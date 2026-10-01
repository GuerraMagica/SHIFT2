#include "PluginProcessor.h"
#include "PluginEditor.h"
#include <cmath>

PitchTimeProAudioProcessor::PitchTimeProAudioProcessor()
    : AudioProcessor (BusesProperties()
          .withInput ("Input", juce::AudioChannelSet::stereo(), true)
          .withOutput ("Output", juce::AudioChannelSet::stereo(), true)),
      parameters (*this, nullptr, "PARAMETERS", {
          std::make_unique<juce::AudioParameterFloat>("pitch_semitones", "Pitch Semitones", -24.0f, 24.0f, 0.0f),
          std::make_unique<juce::AudioParameterFloat>("pitch_cents", "Pitch Cents", -50.0f, 50.0f, 0.0f),
          std::make_unique<juce::AudioParameterFloat>("throat_shift", "Throat Length / Formant Shift", -12.0f, 12.0f, 0.0f),
          std::make_unique<juce::AudioParameterChoice>("material_mode", "Content-Aware Material Mode",
              juce::StringArray {
                  "Vocal / Dialogue (Cine & Doblaje)",
                  "Complex Mix / Master (Orquesta & Reverb)",
                  "Rhythmic / Percussion (Baterias & Foley)"
              }, 0),
          std::make_unique<juce::AudioParameterFloat>("time_ratio", "Time Ratio", 0.5f, 2.0f, 1.0f),
          std::make_unique<juce::AudioParameterBool>("formant_preserve", "Formant Preservation", true),
          std::make_unique<juce::AudioParameterBool>("transient_lock", "Transient Lock (IPL)", true),
          std::make_unique<juce::AudioParameterChoice>("engine_backend", "DSP Engine",
              juce::StringArray { "Signalsmith Studio (MIT Core)", "F-Form Standard (Linear)" }, 0),
          std::make_unique<juce::AudioParameterChoice>("fps_preset", "SMPTE Frame Rate",
              juce::StringArray {
                  "Manual / Direct Control (1.000x)",
                  "24 fps -> 25 fps (Film to PAL +4.167%)",
                  "25 fps -> 24 fps (PAL to Film -4.000%)",
                  "23.976 fps -> 25 fps (NTSC 24p to PAL +4.271%)",
                  "25 fps -> 23.976 fps (PAL to NTSC 24p -4.096%)",
                  "24 fps -> 23.976 fps (Film 24p Pull-down -0.100%)",
                  "23.976 fps -> 24 fps (NTSC to Film 24p Pull-up +0.100%)",
                  "24 fps -> 29.97 fps (Film to NTSC Video +24.875%)",
                  "29.97 fps -> 24 fps (NTSC Video to Film -19.920%)",
                  "25 fps -> 29.97 fps (PAL to NTSC Video +19.880%)",
                  "29.97 fps -> 25 fps (NTSC Video to PAL -16.583%)",
                  "30 fps -> 24 fps (30p Video to Film -20.000%)",
                  "24 fps -> 30 fps (Film to 30p Video +25.000%)",
                  "29.97 fps -> 30 fps (NTSC Drop to Non-Drop +0.100%)",
                  "30 fps -> 29.97 fps (NTSC Non-Drop to Drop -0.100%)",
                  "60 fps -> 24 fps (HFR 60p to Film -60.000% Slow-Mo)",
                  "24 fps -> 60 fps (Film to HFR 60p +150.000% Fast-Motion)",
                  "59.94 fps -> 29.97 fps (Half Speed -50.000%)",
                  "29.97 fps -> 59.94 fps (Double Speed +100.000%)"
              }, 0),
          std::make_unique<juce::AudioParameterBool>("auto_pitch_corr", "Auto Pitch Correction (Maintain Key)", true),
          std::make_unique<juce::AudioParameterBool>("multichannel_lock", "Multichannel Phase Lock (Surround & Atmos)", true),
          std::make_unique<juce::AudioParameterBool>("enabled", "Enabled", true)
      })
{
}

