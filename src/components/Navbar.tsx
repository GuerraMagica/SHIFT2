import React from 'react';
import { Play, Pause, Square, Volume2, ShieldCheck, Github, Cpu, Activity, Code, FileText, Calculator } from 'lucide-react';
import { AudioAlgorithmType } from '../types';

interface NavbarProps {
  activeTab: 'testbench' | 'cpp_code' | 'audit' | 'calculator';
  setActiveTab: (tab: 'testbench' | 'cpp_code' | 'audit' | 'calculator') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  currentAlgorithm: AudioAlgorithmType;
  onAlgorithmChange: (algo: AudioAlgorithmType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isPlaying,
  onTogglePlay,
  onStop,
  volume,
  onVolumeChange,
  currentAlgorithm,
  onAlgorithmChange,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-bold text-white text-lg shadow-lg shadow-cyan-500/20 border border-cyan-400/30">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-lg font-mono">F-FORM</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-semibold">
                  v2.0 DSP
                </span>
              </div>
              <p className="text-xs text-slate-400">Guerra Magica Audio • Studio Pitch & Time</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-testbench-btn"
              onClick={() => setActiveTab('testbench')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'testbench'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audio Lab & DSP</span>
            </button>

            <button
              id="tab-cpp-btn"
              onClick={() => setActiveTab('cpp_code')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'cpp_code'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Código C++ (Repo)</span>
            </button>

            <button
              id="tab-audit-btn"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'audit'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Auditoría Sync & Bug</span>
            </button>

            <button
              id="tab-calc-btn"
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculadora PDC</span>
            </button>
          </nav>

          {/* Quick Audio Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Quick A/B Engine Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-[10px] uppercase font-mono text-slate-400">Motor:</span>
              <select
                id="navbar-algo-select"
                value={currentAlgorithm}
                onChange={(e) => onAlgorithmChange(e.target.value as AudioAlgorithmType)}
                className="bg-slate-900 text-cyan-300 text-xs font-mono font-medium rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="fform_v2">F-Form 2.0 (IPL + Formant)</option>
                <option value="signalsmith">Signalsmith (Baseline)</option>
                <option value="classic_pv">Classic Phase Vocoder</option>
                <option value="bypass">Bypass (Original)</option>
              </select>
            </div>

            {/* Transport */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                id="navbar-play-btn"
                onClick={onTogglePlay}
                className={`p-2 rounded-md transition-colors ${
                  isPlaying
                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                id="navbar-stop-btn"
                onClick={onStop}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                title="Detener"
              >
                <Square className="w-4 h-4" />
              </button>
            </div>

            {/* Volume */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 px-2 py-1.5 rounded-lg border border-slate-800">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                id="navbar-volume-slider"
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Repo Link */}
            <a
              href="https://github.com/GuerraMagica/f-form"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
              title="Ver repositorio en GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
