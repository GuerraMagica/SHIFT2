cmake_minimum_required(VERSION 3.22)
project(FForm VERSION 2.0.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# JUCE 8 Framework (descarga automatica si no esta instalado localmente)
include(FetchContent)
FetchContent_Declare(
    JUCE
    GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
    GIT_TAG        8.0.4
)
FetchContent_MakeAvailable(JUCE)

# ==============================================================================
# Configuracion Avid AAX SDK para Pro Tools en macOS
# ==============================================================================
if(NOT DEFINED AAX_SDK_PATH)
    if(EXISTS "${CMAKE_CURRENT_SOURCE_DIR}/vendor/aax-sdk-2-9-0")
        set(AAX_SDK_PATH "${CMAKE_CURRENT_SOURCE_DIR}/vendor/aax-sdk-2-9-0")
    elseif(DEFINED ENV{AAX_SDK_PATH})
        set(AAX_SDK_PATH "$ENV{AAX_SDK_PATH}")
    endif()
endif()

set(PLUGIN_FORMATS VST3 AU)

# Comprobar presencia del SDK de Avid
if(EXISTS "${AAX_SDK_PATH}/Interfaces/AAX.h" OR EXISTS "${AAX_SDK_PATH}/include/AAX.h" OR EXISTS "${AAX_SDK_PATH}/AAX.h")
    message(STATUS ">> [OK] Avid AAX SDK detectado en: ${AAX_SDK_PATH}")
    message(STATUS ">> Compilando plugin F-Form para: VST3, AU y AAX (Pro Tools)")
    list(APPEND PLUGIN_FORMATS AAX)
else()
    message(STATUS ">> [INFO] Para compilar formato AAX (Pro Tools), coloca el SDK de Avid en: vendor/aax-sdk-2-9-0")
    message(STATUS ">> Compilando plugin F-Form para: VST3 y AU")
endif()

# ==============================================================================
# Definicion del Plugin F-Form con JUCE
# ==============================================================================
juce_add_plugin(FForm
    COMPANY_NAME "Guerra Magica Audio"
    BUNDLE_ID "com.guerramagica.fform"
    IS_SYNTH FALSE
    NEEDS_MIDI_INPUT FALSE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    PLUGIN_MANUFACTURER_CODE Grmg
    PLUGIN_CODE Ffrm
    FORMATS ${PLUGIN_FORMATS}
    PRODUCT_NAME "F-Form 2.0"
    AAX_CATEGORY AAX_ePlugInCategory_PitchShift
)

juce_generate_juce_header(FForm)

if("AAX" IN_LIST PLUGIN_FORMATS)
    target_compile_definitions(FForm PUBLIC JucePlugin_AAXDisableBypass=0)
endif()

target_sources(FForm PRIVATE
    src/PluginProcessor.h
    src/PluginProcessor.cpp
    src/PluginEditor.h
    src/PluginEditor.cpp
    src/FFormDSPCore.h
    src/Shift2VoiceEngine.h
    src/TimeStretchEngine.h
)

target_include_directories(FForm PRIVATE
    src
    src/signalsmith-linear
    vendor
    vendor/signalsmith-stretch
    vendor/signalsmith-linear
)

target_compile_definitions(FForm PRIVATE
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
)

target_link_libraries(FForm PRIVATE
    juce::juce_audio_utils
    juce::juce_dsp
    juce::juce_gui_basics
    juce::juce_gui_extra
    PUBLIC
    juce::juce_recommended_config_flags
    juce::juce_recommended_warning_flags
)
