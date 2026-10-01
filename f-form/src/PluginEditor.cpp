#include "PluginEditor.h"

PitchTimeProAudioProcessorEditor::PitchTimeProAudioProcessorEditor (PitchTimeProAudioProcessor& p)
    : AudioProcessorEditor (&p),
      audioProcessor (p)
{
    setSize (780, 500);

    // Setup rotary sliders
    setupRotarySlider (pitchSlider, -24.0, 24.0, 0.0, " st", 0);
    setupRotarySlider (centsSlider, -50.0, 50.0, 0.0, " ct", 0);
    setupRotarySlider (throatSlider, -12.0, 12.0, 0.0, " st", 1);
    setupRotarySlider (timeSlider, 0.5, 2.0, 1.0, "x", 3);

    pitchLabel.setText ("PITCH", juce::dontSendNotification);
    pitchLabel.setJustificationType (juce::Justification::centred);
    pitchLabel.attachToComponent (&pitchSlider, false);

    centsLabel.setText ("FINE CENTS", juce::dontSendNotification);
    centsLabel.setJustificationType (juce::Justification::centred);
    centsLabel.attachToComponent (&centsSlider, false);

    throatLabel.setText ("THROAT / FORMANT", juce::dontSendNotification);
    throatLabel.setJustificationType (juce::Justification::centred);
    throatLabel.attachToComponent (&throatSlider, false);

    timeLabel.setText ("TIME STRETCH", juce::dontSendNotification);
    timeLabel.setJustificationType (juce::Justification::centred);
    timeLabel.attachToComponent (&timeSlider, false);

    // Modos de Material Adaptativo
    materialSelector.addItem ("Vocal / Dialogue (Cine & Doblaje)", 1);
    materialSelector.addItem ("Complex Mix / Master (Orquesta & Reverb)", 2);
    materialSelector.addItem ("Rhythmic / Percussion (Baterias & Foley)", 3);
    materialSelector.setSelectedId (1, juce::dontSendNotification);

    materialLabel.setText ("CONTENT-AWARE MATERIAL:", juce::dontSendNotification);
    materialLabel.setJustificationType (juce::Justification::centredLeft);

    backendSelector.addItem ("Signalsmith Studio (MIT Core)", 1);
    backendSelector.addItem ("F-Form Standard (Linear)", 2);
    backendSelector.setSelectedId (1, juce::dontSendNotification);

    // Presets de conversion de velocidad de fotogramas (FPS) en audiovisual
    fpsPresetSelector.addItem ("Manual / Direct Control (1.000x)", 1);
    fpsPresetSelector.addItem ("24 fps -> 25 fps (Film to PAL +4.167%)", 2);
    fpsPresetSelector.addItem ("25 fps -> 24 fps (PAL to Film -4.000%)", 3);
    fpsPresetSelector.addItem ("23.976 fps -> 25 fps (NTSC 24p to PAL +4.271%)", 4);
    fpsPresetSelector.addItem ("25 fps -> 23.976 fps (PAL to NTSC 24p -4.096%)", 5);
    fpsPresetSelector.addItem ("24 fps -> 23.976 fps (Film 24p Pull-down -0.100%)", 6);
    fpsPresetSelector.addItem ("23.976 fps -> 24 fps (NTSC to Film 24p Pull-up +0.100%)", 7);
    fpsPresetSelector.addItem ("24 fps -> 29.97 fps (Film to NTSC Video +24.875%)", 8);
    fpsPresetSelector.addItem ("29.97 fps -> 24 fps (NTSC Video to Film -19.920%)", 9);
    fpsPresetSelector.addItem ("25 fps -> 29.97 fps (PAL to NTSC Video +19.880%)", 10);
    fpsPresetSelector.addItem ("29.97 fps -> 25 fps (NTSC Video to PAL -16.583%)", 11);
    fpsPresetSelector.addItem ("30 fps -> 24 fps (30p Video to Film -20.000%)", 12);
    fpsPresetSelector.addItem ("24 fps -> 30 fps (Film to 30p Video +25.000%)", 13);
    fpsPresetSelector.addItem ("29.97 fps -> 30 fps (NTSC Drop to Non-Drop +0.100%)", 14);
    fpsPresetSelector.addItem ("30 fps -> 29.97 fps (NTSC Non-Drop to Drop -0.100%)", 15);
    fpsPresetSelector.addItem ("60 fps -> 24 fps (HFR 60p to Film -60.000% Slow-Mo)", 16);
    fpsPresetSelector.addItem ("24 fps -> 60 fps (Film to HFR 60p +150.000% Fast-Motion)", 17);
    fpsPresetSelector.addItem ("59.94 fps -> 29.97 fps (Half Speed -50.000%)", 18);
    fpsPresetSelector.addItem ("29.97 fps -> 59.94 fps (Double Speed +100.000%)", 19);
    fpsPresetSelector.setSelectedId (1, juce::dontSendNotification);

    fpsLabel.setText ("SMPTE FRAME RATE (FILM & TV CONVERSION):", juce::dontSendNotification);
    fpsLabel.setJustificationType (juce::Justification::centredLeft);

    addAndMakeVisible (pitchSlider);
    addAndMakeVisible (centsSlider);
    addAndMakeVisible (throatSlider);
    addAndMakeVisible (timeSlider);
    addAndMakeVisible (materialLabel);
    addAndMakeVisible (materialSelector);
    addAndMakeVisible (formantButton);
    addAndMakeVisible (transientButton);
    addAndMakeVisible (enabledButton);
    addAndMakeVisible (backendSelector);
    addAndMakeVisible (fpsPresetSelector);
    addAndMakeVisible (fpsLabel);
    addAndMakeVisible (autoPitchCorrButton);
    addAndMakeVisible (multichannelLockButton);

    // Conexion con APVTS
    auto& params = audioProcessor.getParameters();
    pitchAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment> (
        params, "pitch_semitones", pitchSlider);
    centsAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment> (
        params, "pitch_cents", centsSlider);
    throatAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment> (
        params, "throat_shift", throatSlider);
    timeAttachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment> (
        params, "time_ratio", timeSlider);
    materialAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment> (
        params, "material_mode", materialSelector);
    formantAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment> (
        params, "formant_preserve", formantButton);
    transientAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment> (
        params, "transient_lock", transientButton);
    backendAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment> (
        params, "engine_backend", backendSelector);
    enabledAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment> (
        params, "enabled", enabledButton);
    fpsPresetAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ComboBoxAttachment> (
        params, "fps_preset", fpsPresetSelector);
    autoPitchCorrAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment> (
        params, "auto_pitch_corr", autoPitchCorrButton);
    multichannelLockAttachment = std::make_unique<juce::AudioProcessorValueTreeState::ButtonAttachment> (
        params, "multichannel_lock", multichannelLockButton);
}

