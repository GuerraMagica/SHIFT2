#!/usr/bin/env bash
# ==============================================================================
# Script de compilacion automatica de F-Form 2.0 en macOS (Apple Silicon & Intel)
# Genera: VST3, AU (AudioUnit) y AAX (Pro Tools)
# ==============================================================================

set -e

echo "--------------------------------------------------------"
echo "  Compilador F-Form 2.0 (Guerra Magica) para macOS"
echo "--------------------------------------------------------"

# 1. Comprobar herramientas necesarias en Mac
if ! command -v cmake &> /dev/null; then
    echo "ERROR: CMake no esta instalado. En Mac ejecutalo con: brew install cmake"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "ERROR: Git no esta instalado. Instala las Command Line Tools con: xcode-select --install"
    exit 1
fi

# 2. Comprobar librerias DSP integradas (Signalsmith Stretch & Linear)
if [ -f "src/signalsmith-stretch.h" ] && [ -f "src/signalsmith-linear/stft.h" ]; then
    echo ">> [OK] Motor DSP Signalsmith Stretch y Linear integrados directamente en src/"
else
    echo ">> Descargando librerías DSP Signalsmith Stretch (MIT)..."
    mkdir -p vendor
    if [ ! -d "vendor/signalsmith-stretch" ]; then
        git clone --depth 1 https://github.com/Signalsmith-Audio/signalsmith-stretch.git vendor/signalsmith-stretch
    fi
    if [ ! -d "vendor/signalsmith-linear" ]; then
        git clone --depth 1 https://github.com/Signalsmith-Audio/linear.git vendor/signalsmith-linear
    fi
fi

# 3. Directorio de compilacion y limpieza
BUILD_DIR="build"
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    echo ">> [LIMPIEZA] Eliminando carpeta build anterior..."
    rm -rf "$BUILD_DIR"
fi

echo ">> Configurando proyecto con CMake (Xcode / Clang)..."

# Detectar SDK de AAX
AAX_FLAG=""
if [ -d "vendor/aax-sdk-2-9-0/Interfaces" ] || [ -d "vendor/aax-sdk-2-9-0/include" ]; then
    echo ">> [OK] Avid AAX SDK detectado en vendor/aax-sdk-2-9-0"
    AAX_FLAG="-DAAX_SDK_PATH=$(pwd)/vendor/aax-sdk-2-9-0"
else
    echo ">> [AVISO] Avid AAX SDK no detectado en vendor/aax-sdk-2-9-0."
    echo ">> Se compilaran formatos VST3 y AU. (Para AAX coloca el SDK de Avid en vendor/aax-sdk-2-9-0)."
fi

cmake -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE=Release \
    $AAX_FLAG

echo ">> Compilando artefactos Release..."
cmake --build "$BUILD_DIR" --config Release -j$(sysctl -n hw.ncpu)

echo "--------------------------------------------------------"
echo "  ¡COMPILACION FINALIZADA CON EXITO!"
echo "--------------------------------------------------------"
echo "Plugins generados en $BUILD_DIR/FForm_artefacts/Release/:"
echo " - VST3: ~/Library/Audio/Plug-Ins/VST3/F-Form 2.0.vst3"
echo " - AU:   ~/Library/Audio/Plug-Ins/Components/F-Form 2.0.component"
if [ -n "$AAX_FLAG" ]; then
    echo " - AAX:  /Library/Application Support/Avid/Audio/Plug-Ins/F-Form 2.0.aaxplugin"
fi
echo "Listo para abrir en tu DAW (Pro Tools, Logic, Ableton, Reaper)."
