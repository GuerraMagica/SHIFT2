import React, { useState } from 'react';
import { 
  Copy, Check, Download, Code, FileCode, Terminal, ChevronRight, 
  FolderArchive, Folder, Cpu, Sliders, Box, HelpCircle, AlertCircle, Apple
} from 'lucide-react';
import JSZip from 'jszip';
import { CPP_CODEBASE } from '../data/cppCodebase';
import { CppSourceFile } from '../types';

export const CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CppSourceFile>(CPP_CODEBASE[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipSuccess, setZipSuccess] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'zip' | 'terminal' | 'aax_protools'>('zip');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('f-form');
      if (rootFolder) {
        for (const file of CPP_CODEBASE) {
          rootFolder.file(file.path, file.content);
        }
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'f-form-mac-complete.zip';
      link.click();
      URL.revokeObjectURL(url);
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 3000);
    } catch (err) {
      console.error('Error generando zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  // Agrupaciones lógicas de archivos
  const buildFiles = CPP_CODEBASE.filter(f => f.category === 'cmake');
  const dspFiles = CPP_CODEBASE.filter(f => f.category === 'dsp');
  const pluginFiles = CPP_CODEBASE.filter(f => f.category === 'plugin');

  return (
    <div className="space-y-6">
      
      {/* Banner de explicación: Por qué no encontrabas estos archivos en tu Mac */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border border-cyan-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                <Apple className="w-3 h-3" /> macOS Ready (M1/M2/M3/M4 & Intel)
              </span>
              <span className="text-xs text-slate-400 font-mono">JUCE 8 • VST3 / AU / AAX (Pro Tools)</span>
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight font-mono flex items-center gap-2">
              <span>Estructura Completa del Proyecto f-form/</span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">¿Por qué no encontrabas estos archivos en tu Mac?</strong> El repositorio original en GitHub de <code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded text-xs">GuerraMagica/f-form</code> solo contenía el esqueleto inicial. <strong>Todo este código mejorado (FFormDSPCore, SHIFT 2, CMakeLists y AAX Pro Tools) fue desarrollado y generado en esta sesión</strong> para darte el salto de calidad profesional.
            </p>
          </div>

          {/* Botón Principal: Descargar Todo el Proyecto en ZIP */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="download-full-zip-btn"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isZipping ? (
                <span>Comprimiendo {CPP_CODEBASE.length} archivos...</span>
              ) : zipSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Descarga Iniciada!</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-4 h-4" />
                  <span>Descargar f-form.zip Completo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Guía Rápida interactiva para macOS */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="font-bold text-cyan-400 font-mono flex items-center gap-1.5 mb-1">
              <span>1. Descarga & Descomprime</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Haz clic en el botón azul para bajar <code className="text-slate-200">f-form-mac-complete.zip</code> y descomprímelo en tu Mac.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="font-bold text-purple-400 font-mono flex items-center gap-1.5 mb-1">
              <span>2. Coloca Avid AAX SDK</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Para Pro Tools, pega el SDK de Avid en la carpeta <code className="text-purple-300">vendor/aax-sdk-2-9-0/</code>.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="font-bold text-emerald-400 font-mono flex items-center gap-1.5 mb-1">
              <span>3. Compila con 1 comando</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              En la Terminal de tu Mac ejecuta: <code className="text-emerald-300">./build_mac.sh</code>. ¡Generará VST3, AU y AAX!
            </p>
          </div>
        </div>
      </div>

      {/* Visor de Código & Navegador de Archivos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar: Árbol de archivos (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>Estructura f-form/ ({CPP_CODEBASE.length} archivos)</span>
              </h3>
            </div>

            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              
              {/* Sección CMake & Build */}
              <div>
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono px-2 py-1 bg-cyan-950/40 rounded flex items-center gap-1.5 mb-1.5">
                  <Terminal className="w-3 h-3" />
                  <span>Configuración & Build Mac</span>
                </div>
                <div className="space-y-1">
                  {buildFiles.map((file) => (
                    <button
                      key={file.filename}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all text-xs font-mono ${
                        selectedFile.filename === file.filename
                          ? 'bg-cyan-950/80 border border-cyan-500/80 text-white shadow-sm'
                          : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedFile.filename === file.filename ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-bold truncate text-slate-200">{file.filename}</div>
                        <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección Motores DSP */}
              <div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono px-2 py-1 bg-blue-950/40 rounded flex items-center gap-1.5 mb-1.5">
                  <Cpu className="w-3 h-3" />
                  <span>src/ (Motores DSP C++20)</span>
                </div>
                <div className="space-y-1">
                  {dspFiles.map((file) => (
                    <button
                      key={file.filename}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all text-xs font-mono ${
                        selectedFile.filename === file.filename
                          ? 'bg-blue-950/80 border border-blue-500/80 text-white shadow-sm'
                          : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedFile.filename === file.filename ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-bold truncate text-slate-200">{file.filename}</div>
                        <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección JUCE Plugin */}
              <div>
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono px-2 py-1 bg-purple-950/40 rounded flex items-center gap-1.5 mb-1.5">
                  <Sliders className="w-3 h-3" />
                  <span>src/ (Plugin JUCE VST3/AU/AAX)</span>
                </div>
                <div className="space-y-1">
                  {pluginFiles.map((file) => (
                    <button
                      key={file.filename}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all text-xs font-mono ${
                        selectedFile.filename === file.filename
                          ? 'bg-purple-950/80 border border-purple-500/80 text-white shadow-sm'
                          : 'bg-slate-950/40 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <FileCode className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedFile.filename === file.filename ? 'text-purple-400' : 'text-slate-500'}`} />
                      <div className="min-w-0 flex-1 truncate">
                        <div className="font-bold truncate text-slate-200">{file.filename}</div>
                        <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Visor de Código Principal (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* File Path & Acciones Bar */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200">{selectedFile.path}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({selectedFile.content.split('\n').length} líneas)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="copy-code-btn"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                <button
                  id="download-single-btn"
                  onClick={handleDownloadSingle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Bajar Archivo</span>
                </button>
              </div>
            </div>

            {/* Description Banner */}
            <div className="bg-cyan-950/20 border-b border-cyan-900/30 px-4 py-2 text-xs text-cyan-200 font-mono">
              {selectedFile.description}
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto max-h-[580px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed bg-[#0b0f19]">
              <pre className="select-text">
                <code>
                  {selectedFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row hover:bg-slate-900/60">
                      <span className="table-cell pr-4 text-slate-600 select-none text-right w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell text-slate-200 whitespace-pre">
                        {line}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

          </div>

          {/* Guía Detallada de Terminal para macOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Paso a Paso en la Terminal de tu Mac (Pro Tools AAX & VST3/AU)</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300 font-mono">
              <div>
                <span className="text-cyan-400 font-bold">1. Requisitos previos en Mac:</span>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 mt-1 select-all">
                  xcode-select --install<br />
                  brew install cmake
                </div>
              </div>

              <div>
                <span className="text-purple-400 font-bold">2. Avid AAX SDK para Pro Tools:</span>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-1">
                  Descarga el <strong className="text-slate-300">AAX SDK 2.9.0</strong> de Avid Developer e introduce su contenido dentro de <code className="text-purple-300">f-form/vendor/aax-sdk-2-9-0/</code>.
                </p>
              </div>

              <div>
                <span className="text-emerald-400 font-bold">3. Compilar e instalar automáticamente:</span>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 mt-1 select-all">
                  cd f-form<br />
                  chmod +x build_mac.sh<br />
                  ./build_mac.sh
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                El script compilará para Apple Silicon (M1/M2/M3/M4) e Intel, y copiará el plugin directamente a:<br />
                • Pro Tools AAX: <code className="text-slate-300">/Library/Application Support/Avid/Audio/Plug-Ins/F-Form 2.0.aaxplugin</code><br />
                • VST3: <code className="text-slate-300">~/Library/Audio/Plug-Ins/VST3/F-Form 2.0.vst3</code><br />
                • AU: <code className="text-slate-300">~/Library/Audio/Plug-Ins/Components/F-Form 2.0.component</code>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
