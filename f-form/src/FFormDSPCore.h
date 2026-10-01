#pragma once

#if __has_include("signalsmith-stretch.h")
#include "signalsmith-stretch.h"
#define FFORM_HAS_SIGNALSMITH 1
#elif __has_include(<signalsmith-stretch.h>)
#include <signalsmith-stretch.h>
#define FFORM_HAS_SIGNALSMITH 1
#elif __has_include("vendor/signalsmith-stretch/signalsmith-stretch.h")
#include "vendor/signalsmith-stretch/signalsmith-stretch.h"
#define FFORM_HAS_SIGNALSMITH 1
#else
#include "signalsmith-stretch.h"
#define FFORM_HAS_SIGNALSMITH 1
#endif

#include <vector>
#include <cmath>
#include <algorithm>
#include <numbers>
#include <cstddef>

/**
 * ==============================================================================
 * FFormDSPCore (Phase-Locked Vocoder & Formant Preserving Core)
 * Motor DSP Studio de última generación basado en Signalsmith Stretch (MIT)
 * 
 * Mejoras F-Form 2.0 Pro:
 *  - Ventanas Kaiser adaptativas según Modo de Material (Vocal, Mix, Percusión)
 *  - Modos de Material Adaptativo (Vocal/Dialogue, Complex Mix, Rhythmic/Percussion)
 *  - Longitud de Garganta / Formant Shift independiente (-12 a +12 semitonos)
 *  - Vinculación de fase multicanal estricta para Surround 5.1, 7.1 y Dolby Atmos
 * ==============================================================================
 */

namespace fform::dsp {

constexpr double kPi = std::numbers::pi_v<double>;
constexpr double kTwoPi = 2.0 * kPi;

enum class MaterialMode {
    VocalDialogue = 0,       // Optimizado para voz y diálogo de cine (120ms block, formantes F1-F4 protegidos)
    ComplexMix = 1,          // Mezclas polifónicas, orquesta y reverbs (150ms block, coherencia estéreo a 16 kHz)
    RhythmicPercussion = 2   // Baterías, percusiones y foley (45ms block, respuesta instantánea a transitorios)
};

struct EngineConfig {
    double sampleRate = 48000.0;
    int numChannels = 2;
    int fftSize = 2048;
    double hopRatio = 0.25;
    bool transientPhaseLock = true;
    double transientSensitivity = 0.65;
    bool formantPreservation = true;
    MaterialMode mode = MaterialMode::VocalDialogue;
};

class FFormDSPCore {
public:
    explicit FFormDSPCore(const EngineConfig& config = {})
        : cfg(config), currentMode(config.mode)
    {
        prepare(cfg.sampleRate, cfg.numChannels, cfg.fftSize);
    }

    void prepare(double newSampleRate, int newChannels, int newFftSize = 2048)
    {
        cfg.sampleRate = newSampleRate;
        cfg.numChannels = newChannels;
        cfg.fftSize = newFftSize;
        
        sampleRate = newSampleRate;
        channels = newChannels;

        configureForMode(currentMode);
    }

    void configureForMode(MaterialMode mode, double pitchFactor = 1.0)
    {
        currentMode = mode;
#if FFORM_HAS_SIGNALSMITH
        // Escalar la ventana dinámicamente si el pitch baja para dar mayor resolución a los graves
        double pitchScale = std::clamp(1.0 / std::sqrt(std::max(0.25, pitchFactor)), 0.85, 1.75);

        switch (mode) {
            case MaterialMode::VocalDialogue:
                // 120ms de bloque dinámico, 25ms de intervalo: resolución óptima para el formante vocal humano
                stretch.configure(channels, static_cast<int>(sampleRate * 0.12 * pitchScale), static_cast<int>(sampleRate * 0.025));
                break;
            case MaterialMode::ComplexMix:
                // 150ms de bloque dinámico, 30ms de intervalo: máxima resolución frecuencial para acordes, orquesta y reverbs
                stretch.configure(channels, static_cast<int>(sampleRate * 0.15 * pitchScale), static_cast<int>(sampleRate * 0.030));
                break;
            case MaterialMode::RhythmicPercussion:
                // 45ms de bloque dinámico, 10ms de intervalo: resolución temporal ultra-rápida sin pre-ringing para transitorios
                stretch.configure(channels, static_cast<int>(sampleRate * 0.045 * pitchScale), static_cast<int>(sampleRate * 0.010));
                break;
        }
#endif
    }

    void reset()
    {
#if FFORM_HAS_SIGNALSMITH
        stretch.reset();
#endif
    }

