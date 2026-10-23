import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    authError,
    setAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setAuthError(null);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, name);
      }
      setIsAuthModalOpen(false);
    } catch (err) {
      // Error is set in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      setIsAuthModalOpen(false);
    } catch (err) {
      // Handled in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans select-none"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[8px] max-w-sm w-full p-6 shadow-2xl relative text-[#37352f] dark:text-[#d4d4d4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-3.5 top-3.5 text-[#787774] hover:text-[#37352f] dark:hover:text-white p-1 rounded-[4px] cursor-pointer transition-colors"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-8 h-8 rounded-[4px] bg-[#2383e2]/10 text-[#2383e2] flex items-center justify-center mx-auto mb-2">
            <LogIn size={18} />
          </div>
          <h2 className="text-base font-bold text-[#37352f] dark:text-white">
            {mode === 'login' ? 'Zaloguj się do Workspace' : 'Utwórz konto Workspace'}
          </h2>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-0.5">
            Synchronizacja dokumentów, zadań i asystenta AI
          </p>
        </div>

        {/* Error notice */}
        {authError && (
          <div className="mb-4 p-2 rounded-[4px] bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span className="leading-snug">{authError}</span>
          </div>
        )}

        {/* Google One-Click Button */}
        <button
          onClick={handleGoogle}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white dark:bg-[#282828] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(55,53,47,0.14)] dark:border-[rgba(255,255,255,0.14)] rounded-[4px] font-medium text-xs text-[#37352f] dark:text-white cursor-pointer transition-colors disabled:opacity-50 mb-3"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Kontynuuj przez Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] w-full" />
          <span className="bg-white dark:bg-[#202020] px-2 text-[10px] uppercase font-medium text-[#787774] dark:text-[#9b9a97] absolute">
            lub przez email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === 'register' && (
            <div>
              <label className="text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] block mb-1">
                Twoje imię / Nick:
              </label>
              <div className="relative">
                <UserIcon size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Kacper"
                  className="w-full bg-[rgba(55,53,47,0.02)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] pl-8 pr-3 py-1.5 rounded-[4px] text-xs text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none focus:border-[#2383e2]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] block mb-1">Email:</label>
            <div className="relative">
              <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj@email.pl"
                className="w-full bg-[rgba(55,53,47,0.02)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] pl-8 pr-3 py-1.5 rounded-[4px] text-xs text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none focus:border-[#2383e2]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#787774] dark:text-[#9b9a97] block mb-1">Hasło:</label>
            <div className="relative">
              <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774]" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 znaków"
                className="w-full bg-[rgba(55,53,47,0.02)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] pl-8 pr-3 py-1.5 rounded-[4px] text-xs text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none focus:border-[#2383e2]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-3 bg-[#2383e2] hover:bg-[#1d6fc2] text-white font-medium text-xs rounded-[4px] shadow-2xs cursor-pointer transition-colors disabled:opacity-50 mt-1"
          >
            {submitting ? 'Przetwarzanie...' : mode === 'login' ? 'Zaloguj się' : 'Zarejestruj konto'}
          </button>
        </form>

        {/* Footer switch */}
        <div className="mt-3.5 pt-2.5 border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] text-center text-xs text-[#787774] dark:text-[#9b9a97]">
          {mode === 'login' ? (
            <span>
              Nie masz konta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setAuthError(null);
                }}
                className="text-[#2383e2] font-medium hover:underline cursor-pointer"
              >
                Zarejestruj się
              </button>
            </span>
          ) : (
            <span>
              Masz już konto?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                }}
                className="text-[#2383e2] font-medium hover:underline cursor-pointer"
              >
                Zaloguj się
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
