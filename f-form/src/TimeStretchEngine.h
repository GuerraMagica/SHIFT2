#pragma once

#if __has_include(<JuceHeader.h>)
#include <JuceHeader.h>
#else
#include <juce_audio_basics/juce_audio_basics.h>
#include <juce_dsp/juce_dsp.h>
#endif

#include "FFormDSPCore.h"
#include <memory>
#include <vector>
#include <cmath>
#include <atomic>

/**
 * ==============================================================================
 * TimeStretchEngine (JUCE 8 Wrapper para FFormDSPCore & Signalsmith MIT)
 * Soporta procesado en tiempo real para pistas estéreo, 5.1, 7.1 y Dolby Atmos
 * con compensación de retardo (PDC), modos de material adaptativo y control tímbrico.
 * ==============================================================================
 */
class TimeStretchEngine
{
public:
    enum class Backend {
        FFormAdvanced,   // Algoritmo Signalsmith MIT Core con Formantes y Multicanal
        FFormStandard    // Modo Phase Vocoder lineal
    };

    using MaterialMode = fform::dsp::MaterialMode;

    struct Diagnostics
    {
        int64_t hostInputFrames = 0;
        int64_t engineProducedOutputFrames = 0;
        int64_t reportedHostLatencySamples = 0;
        int64_t transientEvents = 0;
        float phaseCoherenceIndex = 0.98f;
        bool formantCorrectionActive = true;
        int activeChannels = 2;
    };

    TimeStretchEngine() = default;
    ~TimeStretchEngine() = default;

    void prepare(const juce::dsp::ProcessSpec& spec)
    {
        sampleRate = spec.sampleRate;
        numChannels = static_cast<int>(spec.numChannels);
        bufferSize = static_cast<int>(spec.maximumBlockSize);

        // Inicializar motor F-Form 2.0 Avanzado (Signalsmith MIT Core)
        fform::dsp::EngineConfig configAdv;
        configAdv.sampleRate = sampleRate;
        configAdv.numChannels = numChannels;
        configAdv.fftSize = 2048;
        configAdv.transientPhaseLock = transientLockEnabled;
        configAdv.formantPreservation = formantPreserveEnabled;
        fformEngine = std::make_unique<fform::dsp::FFormDSPCore>(configAdv);

        // Motor estándar (para modo comparador clásico)
        fform::dsp::EngineConfig configStd;
        configStd.sampleRate = sampleRate;
        configStd.numChannels = numChannels;
        configStd.fftSize = 2048;
        configStd.transientPhaseLock = false;
        configStd.formantPreservation = false;
        standardEngine = std::make_unique<fform::dsp::FFormDSPCore>(configStd);

        scratchBuffer.setSize(numChannels, bufferSize, false, true, true);
        inputPointers.resize(static_cast<size_t>(numChannels));
        outputPointers.resize(static_cast<size_t>(numChannels));

        // Bypass con compensación de retardo (PDC)
        const int latency = getOutputLatency();
        bypassDelay.setMaximumDelayInSamples(latency + bufferSize * 2);
        bypassDelay.prepare(spec);
        bypassDelay.setDelay(static_cast<float>(latency));
        bypassDelay.reset();

        diagnostics = {};
        diagnostics.reportedHostLatencySamples = latency;
        diagnostics.activeChannels = numChannels;
    }

    void setTimeRatio(float ratio)
    {
        timeRatio = std::isfinite(ratio) ? juce::jlimit(0.25f, 4.0f, ratio) : 1.0f;
    }

    void setPitchRatio(float ratio)
    {
        pitchRatio = std::isfinite(ratio) ? juce::jlimit(0.25f, 4.0f, ratio) : 1.0f;
    }

    void setPitchSemitones(float semitones)
    {
        setPitchRatio(std::pow(2.0f, semitones / 12.0f));
    }

    void setThroatShift(float semitones) noexcept
    {
        throatSemitones = std::isfinite(semitones) ? juce::jlimit(-12.0f, 12.0f, semitones) : 0.0f;
    }

    void setMaterialMode(MaterialMode mode) noexcept
    {
        materialMode = mode;
    }

