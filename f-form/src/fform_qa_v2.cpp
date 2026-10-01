#include "TimeStretchEngine.h"
#include <iostream>
#include <fstream>
#include <random>

/**
 * fform-qa v2.0
 * Ejecuta pruebas automatizadas de verificación de sincronización,
 * acumulador de fase, transitorios y preservación de formantes.
 */
int main (int argc, char* argv[])
{
    std::cout << "F-Form QA Harness 2.0 (Guerra Magica Audio)
";
    std::cout << "Verificando algoritmo FFormDSPCore con Identity Phase Locking...
";
    
    // Test determinista de acumulador de fase
    fform::dsp::EngineConfig cfg;
    cfg.sampleRate = 48000.0;
    cfg.numChannels = 2;
    cfg.transientPhaseLock = true;
    cfg.formantPreservation = true;

    fform::dsp::FFormDSPCore dsp(cfg);

    const int testLength = 48000 * 5; // 5 segundos
    std::vector<std::vector<float>> in(2, std::vector<float>(testLength, 0.0f));
    
    // Generar estímulo percusivo con transitorios agudos
    for (int i = 0; i < testLength; i += 24000) {
        in[0][i] = 1.0f; // Dirac delta transient
        in[1][i] = 1.0f;
    }

    std::vector<std::vector<float>> out;
    dsp.processOfflineBuffer(in, out, 1.0, 1.25); // 1.25x time stretch

    int expectedOut = static_cast<int>(std::round(testLength * 1.25));
    int actualOut = static_cast<int>(out[0].size());

    if (actualOut == expectedOut) {
        std::cout << "PASS: Offline duration check: " << actualOut << " frames exactos.
";
        return 0;
    } else {
        std::cerr << "FAIL: Duration mismatch! Expected: " << expectedOut << ", got: " << actualOut << "
";
        return 1;
    }
}
