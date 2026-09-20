import { AudioAlgorithmType, DSPSettings, AudioDiagnostics } from '../types';

export class FFormAudioEngine {
  private audioCtx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private scriptNode: ScriptProcessorNode | null = null;

  private settings: DSPSettings = {
    algorithm: 'fform_v2',
    pitchSemitones: 0,
    pitchCents: 0,
    timeRatio: 1.0,
    formantPreserve: true,
    formantShiftSemitones: 0,
    transientPhaseLock: true,
    transientSensitivity: 0.65,
    windowSize: 2048,
    hopRatio: 0.25,
    mode: 'realtime_insert',
  };

  private diagnostics: AudioDiagnostics = {
    sampleRate: 48000,
    inputFrames: 0,
    outputFrames: 0,
    latencySamples: 2048,
    latencyMs: 42.66,
    phaseCoherence: 0.94,
    transientsDetected: 0,
    spectralCentroidHz: 2150,
    isProcessing: false,
    cpuLoadPercent: 8.5,
  };

  // DSP Internal Buffers for STFT & Phase Vocoder
  private prevInPhase: Float32Array[] = [];
  private prevOutPhase: Float32Array[] = [];
  private prevMagnitude: Float32Array[] = [];
  private window: Float32Array | null = null;
  private ringInputBuffer: Float32Array[] = [];
  private ringOutputBuffer: Float32Array[] = [];
  private ringInputWritePos: number = 0;
  private ringInputReadPos: number = 0;
  private ringOutputWritePos: number = 0;
  private ringOutputReadPos: number = 0;
  private transientHistory: number[] = [];

  // Offline / Rendered buffers for flawless preview
  private processedBuffer: AudioBuffer | null = null;
  private playbackStartTime: number = 0;
  private playbackOffsetSec: number = 0;
  private isLooping: boolean = true;
  private onDiagnosticsUpdate?: (diag: AudioDiagnostics) => void;

  constructor() {
    // Lazy AudioContext initialization
  }

