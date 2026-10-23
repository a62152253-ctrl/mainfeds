import React, { useState, useEffect } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { BlockEditor } from './components/BlockEditor';
import { HomeDashboard } from './components/HomeDashboard';
import { DatabaseView } from './components/DatabaseView';
import { AllPagesView } from './components/AllPagesView';
import { PublicPageView } from './components/PublicPageView';
import { TrashView } from './components/TrashView';
import { SearchesView } from './components/SearchesView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { TeamsWorkspaceView } from './components/TeamsWorkspaceView';
import { SettingsModal } from './components/SettingsModal';
import { AiChatView } from './components/AiChatView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthGate } from './components/AuthGate';
import { ToastContainer } from './components/ToastContainer';
import { UserProfileType } from './types/workspace';

const WorkspaceContent: React.FC = () => {
  const {
    user,
    loading,
    userProfile,
    isOnboardingOpen,
    setIsOnboardingOpen,
    updateUserProfile,
    setIsAuthModalOpen,
  } = useAuth();
  const {
    pages,
    activeView,
    setActiveView,
    isZenMode,
    isAiFullscreen,
    setIsAiFullscreen,
    isSettingsOpen,
    setIsSettingsOpen,
    seedProfileTemplates,
    isAiSidePanelOpen,
    setIsAiSidePanelOpen,
    toggleAiSidePanel,
  } = useWorkspace();

  // Global keyboard shortcut: Ctrl+D / Cmd+D toggles Notion AI sidecar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (!user) {
          setIsAuthModalOpen(true);
        } else {
          toggleAiSidePanel();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, toggleAiSidePanel, setIsAuthModalOpen]);

  useEffect(() => {
    if (
      window.location.pathname.startsWith('/sell/sell/admin') ||
      window.location.hash.includes('admin')
    ) {
      setActiveView('admin');
    }
  }, [setActiveView]);

  const handleSelectProfile = async (profile: UserProfileType) => {
    await updateUserProfile(profile);
    const nonDeleted = pages.filter((p) => !p.isDeleted);
    if (nonDeleted.length === 0) {
      await seedProfileTemplates(profile);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#fbfbfa] dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-slate-300 dark:border-zinc-700 border-t-[#37352f] dark:border-t-white rounded-full animate-spin" />
          <span className="text-xs font-medium text-[#787774] dark:text-[#9b9a97]">Ładowanie Nowoczesne Studio...</span>
        </div>
      </div>
    );
  }

  // Allow public view even without login if someone opens a shared document link
  // Workspace is accessible locally; AI features require user login

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] font-sans select-none antialiased">
      {/* 1. Left Navigation Sidebar (Hidden in Zen Mode) */}
      {!isZenMode && <Sidebar />}

      {/* 2. Main Workspace View Router */}
      <main className="flex-1 h-full overflow-hidden flex flex-row bg-white dark:bg-[#191919]">
        {activeView === 'ai' ? (
          <div className="flex-1 h-full overflow-hidden">
            <AiChatView
              isCompact={false}
              onSwitchWorkspace={() => setActiveView('home')}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 h-full overflow-hidden flex flex-col">
              {activeView === 'home' && <HomeDashboard />}
              {activeView === 'doc' && <BlockEditor />}
              {activeView === 'all-pages' && <AllPagesView />}
              {(activeView === 'projects' || activeView === 'database') && (
                <DatabaseView key="db-projects" initialEntityKind="projects" initialViewMode="table" />
              )}
              {(activeView === 'tasks' || activeView === 'kanban') && (
                <DatabaseView key="db-tasks" initialEntityKind="tasks" initialViewMode="board" />
              )}
              {(activeView === 'meetings' || activeView === 'calendar') && (
                <DatabaseView key="db-meetings" initialEntityKind="meetings" initialViewMode="calendar" />
              )}
              {activeView === 'teams' && <TeamsWorkspaceView />}
              {activeView === 'public' && <PublicPageView />}
              {activeView === 'trash' && <TrashView />}
              {activeView === 'searches' && <SearchesView />}
              {activeView === 'admin' && <AdminDashboardView />}
            </div>

            {/* Studio AI Sidecar Panel - docked on the right side of the workspace/editor */}
            {isAiSidePanelOpen && (
              <div className="w-[380px] lg:w-[420px] h-full border-l border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-white dark:bg-[#191919] flex flex-col shrink-0 shadow-xs animate-in slide-in-from-right-3 duration-150 z-20">
                <AiChatView
                  isCompact={true}
                  onExpandFullscreen={() => setActiveView('ai')}
                  onClose={() => setIsAiSidePanelOpen(false)}
                />
              </div>
            )}

            {/* Floating Studio AI trigger button when side panel is closed */}
            {!isAiSidePanelOpen && (activeView as string) !== 'ai' && (
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthModalOpen(true);
                  } else {
                    setIsAiSidePanelOpen(true);
                  }
                }}
                className="fixed bottom-5 right-5 px-3 py-1.5 bg-[#ffffff] dark:bg-[#202020] hover:bg-[#f7f6f3] dark:hover:bg-[#2a2a2a] text-[#37352f] dark:text-[#ffffff] rounded-full border border-[rgba(55,53,47,0.14)] dark:border-[rgba(255,255,255,0.14)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)] font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-all z-20 hover:scale-102"
                title="Otwórz asystenta AI (Ctrl+D)"
              >
                {user ? (
                  <Sparkles size={13} className="text-[#2383e2]" />
                ) : (
                  <Lock size={13} className="text-amber-500" />
                )}
                <span>{user ? 'Asystent (Ctrl D)' : 'AI (Zaloguj się)'}</span>
              </button>
            )}
          </>
        )}
      </main>

      {/* 4. Global Search Modal (Ctrl+K / Cmd+K) */}
      <GlobalSearchModal />

      {/* 5. Firebase Auth Modal (Google & Email) */}
      <AuthModal />

      {/* 6. Onboarding Modal & Profile Selector */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        currentProfile={userProfile}
        onSelectProfile={handleSelectProfile}
        onClose={() => setIsOnboardingOpen(false)}
      />

      {/* 7. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 8. Real-time Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <WorkspaceContent />
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
