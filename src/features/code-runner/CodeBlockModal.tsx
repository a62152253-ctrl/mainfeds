import React, { useState } from 'react';
import { Code, Play, Check, X, Terminal, Copy, Trash2, Sparkles } from 'lucide-react';
import { SupportedLanguage } from './types';
import { LANGUAGE_TEMPLATES } from './languageTemplates';
import { executeCode, generateCodeHtml } from './codeRunnerService';

interface CodeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (codeHtml: string) => void;
}

export const CodeBlockModal: React.FC<CodeBlockModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [lang, setLang] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.javascript);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLangChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    setCode(LANGUAGE_TEMPLATES[newLang]);
    setOutput(null);
  };

  const handleRun = () => {
    const res = executeCode(lang, code);
    setOutput(res);
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleConfirm = () => {
    const html = generateCodeHtml(lang, code, output || undefined);
    onInsert(html);
    onClose();
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#181a20] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] text-xs text-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#12141a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center">
              <Code size={15} />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm">Klocek Kodu & Konsola Playground</span>
              <span className="ml-2 text-[10px] text-slate-400 font-mono">({lineCount} linii)</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X size={15} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#14161d]">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-400 font-medium">Język:</span>
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-pink-500 font-medium cursor-pointer"
            >
              <option value="javascript">JavaScript (ES6+)</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="json">JSON</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 font-semibold cursor-pointer shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play size={12} fill="currentColor" />
              <span>Uruchom kod</span>
            </button>
          </div>
        </div>

        {/* Code Input & Line Numbers */}
        <div className="p-4 flex-1 flex flex-col gap-3 bg-[#0f1117] overflow-y-auto">
          <div className="relative flex rounded-xl border border-slate-800 bg-[#090b10] overflow-hidden focus-within:border-pink-500/60">
            {/* Line numbers column */}
            <div className="py-3 px-2 bg-[#0c0e14] text-slate-600 font-mono text-[11px] text-right select-none border-r border-slate-800/80 leading-relaxed min-w-[2.5rem]">
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code textarea */}
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              spellCheck={false}
              className="flex-1 bg-transparent p-3 font-mono text-emerald-400 text-xs focus:outline-none resize-none leading-relaxed"
              placeholder="// Wpisz kod programu..."
            />
          </div>

          {/* Output console */}
          {output && (
            <div className="bg-[#0c0e14] border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 flex flex-col gap-1.5 shadow-inner">
              <div className="flex items-center justify-between text-slate-400 font-sans text-[10px] uppercase font-bold border-b border-slate-800/80 pb-1.5">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Terminal size={12} className="text-emerald-400" />
                  <span>Konsola wyjściowa</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyOutput}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[10px]"
                  >
                    {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? 'Skopiowano' : 'Kopiuj'}</span>
                  </button>
                  <button
                    onClick={() => setOutput(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 text-[10px]"
                    title="Wyczyść konsolę"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto select-text font-mono text-emerald-300">
                {output}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 flex justify-end gap-2 bg-[#12141a]">
          <button onClick={onClose} className="px-3.5 py-1.5 rounded-xl hover:bg-slate-800 text-slate-400 font-medium cursor-pointer">
            Anuluj
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Check size={14} />
            <span>Wstaw klocek do dokumentu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
