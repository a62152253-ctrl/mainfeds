import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Check, Trash2, Globe } from 'lucide-react';

export const CURATED_COVERS = [
  // Gradients
  {
    type: 'gradient',
    label: 'Ciemny Łupek',
    value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  },
  {
    type: 'gradient',
    label: 'Szmaragd',
    value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
  },
  {
    type: 'gradient',
    label: 'Indygo Noc',
    value: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)',
  },
  {
    type: 'gradient',
    label: 'Ciepły Bursztyn',
    value: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
  },
  {
    type: 'gradient',
    label: 'Ciemna Róża',
    value: 'linear-gradient(135deg, #831843 0%, #500724 100%)',
  },
  {
    type: 'gradient',
    label: 'Fiolet Kosmiczny',
    value: 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)',
  },
  {
    type: 'gradient',
    label: 'Świt Północy',
    value: 'linear-gradient(135deg, #0284c7 0%, #0f172a 100%)',
  },
  {
    type: 'gradient',
    label: 'Neon Cyber',
    value: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)',
  },

  // Curated High-Res Photos
  {
    type: 'photo',
    label: 'Alpejski Poranek',
    value: 'url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Mglisty Las Iglasty',
    value: 'url("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Minimalistyczna Architektura',
    value: 'url("https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Japoński Ogród Zen',
    value: 'url("https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Głęboki Kosmos',
    value: 'url("https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Wydmy Pustynne',
    value: 'url("https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Nowoczesne Biurko Studio',
    value: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80")',
  },
  {
    type: 'photo',
    label: 'Pastelowy Zachód Słońca',
    value: 'url("https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1600&q=80")',
  },
];

interface CoverPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCover?: string;
  onSelectCover: (coverUrl?: string) => void;
}

export const CoverPickerModal: React.FC<CoverPickerModalProps> = ({
  isOpen,
  onClose,
  currentCover,
  onSelectCover,
}) => {
  const [tab, setTab] = useState<'presets' | 'url'>('presets');
  const [customUrl, setCustomUrl] = useState('');

  if (!isOpen) return null;

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    const formatted = customUrl.startsWith('url(') ? customUrl : `url("${customUrl.trim()}")`;
    onSelectCover(formatted);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Galeria Okładek</h3>
              <p className="text-[11px] text-slate-400">Dostosuj wizualny nagłówek dokumentu</p>
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

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('presets')}
            className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              tab === 'presets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Kolekcja i Gradienty
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`pb-2.5 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              tab === 'url'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Własny adres URL
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'presets' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CURATED_COVERS.map((cov) => {
                const isSelected = currentCover === cov.value;
                return (
                  <button
                    key={cov.label}
                    type="button"
                    onClick={() => {
                      onSelectCover(cov.value);
                      onClose();
                    }}
                    className={`group relative h-22 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xs hover:shadow-md ${
                      isSelected ? 'border-blue-600 scale-[1.02]' : 'border-transparent hover:border-slate-300'
                    }`}
                    style={{
                      background: cov.value,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors flex items-end p-2">
                      <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                        {cov.label}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Wklej bezpośredni adres URL obrazu:
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Globe size={14} className="text-slate-400" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-... lub https://twojadomena.pl/obrazek.jpg"
                    className="bg-transparent border-none outline-none text-xs w-full text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Obsługiwane są formaty JPG, PNG, WEBP, SVG oraz linki z Unsplash.
                </p>
              </div>

              {customUrl && (
                <div
                  className="h-28 rounded-2xl border border-slate-200 shadow-inner overflow-hidden"
                  style={{
                    backgroundImage: `url("${customUrl}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              <button
                type="button"
                onClick={handleApplyCustomUrl}
                disabled={!customUrl.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold rounded-xl text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Zastosuj okładkę
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          {currentCover ? (
            <button
              type="button"
              onClick={() => {
                onSelectCover(undefined);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
              <span>Usuń okładkę</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">Brak aktywnej okładki</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