bool PitchTimeProAudioProcessor::isBusesLayoutSupported (const BusesLayout& layouts) const
{
    const auto& mainIn = layouts.getMainInputChannelSet();
    const auto& mainOut = layouts.getMainOutputChannelSet();

    if (mainIn != mainOut)
        return false;

    // Soporte nativo para mono, estereo, sonido envolvente 5.1, 7.1 y Dolby Atmos 7.1.4
    return mainIn == juce::AudioChannelSet::mono()
        || mainIn == juce::AudioChannelSet::stereo()
        || mainIn == juce::AudioChannelSet::createLCR()
        || mainIn == juce::AudioChannelSet::quadraphonic()
        || mainIn == juce::AudioChannelSet::create5point0()
        || mainIn == juce::AudioChannelSet::create5point1()
        || mainIn == juce::AudioChannelSet::create7point1()
        || mainIn == juce::AudioChannelSet::create7point1SDDS()
        || mainIn == juce::AudioChannelSet::create7point1point2()
        || mainIn == juce::AudioChannelSet::create7point1point4();
}

void PitchTimeProAudioProcessor::prepareToPlay (double sampleRate, int samplesPerBlock)
{
    juce::dsp::ProcessSpec spec;
    spec.sampleRate = sampleRate;
    spec.maximumBlockSize = static_cast<juce::uint32> (samplesPerBlock);
    spec.numChannels = static_cast<juce::uint32> (getTotalNumOutputChannels());

    timeStretchEngine.prepare (spec);
    setLatencySamples (timeStretchEngine.getOutputLatency());
}

void PitchTimeProAudioProcessor::releaseResources()
{
}

juce::AudioProcessorEditor* PitchTimeProAudioProcessor::createEditor()
{
    return new PitchTimeProAudioProcessorEditor (*this);
}

