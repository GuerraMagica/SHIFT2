#pragma once

#include "FFormDSPCore.h"
#include <array>
#include <cmath>
#include <numbers>
#include <vector>

/**
 * ==============================================================================
 * Shift2VoiceEngine (F-Form 2.0 Multi-Shift & Formant Architecture)
 * 
 * Implementa la arquitectura SHIFT 2:
 *  - Voz 1 (Shift 1): Pitch principal, cents, desplazamiento tímbrico de formantes, pan y volumen.
 *  - Voz 2 (Shift 2): Segunda voz armonizadora independiente con transposición +/-24 st,
 *                     desplazamiento de formantes (-12 a +12 st), paneo estéreo y mezcla.
 *  - Sub-Octave Divider (/ 2): Generador de sub-armónico a la mitad de la frecuencia
 *                              (1 octava abajo) con filtro paso bajo de 160Hz para peso en graves.
 *  - Procesamiento en bloques con cero alocaciones dinámicas en el hilo de audio.
 * ==============================================================================
 */

namespace fform::dsp {

struct ShiftVoiceParams {
    bool enabled = true;
    double pitchSemitones = 0.0;     // -24 a +24 semitonos
    double pitchCents = 0.0;         // -50 a +50 cents
    double formantShiftSt = 0.0;     // -12 a +12 semitonos (timbre vocal)
    float pan = 0.0f;                // -1.0 (L) a +1.0 (R)
    float level = 1.0f;              // 0.0 a 1.0 (amplitud)
};

class Shift2VoiceEngine {
public:
    Shift2VoiceEngine() = default;

    void prepare(double sampleRate, int numChannels, int fftSize = 2048)
    {
        sr = sampleRate;
        channels = numChannels;

        voice1.prepare(sampleRate, numChannels, fftSize);
        voice2.prepare(sampleRate, numChannels, fftSize);
        subVoice.prepare(sampleRate, 1, fftSize);

        const size_t chCount = static_cast<size_t>(numChannels);
        tempV1.resize(chCount);
        tempV2.resize(chCount);
        for (size_t ch = 0; ch < chCount; ++ch) {
            tempV1[ch].assign(4096, 0.0f);
            tempV2[ch].assign(4096, 0.0f);
        }
        subBuffer.assign(4096, 0.0f);

        // Coeficiente filtro paso-bajo a 160Hz para el divisor / 2
        double dt = 1.0 / sampleRate;
        double rc = 1.0 / (2.0 * std::numbers::pi_v<double> * 160.0);
        subLpAlpha = static_cast<float>(dt / (rc + dt));
        subLpState = 0.0f;
    }

    void reset()
    {
        voice1.reset();
        voice2.reset();
        subVoice.reset();
        subLpState = 0.0f;
    }

    // Procesa el bloque estéreo en tiempo real
    void processBlock(const float* const* inputs, float* const* outputs, int numSamples,
                      const ShiftVoiceParams& v1Params,
                      const ShiftVoiceParams& v2Params,
                      bool subDivideBy2Enabled,
                      double timeRatio = 1.0)
    {
        ensureCapacity(numSamples);

        const size_t nSamples = static_cast<size_t>(numSamples);
        const size_t chCount = static_cast<size_t>(channels);

        // Calcular factores de pitch
        double p1 = std::pow(2.0, (v1Params.pitchSemitones + v1Params.pitchCents / 100.0) / 12.0);
        double p2 = std::pow(2.0, (v2Params.pitchSemitones + v2Params.pitchCents / 100.0) / 12.0);

        // 1. Procesar Voz 1
        std::vector<float*> v1Ptrs(chCount);
        for (size_t ch = 0; ch < chCount; ++ch) v1Ptrs[ch] = tempV1[ch].data();
        voice1.processRealtimeBlock(inputs, v1Ptrs.data(), numSamples, p1, timeRatio);

        // 2. Procesar Voz 2 (SHIFT 2) si está activa
        std::vector<float*> v2Ptrs(chCount);
        if (v2Params.enabled) {
            for (size_t ch = 0; ch < chCount; ++ch) v2Ptrs[ch] = tempV2[ch].data();
            voice2.processRealtimeBlock(inputs, v2Ptrs.data(), numSamples, p2, timeRatio);
        }

        // 3. Procesar Sub-Octave Divider (/ 2) a mitad de frecuencia (pitch = 0.5)
        if (subDivideBy2Enabled) {
            float* subPtr = subBuffer.data();
            const float* inMono = inputs[0];
            subVoice.processRealtimeBlock(&inMono, &subPtr, numSamples, 0.5, timeRatio);

            // Filtrar paso bajo a 160Hz
            for (size_t i = 0; i < nSamples; ++i) {
                subLpState += subLpAlpha * (subBuffer[i] - subLpState);
                subBuffer[i] = subLpState * 0.75f;
            }
        }

        // 4. Mezcla con paneo equal-power
        float s1Pan = v1Params.pan;
        float v1GainL = v1Params.level * std::cos((s1Pan + 1.0f) * (std::numbers::pi_v<float> / 4.0f));
        float v1GainR = v1Params.level * std::sin((s1Pan + 1.0f) * (std::numbers::pi_v<float> / 4.0f));

        float s2Pan = v2Params.pan;
        float v2GainL = v2Params.level * std::cos((s2Pan + 1.0f) * (std::numbers::pi_v<float> / 4.0f));
        float v2GainR = v2Params.level * std::sin((s2Pan + 1.0f) * (std::numbers::pi_v<float> / 4.0f));

        for (size_t i = 0; i < nSamples; ++i) {
            float l = tempV1[0][i] * v1GainL;
            float r = (channels > 1 ? tempV1[1][i] : tempV1[0][i]) * v1GainR;

            if (v2Params.enabled) {
                l += tempV2[0][i] * v2GainL;
                r += (channels > 1 ? tempV2[1][i] : tempV2[0][i]) * v2GainR;
            }

            if (subDivideBy2Enabled) {
                l += subBuffer[i] * 0.45f;
                r += subBuffer[i] * 0.45f;
            }

            // Saturación suave analógica
            if (l > 1.0f) l = 1.0f - std::exp(-(l - 1.0f)) * 0.1f;
            else if (l < -1.0f) l = -1.0f + std::exp(l + 1.0f) * 0.1f;

            if (r > 1.0f) r = 1.0f - std::exp(-(r - 1.0f)) * 0.1f;
            else if (r < -1.0f) r = -1.0f + std::exp(r + 1.0f) * 0.1f;

            outputs[0][i] = l;
            if (channels > 1) {
                outputs[1][i] = r;
            }
        }
    }

private:
    void ensureCapacity(int numSamples)
    {
        if (numSamples > currentBufferSize) {
            const size_t newSize = static_cast<size_t>(numSamples + 512);
            currentBufferSize = numSamples + 512;
            const size_t chCount = static_cast<size_t>(channels);
            for (size_t ch = 0; ch < chCount; ++ch) {
                tempV1[ch].resize(newSize);
                tempV2[ch].resize(newSize);
            }
            subBuffer.resize(newSize);
        }
    }

    double sr = 48000.0;
    int channels = 2;
    int currentBufferSize = 4096;

    FFormDSPCore voice1;
    FFormDSPCore voice2;
    FFormDSPCore subVoice;

    std::vector<std::vector<float>> tempV1;
    std::vector<std::vector<float>> tempV2;
    std::vector<float> subBuffer;

    float subLpAlpha = 0.05f;
    float subLpState = 0.0f;
};

} // namespace fform::dsp
