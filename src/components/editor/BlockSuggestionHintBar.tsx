import React from 'react';
import { DocBlock, PageType } from '../../types/workspace';
import { getSuggestedNextBlocks, NextBlockSuggestion } from '../../features/ai/nextBlockSuggester';
import { Sparkles, Plus } from 'lucide-react';

interface BlockSuggestionHintBarProps {
  currentBlock: DocBlock;
  pageType?: PageType;
  allBlocks: DocBlock[];
  blockIndex: number;
  onSelectSuggestion: (suggestion: NextBlockSuggestion) => void;
  onOpenSlashMenu?: () => void;
  onAskAi?: (prompt: string) => void;
}

export const BlockSuggestionHintBar: React.FC<BlockSuggestionHintBarProps> = ({
  currentBlock,
  pageType,
  allBlocks,
  blockIndex,
  onSelectSuggestion,
  onOpenSlashMenu,
  onAskAi,
}) => {
  const suggestions = getSuggestedNextBlocks({
    currentBlock,
    pageType,
    allBlocks,
    blockIndex,
  }).slice(0, 4);

  return (
    <div
      className="mt-1.5 mb-1 flex items-center gap-1.5 bg-slate-900/90 dark:bg-black/90 text-white backdrop-blur-md border border-slate-700/80 shadow-lg px-2.5 py-1 rounded-xl text-[11px] animate-fadeIn transition-all select-none w-fit z-30"
      onMouseDown={(e) => e.preventDefault()} // prevent blur of active editor
    >
      <span className="font-semibold text-slate-300 dark:text-slate-400 flex items-center gap-1 text-[10px] uppercase tracking-wider shrink-0">
        💡 Następny krok:
      </span>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {suggestions.map((sugg, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectSuggestion(sugg);
            }}
            title={sugg.reason + ' — ' + sugg.description}
            className="px-2 py-0.5 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-[10px] font-medium cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-2xs hover:scale-105 active:scale-95"
          >
            <span>{sugg.icon}</span>
            <span>{sugg.label}</span>
          </button>
        ))}

        {onOpenSlashMenu && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenSlashMenu();
            }}
            className="px-1.5 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer shrink-0"
            title="Wszystkie bloki (/)"
          >
            / więcej...
          </button>
        )}

        {onAskAi && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAskAi(`Rozwiń ten blok: ${currentBlock.content || 'nowy temat'}`);
            }}
            className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-medium cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-2xs"
            title="Rozwiń ten akapit z asystentem AI"
          >
            <Sparkles size={11} />
            <span>AI</span>
          </button>
        )}
      </div>
    </div>
  );
};
