# F-Form 2.0 - Pitch & Time Engine (Guerra Mágica)

Motor avanzado de time-stretching y pitch-shifting con arquitectura **SHIFT 2** (voz dual independiente), preservación de formantes mediante Cepstral Liftering y mitigación del efecto phasiness con **Identity Phase Locking (IPL)**.

## Estructura del Proyecto

```text
f-form/
├── CMakeLists.txt              # Configuración CMake para JUCE 8 (VST3, AU, AAX)
├── build_mac.sh                # Script automático de compilación para Mac
├── src/
│   ├── FFormDSPCore.h          # Motor DSP C++20 con IPL, preservación de formantes y transitorios
│   ├── Shift2VoiceEngine.h     # Arquitectura SHIFT 2 (Pitch dual + Formante + Sub-Octava / 2)
│   ├── TimeStretchEngine.h     # Conector para JUCE con soporte Realtime y AudioSuite
│   ├── PluginProcessor.h       # Cabecera del procesador JUCE y árbol de parámetros
│   ├── PluginProcessor.cpp     # Implementación del audio processor
│   ├── PluginEditor.h          # Cabecera de la interfaz gráfica de usuario
│   └── PluginEditor.cpp        # Interfaz de usuario con controles duales e indicadores
└── vendor/
    └── aax-sdk-2-9-0/          # Carpeta para el SDK de Avid AAX (Pro Tools)
        └── README_AVID_SDK.txt
```

## Compilación rápida en macOS (Mac M1/M2/M3/M4 o Intel)

1. Abre Terminal y navega a la carpeta:
```bash
cd f-form
```

2. Ejecuta el script de compilación:
```bash
chmod +x build_mac.sh
./build_mac.sh
```

O manualmente con CMake:
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j8
```

## Probar en Pro Tools (AAX)
1. Coloca el Avid AAX SDK 2.9.0 en `vendor/aax-sdk-2-9-0`.
2. Compila el proyecto con `./build_mac.sh`.
3. El archivo `F-Form 2.0.aaxplugin` se copiará automáticamente a:
   `/Library/Application Support/Avid/Audio/Plug-Ins/`
4. Inicia Pro Tools (versión Developer o con soporte de plugins locales) para insertar el plugin en cualquier pista de audio o usarlo en AudioSuite.
