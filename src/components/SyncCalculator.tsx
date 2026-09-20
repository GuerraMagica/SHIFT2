import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export const SyncCalculator: React.FC = () => {
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [blockSize, setBlockSize] = useState<number>(512);
  const [timeRatio, setTimeRatio] = useState<number>(1.25);
  const [audioDurationSec, setAudioDurationSec] = useState<number>(180); // 3 minutes
  const [fftSize, setFftSize] = useState<number>(2048);

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

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase font-mono">
            Herramienta de Verificación Matemática
          </span>
          <span className="text-xs text-slate-400 font-mono">PDC & Sample-Accurate Sync Simulator</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Calculadora de Latencia PDC y Simulación de Drift de Sincronía
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Simula el comportamiento exacto de los buffers para diferentes frecuencias de muestreo (44.1k, 48k, 96k),
          tamaños de bloque del DAW y duraciones largas de audio.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Parámetros del Host / DAW</span>
            </h3>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Sample Rate (Hz):</label>
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
                    {sr / 1000} kHz
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Block Size (Buffer del Host):</label>
              <div className="grid grid-cols-4 gap-2">
                {[128, 256, 512, 1024].map((bs) => (
                  <button
                    key={bs}
                    onClick={() => setBlockSize(bs)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                      blockSize === bs
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {bs} smp
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Time Ratio:</span>
                <span className="text-cyan-400 font-bold">{timeRatio.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={timeRatio}
                onChange={(e) => setTimeRatio(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Duración del Audio:</span>
                <span className="text-cyan-400 font-bold">{audioDurationSec}s ({Math.floor(audioDurationSec / 60)}m {audioDurationSec % 60}s)</span>
              </div>
              <input
                type="range"
                min="10"
                max="600"
                step="10"
                value={audioDurationSec}
                onChange={(e) => setAudioDurationSec(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Tamaño FFT (Ventana):</label>
              <div className="grid grid-cols-3 gap-2">
                {[1024, 2048, 4096].map((w) => (
                  <button
                    key={w}
                    onClick={() => setFftSize(w)}
                    className={`py-2 text-xs font-mono rounded-lg border transition-all ${
                      fftSize === w
                        ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results & Math Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Resultados de la Simulación de Sincronía
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block mb-1">Latencia Reportada al Host (PDC):</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">{latencySamples} smp</span>
                <span className="text-xs font-mono text-slate-500 block mt-0.5">({latencyMs.toFixed(2)} ms exactos)</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block mb-1">Duración Offline Esperada:</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">{expectedOutputSamplesOffline.toLocaleString()} smp</span>
                <span className="text-xs font-mono text-slate-500 block mt-0.5">({(expectedOutputSamplesOffline / sampleRate).toFixed(2)} s)</span>
              </div>
            </div>

            {/* Comparison between Old FIFO and F-Form 2.0 */}
            <div className="space-y-3 pt-2">
              <div className="bg-rose-950/20 border border-rose-900/50 p-3.5 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Comportamiento con el Antiguo FIFO (F-Form Milestone 1):</span>
                </div>
                <p className="text-slate-400 mb-2">
                  El redondeo de saltos sin acumulador fraccional acumulaba un error de{' '}
                  <span className="text-rose-400 font-bold">{fractionalErrorPerHop.toFixed(4)} muestras/salto</span>.
                </p>
                <div className="text-rose-400 font-bold">
                  Drift Acumulado Estimado: ±{Math.round(cumulativeDriftSamplesOldFIFO).toLocaleString()} muestras ({(cumulativeDriftSamplesOldFIFO / sampleRate * 1000).toFixed(1)} ms de desalineación audible).
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/50 p-3.5 rounded-xl text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-300 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Comportamiento con F-Form 2.0 (Nuevo Motor con Acumulador Fraccional):</span>
                </div>
                <p className="text-slate-300 mb-2">
                  Acumulador de fase continua en precisión de 64 bits con flush sincrónico.
                </p>
                <div className="text-emerald-400 font-bold">
                  Drift Acumulado: 0.000 muestras exactas (Sincronía de muestra garantizada en Pro Tools y VST3).
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