void PitchTimeProAudioProcessorEditor::setupRotarySlider (juce::Slider& s, double min, double max, double def, const juce::String& suffix, int dec)
{
    s.setSliderStyle (juce::Slider::RotaryVerticalDrag);
    s.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 65, 20);
    s.setRange (min, max);
    s.setValue (def);
    s.setTextValueSuffix (suffix);
    s.setNumDecimalPlacesToDisplay (dec);
}

void PitchTimeProAudioProcessorEditor::paint (juce::Graphics& g)
{
    // Fondo profesional estilo hardware analogico oscuro
    g.fillAll (juce::Colour (0xff0a0f1d));

    // Cabecera
    g.setColour (juce::Colour (0xff111827));
    g.fillRect (0, 0, getWidth(), 56);

    g.setColour (juce::Colour (0xffffffff));
    g.setFont (juce::FontOptions (22.0f, juce::Font::bold));
    g.drawText ("F-FORM 2.0 PRO", 24, 14, 210, 28, juce::Justification::left);

    g.setColour (juce::Colour (0xff38bdf8));
    g.setFont (juce::FontOptions (12.0f));
    g.drawText ("POST-PRODUCTION PITCH & TIME SUITE \xe2\x80\xa2 DOLBY ATMOS & SURROUND 7.1 READY", 215, 18, 540, 22, juce::Justification::left);

    // Contenedores visuales
    // 1. Pitch & Throat Controls
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (20.0f, 68.0f, 390.0f, 235.0f, 8.0f);
    g.setColour (juce::Colour (0xff1f2937));
    g.drawRoundedRectangle (20.0f, 68.0f, 390.0f, 235.0f, 8.0f, 1.0f);

    // 2. Time & Material Mode Controls
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (425.0f, 68.0f, 335.0f, 235.0f, 8.0f);
    g.setColour (juce::Colour (0xff1f2937));
    g.drawRoundedRectangle (425.0f, 68.0f, 335.0f, 235.0f, 8.0f, 1.0f);

    // 3. Post-Production FPS & Multichannel Panel
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (20.0f, 315.0f, 740.0f, 120.0f, 8.0f);
    g.setColour (juce::Colour (0xff0284c7));
    g.drawRoundedRectangle (20.0f, 315.0f, 740.0f, 120.0f, 8.0f, 1.0f);

    // Subtitulos de seccion
    g.setColour (juce::Colour (0xff94a3b8));
    g.setFont (juce::FontOptions (12.0f, juce::Font::bold));
    g.drawText ("TONO Y TRACTO VOCAL (PITCH & THROAT)", 35, 76, 350, 20, juce::Justification::left);
    g.drawText ("TIEMPO Y MODO DE MATERIAL", 440, 76, 300, 20, juce::Justification::left);

    // Indicador de Sincronia Multicanal Activa (LED verde)
    g.setColour (juce::Colour (0xff22c55e));
    g.fillEllipse (730.0f, 326.0f, 10.0f, 10.0f);
    g.setColour (juce::Colour (0xff86efac));
    g.setFont (juce::FontOptions (10.0f, juce::Font::bold));
    g.drawText ("ATMOS / 7.1 / 5.1 PHASE-LOCKED", 500, 322, 220, 18, juce::Justification::right);
}

void PitchTimeProAudioProcessorEditor::resized()
{
    pitchSlider.setBounds (30, 115, 115, 140);
    centsSlider.setBounds (155, 115, 115, 140);
    throatSlider.setBounds (280, 115, 115, 140);

    formantButton.setBounds (35, 265, 180, 24);

    timeSlider.setBounds (440, 115, 115, 140);

    materialLabel.setBounds (565, 105, 185, 20);
    materialSelector.setBounds (565, 128, 185, 28);
    transientButton.setBounds (565, 168, 185, 24);
    backendSelector.setBounds (565, 205, 185, 28);

    // Panel Audiovisual de FPS y Multicanal
    fpsLabel.setBounds (35, 322, 450, 20);
    fpsPresetSelector.setBounds (35, 350, 340, 28);
    autoPitchCorrButton.setBounds (390, 350, 340, 28);
    multichannelLockButton.setBounds (35, 390, 340, 28);

    enabledButton.setBounds (getWidth() / 2 - 70, getHeight() - 44, 140, 32);
}
