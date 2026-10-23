import React from 'react';
import { Palette, Check } from 'lucide-react';

export const TEXT_COLORS = [
  { label: 'Domyślny', class: '', colorHex: '#334155' },
  { label: 'Szary', class: 'text-slate-500', colorHex: '#64748b' },
  { label: 'Czerwony', class: 'text-rose-600', colorHex: '#e11d48' },
  { label: 'Pomarańczowy', class: 'text-orange-600', colorHex: '#ea580c' },
  { label: 'Bursztynowy', class: 'text-amber-600', colorHex: '#d97706' },
  { label: 'Szmaragdowy', class: 'text-emerald-600', colorHex: '#059669' },
  { label: 'Błękitny', class: 'text-blue-600', colorHex: '#2563eb' },
  { label: 'Fioletowy', class: 'text-purple-600', colorHex: '#9333ea' },
  { label: 'Różowy', class: 'text-pink-600', colorHex: '#db2777' },
];

export const BG_COLORS = [
  { label: 'Brak tła', class: '', colorHex: '#ffffff' },
  { label: 'Szare tło', class: 'bg-slate-100/90 text-slate-900 border border-slate-200/60', colorHex: '#f1f5f9' },
  { label: 'Czerwone tło', class: 'bg-rose-50/90 text-rose-950 border border-rose-200/60', colorHex: '#ffe4e6' },
  { label: 'Pomarańczowe tło', class: 'bg-orange-50/90 text-orange-950 border border-orange-200/60', colorHex: '#ffedd5' },
  { label: 'Żółte tło', class: 'bg-amber-50/90 text-amber-950 border border-amber-200/60', colorHex: '#fef3c7' },
  { label: 'Zielone tło', class: 'bg-emerald-50/90 text-emerald-950 border border-emerald-200/60', colorHex: '#d1fae5' },
  { label: 'Niebieskie tło', class: 'bg-blue-50/90 text-blue-950 border border-blue-200/60', colorHex: '#dbeafe' },
  { label: 'Fioletowe tło', class: 'bg-purple-50/90 text-purple-950 border border-purple-200/60', colorHex: '#f3e8ff' },
  { label: 'Różowe tło', class: 'bg-pink-50/90 text-pink-950 border border-pink-200/60', colorHex: '#fce7f3' },
];

interface BlockColorMenuProps {
  currentTextColor?: string;
  currentBgColor?: string;
  onSelectColor: (textColor?: string, bgColor?: string) => void;
  onClose: () => void;
}

export const BlockColorMenu: React.FC<BlockColorMenuProps> = ({
  currentTextColor,
  currentBgColor,
  onSelectColor,
  onClose,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 p-2 rounded-2xl shadow-2xl w-60 text-xs animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
        <Palette size={12} />
        <span>Kolor bloku</span>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
        {/* Text Colors */}
        <div>
          <span className="text-[10px] text-slate-400 font-semibold px-2 block mb-1">
            KOLOR TEKSTU
          </span>
          <div className="space-y-0.5">
            {TEXT_COLORS.map((tc) => (
              <button
                key={tc.label}
                type="button"
                onClick={() => {
                  onSelectColor(tc.class || undefined, currentBgColor);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-2xs shrink-0"
                    style={{ backgroundColor: tc.colorHex }}
                  />
                  <span className={tc.class || 'text-slate-800'}>{tc.label}</span>
                </div>
                {currentTextColor === tc.class && (
                  <Check size={12} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Background Colors */}
        <div className="border-t border-slate-100 pt-1.5">
          <span className="text-[10px] text-slate-400 font-semibold px-2 block mb-1">
            WYRÓŻNIENIE TŁA
          </span>
          <div className="space-y-0.5">
            {BG_COLORS.map((bg) => (
              <button
                key={bg.label}
                type="button"
                onClick={() => {
                  onSelectColor(currentTextColor, bg.class || undefined);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-md border border-slate-200 shadow-2xs shrink-0"
                    style={{ backgroundColor: bg.colorHex }}
                  />
                  <span className="text-slate-800">{bg.label}</span>
                </div>
                {currentBgColor === bg.class && (
                  <Check size={12} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
