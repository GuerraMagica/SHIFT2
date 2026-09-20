import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AudioTestbench } from './components/AudioTestbench';
import { CodeViewer } from './components/CodeViewer';
import { AuditView } from './components/AuditView';
import { SyncCalculator } from './components/SyncCalculator';
import { audioEngine } from './dsp/dspEngine';
import { AudioAlgorithmType, AudioDiagnostics, DSPSettings } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'testbench' | 'cpp_code' | 'audit' | 'calculator'>('testbench');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.9);
  const [settings, setSettings] = useState<DSPSettings>(audioEngine.getSettings());
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics>({
    sampleRate: 48000,
    inputFrames: 0,
    outputFrames: 0,
    latencySamples: 2048,
    latencyMs: 42.66,
    phaseCoherence: 0.96,
    transientsDetected: 0,
    spectralCentroidHz: 2150,
    isProcessing: false,
    cpuLoadPercent: 8.5,
  });

  useEffect(() => {
    audioEngine.setDiagnosticsCallback((diag) => {
      setDiagnostics(diag);
      setIsPlaying(audioEngine.getIsPlaying());
    });
  }, []);

  const handleUpdateSettings = (newSettings: Partial<DSPSettings>) => {
    audioEngine.updateSettings(newSettings);
    setSettings(audioEngine.getSettings());
  };

  const handleTogglePlay = () => {
    audioEngine.togglePlayback();
    setIsPlaying(audioEngine.getIsPlaying());
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
  };

  const handleAlgorithmChange = (algo: AudioAlgorithmType) => {
    handleUpdateSettings({ algorithm: algo });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        currentAlgorithm={settings.algorithm}
        onAlgorithmChange={handleAlgorithmChange}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'testbench' && (
          <AudioTestbench
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            diagnostics={diagnostics}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onStop={handleStop}
          />
        )}

        {activeTab === 'cpp_code' && <CodeViewer />}

        {activeTab === 'audit' && <AuditView />}

        {activeTab === 'calculator' && <SyncCalculator />}
      </main>

      {/* Bottom Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-6 text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>F-Form DSP Engine v2.0 • Phase Vocoder + Identity Phase Locking (IPL) + Formant Preserver</span>
          </div>
          <div>
            <span>Desarrollado para Guerra Magica Audio (JUCE 8 / C++20 / macOS & AAX)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
