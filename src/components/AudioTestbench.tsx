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
  ArrowRightLeft,
  Divide,
  SlidersHorizontal,
  Film,
  Video,
  ShieldCheck
} from 'lucide-react';

interface SmpteFpsPreset {
  id: string;
  name: string;
  sourceFps: number;
  targetFps: number;
  ratio: number;
  pct: number;
  description: string;
}

const SMPTE_FRAME_RATES = [
  { value: 23.976024, label: '23.976 FPS (NTSC 24p)' },
  { value: 24, label: '24 FPS (Film Standard)' },
  { value: 25, label: '25 FPS (PAL / Broadcast Europa)' },
  { value: 29.97003, label: '29.97 FPS (NTSC Video)' },
  { value: 30, label: '30 FPS (Web & Broadcast 30p)' },
  { value: 59.94006, label: '59.94 FPS (NTSC 60i / HFR)' },
  { value: 60, label: '60 FPS (HFR 60p Cine / Gaming)' },
];

const SMPTE_PRESETS: SmpteFpsPreset[] = [
  { id: '24_25', name: '24 fps → 25 fps', sourceFps: 24, targetFps: 25, ratio: 25 / 24, pct: 4.167, description: 'Film a PAL / TV Europa (+4.167%)' },
  { id: '25_24', name: '25 fps → 24 fps', sourceFps: 25, targetFps: 24, ratio: 24 / 25, pct: -4.000, description: 'PAL a Film Cine 24p (-4.000%)' },
  { id: '23976_25', name: '23.976 fps → 25 fps', sourceFps: 23.976024, targetFps: 25, ratio: 1001 / 960, pct: 4.271, description: 'NTSC 24p a PAL Europa (+4.271%)' },
  { id: '25_23976', name: '25 fps → 23.976 fps', sourceFps: 25, targetFps: 23.976024, ratio: 960 / 1001, pct: -4.096, description: 'PAL Europa a NTSC 24p (-4.096%)' },
  { id: '24_23976', name: '24 fps → 23.976 fps', sourceFps: 24, targetFps: 23.976024, ratio: 1000 / 1001, pct: -0.100, description: 'Film 24p a NTSC (Pull-down -0.100%)' },
  { id: '23976_24', name: '23.976 fps → 24 fps', sourceFps: 23.976024, targetFps: 24, ratio: 1001 / 1000, pct: 0.100, description: 'NTSC a Film 24p (Pull-up +0.100%)' },
  { id: '24_2997', name: '24 fps → 29.97 fps', sourceFps: 24, targetFps: 29.97003, ratio: 1250 / 1001, pct: 24.875, description: 'Cine a Vídeo NTSC 30p (+24.875%)' },
  { id: '2997_24', name: '29.97 fps → 24 fps', sourceFps: 29.97003, targetFps: 24, ratio: 1001 / 1250, pct: -19.920, description: 'Vídeo NTSC a Cine 24p (-19.920%)' },
  { id: '25_2997', name: '25 fps → 29.97 fps', sourceFps: 25, targetFps: 29.97003, ratio: 1200 / 1001, pct: 19.880, description: 'PAL a Vídeo NTSC 30p (+19.880%)' },
  { id: '2997_25', name: '29.97 fps → 25 fps', sourceFps: 29.97003, targetFps: 25, ratio: 1001 / 1200, pct: -16.583, description: 'Vídeo NTSC a PAL (-16.583%)' },
  { id: '30_24', name: '30 fps → 24 fps', sourceFps: 30, targetFps: 24, ratio: 24 / 30, pct: -20.000, description: '30p Broadcast a Cine 24p (-20.000%)' },
  { id: '24_30', name: '24 fps → 30 fps', sourceFps: 24, targetFps: 30, ratio: 30 / 24, pct: 25.000, description: 'Cine 24p a 30p Broadcast (+25.000%)' },
  { id: '2997_30', name: '29.97 fps → 30 fps', sourceFps: 29.97003, targetFps: 30, ratio: 1001 / 1000, pct: 0.100, description: 'NTSC Drop-Frame a Non-Drop (+0.100%)' },
  { id: '30_2997', name: '30 fps → 29.97 fps', sourceFps: 30, targetFps: 29.97003, ratio: 1000 / 1001, pct: -0.100, description: 'NTSC Non-Drop a Drop-Frame (-0.100%)' },
  { id: '60_24', name: '60 fps → 24 fps', sourceFps: 60, targetFps: 24, ratio: 24 / 60, pct: -60.000, description: 'HFR 60p a Film 24p (Slow-Motion 2.5x)' },
  { id: '24_60', name: '24 fps → 60 fps', sourceFps: 24, targetFps: 60, ratio: 60 / 24, pct: 150.000, description: 'Film 24p a HFR 60p (Fast-Motion)' },
  { id: '5994_2997', name: '59.94 fps → 29.97 fps', sourceFps: 59.94006, targetFps: 29.97003, ratio: 0.5, pct: -50.000, description: 'Mitad de velocidad / 2x Slow (-50.000%)' },
  { id: '2997_5994', name: '29.97 fps → 59.94 fps', sourceFps: 29.97003, targetFps: 59.94006, ratio: 2.0, pct: 100.000, description: 'Doble de velocidad / Fast (+100.000%)' },
];
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
  const [autoPitchCorrection, setAutoPitchCorrection] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customSourceFps, setCustomSourceFps] = useState<number>(24);
  const [customTargetFps, setCustomTargetFps] = useState<number>(25);

  const handleCustomFpsChange = (source: number, target: number) => {
    setCustomSourceFps(source);
    setCustomTargetFps(target);
    setActivePresetId(null);
    const newRatio = target / source;
    if (autoPitchCorrection) {
      const driftCents = 1200 * Math.log2(newRatio);
      const compCents = -Math.round(driftCents);
      const semi = Math.floor(compCents / 100);
      const cents = compCents - semi * 100;
      onUpdateSettings({
        timeRatio: newRatio,
        pitchSemitones: semi,
        pitchCents: cents,
        formantPreserve: true
      });
    } else {
      onUpdateSettings({
        timeRatio: newRatio,
        pitchSemitones: 0,
        pitchCents: 0
      });
    }
  };

  const handleSelectSmptePreset = (preset: SmpteFpsPreset) => {
    setActivePresetId(preset.id);
    const newRatio = preset.ratio;
    if (autoPitchCorrection) {
      // Invert pitch shift to preserve actor's natural voice and musical key
      const driftCents = 1200 * Math.log2(newRatio);
      const compCents = -Math.round(driftCents);
      const semi = Math.floor(compCents / 100);
      const cents = compCents - semi * 100;
      onUpdateSettings({
        timeRatio: newRatio,
        pitchSemitones: semi,
        pitchCents: cents,
        formantPreserve: true
      });
    } else {
      onUpdateSettings({
        timeRatio: newRatio,
        pitchSemitones: 0,
        pitchCents: 0
      });
    }
  };

  const handleResetToRealtime = () => {
    setActivePresetId(null);
    onUpdateSettings({
      timeRatio: 1.0,
      pitchSemitones: 0,
      pitchCents: 0,
      throatShift: 0
    });
  };

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

      {/* ================================================================= */}
      {/* # PRESETS DE CONVERSIÓN DE FPS ESTÁNDAR DE LA INDUSTRIA (SMPTE)   */}
      {/* ================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700/80 text-cyan-400">
              <Film className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-wider">
                  Post-Producción & Cine
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-mono font-bold">
                  SMPTE RATIONAL FRACTIONS
                </span>
              </div>
              <h3 className="text-base font-bold text-white font-mono tracking-tight">
                Presets de Conversión de FPS Estándar de la Industria
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPitchCorrection(!autoPitchCorrection)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
                autoPitchCorrection
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-950'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto Pitch Correction: {autoPitchCorrection ? 'ACTIVO (Tono Vocal Fijo)' : 'DESACTIVADO (Varispeed)'}</span>
            </button>

            <button
              onClick={handleResetToRealtime}
              className="px-3 py-1.5 rounded-xl text-xs font-mono text-slate-400 bg-slate-950 border border-slate-800 hover:text-white hover:border-slate-700 transition-all"
            >
              Reset 1.0x
            </button>
          </div>
        </div>

        {/* SMPTE Frame Rate Dropdown & Custom FPS Mapper */}
        <div className="bg-slate-950/90 border border-cyan-800/60 rounded-xl p-4 mb-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Main Dropdown */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-cyan-400" />
                SMPTE Frame Rate Dropdown
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Mapeo automático al motor DSP</span>
            </label>
            <select
              id="smpte-frame-rate-dropdown"
              value={activePresetId || 'manual'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'manual') {
                  handleResetToRealtime();
                } else {
                  const found = SMPTE_PRESETS.find(p => p.id === val);
                  if (found) handleSelectSmptePreset(found);
                }
              }}
              className="w-full bg-slate-900 border-2 border-cyan-500/80 rounded-xl px-3.5 py-2 font-mono text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer shadow-lg shadow-cyan-950/60 transition-all hover:border-cyan-400"
            >
              <option value="manual">Manual / Control Directo (1.000000x Speed)</option>
              <optgroup label="── Estándares Cine & TV (Europa / PAL 25p) ──">
                <option value="24_25">24 fps → 25 fps (Film Cine a PAL +4.167% | Ratio: 1.041667x)</option>
                <option value="25_24">25 fps → 24 fps (PAL a Film Cine -4.000% | Ratio: 0.960000x)</option>
                <option value="23976_25">23.976 fps → 25 fps (NTSC 24p a PAL +4.271% | Ratio: 1.042708x)</option>
                <option value="25_23976">25 fps → 23.976 fps (PAL a NTSC 24p -4.096% | Ratio: 0.959041x)</option>
              </optgroup>
              <optgroup label="── NTSC Pull-Down / Pull-Up (Cine 24p vs NTSC 23.976p) ──">
                <option value="24_23976">24 fps → 23.976 fps (Film 24p Pull-down -0.100% | Ratio: 0.999001x)</option>
                <option value="23976_24">23.976 fps → 24 fps (NTSC to Film 24p Pull-up +0.100% | Ratio: 1.001000x)</option>
              </optgroup>
              <optgroup label="── NTSC Broadcast 29.97p / 30p ──">
                <option value="24_2997">24 fps → 29.97 fps (Film a NTSC 30p +24.875% | Ratio: 1.248751x)</option>
                <option value="2997_24">29.97 fps → 24 fps (NTSC 30p a Film -19.920% | Ratio: 0.800800x)</option>
                <option value="25_2997">25 fps → 29.97 fps (PAL a NTSC 30p +19.880% | Ratio: 1.198801x)</option>
                <option value="2997_25">29.97 fps → 25 fps (NTSC 30p a PAL -16.583% | Ratio: 0.834167x)</option>
                <option value="30_24">30 fps → 24 fps (30p Video a Cine -20.000% | Ratio: 0.800000x)</option>
                <option value="24_30">24 fps → 30 fps (Cine a 30p Video +25.000% | Ratio: 1.250000x)</option>
                <option value="2997_30">29.97 fps → 30 fps (Drop-Frame a Non-Drop +0.100% | Ratio: 1.001000x)</option>
                <option value="30_2997">30 fps → 29.97 fps (Non-Drop a Drop-Frame -0.100% | Ratio: 0.999000x)</option>
              </optgroup>
              <optgroup label="── High Frame Rate (HFR 60p / 59.94p & Slow-Mo) ──">
                <option value="60_24">60 fps → 24 fps (HFR 60p a Film -60.000% Slow-Motion | Ratio: 0.400000x)</option>
                <option value="24_60">24 fps → 60 fps (Film a HFR 60p +150.000% Fast-Motion | Ratio: 2.500000x)</option>
                <option value="5994_2997">59.94 fps → 29.97 fps (Mitad de velocidad / Slow-Mo -50.000% | Ratio: 0.500000x)</option>
                <option value="2997_5994">29.97 fps → 59.94 fps (Doble de velocidad / Fast +100.000% | Ratio: 2.000000x)</option>
              </optgroup>
            </select>
          </div>

          {/* Custom Dual Dropdown: Source FPS -> Target FPS */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
              <span>Mapeo Personalizado entre Cualquier FPS</span>
              <span className="text-[10px] text-cyan-400">Ratio exacto = Target / Source</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={customSourceFps}
                  onChange={(e) => handleCustomFpsChange(parseFloat(e.target.value), customTargetFps)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 font-mono text-xs text-slate-200 focus:border-cyan-400"
                >
                  {SMPTE_FRAME_RATES.map(f => (
                    <option key={`src_${f.value}`} value={f.value}>De: {f.label}</option>
                  ))}
                </select>
              </div>

              <span className="text-cyan-400 font-bold font-mono">→</span>

              <div className="flex-1">
                <select
                  value={customTargetFps}
                  onChange={(e) => handleCustomFpsChange(customSourceFps, parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 font-mono text-xs text-slate-200 focus:border-cyan-400"
                >
                  {SMPTE_FRAME_RATES.map(f => (
                    <option key={`tgt_${f.value}`} value={f.value}>A: {f.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleCustomFpsChange(customSourceFps, customTargetFps)}
                className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        {/* 10 SMPTE Presets Quick-Access Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SMPTE_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectSmptePreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-white shadow-lg shadow-cyan-950/80 ring-1 ring-cyan-400'
                    : 'bg-slate-950/80 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-xs font-bold">
                  <span>{preset.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      preset.pct >= 0 ? 'bg-cyan-900/60 text-cyan-300' : 'bg-amber-900/60 text-amber-300'
                    }`}
                  >
                    {preset.pct > 0 ? `+${preset.pct.toFixed(2)}%` : `${preset.pct.toFixed(2)}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.description}</div>
              </button>
            );
          })}
        </div>

        {/* Real-time sync feedback bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Ratio Activo:</span>
            <span className="text-cyan-400 font-bold">{settings.timeRatio.toFixed(6)}x</span>
            <span className="text-slate-500">
              ({((settings.timeRatio - 1.0) * 100).toFixed(3)}% de velocidad)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Compensación Tonal:</span>
            <span className={autoPitchCorrection ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {autoPitchCorrection
                ? `${(-1200 * Math.log2(settings.timeRatio)).toFixed(2)}¢ (Tono de Actores 100% Protegido)`
                : '0.00¢ (Modo Cinta Varispeed)'}
            </span>
          </div>
        </div>
      </div>

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

            {/* Throat Length / Formant Shift Module */}
            <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                    Longitud de Garganta / Throat Length
                  </span>
                </div>
                <span className="text-sm font-bold font-mono text-purple-400">
                  {settings.throatShift > 0 ? `+${settings.throatShift}` : settings.throatShift} st
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modula el tamaño del tracto vocal de forma 100% independiente del pitch: simula voz masculina profunda (st negativos) o femenina/infantil (st positivos).
              </p>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={settings.throatShift}
                onChange={(e) => onUpdateSettings({ throatShift: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>-12 st (Tórax Profundo / Monstruo)</span>
                <span>0 st (Natural)</span>
                <span>+12 st (Infantil / Anime)</span>
              </div>
            </div>

            {/* Content-Aware Material Mode Module */}
            <div className="p-4 rounded-2xl border bg-slate-900 border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  Modo de Material Adaptativo
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vocal', label: 'Vocal / Diálogo', desc: 'Tonality Limit a 8kHz' },
                  { id: 'mix', label: 'Complex Mix', desc: 'Coherencia Estéreo a 16kHz' },
                  { id: 'percussion', label: 'Percusión / Foley', desc: 'Fase instantánea 0 latency' }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateSettings({ materialMode: m.id as any })}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      settings.materialMode === m.id
                        ? 'bg-amber-950/50 border-amber-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono">{m.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Multichannel Dolby Atmos & Surround 7.1 / 5.1 Matrix */}
            <div className="col-span-full p-4 rounded-2xl border bg-slate-900/90 border-cyan-800/60 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Soporte Multicanal Surround 5.1 / 7.1 & Dolby Atmos (Cine & AudioSuite)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  PHASE-LOCKED MULTI-STEM
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'mono', label: 'Mono', ch: '1 Ch' },
                  { id: 'stereo', label: 'Estéreo', ch: '2 Ch (L/R)' },
                  { id: '5.1', label: '5.1 Surround', ch: '6 Ch (L/C/R/Lfe/Ls/Rs)' },
                  { id: '7.1', label: '7.1 Surround', ch: '8 Ch (+ Side/Back)' },
                  { id: '7.1.4_atmos', label: 'Dolby Atmos', ch: '12 Ch (+ 4 Ceiling)' }
                ].map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => onUpdateSettings({ multichannelLayout: layout.id as any })}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      settings.multichannelLayout === layout.id
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-950/40'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-mono">{layout.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{layout.ch}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* ================================================================= */}
          {/* # SHIFT 2 / DUAL-VOICE ENGINE & SUB-OCTAVE DIVIDER                */}
          {/* ================================================================= */}
          <div id="shift2-dual-rack" className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            
            {/* Ambient visual badge */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-900/60 text-cyan-300 border border-cyan-700/60 uppercase tracking-wide">
                    # SHIFT 2 / DUAL ENGINE
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Dual Harmonizer + Desplazamiento de Formantes + Divisor / 2
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-mono mt-1 flex items-center gap-2">
                  <span>Procesador Multi-Voz SHIFT 1 & SHIFT 2</span>
                </h3>
              </div>

              {/* Action toggles: Shift 2 Enable & / 2 Sub-Octave Divider */}
              <div className="flex items-center gap-3">
                {/* / 2 Sub-Octave Button */}
                <button
                  id="sub-octave-divider-btn"
                  onClick={() => onUpdateSettings({ subDivideBy2: !settings.subDivideBy2 })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                    settings.subDivideBy2
                      ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Divide className="w-3.5 h-3.5" />
                  <span>MODO / 2 SUB-OCTAVA</span>
                  {settings.subDivideBy2 && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
                </button>

                {/* Shift 2 Master Toggle */}
                <button
                  id="shift2-master-toggle-btn"
                  onClick={() => onUpdateSettings({ shift2Enabled: !settings.shift2Enabled })}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border ${
                    settings.shift2Enabled
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>VOZ 2 (SHIFT 2): {settings.shift2Enabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* Quick Harmony Presets Bar */}
            <div className="mt-3 pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Presets Armonía:</span>
              
              <button
                id="preset-sub-octave-btn"
                onClick={() => onUpdateSettings({
                  shift2Enabled: true,
                  shift2PitchSemitones: -12,
                  shift2PitchCents: 0,
                  shift2FormantSemitones: 0,
                  subDivideBy2: true,
                  shift1Pan: -0.2,
                  shift2Pan: 0.2,
                  shift2Level: 0.85
                })}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-all"
              >
                / 2 Sub-Octava (-12st + Sub)
              </button>

              <button
                id="preset-fifth-harmony-btn"
                onClick={() => onUpdateSettings({
                  shift2Enabled: true,
                  shift2PitchSemitones: 7,
                  shift2PitchCents: 0,
                  shift2FormantSemitones: 0,
                  subDivideBy2: false,
                  shift1Pan: -0.35,
                  shift2Pan: 0.35,
                  shift2Level: 0.75
                })}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-all"
              >
                +7 st Quinta Perfecta
              </button>

              <button
                id="preset-gender-morph-btn"
                onClick={() => onUpdateSettings({
                  shift2Enabled: true,
                  shift2PitchSemitones: 0,
                  formantShiftSemitones: -5,
                  shift2FormantSemitones: 6,
                  subDivideBy2: false,
                  shift1Pan: -0.4,
                  shift2Pan: 0.4,
                  shift2Level: 0.85
                })}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-all"
              >
                Vocal Gender Morph (Masc / Fem)
              </button>

              <button
                id="preset-micro-detune-btn"
                onClick={() => onUpdateSettings({
                  shift2Enabled: true,
                  shift2PitchSemitones: 0,
                  pitchCents: -9,
                  shift2PitchCents: 9,
                  shift1Pan: -0.8,
                  shift2Pan: 0.8,
                  shift2Level: 0.9
                })}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-all"
              >
                Chorus Estéreo (+9c / -9c)
              </button>

              <button
                id="preset-dual-octave-btn"
                onClick={() => onUpdateSettings({
                  shift2Enabled: true,
                  pitchSemitones: -12,
                  shift2PitchSemitones: 12,
                  shift1Pan: -0.5,
                  shift2Pan: 0.5,
                  shift2Level: 0.8
                })}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-cyan-500 hover:text-cyan-300 transition-all"
              >
                Dual Octaves (-12st / +12st)
              </button>
            </div>

            {/* Dual Channel Strips Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              
              {/* VOICE 1 (Shift 1 Primary) Strip */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono font-bold text-white uppercase">VOZ 1 (SHIFT 1 - CANAL PRINCIPAL)</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {settings.pitchSemitones > 0 ? `+${settings.pitchSemitones}` : settings.pitchSemitones} st ({settings.pitchCents}c)
                  </span>
                </div>

                {/* Formant Shift Offset 1 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Desplazamiento de Formante:</span>
                    <span className="text-emerald-400 font-bold">
                      {settings.formantShiftSemitones > 0 ? `+${settings.formantShiftSemitones}` : settings.formantShiftSemitones} st
                    </span>
                  </div>
                  <input
                    id="v1-formant-shift-slider"
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={settings.formantShiftSemitones}
                    onChange={(e) => onUpdateSettings({ formantShiftSemitones: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <button onClick={() => onUpdateSettings({ formantShiftSemitones: -5 })} className="hover:text-emerald-400">Profundo (-5)</button>
                    <button onClick={() => onUpdateSettings({ formantShiftSemitones: 0 })} className="hover:text-emerald-400">Neutro (0)</button>
                    <button onClick={() => onUpdateSettings({ formantShiftSemitones: 5 })} className="hover:text-emerald-400">Femenino (+5)</button>
                  </div>
                </div>

                {/* Pan & Level Controls */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Pan:</span>
                      <span className="text-slate-300">
                        {settings.shift1Pan < -0.05 ? `${Math.round(Math.abs(settings.shift1Pan) * 100)}% L` : settings.shift1Pan > 0.05 ? `${Math.round(settings.shift1Pan * 100)}% R` : 'C'}
                      </span>
                    </div>
                    <input
                      id="v1-pan-slider"
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={settings.shift1Pan}
                      onChange={(e) => onUpdateSettings({ shift1Pan: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Nivel:</span>
                      <span className="text-slate-300">{Math.round(settings.shift1Level * 100)}%</span>
                    </div>
                    <input
                      id="v1-level-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.shift1Level}
                      onChange={(e) => onUpdateSettings({ shift1Level: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* VOICE 2 (SHIFT 2 Armonizador) Strip */}
              <div className={`border rounded-xl p-4 space-y-3 transition-all ${
                settings.shift2Enabled
                  ? 'bg-slate-950/80 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${settings.shift2Enabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-mono font-bold text-white uppercase">VOZ 2 (SHIFT 2 - ARMONIZADOR)</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {settings.shift2PitchSemitones > 0 ? `+${settings.shift2PitchSemitones}` : settings.shift2PitchSemitones} st ({settings.shift2PitchCents}c)
                  </span>
                </div>

                {/* Pitch Shifter 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Pitch Shift 2:</span>
                    <div className="flex items-center gap-1">
                      {[-12, -7, -5, 0, 5, 7, 12].map((st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateSettings({ shift2PitchSemitones: st, shift2Enabled: true })}
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                            settings.shift2PitchSemitones === st
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {st > 0 ? `+${st}` : st}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    id="v2-pitch-slider"
                    type="range"
                    min="-24"
                    max="24"
                    step="1"
                    value={settings.shift2PitchSemitones}
                    onChange={(e) => onUpdateSettings({ shift2PitchSemitones: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>

                {/* Formant Shift Offset 2 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Desplazamiento Formante Shift 2:</span>
                    <span className="text-purple-400 font-bold">
                      {settings.shift2FormantSemitones > 0 ? `+${settings.shift2FormantSemitones}` : settings.shift2FormantSemitones} st
                    </span>
                  </div>
                  <input
                    id="v2-formant-shift-slider"
                    type="range"
                    min="-12"
                    max="12"
                    step="1"
                    value={settings.shift2FormantSemitones}
                    onChange={(e) => onUpdateSettings({ shift2FormantSemitones: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <button onClick={() => onUpdateSettings({ shift2FormantSemitones: -5 })} className="hover:text-purple-400">Profundo (-5)</button>
                    <button onClick={() => onUpdateSettings({ shift2FormantSemitones: 0 })} className="hover:text-purple-400">Neutro (0)</button>
                    <button onClick={() => onUpdateSettings({ shift2FormantSemitones: 6 })} className="hover:text-purple-400">Agudo (+6)</button>
                  </div>
                </div>

                {/* Pan & Level Controls 2 */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Pan:</span>
                      <span className="text-slate-300">
                        {settings.shift2Pan < -0.05 ? `${Math.round(Math.abs(settings.shift2Pan) * 100)}% L` : settings.shift2Pan > 0.05 ? `${Math.round(settings.shift2Pan * 100)}% R` : 'C'}
                      </span>
                    </div>
                    <input
                      id="v2-pan-slider"
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={settings.shift2Pan}
                      onChange={(e) => onUpdateSettings({ shift2Pan: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">Nivel:</span>
                      <span className="text-slate-300">{Math.round(settings.shift2Level * 100)}%</span>
                    </div>
                    <input
                      id="v2-level-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.shift2Level}
                      onChange={(e) => onUpdateSettings({ shift2Level: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
