import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../dsp/dspEngine';
import { AudioDiagnostics } from '../types';

interface SpectrogramViewProps {
  diagnostics: AudioDiagnostics;
  isPlaying: boolean;
}

export const SpectrogramView: React.FC<SpectrogramViewProps> = ({ diagnostics, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    const render = () => {
      animFrameIdRef.current = requestAnimationFrame(render);

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, width, height);

      // Grid background lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 0; x < width; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        analyser.getByteTimeDomainData(timeArray);

        // Draw frequency spectrum with gradient
        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#06b6d4'); // Cyan
        gradient.addColorStop(0.5, '#3b82f6'); // Blue
        gradient.addColorStop(0.85, '#a855f7'); // Purple
        gradient.addColorStop(1, '#f59e0b'); // Amber peaks

        ctx.fillStyle = gradient;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height * 0.75);
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
          if (x > width) break;
        }

        // Draw waveform overlay
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let waveX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeArray[i] / 128.0;
          const y = (v * height) / 3.5 + 40;

          if (i === 0) {
            ctx.moveTo(waveX, y);
          } else {
            ctx.lineTo(waveX, y);
          }
          waveX += sliceWidth;
        }
        ctx.stroke();
      } else {
        // Idle animation
        ctx.fillStyle = '#64748b';
        ctx.font = '12px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EN ESPERA — PULSA REPRODUCIR PARA ANALIZAR EL ESPECTRO DSP', width / 2, height / 2);
      }
    };

    render();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <h3 className="text-sm font-semibold text-slate-200 font-mono">
            ANALIZADOR ESPECTRAL FFT & FORMA DE ONDA
          </h3>
        </div>

        {/* Realtime Metrics Badges */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400">Coherencia de Fase:</span>
            <span className={`font-bold ${diagnostics.phaseCoherence >= 0.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(diagnostics.phaseCoherence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400">Latencia PDC:</span>
            <span className="font-bold text-cyan-400">
              {diagnostics.latencySamples} smp ({diagnostics.latencyMs.toFixed(1)} ms)
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400">Transitorios:</span>
            <span className="font-bold text-purple-400">{diagnostics.transientsDetected}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={180}
          className="w-full h-full block"
        />

        {/* Frequency scale markers */}
        <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[10px] font-mono text-slate-500 pointer-events-none">
          <span>20 Hz</span>
          <span>250 Hz</span>
          <span>1 kHz</span>
          <span>4 kHz</span>
          <span>10 kHz</span>
          <span>20 kHz</span>
        </div>
      </div>
    </div>
  );
};
