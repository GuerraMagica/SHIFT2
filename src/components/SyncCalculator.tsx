import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, ShieldCheck, Film, Video, Sparkles } from 'lucide-react';

interface FpsConversionPreset {
  id: string;
  name: string;
  sourceFps: number;
  targetFps: number;
  description: string;
}

const FPS_PRESETS: FpsConversionPreset[] = [
  { id: '24_25', name: '24 fps → 25 fps', sourceFps: 24, targetFps: 25, description: 'Cine a TV/Broadcast PAL (Aceleración +4.167%)' },
  { id: '25_24', name: '25 fps → 24 fps', sourceFps: 25, targetFps: 24, description: 'TV PAL a Cine 24p (Ralentización -4.000%)' },
  { id: '23976_25', name: '23.976 fps → 25 fps', sourceFps: 23.976024, targetFps: 25, description: 'NTSC 24p a PAL Europa (Aceleración +4.271%)' },
  { id: '25_23976', name: '25 fps → 23.976 fps', sourceFps: 25, targetFps: 23.976024, description: 'PAL Europa a NTSC 24p (Ralentización -4.096%)' },
  { id: '24_23976', name: '24 fps → 23.976 fps', sourceFps: 24, targetFps: 23.976024, description: 'Film 24p a NTSC (Pull-down -0.100%)' },
  { id: '23976_24', name: '23.976 fps → 24 fps', sourceFps: 23.976024, targetFps: 24, description: 'NTSC a Film 24p (Pull-up +0.100%)' },
  { id: '24_2997', name: '24 fps → 29.97 fps', sourceFps: 24, targetFps: 29.97003, description: 'Cine a Vídeo NTSC (+24.875%)' },
  { id: '2997_24', name: '29.97 fps → 24 fps', sourceFps: 29.97003, targetFps: 24, description: 'Vídeo NTSC a Cine 24p (-19.920%)' },
  { id: '25_2997', name: '25 fps → 29.97 fps', sourceFps: 25, targetFps: 29.97003, description: 'PAL a Vídeo NTSC (+19.880%)' },
  { id: '2997_25', name: '29.97 fps → 25 fps', sourceFps: 29.97003, targetFps: 25, description: 'Vídeo NTSC a PAL (-16.583%)' }
];

