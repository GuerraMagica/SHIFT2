export type AudioAlgorithmType = 'fform_v2' | 'signalsmith' | 'classic_pv' | 'bypass';

export type AudioSourceType = 'drums' | 'vocal' | 'synth' | 'sweep' | 'mic' | 'file';

export interface DSPSettings {
  algorithm: AudioAlgorithmType;
  pitchSemitones: number; // -24 to +24
  pitchCents: number; // -50 to +50
  timeRatio: number; // 0.25 to 4.0
  formantPreserve: boolean;
  formantShiftSemitones: number; // -12 to +12 (Shift 2 Formant Offset)
  transientPhaseLock: boolean;
  transientSensitivity: number; // 0.0 to 1.0
  windowSize: number; // 512, 1024, 2048, 4096
  hopRatio: number; // 0.25 (75% overlap)
  mode: 'realtime_insert' | 'offline_audiosuite';

  // SHIFT 2 / Dual Engine & Sub-Octave (/ 2) Architecture
  shift2Enabled: boolean;
  shift2PitchSemitones: number; // -24 to +24
  shift2PitchCents: number; // -50 to +50
  shift2FormantSemitones: number; // -12 to +12
  shift2Pan: number; // -1.0 to 1.0
  shift2Level: number; // 0.0 to 1.0 (gain)
  shift1Pan: number; // -1.0 to 1.0
  shift1Level: number; // 0.0 to 1.0 (gain)
  subDivideBy2: boolean; // Shift / 2 mode: sub-octave generator / half-speed divider

  // Pro Features: Throat Length, Material Mode & Multichannel Dolby Atmos
  throatShift: number; // -12 to +12 st (Throat Length / Formant Shift)
  materialMode: 'vocal' | 'mix' | 'percussion';
  multichannelLayout: 'mono' | 'stereo' | '5.1' | '7.1' | '7.1.4_atmos';
}

export interface AudioDiagnostics {
  sampleRate: number;
  inputFrames: number;
  outputFrames: number;
  latencySamples: number;
  latencyMs: number;
  phaseCoherence: number; // 0.0 to 1.0
  transientsDetected: number;
  spectralCentroidHz: number;
  isProcessing: boolean;
  cpuLoadPercent: number;
}

export interface CppSourceFile {
  filename: string;
  path: string;
  description: string;
  category: 'dsp' | 'plugin' | 'qa' | 'cmake' | 'aax';
  content: string;
}

export interface AuditSection {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  summary: string;
  currentRepoState: string;
  rootCause: string;
  solution: string;
}
