#pragma once

#if __has_include(<JuceHeader.h>)
#include <JuceHeader.h>
#else
#include <juce_audio_processors/juce_audio_processors.h>
#include <juce_audio_utils/juce_audio_utils.h>
#include <juce_dsp/juce_dsp.h>
#endif
#include "FFormDSPCore.h"
#include "Shift2VoiceEngine.h"
#include "TimeStretchEngine.h"

/**
 * ==============================================================================
 * PitchTimeProAudioProcessor (F-Form 2.0 Audio Processor)
 * Plugin VST3 / AU / AAX para DAWs (Pro Tools, Logic Pro, Ableton, Reaper)
 * ==============================================================================
 */
class PitchTimeProAudioProcessor : public juce::AudioProcessor
{
public:
    PitchTimeProAudioProcessor();
    ~PitchTimeProAudioProcessor() override = default;

    void prepareToPlay (double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;

    bool isBusesLayoutSupported (const BusesLayout& layouts) const override;
    void processBlock (juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return "F-Form 2.0"; }

    bool acceptsMidi() const override { return false; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram (int) override {}
    const juce::String getProgramName (int) override { return {}; }
    void changeProgramName (int, const juce::String&) override {}

    void getStateInformation (juce::MemoryBlock& destData) override;
    void setStateInformation (const void* data, int sizeInBytes) override;

    juce::AudioProcessorValueTreeState& getParameters() { return parameters; }
    fform::dsp::Shift2VoiceEngine& getVoiceEngine() { return voiceEngine; }
    TimeStretchEngine& getTimeStretchEngine() { return timeStretchEngine; }

private:
    juce::AudioProcessorValueTreeState parameters;
    fform::dsp::Shift2VoiceEngine voiceEngine;
    TimeStretchEngine timeStretchEngine;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PitchTimeProAudioProcessor)
};
