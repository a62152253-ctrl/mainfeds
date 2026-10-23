import React, { useState } from 'react';
import {
  Globe,
  Share2,
  Maximize2,
  Minimize2,
  Check,
  Copy,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const {
    activeDoc,
    activeView,
    isZenMode,
    setIsZenMode,
    syncStatus,
    togglePagePublic,
    setActiveView,
  } = useWorkspace();
  const { user, setIsAuthModalOpen } = useAuth();

  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPublicLink = () => {
    const url = window.location.origin + '?public=' + (activeDoc?.publicSlug || activeDoc?.id);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const getBreadcrumbLabel = () => {
    switch (activeView) {
      case 'home':
        return 'Pulpit Główny';
      case 'all-pages':
        return 'Wszystkie Dokumenty';
      case 'kanban':
        return 'Tablica Kanban';
      case 'database':
        return 'Baza Danych';
      case 'calendar':
        return 'Kalendarz Zadań';
      case 'doc':
      case 'public':
        return activeDoc?.title || 'Dokument';
      default:
        return 'Workspace';
    }
  };

  return (
    <>
      <header className="h-11 px-4 bg-[#202020] border-b border-[#2d2d2d] flex items-center justify-between text-xs select-none shrink-0 no-print">
        {/* Left: Breadcrumbs & Status */}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 font-medium">Workspace</span>
          <span className="text-zinc-600">/</span>
          {activeDoc?.icon && activeView === 'doc' && (
            <span className="text-sm">{activeDoc.icon}</span>
          )}
          <span className="font-semibold text-zinc-100 truncate max-w-xs">
            {getBreadcrumbLabel()}
          </span>

          {/* Sync indicator */}
          <div className="ml-2 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'saving'
                  ? 'bg-amber-400 animate-pulse'
                  : syncStatus === 'saved'
                  ? 'bg-emerald-500'
                  : 'bg-zinc-500'
              }`}
            />
            <span className="capitalize">{syncStatus}</span>
          </div>
        </div>

        {/* Right: Real User & Actions */}
        <div className="flex items-center gap-2">
          {/* Share / Public Website Toggle */}
          {activeView === 'doc' && activeDoc && (
            <button
              onClick={() => setShowShareModal(true)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeDoc.isPublic
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#2b2b2b] text-zinc-300 hover:text-white'
              }`}
            >
              {activeDoc.isPublic ? <Globe size={13} /> : <Share2 size={13} />}
              <span>{activeDoc.isPublic ? 'Opublikowano' : 'Udostępnij'}</span>
            </button>
          )}

          {/* Zen / Focus Mode */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            title={isZenMode ? 'Wyjdź z trybu skupienia' : 'Tryb skupienia (Zen Mode)'}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              isZenMode ? 'bg-blue-600/30 text-blue-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#2b2b2b]'
            }`}
          >
            {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Real User Profile / Auth Button */}
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#2b2b2b] hover:bg-[#333] cursor-pointer transition-colors"
              title={`Zalogowano: ${user.email}`}
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Profil'}
                  className="w-5 h-5 rounded-full object-cover border border-[#444]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium text-zinc-200 max-w-[90px] truncate text-[11px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogIn size={12} />
              <span>Zaloguj</span>
            </button>
          )}
        </div>
      </header>

      {/* Share / Public Publishing Modal */}
      {showShareModal && activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#222222] border border-[#333] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#333] pb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-blue-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Udostępnianie i Publikacja WWW</h3>
              </div>
              <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {/* Public Switch */}
            <div className="p-3 bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-zinc-100">Opublikuj jako stronę WWW</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Każdy z linkiem będzie mógł zobaczyć czystą wersję bez prywatnego workspace'u.
                </div>
              </div>
              <button
                onClick={() => togglePagePublic(activeDoc.id)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  activeDoc.isPublic ? 'bg-blue-600' : 'bg-[#333]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    activeDoc.isPublic ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Public Link Box */}
            {activeDoc.isPublic && (
              <div className="space-y-2">
                <div className="text-[11px] text-zinc-400 font-medium">Link do publicznej strony:</div>
                <div className="flex items-center gap-1.5 bg-[#181818] border border-[#2e2e2e] rounded p-1.5 font-mono text-[11px] text-zinc-300">
                  <span className="truncate flex-1">
                    https://workspace.app/{activeDoc.publicSlug || activeDoc.id}
                  </span>
                  <button
                    onClick={handleCopyPublicLink}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-sans cursor-pointer flex items-center gap-1"
                  >
                    {copiedLink ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copiedLink ? 'Skopiowano' : 'Kopiuj'}</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowShareModal(false);
                      setActiveView('public');
                    }}
                    className="flex-1 py-1.5 bg-[#2b2b2b] hover:bg-[#333] text-zinc-200 rounded text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span>Zobacz podgląd publiczny</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-3 py-1.5 bg-[#2b2b2b] hover:bg-[#333] text-zinc-300 rounded cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
