==============================================================================
GUIA DE INSTALACION DEL SDK DE AVID AAX PARA PRO TOOLS EN macOS
==============================================================================

Para compilar el plugin F-Form en formato AAX nativo para Avid Pro Tools:

1. Obten el Avid AAX SDK:
   - Ingresa a la cuenta de desarrollador de Avid:
     https://www.avid.com/alliance-partner-program
   - Descarga el "AAX SDK 2.9.0" (o version 2.6.0+ compatible).

2. Descomprime y copia los archivos en esta carpeta:
   La estructura esperada en este directorio debe ser:
   f-form/vendor/aax-sdk-2-9-0/
   ├── Interfaces/
   │   ├── AAX.h
   │   ├── AAX_CEffectParameters.h
   │   └── ...
   ├── Extensions/
   ├── Utilities/
   └── Libs/

3. Si tienes el AAX SDK en otra ubicacion de tu Mac (por ejemplo en /Users/tu_usuario/SDKs/aax-sdk-2.9.0),
   puedes indicarselo a CMake directamente al compilar con:
   cmake -B build -DAAX_SDK_PATH=/ruta/a/tu/aax-sdk-2.9.0

4. Nota sobre Pro Tools Developer Build:
   - Pro Tools Retail exige plugins firmados por Pace iLok Eden con firma digital Avid.
   - Para probar tu plugin en Pro Tools durante el desarrollo sin firma comercial,
     instala "Pro Tools Developer Build" (disponible gratis en Avid Audio Developer Portal)
     o activa el modo de carga de plugins sin firmar en tu sesion de pruebas.
   - Mientras tanto, puedes probar la misma logica DSP y GUI al 100% en formato VST3 y AU
     usando Reaper, Logic Pro, Ableton Live o el JUCE AudioPluginHost en tu Mac.
