#pragma once

#if __has_include(<JuceHeader.h>)
#include <JuceHeader.h>
#else
#include <juce_gui_basics/juce_gui_basics.h>
#include <juce_gui_extra/juce_gui_extra.h>
#include <juce_audio_processors/juce_audio_processors.h>
#endif
#include "PluginProcessor.h"

/**
 * ==============================================================================
 * PitchTimeProAudioProcessorEditor (F-Form 2.0 GUI Editor)
 * Interfaz profesional moderna para VST3 / AU / AAX en Pro Tools & DAWs
 * Con panel de Conversión Audiovisual de FPS, Throat Length y Soporte Atmos
 * ==============================================================================
 */
class PitchTimeProAudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    explicit PitchTimeProAudioProcessorEditor (PitchTimeProAudioProcessor&);
    ~PitchTimeProAudioProcessorEditor() override = default;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    void setupRotarySlider (juce::Slider& s, double min, double max, double def, const juce::String& suffix, int dec);

    PitchTimeProAudioProcessor& audioProcessor;

    // Rotary Sliders
    juce::Slider pitchSlider;
    juce::Label pitchLabel;

    juce::Slider centsSlider;
    juce::Label centsLabel;

    juce::Slider throatSlider;
    juce::Label throatLabel;

    juce::Slider timeSlider;
    juce::Label timeLabel;

    // Selectors & Toggles
    juce::ComboBox materialSelector;
    juce::Label materialLabel;

    juce::ToggleButton formantButton { "Formant Preservation" };
    juce::ToggleButton transientButton { "IPL Transient Lock" };
    juce::ToggleButton enabledButton { "Plugin Active" };
    juce::ComboBox backendSelector;

    // Audiovisual Post-Production FPS Conversion Panel
    juce::ComboBox fpsPresetSelector;
    juce::Label fpsLabel;
    juce::ToggleButton autoPitchCorrButton { "Auto Pitch Correction (Lock Key)" };
    juce::ToggleButton multichannelLockButton { "Phase Lock (5.1 / 7.1 / Atmos)" };

    // Parameter Attachments
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> pitchAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> centsAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> throatAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::SliderAttachment> timeAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> materialAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> formantAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> transientAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> backendAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> enabledAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ComboBoxAttachment> fpsPresetAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> autoPitchCorrAttachment;
    std::unique_ptr<juce::AudioProcessorValueTreeState::ButtonAttachment> multichannelLockAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (PitchTimeProAudioProcessorEditor)
};
