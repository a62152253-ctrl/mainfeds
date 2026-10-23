import React, { useState } from 'react';
import {
  X,
  List,
  ArrowRight,
  Copy,
  Check,
  Heading1,
  Heading2,
  Heading3,
  Bookmark,
} from 'lucide-react';
import { BlockType } from '../../types/workspace';

interface HeadingItem {
  id: string;
  type: BlockType;
  content: string;
  numbering: string;
}

interface DocOutlineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  headings: HeadingItem[];
  onScrollToHeading: (blockId: string) => void;
  onCopyOutlineMarkdown: () => void;
}

export const DocOutlineDrawer: React.FC<DocOutlineDrawerProps> = ({
  isOpen,
  onClose,
  headings,
  onScrollToHeading,
  onCopyOutlineMarkdown,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopyOutlineMarkdown();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="w-80 h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <List size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <span>Spis Treści</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono font-medium">
                  {headings.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Interaktywny konspekt dokumentu</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Headings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {headings.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400">
              <Bookmark size={30} className="mx-auto mb-2 opacity-30 text-slate-400" />
              <h4 className="text-xs font-semibold text-slate-600">Brak nagłówków</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Wpisz <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/h1</code> lub{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/h2</code> w edytorze, aby stworzyć spis treści.
              </p>
            </div>
          ) : (
            headings.map((h) => {
              const indentClass =
                h.type === 'h1'
                  ? 'pl-2 text-slate-900 font-bold text-xs'
                  : h.type === 'h2'
                  ? 'pl-6 text-slate-700 font-medium text-xs'
                  : 'pl-10 text-slate-500 font-normal text-[11px]';

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    onScrollToHeading(h.id);
                  }}
                  className={`w-full text-left py-2 px-2.5 rounded-xl hover:bg-blue-50/70 hover:text-blue-700 transition-colors flex items-center gap-2 group cursor-pointer ${indentClass}`}
                >
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-500 shrink-0">
                    {h.numbering}
                  </span>
                  <span className="truncate flex-1">
                    {h.content || <span className="italic text-slate-300">Pusty nagłówek</span>}
                  </span>
                  <ArrowRight
                    size={12}
                    className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity shrink-0"
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {headings.length > 0 && (
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer shadow-2xs transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-600">Skopiowano konspekt!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-400" />
                  <span>Kopiuj konspekt (Markdown)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