void PitchTimeProAudioProcessor::processBlock (juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ignoreUnused (midiMessages);

    // Leer parametros en tiempo real
    const float pitchSemitones = *parameters.getRawParameterValue ("pitch_semitones");
    const float pitchCents = *parameters.getRawParameterValue ("pitch_cents");
    const float throatShift = *parameters.getRawParameterValue ("throat_shift");
    const int materialMode = static_cast<int>(*parameters.getRawParameterValue ("material_mode"));
    float timeRatio = *parameters.getRawParameterValue ("time_ratio");
    const bool formantPreserve = *parameters.getRawParameterValue ("formant_preserve") > 0.5f;
    const bool transientLock = *parameters.getRawParameterValue ("transient_lock") > 0.5f;
    const int backendIndex = static_cast<int>(*parameters.getRawParameterValue ("engine_backend"));
    const int fpsPreset = static_cast<int>(*parameters.getRawParameterValue ("fps_preset"));
    const bool autoPitchCorr = *parameters.getRawParameterValue ("auto_pitch_corr") > 0.5f;
    const bool multichannelLock = *parameters.getRawParameterValue ("multichannel_lock") > 0.5f;
    const bool enabled = *parameters.getRawParameterValue ("enabled") > 0.5f;

    // 1. Calcular ratio temporal con precision SMPTE estricta de fraccion exacta
    float presetSpeedRatio = 1.0f;
    switch (fpsPreset)
    {
        case 1: presetSpeedRatio = 25.0f / 24.0f; break;                           // 24 -> 25 (+4.1667%)
        case 2: presetSpeedRatio = 24.0f / 25.0f; break;                           // 25 -> 24 (-4.0000%)
        case 3: presetSpeedRatio = 1001.0f / 960.0f; break;                        // 23.976 -> 25 (+4.2708%)
        case 4: presetSpeedRatio = 960.0f / 1001.0f; break;                        // 25 -> 23.976 (-4.0959%)
        case 5: presetSpeedRatio = 1000.0f / 1001.0f; break;                       // 24 -> 23.976 Pull-down (-0.0999%)
        case 6: presetSpeedRatio = 1001.0f / 1000.0f; break;                       // 23.976 -> 24 Pull-up (+0.1000%)
        case 7: presetSpeedRatio = 1250.0f / 1001.0f; break;                       // 24 -> 29.97 (+24.8751%)
        case 8: presetSpeedRatio = 1001.0f / 1250.0f; break;                       // 29.97 -> 24 (-19.9200%)
        case 9: presetSpeedRatio = 1200.0f / 1001.0f; break;                       // 25 -> 29.97 (+19.8801%)
        case 10: presetSpeedRatio = 1001.0f / 1200.0f; break;                      // 29.97 -> 25 (-16.5833%)
        case 11: presetSpeedRatio = 24.0f / 30.0f; break;                          // 30 -> 24 (-20.0000%)
        case 12: presetSpeedRatio = 30.0f / 24.0f; break;                          // 24 -> 30 (+25.0000%)
        case 13: presetSpeedRatio = 1001.0f / 1000.0f; break;                      // 29.97 -> 30 (+0.1000%)
        case 14: presetSpeedRatio = 1000.0f / 1001.0f; break;                      // 30 -> 29.97 (-0.1000%)
        case 15: presetSpeedRatio = 24.0f / 60.0f; break;                          // 60 -> 24 (-60.0000% Slow-Mo)
        case 16: presetSpeedRatio = 60.0f / 24.0f; break;                          // 24 -> 60 (+150.000% Fast-Mo)
        case 17: presetSpeedRatio = 0.5f; break;                                   // 59.94 -> 29.97 (-50.000%)
        case 18: presetSpeedRatio = 2.0f; break;                                   // 29.97 -> 59.94 (+100.000%)
        default: presetSpeedRatio = 1.0f; break;
    }

    if (fpsPreset > 0) {
        timeRatio = presetSpeedRatio;
    }

    // 2. Factor de pitch base introducido por el usuario
    const float totalUserSemitones = pitchSemitones + (pitchCents / 100.0f);
    float pitchRatio = std::pow (2.0f, totalUserSemitones / 12.0f);

    // 3. Compensacion automatica de pitch para preservar el tono en conversion audiovisual
    // Si autoPitchCorr esta activo, multiplica por 1 / timeRatio para cancelar exactamente
    // el aumento o disminucion de tono producido por la velocidad de reproduccion cinematografica.
    if (autoPitchCorr && std::abs (timeRatio - 1.0f) > 0.00005f) {
        float compensationFactor = 1.0f / timeRatio;
        pitchRatio *= compensationFactor;
    }

    timeStretchEngine.setEnabled (enabled);
    timeStretchEngine.setTimeRatio (timeRatio);
    timeStretchEngine.setPitchRatio (pitchRatio);
    timeStretchEngine.setThroatShift (throatShift);
    timeStretchEngine.setMaterialMode (static_cast<TimeStretchEngine::MaterialMode>(materialMode));
    timeStretchEngine.setMultichannelPhaseLock (multichannelLock);
    timeStretchEngine.setFormantPreserve (formantPreserve);
    timeStretchEngine.setTransientLock (transientLock);
    timeStretchEngine.setBackend (backendIndex == 0 ? TimeStretchEngine::Backend::FFormAdvanced 
                                                   : TimeStretchEngine::Backend::FFormStandard);

    timeStretchEngine.process (buffer);
}

void PitchTimeProAudioProcessor::getStateInformation (juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml (state.createXml());
    copyXmlToBinary (*xml, destData);
}

void PitchTimeProAudioProcessor::setStateInformation (const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState (getXmlFromBinary (data, sizeInBytes));
    if (xmlState != nullptr)
        parameters.replaceState (juce::ValueTree::fromXml (*xmlState));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new PitchTimeProAudioProcessor();
}
