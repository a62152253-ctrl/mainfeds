import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  Search,
  Bell,
  Star,
  FileText,
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  LogIn,
  LogOut,
  Trash2,
  Columns3,
  Users,
  Sparkles,
  Database,
  Compass,
  Settings,
  MoreHorizontal,
  Copy,
  Edit2,
  Check,
  Lock,
  X,
  LayoutTemplate,
  Calendar,
  HelpCircle,
  BookOpen,
  Briefcase,
  Layers,
  FolderPlus,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationsModal } from './NotificationsModal';
import { TemplatesModal } from './TemplatesModal';
import { PageType, WorkspacePage } from '../types/workspace';

interface PageTreeItemProps {
  page: WorkspacePage;
  level: number;
  allPages: WorkspacePage[];
  activeDocId?: string;
  activeView: string;
  expandedPages: Record<string, boolean>;
  onToggleExpand: (pageId: string) => void;
  onSelectPage: (pageId: string) => void;
  onCreateSubpage: (pageId: string) => void;
  onOpenContextMenu: (e: React.MouseEvent, pageId: string) => void;
}

const PageTreeItem: React.FC<PageTreeItemProps> = ({
  page,
  level,
  allPages,
  activeDocId,
  activeView,
  expandedPages,
  onToggleExpand,
  onSelectPage,
  onCreateSubpage,
  onOpenContextMenu,
}) => {
  const childPages = allPages.filter((p) => p.parentPageId === page.id && !p.isDeleted);
  const hasChildren = childPages.length > 0;
  const isExpanded = !!expandedPages[page.id];
  const isSelected = activeDocId === page.id && activeView === 'doc';

  return (
    <div className="select-none">
      <div
        className={`group relative flex items-center justify-between py-1 rounded-[4px] cursor-pointer transition-colors text-[13px] ${
          isSelected
            ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
            : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.05)] dark:hover:bg-[rgba(255,255,255,0.055)]'
        }`}
        style={{ paddingLeft: `${8 + level * 14}px`, paddingRight: '6px' }}
        onClick={() => onSelectPage(page.id)}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
          {/* Chevron for subpages */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(page.id);
            }}
            className={`w-4 h-4 flex items-center justify-center rounded-[3px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)] cursor-pointer shrink-0 transition-transform ${
              hasChildren ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
            }`}
          >
            {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>

          {/* Page Icon */}
          <span className="text-sm shrink-0 leading-none">{page.icon || '📄'}</span>

          {/* Page Title */}
          <span className="truncate leading-tight">{page.title || 'New page'}</span>
        </div>

        {/* Hover Action Buttons: [+] for Subpage, [...] for Menu */}
        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 opacity-80 hover:opacity-100">
          <button
            type="button"
            title="Dodaj podstronę (Add subpage)"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubpage(page.id);
            }}
            className="p-1 rounded-[3px] hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)] text-[#787774] hover:text-[#37352f] dark:hover:text-white cursor-pointer"
          >
            <Plus size={11} />
          </button>
          <button
            type="button"
            title="Więcej opcji"
            onClick={(e) => {
              e.stopPropagation();
              onOpenContextMenu(e, page.id);
            }}
            className="p-1 rounded-[3px] hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)] text-[#787774] hover:text-[#37352f] dark:hover:text-white cursor-pointer"
          >
            <MoreHorizontal size={11} />
          </button>
        </div>
      </div>

      {/* Render nested children recursively */}
      {hasChildren && isExpanded && (
        <div className="space-y-[1px]">
          {childPages.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              level={level + 1}
              allPages={allPages}
              activeDocId={activeDocId}
              activeView={activeView}
              expandedPages={expandedPages}
              onToggleExpand={onToggleExpand}
              onSelectPage={onSelectPage}
              onCreateSubpage={onCreateSubpage}
              onOpenContextMenu={onOpenContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const {
    pages,
    sharedPages,
    folders,
    tasks,
    activeDoc,
    activeView,
    setActivePageId,
    setActiveView,
    setIsSearchOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    createPage,
    createSubpage,
    createFolder,
    deletePage,
    updatePageTitle,
    updatePageType,
    toggleFavorite,
    unreadNotificationsCount,
    currentWorkspace,
    workspaces,
    switchWorkspace,
    isAiSidePanelOpen,
    toggleAiSidePanel,
  } = useWorkspace();

  const { user, signOutUser, setIsAuthModalOpen, userProfile, setIsOnboardingOpen } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({});
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHomeExpanded, setIsHomeExpanded] = useState(true);
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);
  const [isTeamspacesExpanded, setIsTeamspacesExpanded] = useState(true);
  const [isSharedExpanded, setIsSharedExpanded] = useState(true);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    pageId: string;
    x: number;
    y: number;
  } | null>(null);

  // Inline rename state
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [contextMenu]);

  const togglePageExpand = (pageId: string) => {
    setExpandedPages((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const handleOpenContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
  };

  const handleDuplicatePage = async (page: WorkspacePage) => {
    await createPage(
      page.folderId,
      `${page.title} (kopia)`,
      page.blocks,
      page.pageType || 'Document',
      page.icon
    );
    setContextMenu(null);
  };

  const activePages = pages.filter((p) => !p.isDeleted);
  // Root private pages: pages without parentPageId and not deleted
  const rootPrivatePages = activePages.filter((p) => !p.parentPageId);
  const favoritePages = activePages.filter((p) => p.isFavorite);
  const deletedPagesCount = pages.filter((p) => p.isDeleted).length;

  return (
    <aside className="w-60 h-full bg-[#fbfbfa] dark:bg-[#202020] border-r border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex flex-col select-none shrink-0 text-[13px] text-[#37352f] dark:text-[#d4d4d4] font-sans no-print transition-colors duration-150">
      {/* ========================================================================= */}
      {/* 1. NOTION-STYLE WORKSPACE SWITCHER (Exact 1:1)                            */}
      {/* ========================================================================= */}
      <div className="p-2 border-b border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] relative shrink-0">
        <button
          onClick={() => {
            if (user) {
              setIsUserMenuOpen(!isUserMenuOpen);
            } else {
              setIsAuthModalOpen(true);
            }
          }}
          className="w-full flex items-center justify-between p-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] transition-colors cursor-pointer text-left group"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded-[4px] bg-[#37352f] dark:bg-[#ffffff] text-white dark:text-[#191919] font-bold flex items-center justify-center shrink-0 text-[11px] shadow-2xs">
              {(user?.displayName || user?.email || currentWorkspace.name || 'K')[0].toUpperCase()}
            </div>
            <div className="truncate">
              <div className="font-semibold text-[#37352f] dark:text-white text-[13px] truncate leading-tight flex items-center gap-1">
                <span className="truncate">
                  {user?.displayName ? `${user.displayName}'s Space` : currentWorkspace.name || "Kamil Lipowski's Space"}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown size={13} className="text-[#787774] dark:text-[#9b9a97] group-hover:text-[#37352f] dark:group-hover:text-white shrink-0" />
        </button>

        {/* Workspace Dropdown Menu */}
        {isUserMenuOpen && user && (
          <div className="absolute top-full left-2 right-2 mt-1 z-50 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] shadow-[rgba(15,15,15,0.05)_0px_0px_0px_1px,rgba(15,15,15,0.1)_0px_3px_10px] p-1.5 space-y-1 text-xs animate-in fade-in">
            <div className="px-2 py-1 text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase font-semibold tracking-wider">
              Przestrzenie robocze
            </div>
            <div className="space-y-0.5 max-h-36 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setIsUserMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[4px] cursor-pointer text-left transition-colors ${
                    currentWorkspace.id === ws.id
                      ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                      : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{ws.icon || '🏢'}</span>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  {currentWorkspace.id === ws.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2383e2] dark:bg-[#529cca] shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] pt-1">
              <button
                onClick={() => {
                  signOutUser();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer text-left transition-colors font-medium text-[11px]"
              >
                <LogOut size={12} />
                <span>Wyloguj się</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP ACTION ROW: Search, Updates, Settings                               */}
      {/* ========================================================================= */}
      <div className="px-2 pt-1.5 pb-1 space-y-[2px] shrink-0">
        {/* Szukaj (⌘K) */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer text-[13px]"
        >
          <div className="flex items-center gap-2">
            <Search size={15} className="text-[#787774] dark:text-[#9b9a97]" />
            <span>Search</span>
          </div>
          <kbd className="text-[10px] font-mono text-[#787774] dark:text-[#9b9a97] bg-[rgba(55,53,47,0.05)] dark:bg-[rgba(255,255,255,0.06)] px-1.5 py-0.2 rounded border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
            ⌘K
          </kbd>
        </button>

        {/* Notifications / Updates */}
        <button
          onClick={() => setIsNotificationsOpen(true)}
          className="w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer text-[13px]"
        >
          <div className="flex items-center gap-2">
            <Bell size={15} />
            <span>Updates</span>
          </div>
          {unreadNotificationsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white transition-colors cursor-pointer text-[13px]"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SCROLLABLE NOTION DOCUMENT TREE & SECTIONS                             */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {/* HOME SECTION (Exact Notion Screenshot match) */}
        <div className="space-y-[1px]">
          <button
            onClick={() => setActiveView('home')}
            className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer transition-colors text-[13px] ${
              activeView === 'home'
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home size={15} className="text-[#787774] dark:text-[#9b9a97]" />
              <span>Home</span>
            </div>
          </button>

          {/* Under Home: Recent highlights list */}
          {favoritePages.length > 0 && (
            <div className="space-y-[1px] pl-2 pt-0.5">
              {favoritePages.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setActivePageId(p.id);
                    setActiveView('doc');
                  }}
                  className={`flex items-center gap-2 px-2 py-1 rounded-[4px] text-[12px] cursor-pointer truncate transition-colors ${
                    activeDoc?.id === p.id && activeView === 'doc'
                      ? 'bg-[rgba(55,53,47,0.08)] text-[#37352f] dark:text-white font-semibold'
                      : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.04)]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-500 shrink-0" />
                  <span className="truncate">{p.title || 'Untitled'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION: PRIVATE (with [+] Add page button) */}
        <div className="space-y-[1px]">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-[0.04em] group">
            <span
              onClick={() => setIsPrivateExpanded(!isPrivateExpanded)}
              className="flex items-center gap-1 cursor-pointer hover:text-[#37352f] dark:hover:text-white"
            >
              {isPrivateExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Private</span>
            </span>

            <button
              onClick={async () => {
                const newId = await createPage(undefined, '', undefined, 'Document', '📄');
                if (newId) {
                  setActivePageId(newId);
                  setActiveView('doc');
                }
              }}
              title="Add a page"
              className="p-0.5 rounded-[3px] hover:bg-[rgba(55,53,47,0.08)] dark:hover:bg-[rgba(255,255,255,0.08)] text-[#787774] hover:text-[#37352f] dark:hover:text-white cursor-pointer"
            >
              <Plus size={13} />
            </button>
          </div>

          {isPrivateExpanded && (
            <div className="space-y-[1px]">
              {rootPrivatePages.length === 0 ? (
                <div
                  onClick={async () => {
                    const newId = await createPage(undefined, '', undefined, 'Document', '📄');
                    if (newId) {
                      setActivePageId(newId);
                      setActiveView('doc');
                    }
                  }}
                  className="px-2 py-1 text-xs text-[#787774] dark:text-[#9b9a97] italic cursor-pointer hover:underline"
                >
                  + Add a page
                </div>
              ) : (
                rootPrivatePages.map((page) => (
                  <PageTreeItem
                    key={page.id}
                    page={page}
                    level={0}
                    allPages={activePages}
                    activeDocId={activeDoc?.id}
                    activeView={activeView}
                    expandedPages={expandedPages}
                    onToggleExpand={togglePageExpand}
                    onSelectPage={(id) => {
                      setActivePageId(id);
                      setActiveView('doc');
                    }}
                    onCreateSubpage={async (parentId) => {
                      await createSubpage(parentId, '');
                      setExpandedPages((prev) => ({ ...prev, [parentId]: true }));
                    }}
                    onOpenContextMenu={handleOpenContextMenu}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* SECTION: WSPÓLNE / SHARED */}
        {sharedPages.length > 0 && (
          <div className="space-y-[1px]">
            <div
              onClick={() => setIsSharedExpanded(!isSharedExpanded)}
              className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-[0.04em] cursor-pointer hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] rounded-[4px] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {isSharedExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                <span className="flex items-center gap-1.5 font-bold">
                  <Users size={12} />
                  <span>Shared</span>
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                {sharedPages.length}
              </span>
            </div>

            {isSharedExpanded && (
              <div className="space-y-[1px] pl-1">
                {sharedPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => {
                      setActivePageId(page.id);
                      setActiveView('doc');
                    }}
                    className={`flex items-center gap-2 px-2 py-1 rounded-[4px] cursor-pointer transition-colors text-[13px] ${
                      activeDoc?.id === page.id && activeView === 'doc'
                        ? 'bg-[rgba(35,131,226,0.12)] text-[#2383e2] dark:text-[#529cca] font-semibold'
                        : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)]'
                    }`}
                  >
                    <span className="text-sm shrink-0">{page.icon || '👥'}</span>
                    <span className="truncate">{page.title || 'Bez tytułu'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION: TEAMSPACES (Exact Notion Screenshot match) */}
        <div className="space-y-[1px]">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-[0.04em] group">
            <span
              onClick={() => setIsTeamspacesExpanded(!isTeamspacesExpanded)}
              className="flex items-center gap-1 cursor-pointer hover:text-[#37352f] dark:hover:text-white"
            >
              {isTeamspacesExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <span>Teamspaces</span>
            </span>
          </div>

          {isTeamspacesExpanded && (
            <div className="space-y-[1px]">
              <button
                onClick={() => setActiveView('teams')}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer text-[13px] ${
                  activeView === 'teams'
                    ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                    : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#787774] dark:text-[#9b9a97]" />
                  <span>Team HQ</span>
                </div>
              </button>
              <button
                onClick={() => setActiveView('projects')}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer text-[13px] ${
                  activeView === 'projects' || activeView === 'database'
                    ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                    : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database size={14} className="text-[#787774] dark:text-[#9b9a97]" />
                  <span>Projects</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774] dark:text-[#9b9a97] tabular-nums">
                  {activePages.filter((p) => p.pageType === 'Project' || (p.tags || []).some((t) => t.toLowerCase().includes('projekt') || t.toLowerCase().includes('project'))).length}
                </span>
              </button>
              <button
                onClick={() => setActiveView('tasks')}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer text-[13px] ${
                  activeView === 'kanban' || activeView === 'tasks'
                    ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                    : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Columns3 size={14} className="text-[#787774] dark:text-[#9b9a97]" />
                  <span>Tasks</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774] dark:text-[#9b9a97] tabular-nums">
                  {tasks.length}
                </span>
              </button>
              <button
                onClick={() => setActiveView('meetings')}
                className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer text-[13px] ${
                  activeView === 'meetings' || activeView === 'calendar'
                    ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                    : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#787774] dark:text-[#9b9a97]" />
                  <span>Meetings</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774] dark:text-[#9b9a97] tabular-nums">
                  {activePages.filter((p) => p.pageType === 'Meeting' || (p.tags || []).some((t) => t.toLowerCase().includes('spotkanie') || t.toLowerCase().includes('meeting'))).length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM UTILITY LIST */}
        <div className="pt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] space-y-[2px]">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white cursor-pointer text-[13px]"
          >
            <LayoutTemplate size={14} />
            <span>Templates</span>
          </button>
          <button
            onClick={() => setActiveView('searches')}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white cursor-pointer text-[13px]"
          >
            <BookOpen size={14} />
            <span>Library</span>
          </button>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="w-full flex items-center gap-2 px-2 py-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white cursor-pointer text-[13px]"
          >
            <HelpCircle size={14} />
            <span>Help</span>
          </button>
          <button
            onClick={() => setActiveView('trash')}
            className={`w-full flex items-center justify-between px-2 py-1 rounded-[4px] cursor-pointer text-[13px] ${
              activeView === 'trash'
                ? 'bg-[rgba(55,53,47,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.06)] hover:text-[#37352f] dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trash2 size={14} />
              <span>Trash</span>
            </div>
            {deletedPagesCount > 0 && (
              <span className="text-[10px] font-mono text-[#787774] tabular-nums">
                {deletedPagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VERY BOTTOM FLOATING PILL: "New chat (Ctrl D)" (Exact Notion match)     */}
      {/* ========================================================================= */}
      <div className="p-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] bg-[#fbfbfa] dark:bg-[#202020] shrink-0">
        <button
          type="button"
          onClick={() => toggleAiSidePanel()}
          className="w-full py-1.5 px-2.5 rounded-[6px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#252525] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] text-xs text-[#37352f] dark:text-white font-medium flex items-center justify-between shadow-2xs cursor-pointer transition-colors"
          title="Otwórz asystenta AI (Ctrl+D)"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
            <span className="font-medium">New chat</span>
            <kbd className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">Ctrl D</kbd>
          </div>
          <div className="flex items-center gap-1 text-[#787774]">
            <Plus size={12} />
            <Edit2 size={11} />
          </div>
        </button>
      </div>

      {/* Context Menu for page items */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] shadow-[rgba(15,15,15,0.05)_0px_0px_0px_1px,rgba(15,15,15,0.1)_0px_3px_10px] p-1 w-48 text-xs text-[#37352f] dark:text-[#d4d4d4] animate-in fade-in"
        >
          {(() => {
            const page = pages.find((p) => p.id === contextMenu.pageId);
            if (!page) return null;
            return (
              <>
                <button
                  onClick={async () => {
                    await createSubpage(page.id, 'New page');
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer text-left"
                >
                  <Plus size={12} />
                  <span>Dodaj podstronę</span>
                </button>
                <button
                  onClick={() => handleDuplicatePage(page)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer text-left"
                >
                  <Copy size={12} />
                  <span>Duplikuj</span>
                </button>
                <button
                  onClick={async () => {
                    await toggleFavorite(page.id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer text-left"
                >
                  <Star size={12} className={page.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
                  <span>{page.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}</span>
                </button>
                <div className="border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] my-1" />
                <button
                  onClick={async () => {
                    await deletePage(page.id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-[4px] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer text-left"
                >
                  <Trash2 size={12} />
                  <span>Przenieś do kosza</span>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <TemplatesModal
          isOpen={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
          currentBlocksCount={0}
          onSelectTemplate={async (tpl) => {
            const blocks = tpl.blocks.map((b, idx) => ({
              id: `tpl-${Date.now()}-${idx}`,
              type: b.type,
              content: b.content,
            }));
            const newId = await createPage(undefined, tpl.name, blocks, 'Document', tpl.icon);
            setShowTemplatesModal(false);
            if (newId) {
              setActivePageId(newId);
              setActiveView('doc');
            }
          }}
        />
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </aside>
  );
};
