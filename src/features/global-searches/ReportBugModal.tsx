import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bot,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { bugReportService } from './bugReportService';
import { BugReportItem, BugReportReason } from './types';

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  claimText: string;
  claimId?: string;
  searchId?: string;
  collectionId?: string;
  onSuccess?: (report: BugReportItem) => void;
}

export const ReportBugModal: React.FC<ReportBugModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  claimText,
  claimId,
  searchId,
  collectionId,
  onSuccess,
}) => {
  const [reason, setReason] = useState<BugReportReason>('factual_error');
  const [counterSourceUrl, setCounterSourceUrl] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BugReportItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const quota = bugReportService.getRemainingQuota(userId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const res = await bugReportService.submitBugReport({
      userId,
      userEmail,
      searchId,
      collectionId,
      claimId,
      claimText,
      reason,
      counterSourceUrl: counterSourceUrl.trim() || undefined,
      userComment: comment.trim(),
    });

    setIsSubmitting(false);

    if (res.success && res.report) {
      setResult(res.report);
      onSuccess?.(res.report);
    } else {
      setErrorMsg(res.error || 'Nie udało się przesłać zgłoszenia.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none antialiased animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Zgłoś błąd merytoryczny w fakcie
              </h3>
              <p className="text-[11px] text-slate-500">
                Weryfikacja rzetelności źródeł (Limit: 4 zgłoszenia / 24h na konto)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quota Indicator */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck size={14} className="text-blue-500" />
            <span className="font-medium">Pozostały limit zgłoszeń na 24h:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span
              className={`font-bold ${
                quota.remaining > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'
              }`}
            >
              {quota.remaining} / {quota.max}
            </span>
            {quota.resetInHours > 0 && quota.remaining < quota.max && (
              <span className="text-[10px] text-slate-400 font-sans flex items-center gap-1">
                <Clock size={11} />
                <span>reset za ~{quota.resetInHours}h</span>
              </span>
            )}
          </div>
        </div>

        {result ? (
          /* Result Card after AI verification */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                <CheckCircle2 size={16} />
                <span>Zgłoszenie zarejestrowane i zbadane przez Audytora AI</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                Status zgłoszenia:{' '}
                <strong className="uppercase font-bold text-slate-900 dark:text-white">
                  {result.status === 'verified_bug'
                    ? 'Potwierdzono błąd merytoryczny (VERIFIED BUG)'
                    : result.status === 'rejected'
                    ? 'Fakt zweryfikowany jako poprawny (REJECTED)'
                    : 'Częściowo potwierdzono / Niejednoznaczność (PARTIALLY CONFIRMED)'}
                </strong>
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Twierdzenie zostało oznaczone etykietą <strong>Sporne (Disputed)</strong> w widoku
                badań do czasu ponownej oceny wieloźródłowej.
              </div>
              {result.aiVerdict && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <Bot size={13} className="text-blue-500" />
                    <span>Uzasadnienie audytora AI:</span>
                  </div>
                  {result.aiVerdict}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-sm transition-colors"
            >
              Zamknij
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* The claim */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Kwestionowane twierdzenie:
              </label>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs border border-slate-200/60 dark:border-slate-800 italic leading-relaxed">
                „{claimText}”
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Kategoria problemu:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as BugReportReason)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="factual_error">❌ Błąd merytoryczny / fakt jest nieprawdziwy</option>
                <option value="outdated">⏳ Nieaktualne dane / zdezaktualizowana wersja</option>
                <option value="missing_source">🔗 Brakujące kluczowe źródło lub zniekształcony cytat</option>
                <option value="bias">⚖️ Stronniczość / dezinformacja w interpretacji</option>
                <option value="other">📝 Inny problem merytoryczny</option>
              </select>
            </div>

            {/* Counter Source URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center justify-between">
                <span>Link do źródła korygującego (opcjonalnie):</span>
                <span className="text-[10px] text-slate-400">URL publikacji lub dokumentacji</span>
              </label>
              <input
                type="url"
                value={counterSourceUrl}
                onChange={(e) => setCounterSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Comment */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Twój komentarz / dlaczego informacja jest błędna:
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Np. Najnowsze publikacje naukowe z 2025 roku wykazały, że..."
                className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={!comment.trim() || isSubmitting || quota.remaining <= 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Weryfikacja AI...</span>
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Wyślij do weryfikacji</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
