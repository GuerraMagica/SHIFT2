import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Upload,
  Music,
  Mic,
  Disc,
  Radio,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import { audioEngine } from '../dsp/dspEngine';
import { AudioAlgorithmType, AudioDiagnostics, AudioSourceType, DSPSettings } from '../types';
import { SpectrogramView } from './SpectrogramView';

interface AudioTestbenchProps {
  settings: DSPSettings;
  onUpdateSettings: (newSettings: Partial<DSPSettings>) => void;
  diagnostics: AudioDiagnostics;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
}

export const AudioTestbench: React.FC<AudioTestbenchProps> = ({
  settings,
  onUpdateSettings,
  diagnostics,
  isPlaying,
  onTogglePlay,
  onStop,
}) => {
  const [activeSource, setActiveSource] = useState<AudioSourceType>('drums');
  const [customFileName, setCustomFileName] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [compareMode, setCompareMode] = useState<boolean>(false);

  // Initialize with drum stimulus on first mount
  useEffect(() => {
    const init = async () => {
      setIsRendering(true);
      await audioEngine.loadSyntheticStimulus('drums');
      setIsRendering(false);
    };
    init();
  }, []);

  const handleSelectSource = async (source: AudioSourceType) => {
    setActiveSource(source);
    setIsRendering(true);
    if (source === 'drums' || source === 'vocal' || source === 'synth' || source === 'sweep') {
      setCustomFileName(null);
      await audioEngine.loadSyntheticStimulus(source);
    }
    setIsRendering(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setActiveSource('file');
    setCustomFileName(file.name);
    setIsRendering(true);
    await audioEngine.loadAudioFile(file);
    setIsRendering(false);
  };

  const quickPitchButtons = [-12, -7, -5, -1, 0, 1, 5, 7, 12];
  const quickTimeButtons = [0.5, 0.8, 1.0, 1.25, 1.5, 2.0];

  const toggleCompareEngine = () => {
    if (settings.algorithm === 'fform_v2') {
      onUpdateSettings({ algorithm: 'signalsmith' });
      setCompareMode(true);
    } else {
      onUpdateSettings({ algorithm: 'fform_v2' });
      setCompareMode(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Quick Objective & A/B Comparison */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase tracking-wider font-mono">
                Laboratorio DSP Interactivo
              </span>
              <span className="text-xs text-slate-400 font-mono">Web Audio + STFT Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              F-Form 2.0 (Phase-WSOLA & Formant Engine) vs Baseline
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Prueba auditiva en tiempo real del nuevo algoritmo de time-stretching y pitch-shifting.
              Compara directamente la pegada de transitorios (sin efecto <span className="text-cyan-300 font-medium">phasiness</span>) y la voz natural (con <span className="text-emerald-300 font-medium">preservación de formantes</span>).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="instant-ab-btn"
              onClick={toggleCompareEngine}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
                settings.algorithm === 'fform_v2'
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/40 shadow-cyan-600/20'
                  : 'bg-amber-600 hover:bg-amber-500 text-white border border-amber-400/40 shadow-amber-600/20'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>
                {settings.algorithm === 'fform_v2'
                  ? 'Comparar con Signalsmith Baseline'
                  : 'Volver a F-Form 2.0 Mejorado'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Spectrogram & Waveform Canvas */}
      <SpectrogramView diagnostics={diagnostics} isPlaying={isPlaying} />

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Audio Source & Preset Stimuli (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <Disc className="w-4 h-4 text-cyan-400" />
              <span>1. Fuente de Audio & Estímulos</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                id="source-drums-btn"
                onClick={() => handleSelectSource('drums')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeSource === 'drums'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-bold flex items-center justify-between">
                  <span>Drums Loop</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Transitorios rápidos (Kick, Snare, Hats)</p>
              </button>

              <button
                id="source-vocal-btn"
                onClick={() => handleSelectSource('vocal')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeSource === 'vocal'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-bold flex items-center justify-between">
                  <span>Vocal Vowel</span>
                  <Mic className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Formantes F1-F3 (Prueba anti-ardilla)</p>
              </button>

              <button
                id="source-synth-btn"
                onClick={() => handleSelectSource('synth')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeSource === 'synth'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-bold flex items-center justify-between">
                  <span>Synth Pad</span>
                  <Music className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Acordes densos y coherencia estéreo</p>
              </button>

              <button
                id="source-sweep-btn"
                onClick={() => handleSelectSource('sweep')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeSource === 'sweep'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-mono font-bold flex items-center justify-between">
                  <span>Sine Sweep</span>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">20Hz-18kHz (Prueba lineal de pitch)</p>
              </button>
            </div>

            {/* Custom WAV file upload */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <label
                htmlFor="audio-file-input"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-xs font-mono text-slate-300 transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{customFileName ? customFileName : 'Cargar tu propio WAV / MP3'}</span>
              </label>
              <input
                id="audio-file-input"
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Quick Transport Controls */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  id="main-play-toggle-btn"
                  onClick={onTogglePlay}
                  disabled={isRendering}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all ${
                    isPlaying
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlaying ? 'PAUSAR' : 'REPRODUCIR'}</span>
                </button>

                <button
                  id="main-stop-btn"
                  onClick={onStop}
                  className="px-3 py-2 rounded-xl text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  DETENER
                </button>
              </div>

              {isRendering && (
                <span className="text-xs font-mono text-cyan-400 animate-pulse">
                  Procesando FFT...
                </span>
              )}
            </div>
          </div>

          {/* Engine Selector Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Motor Algorítmico Activo</span>
            </h3>

            <div className="space-y-2">
              <label
                onClick={() => onUpdateSettings({ algorithm: 'fform_v2' })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.algorithm === 'fform_v2'
                    ? 'bg-cyan-950/60 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${settings.algorithm === 'fform_v2' ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'}`}>
                  {settings.algorithm === 'fform_v2' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-cyan-300">F-Form 2.0 (Phase-WSOLA + Formant)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Identity Phase Locking (IPL) + Detección de Transitorios + Preservación de Formantes.
                  </p>
                </div>
              </label>

              <label
                onClick={() => onUpdateSettings({ algorithm: 'signalsmith' })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.algorithm === 'signalsmith'
                    ? 'bg-amber-950/40 border-amber-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${settings.algorithm === 'signalsmith' ? 'border-amber-400 bg-amber-400' : 'border-slate-600'}`}>
                  {settings.algorithm === 'signalsmith' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-amber-300">Signalsmith Stretch (Baseline F-Form)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Estado actual del repositorio: phase vocoder multi-banda sin bloqueo de transitorios ni formantes.
                  </p>
                </div>
              </label>

              <label
                onClick={() => onUpdateSettings({ algorithm: 'classic_pv' })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.algorithm === 'classic_pv'
                    ? 'bg-purple-950/40 border-purple-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${settings.algorithm === 'classic_pv' ? 'border-purple-400 bg-purple-400' : 'border-slate-600'}`}>
                  {settings.algorithm === 'classic_pv' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-purple-300">Classic Phase Vocoder</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rotación de fase estándar básica (evidencia clara de phasiness / dispersión).
                  </p>
                </div>
              </label>

              <label
                onClick={() => onUpdateSettings({ algorithm: 'bypass' })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  settings.algorithm === 'bypass'
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center ${settings.algorithm === 'bypass' ? 'border-slate-400 bg-slate-400' : 'border-slate-600'}`}>
                  {settings.algorithm === 'bypass' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-slate-300">Bypass (Audio Original)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Audio original con delay compensado para comparación directa 1:1.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: DSP Parameters (Pitch, Time, Formants, IPL) (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Pitch Shifter Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Pitch Shifting (-24 a +24 Semitonos)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {settings.pitchSemitones > 0 ? `+${settings.pitchSemitones}` : settings.pitchSemitones} st
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({settings.pitchCents > 0 ? `+${settings.pitchCents}` : settings.pitchCents} cents)
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <input
                id="pitch-semitones-slider"
                type="range"
                min="-12"
                max="12"
                step="1"
                value={settings.pitchSemitones}
                onChange={(e) => onUpdateSettings({ pitchSemitones: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              {/* Quick preset buttons */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {quickPitchButtons.map((st) => (
                  <button
                    key={st}
                    onClick={() => onUpdateSettings({ pitchSemitones: st })}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all ${
                      settings.pitchSemitones === st
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st > 0 ? `+${st}` : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine tuning Cents */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Afinación Fina (Cents):</span>
              <div className="flex items-center gap-2 w-48">
                <input
                  id="pitch-cents-slider"
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={settings.pitchCents}
                  onChange={(e) => onUpdateSettings({ pitchCents: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="w-12 text-right text-slate-300">{settings.pitchCents}c</span>
              </div>
            </div>
          </div>

          {/* Time Stretch Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Time Stretch Ratio (0.25x a 4.0x)
                </h3>
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {settings.timeRatio.toFixed(2)}x
              </div>
            </div>

            <div className="space-y-3">
              <input
                id="time-ratio-slider"
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.timeRatio}
                onChange={(e) => onUpdateSettings({ timeRatio: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex items-center justify-between gap-1 pt-1">
                {quickTimeButtons.map((r) => (
                  <button
                    key={r}
                    onClick={() => onUpdateSettings({ timeRatio: r })}
                    className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-all ${
                      Math.abs(settings.timeRatio - r) < 0.01
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Note about Realtime Insert vs Offline contract */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Modo de Procesamiento:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateSettings({ mode: 'realtime_insert' })}
                  className={`px-2.5 py-1 rounded border text-xs font-mono ${
                    settings.mode === 'realtime_insert'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Realtime Insert (PDC Fija)
                </button>
                <button
                  onClick={() => onUpdateSettings({ mode: 'offline_audiosuite' })}
                  className={`px-2.5 py-1 rounded border text-xs font-mono ${
                    settings.mode === 'offline_audiosuite'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  AudioSuite / Offline (N_out = N_in * ratio)
                </button>
              </div>
            </div>
          </div>

          {/* Formant Preservation & Transient Locking (The Key Innovations!) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Formant Preservation Module */}
            <div className={`p-4 rounded-2xl border transition-all ${
              settings.formantPreserve
                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-950/30'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Preservación de Formantes
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="formant-preserve-toggle"
                    type="checkbox"
                    checked={settings.formantPreserve}
                    onChange={(e) => onUpdateSettings({ formantPreserve: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Extrae la envolvente espectral mediante Cepstrum Liftering y cancela el desplazamiento tímbrico
                al cambiar de octava.
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span>Efecto Ardilla:</span>
                <span className={settings.formantPreserve ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {settings.formantPreserve ? 'ELIMINADO' : 'ACTIVO (Baseline)'}
                </span>
              </div>
            </div>

            {/* Transient Phase Locking (IPL) Module */}
            <div className={`p-4 rounded-2xl border transition-all ${
              settings.transientPhaseLock
                ? 'bg-cyan-950/20 border-cyan-500/50 shadow-cyan-950/30'
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Identity Phase Locking (IPL)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="transient-lock-toggle"
                    type="checkbox"
                    checked={settings.transientPhaseLock}
                    onChange={(e) => onUpdateSettings({ transientPhaseLock: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Bloquea las fases adyacentes a los picos espectrales dominantes y preserva los onsets
                de percusión con cero dispersión.
              </p>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span>Pegada de Transitorios:</span>
                <span className={settings.transientPhaseLock ? 'text-cyan-400 font-bold' : 'text-amber-400 font-bold'}>
                  {settings.transientPhaseLock ? 'MÁXIMA (Zero Smear)' : 'DIFUMINADA (Phasiness)'}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
