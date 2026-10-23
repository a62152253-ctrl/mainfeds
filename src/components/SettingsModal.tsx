import React, { useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  Command,
  User,
  ShieldCheck,
  Building,
  LogOut,
  Check,
  Palette,
  Sliders,
  Keyboard,
  Info,
} from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { USER_PROFILES } from '../features/profile/userProfileConfig';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, userProfile, setIsOnboardingOpen, signOutUser } = useAuth();
  const { workspaceName, setWorkspaceName, currentWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'shortcuts' | 'account'>('appearance');

  if (!isOpen) return null;

  const currentProfileDef = userProfile ? USER_PROFILES[userProfile] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Sliders size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Ustawienia Workspace
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Personalizacja wyglądu, profilu i preferencji
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-950/30 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Palette size={14} />
            <span>Wygląd & Motyw</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>Profil Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'shortcuts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Keyboard size={14} />
            <span>Skróty klawiszowe</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'account'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <User size={14} />
            <span>Konto</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* TAB 1: WYGLĄD & MOTYW */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                  Motyw kolorystyczny
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
                  Wybierz preferowany tryb wyświetlania interfejsu. Zmiana jest natychmiastowa i nie powoduje migotania.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {/* Jasny */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Jasny</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Klasyczny kontrast</div>
                    </div>
                    {theme === 'light' && <Check size={14} className="text-blue-600" />}
                  </button>

                  {/* Ciemny */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center">
                      <Moon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Ciemny</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Dla skupienia i w nocy</div>
                    </div>
                    {theme === 'dark' && <Check size={14} className="text-blue-600" />}
                  </button>

                  {/* Systemowy */}
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2.5 transition-all cursor-pointer text-center ${
                      theme === 'system'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs">Systemowy</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Automatyczny</div>
                    </div>
                    {theme === 'system' && <Check size={14} className="text-blue-600" />}
                  </button>
                </div>
              </div>

              {/* Informacja o Design System */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                <Info size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">
                    Spójny Design System v1
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                    Typografia oparta o Plus Jakarta Sans oraz JetBrains Mono. Wzornictwo minimalistyczne inspirowane Linear i Notion z płynnymi przejściami stanów interfejsu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFIL WORKSPACE */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentProfileDef?.icon || '⚡'}</span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {currentProfileDef?.title || userProfile || 'Standard'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {currentProfileDef?.tagline || 'Domyślna konfiguracja workspace'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                    Aktywny profil
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  {currentProfileDef?.description ||
                    'Profil dostosowuje domyślne szablony, układ sekcji i rekomendowane prompty AI. Nie modyfikuje Twoich uprawnień do bazy.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Uprawnienia są w 100% niezależne od profilu</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      setIsOnboardingOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles size={12} />
                    <span>Zmień profil / Szablony</span>
                  </button>
                </div>
              </div>

              {currentProfileDef && currentProfileDef.suggestedAiPills.length > 0 && (
                <div>
                  <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                    Dedykowane sugestie promptów AI dla profilu:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {currentProfileDef.suggestedAiPills.map((pill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono border border-slate-200 dark:border-slate-700"
                      >
                        {pill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SKRÓTY KLAWISZOWE */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-2">
                Nawiguj po aplikacji bez odrywania rąk od klawiatury:
              </p>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-850">
                {[
                  { key: 'Ctrl + K / ⌘K', desc: 'Wyszukiwanie globalne i szybkie przełączanie stron' },
                  { key: 'Ctrl + / / ⌘/', desc: 'Otwórz / wyślij zapytanie do Asystenta AI' },
                  { key: 'Ctrl + B / ⌘B', desc: 'Pogrubienie zaznaczonego tekstu w edytorze' },
                  { key: 'Ctrl + I / ⌘I', desc: 'Kursywa tekstu' },
                  { key: 'Ctrl + Z / ⌘Z', desc: 'Cofnij ostatnią edycję bloku' },
                  { key: 'Esc', desc: 'Zamknij modal, wyszukiwarkę lub panel boczny' },
                  { key: '/', desc: 'W pustym bloku: otwórz menu 80+ bloków dokumentu' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.desc}</span>
                    <kbd className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-bold border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: KONTO & WORKSPACE */}
          {activeTab === 'account' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {user?.displayName || 'Użytkownik'}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{user?.email || 'Brak emaila'}</p>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={() => {
                      signOutUser();
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs border border-rose-200 dark:border-rose-900 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <LogOut size={13} />
                    <span>Wyloguj się</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nazwa aktualnej przestrzeni roboczej
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 cursor-pointer transition-all shadow-xs"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
};
