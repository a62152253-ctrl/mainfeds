import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Download,
  Trash2,
  X,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { evaluatePasswordStrength, generateRecoveryPhrase } from './crypto';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'unlock' | 'setup' | 'settings';
  hint?: string;
  autoLockMinutes: number;
  setAutoLockMinutes: (min: number) => void;
  onUnlock: (password: string) => Promise<boolean>;
  onSetupPassword: (password: string, hint?: string) => Promise<void>;
  onChangePassword: (oldPass: string, newPass: string, newHint?: string) => Promise<boolean>;
  onRemovePassword: () => void;
  onExportBackup: () => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  isOpen,
  onClose,
  mode: initialMode,
  hint,
  autoLockMinutes,
  setAutoLockMinutes,
  onUnlock,
  onSetupPassword,
  onChangePassword,
  onRemovePassword,
  onExportBackup,
}) => {
  const [mode, setMode] = useState<'unlock' | 'setup' | 'settings'>(initialMode);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newHint, setNewHint] = useState(hint || '');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [showRecoveryAlert, setShowRecoveryAlert] = useState(false);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(password);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Podaj hasło do sejfu.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    const ok = await onUnlock(password);
    setIsSubmitting(false);
    if (ok) {
      setPassword('');
      onClose();
    } else {
      setErrorMsg('Nieprawidłowe hasło. Spróbuj ponownie.');
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Hasło musi zawierać minimum 6 znaków.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Wprowadzone hasła różnią się od siebie.');
      return;
    }

    setIsSubmitting(true);
    await onSetupPassword(password, newHint);
    setIsSubmitting(false);
    setPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!oldPassword) {
      setErrorMsg('Podaj dotychczasowe hasło.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Nowe hasło musi zawierać co najmniej 6 znaków.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Nowe hasła nie są identyczne.');
      return;
    }

    setIsSubmitting(true);
    const ok = await onChangePassword(oldPassword, password, newHint);
    setIsSubmitting(false);
    if (ok) {
      setOldPassword('');
      setPassword('');
      setConfirmPassword('');
      setMode('settings');
      setErrorMsg(null);
    } else {
      setErrorMsg('Dotychczasowe hasło jest niepoprawne.');
    }
  };

  const handleGenerateRecovery = () => {
    const phrase = generateRecoveryPhrase();
    setRecoveryPhrase(phrase);
    setShowRecoveryAlert(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#181a20] border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-md flex flex-col text-slate-200 text-xs overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#13151b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
              <Lock size={15} />
            </div>
            <div>
              <div className="font-bold text-slate-100 text-sm">
                {mode === 'unlock' && 'Odszyfruj Sejf Dokumentu'}
                {mode === 'setup' && 'Zabezpiecz stronę Sejfem (AES-256)'}
                {mode === 'settings' && 'Ustawienia Sejfu Dokumentu'}
              </div>
              <div className="text-[10px] text-slate-400">
                Bezpieczne szyfrowanie end-to-end w Twojej przeglądarce
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 flex items-start gap-2 animate-shake">
              <AlertCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE: UNLOCK */}
          {mode === 'unlock' && (
            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Wprowadź hasło główne sejfu:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wpisz hasło..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {hint && (
                <div className="p-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-[11px] text-slate-400">
                  <span className="text-violet-400 font-semibold">Podpowiedź do hasła:</span>{' '}
                  {hint}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
                >
                  <Unlock size={14} />
                  <span>{isSubmitting ? 'Odszyfrowywanie...' : 'Odblokuj dokument'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: SETUP */}
          {mode === 'setup' && (
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Nowe hasło sejfu:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wprowadź silne hasło..."
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>

                {/* Password strength meter */}
                {password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Siła hasła:</span>
                      <span className="font-semibold text-slate-200">{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-full flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score - 1 ? strength.color : 'bg-slate-700/50'
                          }`}
                        />
                      ))}
                    </div>
                    {strength.feedback.length > 0 && (
                      <div className="text-[10px] text-slate-400 italic">
                        {strength.feedback.join(' • ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Potwierdź hasło:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Wpisz ponownie nowe hasło..."
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Podpowiedź do hasła (opcjonalnie):
                </label>
                <input
                  type="text"
                  value={newHint}
                  onChange={(e) => setNewHint(e.target.value)}
                  placeholder="np. Nazwisko ulubionego autora..."
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Recovery phrase button */}
              <div className="p-3 bg-violet-950/30 border border-violet-800/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-violet-300 text-[11px]">Klucz ratunkowy</div>
                  <div className="text-[10px] text-violet-400/80">
                    Wygeneruj 12-słowny kod na wypadek zapomnienia hasła
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateRecovery}
                  className="px-2.5 py-1 bg-violet-800/40 hover:bg-violet-800/60 text-violet-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Generuj
                </button>
              </div>

              {showRecoveryAlert && recoveryPhrase && (
                <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-xl space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert size={13} />
                    <span>Zapisz swój kod ratunkowy:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-200 bg-black/40 p-2 rounded border border-slate-800 select-all break-all">
                    {recoveryPhrase}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  <span>{isSubmitting ? 'Zabezpieczanie...' : 'Włącz ochronę sejfem'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MODE: SETTINGS */}
          {mode === 'settings' && (
            <div className="space-y-4">
              {/* Auto lock timer */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-violet-400" />
                  <span>Czas automatycznego blokowania przy braku aktywności:</span>
                </label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 cursor-pointer"
                >
                  <option value={1}>Po 1 minucie</option>
                  <option value={5}>Po 5 minutach (zalecane)</option>
                  <option value={15}>Po 15 minutach</option>
                  <option value={30}>Po 30 minutach</option>
                  <option value={0}>Wyłącz automatyczne blokowanie</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={onExportBackup}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Download size={14} className="text-blue-400" />
                    <span>Pobierz zaszyfrowaną kopię (.vault.json)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Pobierz plik</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Czy na pewno chcesz usunąć hasło i wyłączyć sejf dla tej strony?')) {
                      onRemovePassword();
                      onClose();
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 size={14} className="text-rose-400" />
                    <span>Wyłącz sejf i usuń hasło</span>
                  </span>
                  <span className="text-[10px] text-rose-400">Odszyfruj na stałe</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium cursor-pointer"
                >
                  Gotowe
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
