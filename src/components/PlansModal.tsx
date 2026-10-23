import React, { useState } from 'react';
import { Sparkles, Check, ShieldCheck, Zap, X, AlertCircle } from 'lucide-react';
import { subscriptionService, SubscriptionPlanId } from '../services/subscriptionService';

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPro?: boolean;
}

export const PlansModal: React.FC<PlansModalProps> = ({
  isOpen,
  onClose,
  highlightPro = false,
}) => {
  const [showMockInfo, setShowMockInfo] = useState(false);
  const snapshot = subscriptionService.getSubscriptionSnapshot();

  if (!isOpen) return null;

  const handlePayClick = () => {
    // Zgodnie z KROK 11: brak fałszywego formularza, brak pobierania pieniędzy,
    // otwarcie czytelnego okna informującego o fazie przygotowania
    setShowMockInfo(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1f1f1f] text-[#37352f] dark:text-[#d4d4d4] rounded-[14px] shadow-2xl border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] overflow-hidden">
        {/* Zamknij */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Nagłówek */}
        <div className="p-6 pb-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#2383e2]">
            <Sparkles size={14} />
            <span>Plany i Dostęp SearchPoint</span>
          </div>
          <h2 className="text-xl font-bold text-[#37352f] dark:text-white mt-1">
            Wybierz plan dopasowany do Twojej pracy
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1">
            Prosty i przejrzysty model — bez ukrytych opłat ani zobowiązań.
          </p>

          {snapshot.mockTrialActive && (
            <div className="mt-3 p-2.5 rounded-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                <strong>Tymczasowy dostęp Pro aktywny dla każdego:</strong> Wszystkie narzędzia i szablony są obecnie bezpłatnie odblokowane na czas wdrażania systemu płatności.
              </span>
            </div>
          )}
        </div>

        {/* Karty Planów (Free vs Pro) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PLAN FREE */}
          <div className="p-5 rounded-[12px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-[#fbfbfa] dark:bg-[#191919] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#37352f] dark:text-white">Free</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97]">
                  Podstawowy
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#37352f] dark:text-white">0 zł</span>
                <span className="text-xs text-[#787774] dark:text-[#9b9a97]">/ na zawsze</span>
              </div>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-2 leading-relaxed">
                Niezbędne narzędzia do codziennej pracy z tekstem i rozmów z Asystentem AI.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Rozmowa z AI i odpowiedzi tekstowe bez limitu</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Maksymalnie <strong>3 nowe notatki AI dziennie</strong></span>
                </div>
                <div className="flex items-start gap-2 text-[#787774] dark:text-[#9b9a97]">
                  <X size={14} className="text-[#eb5757] shrink-0 mt-0.5" />
                  <span>Brak biblioteki szablonów Pro (Templates)</span>
                </div>
                <div className="flex items-start gap-2 text-[#787774] dark:text-[#9b9a97]">
                  <X size={14} className="text-[#eb5757] shrink-0 mt-0.5" />
                  <span>Brak zaawansowanego Deep Research 4+ źródeł</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)]">
              <button
                disabled
                className="w-full py-2 px-3 rounded-[6px] bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] text-xs font-medium cursor-not-allowed text-center"
              >
                Twój obecny plan domyślny
              </button>
            </div>
          </div>

          {/* PLAN PRO */}
          <div className={`p-5 rounded-[12px] border-2 ${
            highlightPro
              ? 'border-[#2383e2] ring-2 ring-blue-500/20'
              : 'border-[#2383e2]/60 dark:border-[#2383e2]/40'
          } bg-white dark:bg-[#1a1a1a] flex flex-col justify-between relative shadow-sm`}>
            <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-[#2383e2] text-white rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs">
              Rekomendowany
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#37352f] dark:text-white flex items-center gap-1.5">
                  <Zap size={15} className="text-[#2383e2]" />
                  <span>Pro</span>
                </h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#37352f] dark:text-white">8 zł</span>
                <span className="text-xs text-[#787774] dark:text-[#9b9a97]">/ miesiąc</span>
              </div>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-2 leading-relaxed">
                Pełna moc tworzenia notatek z researchu, pełne 80 typów bloków i szablony.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2383e2] shrink-0 mt-0.5" />
                  <span><strong>Nielimitowane</strong> tworzenie notatek przez AI</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2383e2] shrink-0 mt-0.5" />
                  <span>Zaawansowany <strong>Deep Research (4+ bazy naukowe)</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2383e2] shrink-0 mt-0.5" />
                  <span>Pełna biblioteka szablonów <strong>(Templates Library)</strong></span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2383e2] shrink-0 mt-0.5" />
                  <span>Personalizacja stylów, wideo YouTube i grafiki Wikimedia</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="text-[#2383e2] shrink-0 mt-0.5" />
                  <span>Kopiowanie całej notatki do Markdown i HTML z zachowaniem stylów</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[rgba(55,53,47,0.08)] dark:border-[rgba(255,255,255,0.08)]">
              <button
                onClick={handlePayClick}
                className="w-full py-2.5 px-3 rounded-[6px] bg-[#2383e2] hover:bg-[#1d6fc2] text-white text-xs font-semibold cursor-pointer text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>Zapłać — 8 zł</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Informacji o Mock Payments (KROK 11) */}
        {showMockInfo && (
          <div className="absolute inset-0 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xs p-6 flex flex-col justify-center items-center text-center z-20 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-[#2383e2] flex items-center justify-center mb-3">
              <ShieldCheck size={26} />
            </div>
            <h3 className="text-lg font-bold text-[#37352f] dark:text-white">
              Płatności są obecnie w fazie przygotowania
            </h3>
            <p className="text-xs text-[#787774] dark:text-[#9b9a97] max-w-md mt-2 leading-relaxed">
              Na czas wdrażania systemu płatności wszystkie funkcje Pro są tymczasowo dostępne dla każdego użytkownika bez opłat. Nie pobrano żadnych pieniędzy i nie wymagamy podawania danych karty płatniczej.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowMockInfo(false);
                  onClose();
                }}
                className="px-4 py-2 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[6px] text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                Rozumiem, korzystaj z Pro za darmo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
