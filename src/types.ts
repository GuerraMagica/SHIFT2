export type AudioAlgorithmType = 'fform_v2' | 'signalsmith' | 'classic_pv' | 'bypass';

export type AudioSourceType = 'drums' | 'vocal' | 'synth' | 'sweep' | 'mic' | 'file';

export interface DSPSettings {
  algorithm: AudioAlgorithmType;
  pitchSemitones: number; // -12 to +12
  pitchCents: number; // -50 to +50
  timeRatio: number; // 0.25 to 4.0
  formantPreserve: boolean;
  formantShiftSemitones: number; // -12 to +12
  transientPhaseLock: boolean;
  transientSensitivity: number; // 0.0 to 1.0
  windowSize: number; // 512, 1024, 2048, 4096
  hopRatio: number; // 0.25 (75% overlap)
  mode: 'realtime_insert' | 'offline_audiosuite';
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
  category: 'dsp' | 'plugin' | 'qa' | 'cmake';
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