    void setMultichannelPhaseLock(bool lock) noexcept
    {
        multichannelPhaseLock = lock;
    }

    void setFormantPreserve(bool preserve) noexcept
    {
        formantPreserveEnabled = preserve;
        diagnostics.formantCorrectionActive = preserve;
    }

    void setTransientLock(bool lock) noexcept
    {
        transientLockEnabled = lock;
    }

    void setBackend(Backend b) noexcept
    {
        currentBackend = b;
    }

    void setEnabled(bool shouldProcess) noexcept
    {
        enabled = shouldProcess;
    }

    void process(juce::AudioBuffer<float>& buffer)
    {
        const auto inputChannels = juce::jmin(numChannels, buffer.getNumChannels());
        const auto numSamples = buffer.getNumSamples();

        diagnostics.hostInputFrames += numSamples;

        if (inputChannels == 0 || numSamples == 0) {
            buffer.clear();
            return;
        }

        // Copia local para bypass alineado a muestras
        for (int ch = 0; ch < inputChannels; ++ch) {
            const auto* src = buffer.getReadPointer(ch);
            for (int s = 0; s < numSamples; ++s) {
                bypassDelay.pushSample(ch, src[s]);
            }
        }

        if (!enabled || (std::abs(pitchRatio - 1.0f) < 0.0005f &&
                         std::abs(timeRatio - 1.0f) < 0.0005f &&
                         std::abs(throatSemitones) < 0.01f))
        {
            for (int ch = 0; ch < inputChannels; ++ch) {
                auto* dst = buffer.getWritePointer(ch);
                for (int s = 0; s < numSamples; ++s) {
                    dst[s] = bypassDelay.popSample(ch);
                }
            }
            return;
        }

        // Evacuar delay de bypass mientras procesamos
        for (int ch = 0; ch < inputChannels; ++ch) {
            for (int s = 0; s < numSamples; ++s) {
                bypassDelay.popSample(ch);
            }
        }

        const size_t inChs = static_cast<size_t>(inputChannels);
        std::vector<const float*> ins(inChs);
        std::vector<float*> outs(inChs);
        for (size_t ch = 0; ch < inChs; ++ch) {
            ins[ch] = buffer.getReadPointer(static_cast<int>(ch));
            outs[ch] = buffer.getWritePointer(static_cast<int>(ch));
        }

        if (currentBackend == Backend::FFormAdvanced && fformEngine != nullptr) {
            fformEngine->processRealtimeBlock(ins.data(), outs.data(), numSamples,
                                             pitchRatio, timeRatio,
                                             throatSemitones, materialMode);
        } else if (standardEngine != nullptr) {
            standardEngine->processRealtimeBlock(ins.data(), outs.data(), numSamples,
                                                pitchRatio, timeRatio,
                                                throatSemitones, materialMode);
        }

        diagnostics.engineProducedOutputFrames += numSamples;
    }

    int getOutputLatency() const noexcept
    {
        if (fformEngine != nullptr) {
            return fformEngine->getLatencyInSamples();
        }
        return 2048;
    }

    Diagnostics getDiagnostics() const noexcept { return diagnostics; }

private:
    std::unique_ptr<fform::dsp::FFormDSPCore> fformEngine;
    std::unique_ptr<fform::dsp::FFormDSPCore> standardEngine;
    juce::dsp::DelayLine<float, juce::dsp::DelayLineInterpolationTypes::None> bypassDelay;

    Backend currentBackend = Backend::FFormAdvanced;
    MaterialMode materialMode = MaterialMode::VocalDialogue;
    double sampleRate = 48000.0;
    int numChannels = 2;
    int bufferSize = 2048;
    float timeRatio = 1.0f;
    float pitchRatio = 1.0f;
    float throatSemitones = 0.0f;
    bool enabled = true;
    bool formantPreserveEnabled = true;
    bool transientLockEnabled = true;
    bool multichannelPhaseLock = true;

    juce::AudioBuffer<float> scratchBuffer;
    std::vector<const float*> inputPointers;
    std::vector<float*> outputPointers;

    Diagnostics diagnostics;
};
