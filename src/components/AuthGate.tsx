import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, AlertCircle, LogIn, Sparkles, CheckCircle2, Database, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthGate: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    quickLocalLogin,
    authError,
    setAuthError,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      // AuthContext handles error state
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickEntry = async () => {
    setSubmitting(true);
    setAuthError(null);
    try {
      await quickLocalLogin('Główny Użytkownik');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col lg:flex-row bg-[#0b0f17] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left visual branding hero */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0e1626] via-[#0b0f17] to-[#111927] border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            N
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white text-lg block leading-none">
              Nowoczesne Studio
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
              Workspace OS v3.8 · SQLite Edition
            </span>
          </div>
        </div>

        {/* Middle copy */}
        <div className="relative z-10 my-12 lg:my-0 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Sparkles size={13} />
            <span>Relacyjny system dokumentów i zadań SQLite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-5">
            Zaloguj się do swojego <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Workspace Dashboard</span>.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            Wszystkie Twoje notatki, 90+ bloków, tabele baz danych, widoki Kanban oraz Puter AI działają w 100% lokalnie i bez opóźnień.
          </p>

          <div className="space-y-3">
            {[
              'Relacyjna baza SQLite z natychmiastowym eksportem i importem (.sql)',
              'Brak zależności od Firebase i Google OAuth — zero blokad i błędów',
              'Puter AI (Claude 3.5 Sonnet / GPT-4o) i wieloźródłowe badania Deep Research',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-slate-400 flex items-center gap-2">
          <Database size={14} className="text-emerald-400" />
          <span>Relacyjna Baza Danych SQLite & Local-First Architecture</span>
        </div>
      </div>

      {/* Right authentication box */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#0b0f17]">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* Quick One-Click Entry Button */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/30 text-center space-y-2.5">
            <div className="text-xs font-semibold text-blue-300 flex items-center justify-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              <span>Dostęp Błyskawiczny (Zalecany)</span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleQuickEntry}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Przejdź do Workspace bez logowania</span>
              <ArrowRight size={14} />
            </button>
            <span className="text-[10px] text-slate-400 block">
              Tworzy natychmiastową sesję w lokalnej bazie SQLite.
            </span>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-mono uppercase text-slate-500 shrink-0">
              Lub zaloguj się profilem
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mb-5 border border-slate-700/50">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejestracja
            </button>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={14} className="shrink-0 text-rose-400" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Imię i nazwisko / Pseudonim
                </label>
                <div className="relative">
                  <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="np. Kacper Nowicki"
                    className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Adres Email / Login</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="uzytkownik@searchpoint.pl"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Hasło</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={14} />
                  <span>{mode === 'login' ? 'Zaloguj się' : 'Utwórz konto w SQLite'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
