import React from 'react';
import { Lock, ShieldCheck, KeyRound, Sparkles, Clock } from 'lucide-react';

interface VaultLockedPlaceholderProps {
  docTitle: string;
  hint?: string;
  blocksCount?: number;
  onUnlockClick: () => void;
}

export const VaultLockedPlaceholder: React.FC<VaultLockedPlaceholderProps> = ({
  docTitle,
  hint,
  blocksCount = 0,
  onUnlockClick,
}) => {
  return (
    <div className="my-8 mx-auto max-w-xl p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-[#13161f] to-slate-950 border border-slate-800 text-slate-100 shadow-2xl flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95">
      {/* Icon Badge */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Lock size={28} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900 shadow">
          <ShieldCheck size={12} />
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-1.5 max-w-md">
        <div className="text-[11px] font-mono tracking-widest text-violet-400 uppercase font-semibold">
          Kryptograficzny Sejf AES-256-GCM
        </div>
        <h3 className="text-xl font-extrabold text-white tracking-tight">
          Ten dokument jest zablokowany
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Zawartość strony <strong className="text-slate-200">"{docTitle}"</strong> ({blocksCount} klocków) została zaszyfrowana algorytmem wojskowym w Twojej przeglądarce przed zapisaniem.
        </p>
      </div>

      {/* Hint if present */}
      {hint && (
        <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs">
          <span className="text-violet-400 font-semibold">Podpowiedź:</span> {hint}
        </div>
      )}

      {/* Unlock Button */}
      <div className="pt-2">
        <button
          onClick={onUnlockClick}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-violet-600/30 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <KeyRound size={15} />
          <span>Wprowadź hasło i odblokuj</span>
        </button>
      </div>

      {/* Security guarantees */}
      <div className="pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-[10px] text-slate-400 font-mono w-full">
        <div>
          <span className="block text-slate-200 font-bold">100k iteracji</span>
          <span>PBKDF2-SHA256</span>
        </div>
        <div>
          <span className="block text-slate-200 font-bold">Zero-Knowledge</span>
          <span>Klucz w pamięci RAM</span>
        </div>
        <div>
          <span className="block text-slate-200 font-bold">Auto-Lock</span>
          <span>Ochrona bezczynności</span>
        </div>
      </div>
    </div>
  );
};