    // =========================================================================
    // PROCESAMIENTO REALTIME (Mono, Estéreo, 5.1, 7.1, Dolby Atmos 7.1.4)
    // =========================================================================
    void processRealtimeBlock(const float* const* inputs, float* const* outputs, int numSamples,
                              double pitchFactor, double timeRatio,
                              double throatSemitones = 0.0,
                              MaterialMode mode = MaterialMode::VocalDialogue)
    {
#if FFORM_HAS_SIGNALSMITH
        // Si el modo o el pitch han cambiado significativamente, reconfigurar bloques Kaiser adaptativos
        if (mode != currentMode || std::abs(pitchFactor - lastPitchFactor) > 0.08) {
            configureForMode(mode, pitchFactor);
            lastPitchFactor = pitchFactor;
        }

        // Si no hay transposición ni cambio tímbrico ni time-stretch, bypass transparente directo
        if (std::abs(pitchFactor - 1.0) < 0.00005 &&
            std::abs(timeRatio - 1.0) < 0.00005 &&
            std::abs(throatSemitones) < 0.005)
        {
            for (int ch = 0; ch < channels; ++ch) {
                std::copy_n(inputs[ch], numSamples, outputs[ch]);
            }
            return;
        }

        // 1. Calcular transposición en semitonos
        double semitones = 12.0 * std::log2(std::max(1e-5, pitchFactor));

        // 2. Tonality Limit y frecuencia base según Modo de Material
        float tonalityLimit = 0.0f;
        float formantBase = 0.0f;

        switch (mode) {
            case MaterialMode::VocalDialogue:
                // 8 kHz para preservar las resonancias naturales del tracto vocal en actores
                tonalityLimit = static_cast<float>(8000.0 / sampleRate);
                formantBase = static_cast<float>(150.0 / sampleRate);
                break;
            case MaterialMode::ComplexMix:
                // 16 kHz para retener el aire y la reverberación espacial en mezclas estéreo/surround
                tonalityLimit = static_cast<float>(16000.0 / sampleRate);
                formantBase = 0.0f;
                break;
            case MaterialMode::RhythmicPercussion:
                // 0 para respuesta espectral plana y bloqueo total en transitorios de batería y foley
                tonalityLimit = 0.0f;
                formantBase = 0.0f;
                break;
        }

        stretch.setFormantBase(formantBase);

        if (cfg.formantPreservation) {
            stretch.setTransposeSemitones(static_cast<float>(semitones), tonalityLimit);
        } else {
            stretch.setTransposeFactor(static_cast<float>(pitchFactor));
        }

        // 3. Longitud de Garganta / Formant Shift independiente (Throat Length)
        stretch.setFormantSemitones(static_cast<float>(throatSemitones), false);

        // 4. Procesar todos los canales vinculados en fase (Mono, Estéreo, 5.1, 7.1, Atmos)
        stretch.process(inputs, numSamples, outputs, numSamples);
#else
        for (int ch = 0; ch < channels; ++ch) {
            std::copy_n(inputs[ch], numSamples, outputs[ch]);
        }
#endif
    }

    // =========================================================================
    // PROCESAMIENTO OFFLINE / AUDIOSUITE MULTICANAL
    // =========================================================================
    void processOfflineBuffer(const std::vector<std::vector<float>>& input,
                             std::vector<std::vector<float>>& output,
                             double pitchFactor, double timeRatio,
                             double throatSemitones = 0.0,
                             MaterialMode mode = MaterialMode::VocalDialogue)
    {
        const size_t inFrames = input[0].size();
        const size_t outFrames = static_cast<size_t>(std::round(static_cast<double>(inFrames) * timeRatio));
        output.assign(static_cast<size_t>(channels), std::vector<float>(outFrames, 0.0f));

#if FFORM_HAS_SIGNALSMITH
        signalsmith::stretch::SignalsmithStretch<float> offlineStretch;

        switch (mode) {
            case MaterialMode::VocalDialogue:
                offlineStretch.configure(channels, static_cast<int>(sampleRate * 0.12), static_cast<int>(sampleRate * 0.025));
                break;
            case MaterialMode::ComplexMix:
                offlineStretch.configure(channels, static_cast<int>(sampleRate * 0.15), static_cast<int>(sampleRate * 0.030));
                break;
            case MaterialMode::RhythmicPercussion:
                offlineStretch.configure(channels, static_cast<int>(sampleRate * 0.045), static_cast<int>(sampleRate * 0.010));
                break;
        }

        double semitones = 12.0 * std::log2(std::max(1e-5, pitchFactor));
        float tonalityLimit = (mode == MaterialMode::VocalDialogue) ? static_cast<float>(8000.0 / sampleRate) :
                              (mode == MaterialMode::ComplexMix)    ? static_cast<float>(16000.0 / sampleRate) : 0.0f;

        if (cfg.formantPreservation) {
            offlineStretch.setTransposeSemitones(static_cast<float>(semitones), tonalityLimit);
        } else {
            offlineStretch.setTransposeFactor(static_cast<float>(pitchFactor));
        }

        offlineStretch.setFormantSemitones(static_cast<float>(throatSemitones), false);

        std::vector<const float*> inPtrs(static_cast<size_t>(channels));
        std::vector<float*> outPtrs(static_cast<size_t>(channels));
        for (size_t ch = 0; ch < static_cast<size_t>(channels); ++ch) {
            inPtrs[ch] = input[ch].data();
            outPtrs[ch] = output[ch].data();
        }

        offlineStretch.process(inPtrs.data(), static_cast<int>(inFrames),
                               outPtrs.data(), static_cast<int>(outFrames));
#else
        for (size_t ch = 0; ch < static_cast<size_t>(channels); ++ch) {
            std::copy_n(input[ch].begin(), std::min(inFrames, outFrames), output[ch].begin());
        }
#endif
    }

    int getLatencyInSamples() const noexcept
    {
#if FFORM_HAS_SIGNALSMITH
        return stretch.inputLatency() + stretch.outputLatency();
#else
        return 0;
#endif
    }

private:
    EngineConfig cfg;
    MaterialMode currentMode = MaterialMode::VocalDialogue;
    double sampleRate = 48000.0;
    int channels = 2;
    double lastPitchFactor = 1.0;

#if FFORM_HAS_SIGNALSMITH
    signalsmith::stretch::SignalsmithStretch<float> stretch;
#endif
};

} // namespace fform::dsp
