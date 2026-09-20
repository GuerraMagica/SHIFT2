import { AuditSection } from '../types';

export const AUDIT_SECTIONS: AuditSection[] = [
  {
    id: 'realtime_contract',
    title: '1. Desfase Temporal y Conflicto entre Contratos Realtime vs Offline',
    severity: 'critical',
    summary: 'En Milestone 2A se desactivó el time-stretching en tiempo real forzándolo a 1.0 mediante un fallback pasivo.',
    currentRepoState: 'En `TimeStretchEngine.h`: si `std::abs(timeRatio - 1.0f) > 1e-6f`, el código actual incrementa `timeRatioFallbackEvents` y no procesa el ratio temporal, porque en inserciones en tiempo real el host DAW exige estrictamente N muestras por bloque.',
    rootCause: 'Un plugin en el bus de inserción de un DAW (Pro Tools, Logic, Reaper) opera con un flujo N-in / N-out síncrono. No puede emitir 1.5x más muestras en tiempo real sin una ventana deslizante/congelada circular (tape buffer). Intentar estirar el tiempo con un FIFO sin sincronía al reloj del DAW causaba los 576.000 underflows y 255.000 frames rechazados vistos en el Baseline anterior.',
    solution: 'Separar explícitamente los dos modos de uso: (A) Realtime Insert con pitch shifting continuo de latencia fija compensada (PDC) y time freeze/granular sincronizado al tempo del DAW; y (B) Modo Offline / AudioSuite / Clip Processing donde N_out = round(N_in * ratio) con preservación estricta de duración y acumulador fraccional de fase.'
  },
  {
    id: 'transient_smearing',
    title: '2. Pérdida de Pegada ("Smearing") en Transitorios y Baterías',
    severity: 'high',
    summary: 'Signalsmith Stretch y los phase vocoders convencionales difuminan la fase de los ataques percusivos.',
    currentRepoState: 'Signalsmith Stretch utiliza rotación de fase espectral multi-banda pero carece de un mecanismo rígido de anclaje de fase ante transitorios repentinos (Spectral Flux spikes).',
    rootCause: 'Cuando un transitorio (como el golpe seco de una caja o bombo) cruza una ventana STFT enventanada con Hann, la energía se reparte en múltiples bins. Si la fase de cada bin se desenrolla y escala independientemente, se pierde la alineación coherente en t = t_impacto, transformando el golpe nítido en un sonido "acuoso" o "flanger".',
    solution: 'Implementación de Identity Phase Locking (IPL) según Laroche & Dolson + Puckette, combinado con detección por Spectral Flux. Cuando se detecta un onset transitorio, las fases se bloquean al ángulo de impacto original o a los picos dominantes, preservando el impacto 100% intacto.'
  },
  {
    id: 'formant_preservation',
    title: '3. Efecto Ardilla ("Chipmunk Effect") por Falta de Preservación de Formantes',
    severity: 'high',
    summary: 'Al cambiar el tono de una voz o instrumento acústico, los formantes del tracto vocal se desplazan de forma no natural.',
    currentRepoState: 'Actualmente F-Form ejecuta un cambio de tono simple mediante `stretch.setTransposeSemitones(12.0 * log2(pitchRatio))` sin filtro de compensación espectral de formantes.',
    rootCause: 'El timbre de la voz humana depende de las frecuencias de resonancia de la faringe y boca (formantes F1, F2, F3). Al multiplicar las frecuencias por un factor alfa, los formantes se mueven junto con el tono fundamental F0, convirtiendo una voz humana masculina o femenina en un dibujo animado o en una criatura cavernosa.',
    solution: 'Módulo de Extracción de Envolvente Espectral (Cepstrum Liftering o True Envelope) en FFormDSPCore: se separa la envolvente tímbrica de los armónicos excitadores, se aplica el pitch shift a los armónicos, y se reinyecta la envolvente tímbrica a sus frecuencias de formante originales.'
  },
  {
    id: 'latency_pdc',
    title: '4. Compensación de Latencia en Host (PDC) y Desfase Inicial',
    severity: 'medium',
    summary: 'Signalsmith reporta `inputLatency()` y `outputLatency()`, pero se reportaba sólo `outputLatency()`.',
    currentRepoState: 'En `PluginProcessor.cpp`: `setLatencySamples(timeStretchEngine.getOutputLatency())`. Sin embargo, `stretch.inputLatency()` también introduce muestras requeridas antes de emitir la primera síntesis.',
    rootCause: 'Si el DAW sólo compensa la latencia de salida pero no se compensa internamente la latencia de entrada o el pre-roll de análisis, el audio procesado se desfasa exactamente en una ventana de análisis respecto a la pista contigua, provocando cancelaciones de fase al mezclar.',
    solution: 'Alineación matemática exacta en `FFormDSPCore`: latencia determinista fija exactamente igual al tamaño de ventana N (2048 muestras a 48kHz = 42.66 ms). Delay line interno para la ruta de bypass con la misma latencia para que alternar entre Bypass y Activo tenga diferencia de fase cero.'
  }
];