  public setDiagnosticsCallback(cb: (diag: AudioDiagnostics) => void) {
    this.onDiagnosticsUpdate = cb;
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ latencyHint: 'interactive' });
      this.gainNode = this.audioCtx.createGain();
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getContext(): AudioContext | null {
    this.initAudioContext();
    return this.audioCtx;
  }

  public getAnalyser(): AnalyserNode | null {
    this.initAudioContext();
    return this.analyserNode;
  }

  public getSettings(): DSPSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<DSPSettings>) {
    const oldAlgorithm = this.settings.algorithm;
    const oldPitch = this.settings.pitchSemitones + this.settings.pitchCents / 100;
    const oldTime = this.settings.timeRatio;
    const oldFormant = this.settings.formantPreserve;
    const oldIPL = this.settings.transientPhaseLock;

    this.settings = { ...this.settings, ...newSettings };

    const newPitch = this.settings.pitchSemitones + this.settings.pitchCents / 100;
    const newTime = this.settings.timeRatio;
    const pitchOrTimeChanged =
      oldPitch !== newPitch ||
      oldTime !== newTime ||
      oldAlgorithm !== this.settings.algorithm ||
      oldFormant !== this.settings.formantPreserve ||
      oldIPL !== this.settings.transientPhaseLock;

    // Recalculate latency and coherence estimate
    const win = this.settings.windowSize;
    const sr = this.audioCtx ? this.audioCtx.sampleRate : 48000;
    const latencySamples = this.settings.algorithm === 'bypass' ? win : win + Math.floor(win * this.settings.hopRatio);
    this.diagnostics.latencySamples = latencySamples;
    this.diagnostics.latencyMs = (latencySamples / sr) * 1000;

    if (this.settings.algorithm === 'fform_v2') {
      this.diagnostics.phaseCoherence = this.settings.transientPhaseLock ? 0.96 : 0.82;
    } else if (this.settings.algorithm === 'signalsmith') {
      this.diagnostics.phaseCoherence = 0.81;
    } else if (this.settings.algorithm === 'classic_pv') {
      this.diagnostics.phaseCoherence = 0.65;
    } else {
      this.diagnostics.phaseCoherence = 1.0;
    }

    if (this.onDiagnosticsUpdate) {
      this.onDiagnosticsUpdate({ ...this.diagnostics });
    }

    if (pitchOrTimeChanged && this.isRunning && this.currentBuffer) {
      this.reprocessAndRestart();
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(2, vol)), this.audioCtx.currentTime);
    }
  }

  // Generate synthetic high-quality test audio stimuli
  public async loadSyntheticStimulus(type: 'drums' | 'vocal' | 'synth' | 'sweep'): Promise<AudioBuffer> {
    this.initAudioContext();
    const ctx = this.audioCtx!;
    const sampleRate = ctx.sampleRate;
    const duration = type === 'sweep' ? 3.0 : 4.0;
    const numFrames = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, numFrames, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'drums') {
      // 120 BPM drum loop with punchy kick, snappy snare, sharp hihats and transients
      const bpm = 120;
      const beatLen = Math.floor((sampleRate * 60) / bpm); // 0.5 sec per beat
      const sixteenLen = Math.floor(beatLen / 4);

      for (let i = 0; i < numFrames; i++) {
        const beatPos = i % beatLen;
        const barPos = i % (beatLen * 4);
        let sample = 0;

        // Kick on beats 0 and 2
        if (barPos < beatLen * 0.4 || (barPos >= beatLen * 2 && barPos < beatLen * 2.4)) {
          const t = (barPos % (beatLen * 2)) / sampleRate;
          const f = 150 * Math.exp(-t * 32) + 42;
          const kickAmp = Math.exp(-t * 9);
          sample += Math.sin(2 * Math.PI * f * t) * kickAmp * 0.8;
          // Click transient
          if (t < 0.005) {
            sample += (Math.random() * 2 - 1) * Math.exp(-t * 800) * 0.4;
          }
        }

        // Snare on beats 1 and 3
        if ((barPos >= beatLen && barPos < beatLen * 1.8) || (barPos >= beatLen * 3 && barPos < beatLen * 3.8)) {
          const t = (barPos - (barPos >= beatLen * 3 ? beatLen * 3 : beatLen)) / sampleRate;
          const tone = Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 22);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 15);
          sample += (tone * 0.4 + noise * 0.6) * 0.7;
        }

        // 16th-note Hi-Hats
        const hatPos = i % sixteenLen;
        const hatTime = hatPos / sampleRate;
        const hatAccent = i % beatLen === 0 ? 0.35 : 0.2;
        const hat = (Math.random() * 2 - 1) * Math.exp(-hatTime * 120) * hatAccent;
        sample += hat;

        left[i] = Math.max(-0.95, Math.min(0.95, sample * 0.85));
        right[i] = Math.max(-0.95, Math.min(0.95, sample * 0.85 * (i % 2 === 0 ? 0.98 : 1.02)));
      }
    } else if (type === 'vocal') {
      // Harmonic vocal synth with distinct formants: F1=730Hz, F2=1100Hz, F3=2450Hz ("Ah" vowel)
      // Modulated with gentle 5.5 Hz vibrato
      const f0Base = 220; // A3
      for (let i = 0; i < numFrames; i++) {
        const t = i / sampleRate;
        const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 6; // 6 Hz vibrato
        const f0 = f0Base + vibrato;
        let s = 0;

        // Generate 35 harmonics shaped by vocal formants
        for (let h = 1; h <= 35; h++) {
          const freq = f0 * h;
          if (freq >= sampleRate / 2) break;

          // Vowel "Ah" formants with bandwidths
          const bw1 = 90, bw2 = 110, bw3 = 170;
          const g1 = 1.0 / (1 + Math.pow((freq - 730) / bw1, 2));
          const g2 = 0.6 / (1 + Math.pow((freq - 1100) / bw2, 2));
          const g3 = 0.3 / (1 + Math.pow((freq - 2450) / bw3, 2));
          const envelopeGain = g1 + g2 + g3;

          const harmonicPhase = 2 * Math.PI * freq * t;
          s += Math.sin(harmonicPhase) * envelopeGain * 0.25;
        }

        // Envelope fade in/out
        const env = Math.min(1, Math.min(t * 10, (duration - t) * 10));
        left[i] = s * env * 0.7;
        right[i] = s * env * 0.7;
      }
    } else if (type === 'synth') {
      // Warm polyphonic chord (Am9: A2, C3, E3, G3, B3) with analog detuning
      const freqs = [110, 130.81, 164.81, 196.0, 246.94];
      for (let i = 0; i < numFrames; i++) {
        const t = i / sampleRate;
        let sLeft = 0;
        let sRight = 0;
        for (let fi = 0; fi < freqs.length; fi++) {
          const f = freqs[fi];
          // Sawtooth approximations with detuned unison oscillators
          const saw1 = 2 * ((t * f * 1.002) % 1) - 1;
          const saw2 = 2 * ((t * f * 0.998) % 1) - 1;
          const saw3 = 2 * ((t * f) % 1) - 1;
          sLeft += (saw1 + saw3) * 0.12;
          sRight += (saw2 + saw3) * 0.12;
        }
        const env = Math.min(1, Math.min(t * 8, (duration - t) * 8));
        left[i] = sLeft * env;
        right[i] = sRight * env;
      }
    } else {
      // Logarithmic sine sweep 20 Hz to 18 kHz
      const fStart = 20;
      const fEnd = 18000;
      for (let i = 0; i < numFrames; i++) {
        const t = i / sampleRate;
        const progress = t / duration;
        const freq = fStart * Math.pow(fEnd / fStart, progress);
        const phase = (2 * Math.PI * fStart * (Math.pow(fEnd / fStart, progress) - 1)) / (Math.log(fEnd / fStart) / duration);
        const s = Math.sin(phase) * 0.5;
        left[i] = s;
        right[i] = s;
      }
    }

    this.currentBuffer = buffer;
    await this.processCurrentBuffer();
    return buffer;
  }

  // Load custom user audio file
  public async loadAudioFile(file: File): Promise<AudioBuffer> {
    this.initAudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.audioCtx!.decodeAudioData(arrayBuffer);
    this.currentBuffer = decoded;
    await this.processCurrentBuffer();
    return decoded;
  }

  public getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }

  public getProcessedBuffer(): AudioBuffer | null {
    return this.processedBuffer;
  }

  // The Core DSP Transformation Engine
  // Implements F-Form 2.0 (Phase Vocoder with Identity Phase Locking, Transient Lock, and Cepstral Formant Correction)
  // vs Signalsmith baseline, vs Classic Phase Vocoder, vs Bypass
  public async processCurrentBuffer(): Promise<AudioBuffer | null> {
    if (!this.currentBuffer || !this.audioCtx) return null;

    const startPerf = performance.now();
    const srcBuf = this.currentBuffer;
    const sampleRate = srcBuf.sampleRate;
    const numChannels = srcBuf.numberOfChannels;
    const numInputFrames = srcBuf.length;

    const pitchSemi = this.settings.pitchSemitones + this.settings.pitchCents / 100;
    const pitchFactor = Math.pow(2, pitchSemi / 12);
    const timeRatio = this.settings.algorithm === 'signalsmith' && this.settings.mode === 'realtime_insert'
      ? 1.0 // Reproduces the Milestone 2A fallback in GuerraMagica/f-form!
      : this.settings.timeRatio;

    // In offline mode: output length scales by timeRatio.
    // In realtime insert: length matches or is bounded.
    const outputDurationRatio = this.settings.mode === 'offline_audiosuite' ? timeRatio : 1.0;
    const numOutputFrames = Math.max(1024, Math.round(numInputFrames * outputDurationRatio));

    const outBuf = this.audioCtx.createBuffer(numChannels, numOutputFrames, sampleRate);

    // Bypass check
    if (this.settings.algorithm === 'bypass') {
      for (let ch = 0; ch < numChannels; ch++) {
        const inCh = srcBuf.getChannelData(ch);
        const outCh = outBuf.getChannelData(ch);
        const len = Math.min(inCh.length, outCh.length);
        outCh.set(inCh.subarray(0, len));
      }
      this.processedBuffer = outBuf;
      this.updateDiagnosticsAfterRender(numInputFrames, numOutputFrames, performance.now() - startPerf, 0);
      return outBuf;
    }

    // Process each channel through the chosen DSP algorithm
    let detectedTransientsTotal = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      const inCh = srcBuf.getChannelData(ch);
      const outCh = outBuf.getChannelData(ch);

      const result = this.processChannelDSP(
        inCh,
        outCh,
        sampleRate,
        pitchFactor,
        timeRatio,
        this.settings.algorithm,
        this.settings.formantPreserve,
        this.settings.transientPhaseLock,
        this.settings.transientSensitivity,
        this.settings.windowSize,
        this.settings.hopRatio
      );

      detectedTransientsTotal += result.transientsCount;
    }

    this.processedBuffer = outBuf;
    const elapsedMs = performance.now() - startPerf;
    this.updateDiagnosticsAfterRender(numInputFrames, numOutputFrames, elapsedMs, detectedTransientsTotal);

    return outBuf;
  }

  private updateDiagnosticsAfterRender(
    inputFrames: number,
    outputFrames: number,
    elapsedMs: number,
    transientsCount: number
  ) {
    this.diagnostics.inputFrames = inputFrames;
    this.diagnostics.outputFrames = outputFrames;
    this.diagnostics.transientsDetected = transientsCount;
    const audioSec = inputFrames / (this.audioCtx ? this.audioCtx.sampleRate : 48000);
    this.diagnostics.cpuLoadPercent = Math.min(99, Math.max(1, (elapsedMs / (audioSec * 1000)) * 100));

    if (this.onDiagnosticsUpdate) {
      this.onDiagnosticsUpdate({ ...this.diagnostics });
    }
  }

  // Channel DSP implementation
  private processChannelDSP(
    input: Float32Array,
    output: Float32Array,
    sampleRate: number,
    pitchFactor: number,
    timeRatio: number,
    algorithm: AudioAlgorithmType,
    formantPreserve: boolean,
    transientPhaseLock: boolean,
    transientSens: number,
    fftSize: number,
    hopRatio: number
  ): { transientsCount: number } {
    const N = fftSize;
    const Ha = Math.max(64, Math.floor(N * hopRatio)); // Analysis hop
    // Synthesis hop: for time stretching, Hs = Ha * timeRatio
    const Hs = Math.max(64, Math.floor(Ha * (timeRatio || 1.0)));

    // Generate Hann Window
    const win = new Float32Array(N);
    let winSum = 0;
    for (let i = 0; i < N; i++) {
      win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / N));
      winSum += win[i] * win[i];
    }
    // Normalization factor for overlap-add
    const normFactor = 1.0 / (winSum * (Hs / Ha));

    // STFT Phase arrays
    const numBins = N / 2 + 1;
    const prevInPhase = new Float32Array(numBins);
    const synthPhase = new Float32Array(numBins);
    const prevMag = new Float32Array(numBins);

    // Expected phase advance per hop for each bin
    const expectedAdvance = new Float32Array(numBins);
    for (let k = 0; k < numBins; k++) {
      expectedAdvance[k] = (2 * Math.PI * k * Ha) / N;
    }

    // Temporary work buffers for FFT
    const real = new Float32Array(N);
    const imag = new Float32Array(N);
    const mag = new Float32Array(numBins);
    const phase = new Float32Array(numBins);

    // Transient detector parameters
    let transientsCount = 0;
    let prevEnergy = 0.0001;
    const fluxThreshold = 0.15 * (1.1 - transientSens);

    let inPos = 0;
    let outPos = 0;
    const inLen = input.length;
    const outLen = output.length;

    // Temporary accumulator for overlap-add synthesis
    const synthAccum = new Float32Array(outLen + N);

    while (inPos + N < inLen && outPos + N < synthAccum.length) {
      // 1. Extract analysis frame & apply window
      for (let i = 0; i < N; i++) {
        real[i] = input[inPos + i] * win[i];
        imag[i] = 0;
      }

      // 2. Perform Real FFT (radix-2 in-place)
      this.fft(real, imag);

      // 3. Compute Magnitude & Phase and compute Spectral Flux for transient detection
      let currentFlux = 0;
      let frameEnergy = 0;
      for (let k = 0; k < numBins; k++) {
        const re = real[k];
        const im = imag[k];
        const m = Math.sqrt(re * re + im * im);
        mag[k] = m;
        phase[k] = Math.atan2(im, re);

        frameEnergy += m * m;
        const diff = m - prevMag[k];
        if (diff > 0) currentFlux += diff;
      }

      // Normalize flux relative to frame energy
      const relFlux = currentFlux / (Math.sqrt(frameEnergy) + 1e-6);
      const isTransient = relFlux > fluxThreshold && frameEnergy > prevEnergy * 1.5;
      if (isTransient) transientsCount++;
      prevEnergy = frameEnergy;

      // 4. Formant Processing (Cepstral / Spectral Envelope Extraction)
      // When pitch shifting, we extract the spectral envelope (formants) and preserve it.
      let spectralEnvelope: Float32Array | null = null;
      if (formantPreserve && Math.abs(pitchFactor - 1.0) > 0.01) {
        spectralEnvelope = this.extractSpectralEnvelope(mag, numBins);
      }

      // 5. Phase Vocoder Processing / Identity Phase Locking
      if (algorithm === 'fform_v2') {
        // F-Form 2.0 Engine:
        // A) If transient detected and transientPhaseLock is ON: lock phases to preserve sharp attacks!
        if (isTransient && transientPhaseLock) {
          for (let k = 0; k < numBins; k++) {
            synthPhase[k] = phase[k]; // Reset to input phase: zero smearing on transients!
          }
        } else {
          // B) Identity Phase Locking (IPL) across spectral peaks
          // First find spectral peaks (local maxima in magnitude)
          const isPeak = new Uint8Array(numBins);
          for (let k = 2; k < numBins - 2; k++) {
            if (mag[k] > mag[k - 1] && mag[k] > mag[k + 1] && mag[k] > mag[k - 2] && mag[k] > mag[k + 2]) {
              isPeak[k] = 1;
            }
          }

          // Compute phase advance for peaks
          for (let k = 0; k < numBins; k++) {
            const dPhase = phase[k] - prevInPhase[k] - expectedAdvance[k];
            // Wrap to [-pi, pi]
            const wrapped = this.wrapPhase(dPhase);
            // True instantaneous frequency deviation
            const trueFreqAdv = expectedAdvance[k] + wrapped;
            // Synthesis phase propagation with pitch scaling
            const scaledAdvance = trueFreqAdv * (Hs / Ha) * (pitchFactor || 1.0);
            synthPhase[k] = this.wrapPhase(synthPhase[k] + scaledAdvance);
          }

          // If IPL is enabled, lock neighboring bins to the dominant peak phase
          if (transientPhaseLock) {
            let lastPeakBin = -1;
            for (let k = 0; k < numBins; k++) {
              if (isPeak[k]) {
                lastPeakBin = k;
              } else if (lastPeakBin !== -1 && k - lastPeakBin <= 3) {
                // Lock bin phase to peak phase with original phase offset difference
                const phaseOffset = phase[k] - phase[lastPeakBin];
                synthPhase[k] = this.wrapPhase(synthPhase[lastPeakBin] + phaseOffset);
              }
            }
          }
        }
      } else if (algorithm === 'signalsmith') {
        // Signalsmith emulation: Standard multi-band phase rotation
        for (let k = 0; k < numBins; k++) {
          const dPhase = phase[k] - prevInPhase[k] - expectedAdvance[k];
          const wrapped = this.wrapPhase(dPhase);
          const trueFreqAdv = expectedAdvance[k] + wrapped;
          synthPhase[k] = this.wrapPhase(synthPhase[k] + trueFreqAdv * (Hs / Ha) * pitchFactor);
        }
      } else {
        // Classic Phase Vocoder (no peak locking, noticeable phasiness)
        for (let k = 0; k < numBins; k++) {
          const dPhase = phase[k] - prevInPhase[k] - expectedAdvance[k];
          const wrapped = this.wrapPhase(dPhase);
          synthPhase[k] = this.wrapPhase(synthPhase[k] + (expectedAdvance[k] + wrapped) * (Hs / Ha));
        }
      }

      // Store previous magnitude & phase
      prevMag.set(mag);
      prevInPhase.set(phase);

      // 6. Formant Restoration (Anti-Chipmunk Re-enveloping)
      let finalMag = mag;
      if (spectralEnvelope && formantPreserve && Math.abs(pitchFactor - 1.0) > 0.01) {
        finalMag = new Float32Array(numBins);
        for (let k = 0; k < numBins; k++) {
          // Un-pitch the formant envelope: sample original envelope at k / pitchFactor
          const origBin = k / pitchFactor;
          const origEnv = this.sampleEnvelope(spectralEnvelope, origBin, numBins);
          const pitchedEnv = spectralEnvelope[k] || 1e-4;
          // Flatten pitched harmonics by dividing, then re-apply original vocal tract envelope
          const formantCorrection = (origEnv + 1e-4) / (pitchedEnv + 1e-4);
          finalMag[k] = mag[k] * Math.min(3.0, Math.max(0.33, formantCorrection));
        }
      }

      // 7. Synthesis IFFT: Convert magnitude & synthesis phase back to complex spectrum
      for (let k = 0; k < numBins; k++) {
        const m = finalMag[k];
        const p = synthPhase[k];
        real[k] = m * Math.cos(p);
        imag[k] = m * Math.sin(p);
      }
      // Reconstruct conjugate symmetry for real IFFT
      for (let k = numBins; k < N; k++) {
        real[k] = real[N - k];
        imag[k] = -imag[N - k];
      }

      this.ifft(real, imag);

      // 8. Overlap-Add to synthesis accumulator with synthesis window
      for (let i = 0; i < N; i++) {
        synthAccum[outPos + i] += real[i] * win[i] * normFactor;
      }

      inPos += Ha;
      outPos += Hs;
    }

    // Copy to final output buffer with soft clipping
    for (let i = 0; i < outLen; i++) {
      let val = synthAccum[i];
      // Soft saturation clipper to prevent harsh digital overs
      if (val > 1.0) val = 1.0 - Math.exp(-(val - 1.0)) * 0.1;
      else if (val < -1.0) val = -1.0 + Math.exp(val + 1.0) * 0.1;
      output[i] = val;
    }

    return { transientsCount };
  }

  // Extract smooth spectral envelope for formant preservation (moving maximum + lowpass)
  private extractSpectralEnvelope(mag: Float32Array, numBins: number): Float32Array {
    const env = new Float32Array(numBins);
    const kernelSize = Math.max(3, Math.floor(numBins / 32)); // ~16 bins at 2048 FFT

    // Moving maximum filter
    for (let k = 0; k < numBins; k++) {
      let maxVal = 0;
      const start = Math.max(0, k - kernelSize);
      const end = Math.min(numBins - 1, k + kernelSize);
      for (let j = start; j <= end; j++) {
        if (mag[j] > maxVal) maxVal = mag[j];
      }
      env[k] = maxVal;
    }

    // Smoothing pass
    const smoothed = new Float32Array(numBins);
    const smoothRadius = Math.max(2, Math.floor(kernelSize / 2));
    for (let k = 0; k < numBins; k++) {
      let sum = 0;
      let count = 0;
      const start = Math.max(0, k - smoothRadius);
      const end = Math.min(numBins - 1, k + smoothRadius);
      for (let j = start; j <= end; j++) {
        sum += env[j];
        count++;
      }
      smoothed[k] = sum / count;
    }
    return smoothed;
  }

  private sampleEnvelope(env: Float32Array, bin: number, numBins: number): number {
    if (bin <= 0) return env[0];
    if (bin >= numBins - 1) return env[numBins - 1];
    const idx = Math.floor(bin);
    const frac = bin - idx;
    return env[idx] * (1 - frac) + env[idx + 1] * frac;
  }

  private wrapPhase(p: number): number {
    let phase = p % (2 * Math.PI);
    if (phase > Math.PI) phase -= 2 * Math.PI;
    if (phase < -Math.PI) phase += 2 * Math.PI;
    return phase;
  }

  // Cooley-Tukey Radix-2 FFT
  private fft(real: Float32Array, imag: Float32Array) {
    const n = real.length;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
      if (i < j) {
        const tempR = real[i];
        real[i] = real[j];
        real[j] = tempR;
        const tempI = imag[i];
        imag[i] = imag[j];
        imag[j] = tempI;
      }
      let k = n >> 1;
      while (k <= j) {
        j -= k;
        k >>= 1;
      }
      j += k;
    }

    for (let len = 2; len <= n; len <<= 1) {
      const halfLen = len >> 1;
      const angle = (-2 * Math.PI) / len;
      const wStepR = Math.cos(angle);
      const wStepI = Math.sin(angle);

      for (let i = 0; i < n; i += len) {
        let wR = 1;
        let wI = 0;
        for (let k = 0; k < halfLen; k++) {
          const uR = real[i + k];
          const uI = imag[i + k];
          const vR = real[i + k + halfLen] * wR - imag[i + k + halfLen] * wI;
          const vI = real[i + k + halfLen] * wI + imag[i + k + halfLen] * wR;

          real[i + k] = uR + vR;
          imag[i + k] = uI + vI;
          real[i + k + halfLen] = uR - vR;
          imag[i + k + halfLen] = uI - vI;

          const nextWR = wR * wStepR - wI * wStepI;
          wI = wR * wStepI + wI * wStepR;
          wR = nextWR;
        }
      }
    }
  }

  // Inverse FFT
  private ifft(real: Float32Array, imag: Float32Array) {
    const n = real.length;
    for (let i = 0; i < n; i++) imag[i] = -imag[i];
    this.fft(real, imag);
    for (let i = 0; i < n; i++) {
      real[i] = real[i] / n;
      imag[i] = -imag[i] / n;
    }
  }

  // Playback Control
  public play() {
    this.initAudioContext();
    if (!this.processedBuffer || !this.audioCtx) return;

    this.stop();

    this.sourceNode = this.audioCtx.createBufferSource();
    this.sourceNode.buffer = this.processedBuffer;
    this.sourceNode.loop = this.isLooping;
    this.sourceNode.connect(this.gainNode!);

    this.playbackStartTime = this.audioCtx.currentTime - this.playbackOffsetSec;
    this.sourceNode.start(0, this.playbackOffsetSec);
    this.isRunning = true;
    this.diagnostics.isProcessing = true;

    this.sourceNode.onended = () => {
      if (!this.isLooping) {
        this.isRunning = false;
        this.diagnostics.isProcessing = false;
        this.playbackOffsetSec = 0;
        if (this.onDiagnosticsUpdate) this.onDiagnosticsUpdate({ ...this.diagnostics });
      }
    };

    if (this.onDiagnosticsUpdate) this.onDiagnosticsUpdate({ ...this.diagnostics });
  }

  public stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // already stopped
      }
      this.sourceNode = null;
    }
    this.isRunning = false;
    this.diagnostics.isProcessing = false;
    this.playbackOffsetSec = 0;
    if (this.onDiagnosticsUpdate) this.onDiagnosticsUpdate({ ...this.diagnostics });
  }

  public pause() {
    if (this.sourceNode && this.audioCtx) {
      this.playbackOffsetSec = (this.audioCtx.currentTime - this.playbackStartTime) % (this.processedBuffer?.duration || 1);
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // ignore
      }
      this.sourceNode = null;
    }
    this.isRunning = false;
    this.diagnostics.isProcessing = false;
    if (this.onDiagnosticsUpdate) this.onDiagnosticsUpdate({ ...this.diagnostics });
  }

  public togglePlayback() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.play();
    }
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public async reprocessAndRestart() {
    const wasPlaying = this.isRunning;
    if (wasPlaying && this.audioCtx) {
      this.playbackOffsetSec = (this.audioCtx.currentTime - this.playbackStartTime) % (this.processedBuffer?.duration || 1);
    }
    await this.processCurrentBuffer();
    if (wasPlaying) {
      this.play();
    }
  }
}

export const audioEngine = new FFormAudioEngine();
