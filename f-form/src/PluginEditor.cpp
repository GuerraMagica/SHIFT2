#include "PluginEditor.h"

PitchTimeProAudioProcessorEditor::PitchTimeProAudioProcessorEditor (PitchTimeProAudioProcessor& p)
    : AudioProcessorEditor (&p),
      audioProcessor (p)
{
    // Tamaño espacioso para visualización clara de todos los controles de estudio
    setSize (840, 560);

    // 1. Configuración de Rotary Sliders
    setupRotarySlider (pitchSlider, -24.0, 24.0, 0.0, " st", 0);
    setupRotarySlider (centsSlider, -50.0, 50.0, 0.0, " ct", 0);
    setupRotarySlider (throatSlider, -12.0, 12.0, 0.0, " st", 1);
    setupRotarySlider (timeSlider, 0.5, 2.0, 1.0, "x", 3);

    pitchLabel.setText ("PITCH", juce::dontSendNotification);
    pitchLabel.setJustificationType (juce::Justification::centred);

    centsLabel.setText ("FINE CENTS", juce::dontSendNotification);
    centsLabel.setJustificationType (juce::Justification::centred);

    throatLabel.setText ("THROAT LENGTH", juce::dontSendNotification);
    throatLabel.setJustificationType (juce::Justification::centred);

    timeLabel.setText ("TIME RATIO", juce::dontSendNotification);
    timeLabel.setJustificationType (juce::Justification::centred);

    // 2. Modos de Material Adaptativo
    materialSelector.addItem ("Vocal / Dialogue (Cine & Doblaje)", 1);
    materialSelector.addItem ("Complex Mix / Master (Orquesta & Reverb)", 2);
    materialSelector.addItem ("Rhythmic / Percussion (Baterias & Foley)", 3);
    materialSelector.setSelectedId (1, juce::dontSendNotification);

    materialLabel.setText ("CONTENT-AWARE MATERIAL:", juce::dontSendNotification);
    materialLabel.setJustificationType (juce::Justification::centredLeft);

    backendSelector.addItem ("Signalsmith Studio (MIT Core)", 1);
    backendSelector.addItem ("F-Form Standard (Linear)", 2);
    backendSelector.setSelectedId (1, juce::dontSendNotification);

    // 3. Dropdown de Frame Rates SMPTE Estándar de la Industria
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

    // Añadir componentes hijos a la ventana
    addAndMakeVisible (pitchSlider);
    addAndMakeVisible (pitchLabel);
    addAndMakeVisible (centsSlider);
    addAndMakeVisible (centsLabel);
    addAndMakeVisible (throatSlider);
    addAndMakeVisible (throatLabel);

    addAndMakeVisible (timeSlider);
    addAndMakeVisible (timeLabel);

    addAndMakeVisible (materialLabel);
    addAndMakeVisible (materialSelector);
    addAndMakeVisible (formantButton);
    addAndMakeVisible (transientButton);
    addAndMakeVisible (backendSelector);

    addAndMakeVisible (fpsLabel);
    addAndMakeVisible (fpsPresetSelector);
    addAndMakeVisible (autoPitchCorrButton);
    addAndMakeVisible (multichannelLockButton);

    addAndMakeVisible (enabledButton);

    // Conexión con APVTS (AudioProcessorValueTreeState)
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
    s.setTextBoxStyle (juce::Slider::TextBoxBelow, false, 75, 22);
    s.setRange (min, max);
    s.setValue (def);
    s.setTextValueSuffix (suffix);
    s.setNumDecimalPlacesToDisplay (dec);
    s.setColour (juce::Slider::rotarySliderFillColourId, juce::Colour (0xff38bdf8));
    s.setColour (juce::Slider::thumbColourId, juce::Colour (0xffe2e8f0));
}

