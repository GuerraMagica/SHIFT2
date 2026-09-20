import React, { useState } from 'react';
import { Copy, Check, Download, Code, FileCode, Terminal, CheckCircle2, ChevronRight } from 'lucide-react';
import { CPP_CODEBASE } from '../data/cppCodebase';
import { CppSourceFile } from '../types';

export const CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CppSourceFile>(CPP_CODEBASE[0]);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 uppercase font-mono">
                C++20 / JUCE 8 Ready
              </span>
              <span className="text-xs text-slate-400 font-mono">Archivos listos para GuerraMagica/f-form</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-mono">
              Código Fuente del Nuevo Algoritmo F-Form 2.0
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Implementación modular en C++20 con Phase Vocoder, Identity Phase Locking (IPL),
              preservación de formantes por Cepstrum y soporte de contratos Realtime vs Offline.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Código'}</span>
            </button>

            <button
              id="download-file-btn"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-medium transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Descargar {selectedFile.filename}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sidebar: File List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3 px-2">
              Archivos del Repositorio
            </h3>

            <div className="space-y-1.5">
              {CPP_CODEBASE.map((file) => (
                <button
                  key={file.filename}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                    selectedFile.filename === file.filename
                      ? 'bg-cyan-950/60 border border-cyan-500/80 text-white'
                      : 'bg-slate-950/50 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <FileCode className={`w-4 h-4 mt-0.5 ${selectedFile.filename === file.filename ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-mono font-bold truncate text-slate-200">
                      {file.filename}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                      {file.path}
                    </div>
                  </div>
                  {selectedFile.filename === file.filename && (
                    <ChevronRight className="w-4 h-4 text-cyan-400 self-center" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Build Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-xs font-mono">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Cómo Integrar en f-form</span>
            </h3>
            <p className="text-slate-400 mb-3 text-[11px]">
              1. Coloca <code className="text-cyan-300">FFormDSPCore.h</code> en <code className="text-slate-300">src/</code>
              <br />
              2. Reemplaza <code className="text-cyan-300">TimeStretchEngine.h</code>
              <br />
              3. Compila con Ninja en macOS / Linux:
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto select-all">
              mkdir -p build && cd build<br />
              cmake -G Ninja ..<br />
              ninja
            </div>
          </div>
        </div>

        {/* Main Code Viewer (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            {/* File Path Bar */}
            <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-200">{selectedFile.path}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedFile.content.split('\n').length} líneas • C++
              </span>
            </div>

            {/* Description Banner */}
            <div className="bg-cyan-950/20 border-b border-cyan-900/30 px-4 py-2 text-xs text-cyan-200 font-mono">
              {selectedFile.description}
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
              <pre className="select-text">
                <code>
                  {selectedFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row hover:bg-slate-900/50">
                      <span className="table-cell pr-4 text-slate-600 select-none text-right w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell text-slate-200">
                        {line}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
