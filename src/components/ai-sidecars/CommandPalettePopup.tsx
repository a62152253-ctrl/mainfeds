import React, { useEffect, useRef } from 'react';
import { AiCommandDef } from '../../features/ai/commandsRegistry';
import { Sparkles, CornerDownLeft } from 'lucide-react';

interface CommandPalettePopupProps {
  commands: AiCommandDef[];
  selectedIndex: number;
  onSelectCommand: (cmd: AiCommandDef) => void;
  onClose: () => void;
}

export const CommandPalettePopup: React.FC<CommandPalettePopupProps> = ({
  commands,
  selectedIndex,
  onSelectCommand,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (commands.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 max-h-72 flex flex-col"
    >
      {/* Header bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Sparkles size={11} className="text-blue-500" />
          <span>Dostępne akcje i komendy (/)</span>
        </span>
        <span>Użyj ↑ ↓ i Enter lub kliknij</span>
      </div>

      {/* Commands List */}
      <div className="overflow-y-auto p-1.5 space-y-0.5">
        {commands.map((cmd, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={cmd.id}
              type="button"
              onClick={() => onSelectCommand(cmd)}
              className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 border border-blue-200/80 text-blue-900 shadow-2xs'
                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-base shrink-0">{cmd.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">
                      {cmd.label}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-slate-100 text-slate-500">
                      {cmd.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {cmd.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 shrink-0 ml-2">
                  <span>Wybierz</span>
                  <CornerDownLeft size={11} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