void PitchTimeProAudioProcessorEditor::paint (juce::Graphics& g)
{
    // Fondo profesional oscuro de hardware de estudio
    g.fillAll (juce::Colour (0xff0a0f1d));

    // Barra de cabecera
    g.setColour (juce::Colour (0xff111827));
    g.fillRect (0, 0, getWidth(), 56);

    // Línea separadora decorativa cian
    g.setColour (juce::Colour (0xff0284c7));
    g.fillRect (0, 54, getWidth(), 2);

    // Título y Subtítulo limpios (sin problemas de codificación UTF-8)
    g.setColour (juce::Colour (0xffffffff));
    g.setFont (juce::FontOptions (22.0f, juce::Font::bold));
    g.drawText ("F-FORM 2.0 PRO", 25, 14, 220, 28, juce::Justification::left);

    g.setColour (juce::Colour (0xff38bdf8));
    g.setFont (juce::FontOptions (12.0f, juce::Font::bold));
    g.drawText ("PITCH & TIME ENGINE | GUERRA MAGICA AUDIO", 245, 19, 560, 20, juce::Justification::left);

    // Contenedores visuales (Cards con esquinas redondeadas)
    // 1. Tarjeta Izquierda: Pitch, Fine Cents y Throat Length
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (20.0f, 68.0f, 470.0f, 245.0f, 10.0f);
    g.setColour (juce::Colour (0xff1f2937));
    g.drawRoundedRectangle (20.0f, 68.0f, 470.0f, 245.0f, 10.0f, 1.5f);

    // 2. Tarjeta Derecha: Time Stretch & Modos de Material
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (505.0f, 68.0f, 315.0f, 245.0f, 10.0f);
    g.setColour (juce::Colour (0xff1f2937));
    g.drawRoundedRectangle (505.0f, 68.0f, 315.0f, 245.0f, 10.0f, 1.5f);

    // 3. Tarjeta Inferior: Conversión Audiovisual SMPTE & Multicanal Atmos
    g.setColour (juce::Colour (0xff111827));
    g.fillRoundedRectangle (20.0f, 325.0f, 800.0f, 160.0f, 10.0f);
    g.setColour (juce::Colour (0xff0284c7));
    g.drawRoundedRectangle (20.0f, 325.0f, 800.0f, 160.0f, 10.0f, 1.5f);

    // Encabezados de sección dentro de las tarjetas (sin solapamiento)
    g.setColour (juce::Colour (0xff94a3b8));
    g.setFont (juce::FontOptions (11.0f, juce::Font::bold));
    g.drawText ("PITCH & VOCAL TRACT CONTROLS", 35, 78, 300, 16, juce::Justification::left);
    g.drawText ("DSP & MATERIAL MODE", 520, 78, 250, 16, juce::Justification::left);

    // LED de Sincronía Multicanal Dolby Atmos / 7.1 / 5.1
    g.setColour (juce::Colour (0xff22c55e));
    g.fillEllipse (785.0f, 338.0f, 10.0f, 10.0f);
    g.setColour (juce::Colour (0xff86efac));
    g.setFont (juce::FontOptions (10.0f, juce::Font::bold));
    g.drawText ("ATMOS / 7.1 / 5.1 PHASE-LOCKED", 540, 335, 235, 16, juce::Justification::right);
}

void PitchTimeProAudioProcessorEditor::resized()
{
    // =========================================================================
    // SECCIÓN SUPERIOR IZQUIERDA: PITCH, FINE CENTS & THROAT LENGTH
    // =========================================================================
    // Knob 1: PITCH
    pitchLabel.setBounds (35, 100, 130, 18);
    pitchSlider.setBounds (35, 120, 130, 135);

    // Knob 2: FINE CENTS
    centsLabel.setBounds (190, 100, 130, 18);
    centsSlider.setBounds (190, 120, 130, 135);

    // Knob 3: THROAT LENGTH / FORMANT SHIFT
    throatLabel.setBounds (345, 100, 130, 18);
    throatSlider.setBounds (345, 120, 130, 135);

    formantButton.setBounds (35, 268, 250, 28);

    // =========================================================================
    // SECCIÓN SUPERIOR DERECHA: TIME STRETCH & MATERIAL MODE
    // =========================================================================
    timeLabel.setBounds (520, 100, 120, 18);
    timeSlider.setBounds (520, 120, 120, 135);

    materialLabel.setBounds (655, 100, 155, 18);
    materialSelector.setBounds (655, 122, 155, 28);

    transientButton.setBounds (655, 162, 155, 24);
    backendSelector.setBounds (655, 196, 155, 28);

    // =========================================================================
    // SECCIÓN INFERIOR: SMPTE FRAME RATE & DOLBY ATMOS
    // =========================================================================
    fpsLabel.setBounds (35, 345, 450, 20);
    fpsPresetSelector.setBounds (35, 375, 420, 32);
    autoPitchCorrButton.setBounds (480, 375, 325, 32);

    multichannelLockButton.setBounds (35, 430, 420, 28);

    // =========================================================================
    // PIE DE PÁGINA: ACTIVACIÓN DEL PLUGIN / PDC BYPASS
    // =========================================================================
    enabledButton.setBounds (getWidth() / 2 - 80, getHeight() - 52, 160, 36);
}
