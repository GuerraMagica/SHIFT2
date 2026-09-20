import React from 'react';
import { AlertCircle, CheckCircle2, FileText, Bug, Cpu, Layers, ShieldCheck } from 'lucide-react';
import { AUDIT_SECTIONS } from '../data/auditReport';

export const AuditView: React.FC = () => {
  return (
    <div className="space-y-6">

      {/* Header Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase font-mono">
            Auditoría de Ingeniería DSP
          </span>
          <span className="text-xs text-slate-400 font-mono">Repo: GuerraMagica/f-form (Commit 5cc5040)</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight font-mono">
          Diagnóstico del Bug de Sincronización y Hoja de Ruta de Mejora
        </h2>
        <p className="text-sm text-slate-300 mt-1 max-w-3xl">
          Análisis exhaustivo del problema de desfase temporal reportado en el <code className="text-cyan-300">AGENT_BRIEF.md</code>,
          la causa raíz del descarte de muestras en Milestone 1, y la solución arquitectónica implementada en F-Form 2.0.
        </p>
      </div>

      {/* Comparison Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Comparativa Técnica de Motores de Time-Stretch & Pitch-Shift</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
              <tr>
                <th className="py-3 px-4">Criterio / Característica</th>
                <th className="py-3 px-4 text-amber-400">Signalsmith (F-Form 1.0)</th>
                <th className="py-3 px-4 text-cyan-400 font-bold">F-Form 2.0 (Propuesto)</th>
                <th className="py-3 px-4 text-slate-400">Rubber Band v3</th>
                <th className="py-3 px-4 text-slate-400">SoundTouch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
              <tr>
                <td className="py-3 px-4 font-bold text-white">Preservación de Transitorios</td>
                <td className="py-3 px-4 text-amber-300">Baja (Sin IPL rígido; smearing)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Alta (Identity Phase Locking)</td>
                <td className="py-3 px-4 text-emerald-400">Muy Alta (Phase-locked vocoder)</td>
                <td className="py-3 px-4 text-slate-400">Media (WSOLA básico)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Preservación de Formantes</td>
                <td className="py-3 px-4 text-rose-400">No soportado (Efecto ardilla)</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Sí (Cepstral Liftering)</td>
                <td className="py-3 px-4 text-emerald-400">Sí (LPC / True Envelope)</td>
                <td className="py-3 px-4 text-rose-400">No</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Contrato Realtime Insert</td>
                <td className="py-3 px-4 text-amber-300">Fallback desactivado si time != 1.0</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">PDC Fija + Tape Sliding Window</td>
                <td className="py-3 px-4 text-slate-300">Latencia variable</td>
                <td className="py-3 px-4 text-slate-300">Buffer FIFO variable</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Contrato Offline / AudioSuite</td>
                <td className="py-3 px-4 text-amber-300">No implementado formalmente</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Exacto (N_out = N_in * ratio)</td>
                <td className="py-3 px-4 text-emerald-400">Sí (Calidad de estudio)</td>
                <td className="py-3 px-4 text-slate-300">Sí (Tiempo real)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-white">Licenciamiento & Huella</td>
                <td className="py-3 px-4 text-emerald-400">MIT / Header-only</td>
                <td className="py-3 px-4 text-emerald-400 font-bold">Código Propio C++20 / 0 Deps</td>
                <td className="py-3 px-4 text-amber-300">GPLv2 / Comercial</td>
                <td className="py-3 px-4 text-slate-300">LGPL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Sections Breakdown */}
      <div className="space-y-4">
        {AUDIT_SECTIONS.map((section) => (
          <div
            key={section.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-mono text-white flex items-center gap-2">
                <Bug className={`w-4 h-4 ${section.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                <span>{section.title}</span>
              </h3>
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded uppercase font-bold ${
                section.severity === 'critical'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                Severidad {section.severity}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              {section.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-rose-400 font-bold block mb-1">Causa Raíz en el Repo:</span>
                <p className="text-slate-400 leading-relaxed">{section.rootCause}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1">Solución Implementada en F-Form 2.0:</span>
                <p className="text-slate-400 leading-relaxed">{section.solution}</p>
              </div>
            </div>

            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 font-bold">Estado en Código Actual: </span>
              {section.currentRepoState}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