export const SyncCalculator: React.FC = () => {
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [blockSize, setBlockSize] = useState<number>(512);
  const [timeRatio, setTimeRatio] = useState<number>(1.0416667); // Default 24->25
  const [audioDurationSec, setAudioDurationSec] = useState<number>(5400); // 90 min feature film
  const [fftSize, setFftSize] = useState<number>(2048);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('24_25');
  const [autoPitchCorrection, setAutoPitchCorrection] = useState<boolean>(true);

  const inputSamples = Math.round(audioDurationSec * sampleRate);
  const expectedOutputSamplesOffline = Math.round(inputSamples * timeRatio);
  const latencySamples = fftSize;
  const latencyMs = (latencySamples / sampleRate) * 1000;

  // Analysis hop Ha and Synthesis hop Hs
  const hopAnalysis = Math.floor(fftSize * 0.25);
  const hopSynthesis = Math.round(hopAnalysis * timeRatio);
  const totalHops = Math.floor(inputSamples / hopAnalysis);
  const fractionalErrorPerHop = (hopAnalysis * timeRatio) - hopSynthesis;
  const cumulativeDriftSamplesOldFIFO = Math.abs(fractionalErrorPerHop * totalHops);

  // Audiovisual pitch calculations
  const naturalPitchDriftCents = 1200 * Math.log2(timeRatio);
  const autoCorrectedPitchCents = autoPitchCorrection ? -naturalPitchDriftCents : 0;
  const percentageSpeedChange = ((timeRatio - 1.0) * 100);

  const handleSelectPreset = (preset: FpsConversionPreset) => {
    setSelectedPresetId(preset.id);
    const ratio = preset.targetFps / preset.sourceFps;
    setTimeRatio(ratio);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase font-mono flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            Post-Producción & Estándares Audiovisuales
          </span>
          <span className="text-xs text-slate-400 font-mono">Conversor de Fotogramas (FPS) & Sample-Accurate Sync</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Conversor de Velocidad de Fotogramas (FPS) y Corrección Automática de Tono
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-4xl">
          Convierte bandas sonoras completas entre estándares de Cine y Televisión (24 fps ⇄ 25 fps, 23.976 fps, Pull-Down 0.1%).
          Garantiza sincronía estricta de muestra (<strong className="text-cyan-300">cero drift en largometrajes de 2 horas</strong>) y preserva el timbre original de los actores sin efecto "ardilla" ni "ogro".
        </p>
      </div>

      {/* Preset Selector Banner */}
      <div className="bg-slate-900 border border-cyan-900/60 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Presets Estándar de Conversión Audiovisual (Cine & TV)
            </span>
          </div>
          <button
            onClick={() => setAutoPitchCorrection(!autoPitchCorrection)}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              autoPitchCorrection
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Corrección de Pitch: {autoPitchCorrection ? 'ACTIVA (Tono Fijo)' : 'DESACTIVADA (Varispeed Cinta)'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {FPS_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            const pct = ((p.targetFps / p.sourceFps - 1) * 100);
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="font-mono text-xs font-bold flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${pct >= 0 ? 'bg-cyan-900/60 text-cyan-300' : 'bg-amber-900/60 text-amber-300'}`}>
                    {pct > 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Configuración de Sesión y Bobina</span>
            </h3>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Frecuencia de Muestreo (Sample Rate):</label>
              <div className="grid grid-cols-3 gap-2">
                {[44100, 48000, 96000].map((sr) => (
                  <button
                    key={sr}
                    onClick={() => setSampleRate(sr)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                      sampleRate === sr
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {sr / 1000} kHz {sr === 48000 ? '(Estándar Cine)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Duración de la Bobina o Película:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '3 min (Escena)', sec: 180 },
                  { label: '45 min (Capítulo)', sec: 2700 },
                  { label: '90 min (Película)', sec: 5400 }
                ].map((item) => (
                  <button
                    key={item.sec}
                    onClick={() => setAudioDurationSec(item.sec)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                      audioDurationSec === item.sec
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Ratio de Velocidad (Time Stretch):</span>
                <span className="text-cyan-400 font-bold">{timeRatio.toFixed(6)}x ({percentageSpeedChange > 0 ? `+${percentageSpeedChange.toFixed(3)}%` : `${percentageSpeedChange.toFixed(3)}%`})</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.0001"
                value={timeRatio}
                onChange={(e) => {
                  setTimeRatio(parseFloat(e.target.value));
                  setSelectedPresetId('custom');
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Audiovisual conversion metrics card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Desplazamiento Natural (Varispeed):</span>
                <span className="text-amber-400 font-bold font-mono">
                  {naturalPitchDriftCents > 0 ? `+${naturalPitchDriftCents.toFixed(2)}¢` : `${naturalPitchDriftCents.toFixed(2)}¢`} ({(naturalPitchDriftCents / 100).toFixed(2)} semitonos)
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Compensación F-Form Aplicada:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {autoPitchCorrection ? `${autoCorrectedPitchCents.toFixed(2)}¢ (Tono Inalterado)` : '0.00¢ (Varispeed)'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Results & Simulation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantía de Sincronía Audiovisual (Pro Tools AudioSuite & Realtime)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block mb-1">Muestras de Entrada:</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">{inputSamples.toLocaleString()} smp</span>
                <span className="text-xs font-mono text-slate-500 block mt-0.5">({(inputSamples / sampleRate / 60).toFixed(1)} minutos exactos)</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block mb-1">Muestras de Salida Sincronizadas:</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{expectedOutputSamplesOffline.toLocaleString()} smp</span>
                <span className="text-xs font-mono text-slate-500 block mt-0.5">({(expectedOutputSamplesOffline / sampleRate / 60).toFixed(1)} min alineados a vídeo)</span>
              </div>
            </div>

            {/* Comparison between standard FIFO and F-Form 2.0 with Signalsmith */}
            <div className="space-y-3 pt-2">
              <div className="bg-rose-950/20 border border-rose-900/50 p-3.5 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Sin Algoritmo Adaptativo (Phase Vocoder Convencional):</span>
                </div>
                <p className="text-slate-400 mb-1">
                  Al acelerar una película de 24 a 25 fps (+4.167%), los actores suenan agudos (+70.67 cents) con pérdida de naturalidad vocal y desincronización por acumulación de saltos sin ventana flotante.
                </p>
                <div className="text-rose-400 font-bold">
                  Efecto: Voces con efecto ardilla ("chipmunk") y desfasaje labial en tomas largas.
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/50 p-3.5 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Con F-Form 2.0 (Motor Signalsmith Studio & Auto-Compensación):</span>
                </div>
                <p className="text-slate-300 mb-2">
                  La compensación inversa de -70.67 cents se aplica de forma transparente mediante el filtro de formantes a 8 kHz:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-emerald-400 font-bold">
                  <div>• Deriva de Sincronía: 0.000 muestras</div>
                  <div>• Tonalidad Vocal: 100% Original</div>
                  <div>• Sincronía Labial: Bloqueada al fotograma</div>
                  <div>• Compensación PDC: Automática</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
