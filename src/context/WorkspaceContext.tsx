import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { useAuth } from './AuthContext';
import {
  WorkspacePage,
  WorkspaceFolder,
  TaskItem,
  WorkspaceView,
  DocBlock,
  TaskStatus,
  PageComment,
  PageVersion,
  WorkspaceResource,
  WorkspaceNotification,
  NotificationType,
  NotificationCategory,
  PublicPage,
  TeamRole,
  TeamMember,
  TeamInvite,
  TeamWorkspace,
  PageType,
  UserProfileType,
  PagePermissions,
  validateAndMigratePage,
  UserSearchRecord,
  SharedCollaborator,
  NotionAccessRole,
  isValidRfcEmail,
  normalizeAccessRole,
} from '../types/workspace';
import { USER_PROFILES } from '../features/profile/userProfileConfig';
import {
  triggerSendInviteEmail,
  buildTeamInviteJoinUrl,
} from '../features/team/teamEmailService';
import { sqliteDb } from '../services/sqliteDatabase';
import { knowledgeIndex, HealedPageResult } from '../features/ai/knowledgeIndexService';
import { MultiSourceResearchResult } from '../features/ai/multiSourceResearchService';
import {
  applyShareToWorkspacePages,
  createPingNotification,
  extractExplicitShareDirectives,
  extractPingDirectives,
  isValidShareTarget,
  isWorkspaceWideShareDirective,
  revokeShareFromWorkspacePages,
} from '../features/sharing/sharingService';

interface WorkspaceContextType {
  pages: WorkspacePage[];
  sharedPages: WorkspacePage[];
  sharePageWithEmail: (pageId: string, email: string, role?: NotionAccessRole) => Promise<void>;
  updateCollaboratorRole: (pageId: string, email: string, role: NotionAccessRole) => Promise<void>;
  removePageCollaborator: (pageId: string, email: string) => Promise<void>;
  createSubpage: (parentPageId: string, title?: string) => Promise<string | undefined>;
  setParentPage: (pageId: string, parentPageId?: string) => Promise<void>;
  toggleInheritPermissions: (pageId: string, inherit: boolean) => Promise<void>;
  smartMergePageWithResearch: (pageId: string, researchResult: MultiSourceResearchResult) => Promise<HealedPageResult>;
  folders: WorkspaceFolder[];
  tasks: TaskItem[];
  publicPages: PublicPage[];
  activePageId: string;
  activePublicPageId: string | null;
  activeView: WorkspaceView;
  searchQuery: string;
  isSearchOpen: boolean;
  isZenMode: boolean;
  isAiFullscreen: boolean;
  syncStatus: 'saved' | 'saving' | 'offline';
  selectedTag: string | null;
  activeDoc: WorkspacePage | undefined;
  activePublicPage: PublicPage | undefined;
  
  // Workspace & Folders & Multi-Tenancy Teams
  workspaceName: string;
  setWorkspaceName: (name: string) => void;
  workspaces: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    ownerId?: string;
    members?: TeamMember[];
    createdAt?: number;
  }[];
  currentWorkspace: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    ownerId?: string;
    members?: TeamMember[];
    createdAt?: number;
  };
  switchWorkspace: (workspaceId: string) => void;
  createTeamWorkspace: (name: string, icon?: string, description?: string) => Promise<string>;
  addTeamMemberDirectly: (teamId: string, name: string, email: string, role?: TeamRole) => Promise<void>;
  teamInvites: TeamInvite[];
  sendTeamInvite: (teamId: string, email: string, role?: TeamRole) => Promise<void>;
  respondToInvite: (inviteId: string, accept: boolean) => Promise<void>;
  cancelTeamInvite: (inviteId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberUserId: string, newRole: TeamRole) => Promise<void>;
  removeTeamMember: (teamId: string, memberUserId: string) => Promise<void>;
  deleteTeamWorkspace: (teamId: string) => Promise<void>;
  updateTeamSettings: (
    teamId: string,
    updates: { name?: string; icon?: string; description?: string }
  ) => Promise<void>;
  createFolder: (name: string, parentId?: string, icon?: string) => Promise<string>;
  deleteFolder: (folderId: string) => Promise<void>;
  movePageToFolder: (pageId: string, folderId?: string) => Promise<void>;
  autoOrganizePagesIntoThematicFolders: () => Promise<{ createdFoldersCount: number; organizedPagesCount: number }>;

  // Trash actions
  restorePage: (pageId: string) => Promise<void>;
  permanentlyDeletePage: (pageId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Navigation & UI
  setActivePageId: (id: string) => void;
  setActivePublicPageId: (id: string | null) => void;
  setActiveView: (view: WorkspaceView) => void;
  setSearchQuery: (q: string) => void;
  setIsSearchOpen: (open: boolean) => void;
  setIsZenMode: (zen: boolean) => void;
  setIsAiFullscreen: (fullscreen: boolean) => void;
  isAiSidePanelOpen: boolean;
  setIsAiSidePanelOpen: (open: boolean) => void;
  toggleAiSidePanel: () => void;
  setSelectedTag: (tag: string | null) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Real-time Lists & Smart Queries
  recentlyViewedPages: WorkspacePage[];
  favoritePages: WorkspacePage[];
  userSearches: UserSearchRecord[];
  recordSearch: (
    query: string,
    summary?: string,
    sources?: { title: string; url: string; snippet?: string }[],
    pageId?: string
  ) => void;
  removeUserSearch: (id: string) => void;
  clearUserSearches: () => void;
  reorderPages: (activeId: string, overId: string) => Promise<void>;

  // Pages CRUD
  createPage: (
    folderId?: string,
    title?: string,
    initialBlocks?: DocBlock[],
    pageType?: PageType,
    icon?: string
  ) => Promise<string>;
  updatePageTitle: (pageId: string, title: string) => Promise<void>;
  updatePageIcon: (pageId: string, icon: string) => Promise<void>;
  updatePageCover: (pageId: string, coverGradient?: string) => Promise<void>;
  updatePageType: (pageId: string, pageType: PageType) => Promise<void>;
  updatePageMetadata: (pageId: string, metadataPatch: Record<string, any>) => Promise<void>;
  updatePagePermissions: (pageId: string, permissions: Partial<PagePermissions>) => Promise<void>;
  seedProfileTemplates: (profileType: UserProfileType) => Promise<void>;
  toggleFavorite: (pageId: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  togglePagePublic: (pageId: string) => Promise<void>;
  publishPageToPublic: (pageId: string) => Promise<void>;
  unpublishPageFromPublic: (pageId: string) => Promise<void>;
  addPageTag: (pageId: string, tag: string) => Promise<void>;
  removePageTag: (pageId: string, tag: string) => Promise<void>;

  // Blocks
  updateBlock: (pageId: string, blockId: string, updates: Partial<DocBlock>) => Promise<void>;
  addBlock: (pageId: string, afterBlockId?: string, type?: DocBlock['type']) => Promise<void>;
  insertBlocks: (pageId: string, blocksToInsert: Partial<DocBlock>[], afterBlockId?: string) => Promise<void>;
  replaceAllBlocks: (pageId: string, blocksToSet: DocBlock[]) => Promise<void>;
  deleteBlock: (pageId: string, blockId: string) => Promise<void>;
  moveBlock: (pageId: string, blockId: string, direction: 'up' | 'down') => Promise<void>;
  reorderBlocks: (pageId: string, startIndex: number, endIndex: number) => Promise<void>;
  duplicateBlock: (pageId: string, blockId: string) => Promise<void>;

  // Versions, Backlinks & Resources
  createVersionSnapshot: (pageId: string, label: string) => Promise<void>;
  restoreVersionSnapshot: (pageId: string, versionId: string) => Promise<void>;
  getBacklinks: (pageTitle: string) => { id: string; title: string; icon: string }[];
  resources: WorkspaceResource[];

  // Unified Tasks & Native Task Pages
  openTaskAsPage: (taskId: string) => Promise<string | undefined>;
  addTask: (task: Omit<TaskItem, 'id'>) => Promise<string>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Comments
  addComment: (pageId: string, text: string, blockId?: string) => Promise<void>;
  resolveComment: (pageId: string, commentId: string) => Promise<void>;
  replyToComment: (pageId: string, commentId: string, text: string) => Promise<void>;

  // Public interaction
  likePublicPage: (publicPageId: string) => Promise<void>;
  incrementPublicPageView: (publicPageId: string) => Promise<void>;

  // Notifications & Live Toasts
  notifications: WorkspaceNotification[];
  activeToasts: WorkspaceNotification[];
  unreadNotificationsCount: number;
  isQuietMode: boolean;
  toggleQuietMode: () => void;
  addNotification: (
    title: string,
    message: string,
    type?: NotificationType,
    pageIdOrOptions?: string | { pageId?: string; teamId?: string; taskId?: string; category?: NotificationCategory; actionLabel?: string; silentToast?: boolean },
    teamId?: string,
    taskId?: string,
    actionLabel?: string,
    category?: NotificationCategory
  ) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  removeNotification: (id: string) => void;
  dismissToast: (id: string) => void;
  clearNotifications: () => void;
  exportSqlDump: () => void;
}

/**
 * Recursively removes all `undefined` values from an object or array.
 * Firestore strictly forbids `undefined` in documents and queries.
 */
export function cleanFirestoreData<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => cleanFirestoreData(item)) as any;
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object') {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setIsAuthModalOpen } = useAuth();

  const [pages, setPages] = useState<WorkspacePage[]>(() => {
    return sqliteDb.getAllPages();
  });
  const [folders, setFolders] = useState<WorkspaceFolder[]>(() => {
    return sqliteDb.getAllFolders();
  });
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return sqliteDb.getAllTasks();
  });
  const [publicPages, setPublicPages] = useState<PublicPage[]>([]);

  const [activePageId, setActivePageIdState] = useState<string>(() => {
    const local = sqliteDb.getAllPages();
    return local.length > 0 ? local[0].id : '';
  });
  const setActivePageId = (id: string) => {
    setActivePageIdState(id);
    if (!id) return;
    const now = Date.now();
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, lastViewedAt: now } : p));
      const target = updated.find((p) => p.id === id);
      if (target) sqliteDb.savePage(target);
      return updated;
    });
    if (user) {
      updateDoc(doc(db, 'pages', id), { lastViewedAt: now }).catch(() => {});
    }
  };

  // Re-indeksacja w czasie rzeczywistym dla wyszukiwarki i asystenta AI
  useEffect(() => {
    if (pages && pages.length > 0) {
      knowledgeIndex.reindexAll(pages);
      if (!activePageId) {
        const firstActive = pages.find((p) => !p.isDeleted);
        if (firstActive) {
          setActivePageIdState(firstActive.id);
        }
      }
    }
  }, [pages, activePageId]);

  const [activePublicPageId, setActivePublicPageId] = useState<string | null>(null);
  const [activeView, setActiveViewState] = useState<WorkspaceView>(() => {
    try {
      const saved = localStorage.getItem('nowoczesne_active_view');
      return (saved as WorkspaceView) || 'doc';
    } catch {
      return 'doc';
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isAiSidePanelOpen, setIsAiSidePanelOpen] = useState(false);
  const toggleAiSidePanel = () => setIsAiSidePanelOpen((prev) => !prev);

  // Searches History Store
  const [userSearches, setUserSearches] = useState<UserSearchRecord[]>(() => {
    try {
      const saved = localStorage.getItem('searchpoint_user_searches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 's-1',
        query: 'Podsumowanie metod uczenia maszynowego',
        summary: 'Kluczowe architektury transformerów i optymalizacja parametrów',
        sourcesCount: 4,
        timestamp: Date.now() - 3600000,
        topic: 'AI / Machine Learning',
      },
      {
        id: 's-2',
        query: 'Architektura systemów wieloagentowych',
        summary: 'Protokoły komunikacji agentów, narzędzia i pamieć kontekstowa',
        sourcesCount: 5,
        timestamp: Date.now() - 7200000,
        topic: 'Engineering',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('searchpoint_user_searches', JSON.stringify(userSearches.slice(0, 30)));
    } catch {}
  }, [userSearches]);

  const recordSearch = (
    query: string,
    summary?: string,
    sources?: { title: string; url: string; snippet?: string }[],
    pageId?: string
  ) => {
    const newRecord: UserSearchRecord = {
      id: `srch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      query,
      summary,
      sourcesCount: sources?.length || 0,
      sources,
      timestamp: Date.now(),
      pageId,
    };
    setUserSearches((prev) => [
      newRecord,
      ...prev.filter((s) => s.query.toLowerCase() !== query.toLowerCase()).slice(0, 29),
    ]);
  };

  const removeUserSearch = (id: string) => {
    setUserSearches((prev) => prev.filter((s) => s.id !== id));
  };

  const clearUserSearches = () => {
    setUserSearches([]);
    try {
      localStorage.removeItem('searchpoint_user_searches');
    } catch {}
  };

  const reorderPages = async (activeId: string, overId: string) => {
    if (activeId === overId) return;
    setPages((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeId);
      const newIndex = prev.findIndex((p) => p.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(oldIndex, 1);
      copy.splice(newIndex, 0, moved);
      return copy;
    });
  };
  const [isAiFullscreen, setIsAiFullscreenState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nowoczesne_ai_fullscreen');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const setActiveView = (view: WorkspaceView) => {
    setActiveViewState(view);
    const isAi = view === 'ai';
    setIsAiFullscreenState(isAi);
    try {
      localStorage.setItem('nowoczesne_active_view', view);
      localStorage.setItem('nowoczesne_ai_fullscreen', String(isAi));
    } catch {}
  };

  const setIsAiFullscreen = (fullscreen: boolean) => {
    setIsAiFullscreenState(fullscreen);
    if (fullscreen) {
      setActiveViewState('ai');
    } else if (activeView === 'ai') {
      setActiveViewState('home');
    }
    try {
      localStorage.setItem('nowoczesne_ai_fullscreen', String(fullscreen));
    } catch {}
  };
  const [syncStatus, setSyncStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nowoczesne_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });
  const [activeToasts, setActiveToasts] = useState<WorkspaceNotification[]>([]);
  const [isQuietMode, setIsQuietMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('searchpoint_quiet_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleQuietMode = () => {
    setIsQuietMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('searchpoint_quiet_mode', String(next));
      } catch {}
      if (next) {
        setActiveToasts([]);
      }
      return next;
    });
  };

  const lastToastedMapRef = useRef<Map<string, number>>(new Map());

  const [workspaceName, setWorkspaceName] = useState<string>('My Workspace');
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nowoczesne_current_workspace_id');
      if (saved) return saved;
    } catch {
      // fallback
    }
    return 'ws-personal';
  });

  const [teamWorkspaces, setTeamWorkspaces] = useState<TeamWorkspace[]>(() => {
    try {
      const dbTeams = sqliteDb.getAllTeams();
      if (dbTeams && dbTeams.length > 0) return dbTeams;
      const saved = localStorage.getItem('nowoczesne_team_workspaces');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return sqliteDb.getAllTeams();
  });

  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>(() => {
    try {
      const dbInvites = sqliteDb.getAllInvites();
      if (dbInvites && dbInvites.length > 0) return dbInvites;
      const saved = localStorage.getItem('nowoczesne_team_invites');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  // Sync workspaces, invites, and current workspace to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nowoczesne_current_workspace_id', currentWorkspaceId);
    } catch {
      // ignore
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    try {
      localStorage.setItem('nowoczesne_team_workspaces', JSON.stringify(teamWorkspaces));
    } catch {
      // ignore
    }
  }, [teamWorkspaces]);

  useEffect(() => {
    try {
      localStorage.setItem('nowoczesne_team_invites', JSON.stringify(teamInvites));
    } catch {
      // ignore
    }
  }, [teamInvites]);

  useEffect(() => {
    try {
      localStorage.setItem('nowoczesne_notifications', JSON.stringify(notifications.slice(0, 50)));
    } catch {
      // ignore
    }
  }, [notifications]);

  // List of workspaces (personal + user's teams)
  const workspaces = [
    {
      id: 'ws-personal',
      name: user?.displayName ? `Workspace (${user.displayName})` : 'Osobisty workspace',
      icon: '👤',
      description: 'Twoja prywatna przestrzeń robocza',
      ownerId: user?.uid || 'local',
      members: [
        {
          userId: user?.uid || 'local',
          email: user?.email || 'me@local',
          name: user?.displayName || user?.email?.split('@')[0] || 'Właściciel',
          role: 'Owner' as TeamRole,
          joinedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
    },
    ...teamWorkspaces.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon || '🏢',
      description: t.description || 'Przestrzeń współdzielona zespołu',
      ownerId: t.ownerId,
      members: t.members,
      createdAt: t.createdAt,
    })),
  ];

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];

  const switchWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    addNotification('Przełączono przestrzeń', `Aktualna przestrzeń: ${workspaces.find(w => w.id === workspaceId)?.name || workspaceId}`, 'info');
  };

  // Check URL query parameters for public links or team invites on load (works 100% offline & across sessions)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const publicId = urlParams.get('public');
      const teamInviteId = urlParams.get('team_invite') || urlParams.get('join_team');
      const inviteId = urlParams.get('invite');
      const paramTeamId = urlParams.get('team') || teamInviteId;
      const paramTeamName = urlParams.get('team_name') || urlParams.get('name');
      const paramRole = (urlParams.get('role') as TeamRole) || 'Editor';

      if (publicId) {
        setActivePublicPageId(publicId);
        setActiveView('public');
      } else if (paramTeamId || inviteId) {
        const targetTeamId = paramTeamId || (inviteId ? inviteId.replace('inv-', 'team-') : 'team-searchpoint-core');
        const teamName = paramTeamName ? decodeURIComponent(paramTeamName) : 'SearchPoint Core Team';

        // Auto-join this team in SQLite and React State!
        const existingTeams = sqliteDb.getAllTeams();
        let team = existingTeams.find((t) => t.id === targetTeamId);

        const currentMemberUid = user?.uid || `usr-${Date.now()}`;
        const currentMemberEmail = user?.email || (user?.displayName ? `${user.displayName.toLowerCase().replace(/\s+/g, '.')}@searchpoint.pl` : 'czlonek@searchpoint.pl');
        const currentMemberName = user?.displayName || user?.email?.split('@')[0] || 'Nowy Członek Zespołu';

        const newMember: TeamMember = {
          userId: currentMemberUid,
          email: currentMemberEmail,
          name: currentMemberName,
          role: paramRole,
          joinedAt: Date.now(),
        };

        if (team) {
          const alreadyMember = (team.members || []).some(
            (m) => m.userId === currentMemberUid || (user?.email && m.email === user.email)
          );
          if (!alreadyMember) {
            const updatedMembers = [...(team.members || []), newMember];
            const updatedMemberUids = Array.from(new Set([...(team.memberUids || []), currentMemberUid]));
            const updatedTeam: TeamWorkspace = {
              ...team,
              members: updatedMembers,
              memberUids: updatedMemberUids,
            };
            sqliteDb.saveTeam(updatedTeam);
            setTeamWorkspaces((prev) =>
              prev.map((t) => (t.id === targetTeamId ? updatedTeam : t))
            );
          }
        } else {
          // Create new team workspace locally so the link works for ANY recipient!
          const createdTeam: TeamWorkspace = {
            id: targetTeamId,
            name: teamName,
            icon: '🏢',
            description: 'Współdzielony pokój pracy zespołu',
            ownerId: 'usr-local-owner',
            members: [newMember],
            memberUids: [currentMemberUid],
            createdAt: Date.now(),
          };
          sqliteDb.saveTeam(createdTeam);
          setTeamWorkspaces((prev) => [...prev, createdTeam]);
        }

        // Clean the invite if it was in invites
        if (inviteId) {
          sqliteDb.deleteInvite(inviteId);
          setTeamInvites((prev) => prev.filter((i) => i.id !== inviteId));
        }

        setCurrentWorkspaceId(targetTeamId);
        setActiveView('teams');
        addNotification(
          'Dołączono do zespołu!',
          `Pomyślnie dołączono do zespołu "${teamName}" z rolą: ${paramRole}!`,
          'success'
        );

        // Clean URL to prevent re-join on reload
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {}
      }
    } catch (e) {
      console.warn('URL parsing error:', e);
    }
  }, [user]);

  // 1. Subscribe to Public Pages in Firestore (worldwide real-time public feed)
  useEffect(() => {
    const q = query(collection(db, 'public_pages'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const livePublicPages: PublicPage[] = [];
        snapshot.forEach((docSnap) => {
          livePublicPages.push({ id: docSnap.id, ...docSnap.data() } as PublicPage);
        });
        livePublicPages.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setPublicPages(livePublicPages);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'public_pages');
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Authenticated User's Real Firestore Data
  useEffect(() => {
    if (!user) {
      // Tryb lokalny SQLite: wczytaj lokalne dane
      const localPages = sqliteDb.getAllPages();
      const localTasks = sqliteDb.getAllTasks();
      const localFolders = sqliteDb.getAllFolders();
      setPages(localPages);
      setTasks(localTasks);
      setFolders(localFolders);
      if (localPages.length > 0 && !activePageId) {
        setActivePageId(localPages[0].id);
      }
      return;
    }

    // A. Real Pages (migrated and normalized with unified DocBlock model)
    const pagesQuery = query(collection(db, 'pages'), where('ownerId', '==', user.uid));
    const unsubPages = onSnapshot(
      pagesQuery,
      (snapshot) => {
        const livePages: WorkspacePage[] = [];
        snapshot.forEach((docSnap) => {
          const raw = { id: docSnap.id, ...docSnap.data() };
          livePages.push(validateAndMigratePage(raw));
        });
        livePages.sort((a, b) => b.updatedAt - a.updatedAt);
        setPages(livePages);

        if (livePages.length > 0 && !activePageId) {
          setActivePageId(livePages[0].id);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'pages');
      }
    );

    // B. Real Tasks
    const tasksQuery = query(collection(db, 'tasks'), where('ownerId', '==', user.uid));
    const unsubTasks = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const liveTasks: TaskItem[] = [];
        snapshot.forEach((docSnap) => {
          liveTasks.push({ id: docSnap.id, ...docSnap.data() } as TaskItem);
        });
        setTasks(liveTasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
      }
    );

    // C. Real Folders
    const foldersQuery = query(collection(db, 'folders'), where('ownerId', '==', user.uid));
    const unsubFolders = onSnapshot(
      foldersQuery,
      (snapshot) => {
        const liveFolders: WorkspaceFolder[] = [];
        snapshot.forEach((docSnap) => {
          liveFolders.push({ id: docSnap.id, ...docSnap.data() } as WorkspaceFolder);
        });
        setFolders(liveFolders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'folders');
      }
    );

    // D. Real Team Workspaces
    const teamsQuery = query(collection(db, 'team_workspaces'));
    const unsubTeams = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const liveTeams: TeamWorkspace[] = [];
        snapshot.forEach((docSnap) => {
          const t = { id: docSnap.id, ...docSnap.data() } as TeamWorkspace;
          const isMember =
            t.ownerId === user.uid ||
            (t.memberUids && t.memberUids.includes(user.uid)) ||
            (t.members && t.members.some((m) => m.userId === user.uid || (user.email && m.email?.toLowerCase() === user.email.toLowerCase())));
          if (isMember) {
            liveTeams.push(t);
          }
        });
        if (liveTeams.length > 0) {
          setTeamWorkspaces(liveTeams);
        }
      },
      (error) => {
        console.warn('team_workspaces listener notice (using local cache):', error);
      }
    );

    // E. Real Team Invites
    const invitesQuery = query(collection(db, 'team_invites'));
    const unsubInvites = onSnapshot(
      invitesQuery,
      (snapshot) => {
        const liveInvites: TeamInvite[] = [];
        snapshot.forEach((docSnap) => {
          const inv = { id: docSnap.id, ...docSnap.data() } as TeamInvite;
          const userEmail = user.email?.toLowerCase();
          const isRelevant =
            (userEmail && inv.inviteeEmail?.toLowerCase() === userEmail) ||
            (userEmail && inv.inviterEmail?.toLowerCase() === userEmail) ||
            inv.inviterId === user.uid;
          if (isRelevant) {
            liveInvites.push(inv);
          }
        });
        setTeamInvites(liveInvites);
      },
      (error) => {
        console.warn('team_invites listener notice (using local cache):', error);
      }
    );

    return () => {
      unsubPages();
      unsubTasks();
      unsubFolders();
      unsubTeams();
      unsubInvites();
    };
  }, [user]);

  // Active documents & real-time derived lists
  const activeDoc = pages.find((p) => p.id === activePageId);
  const recentlyViewedPages = [...pages]
    .filter((p) => !p.isDeleted)
    .sort((a, b) => (b.lastViewedAt || b.updatedAt || 0) - (a.lastViewedAt || a.updatedAt || 0))
    .slice(0, 8);

  const favoritePages = pages.filter((p) => p.isFavorite && !p.isDeleted);

  // Wspólne notatki (Współdzielone przez @email, np. @kamill@eskp.pl)
  const sharedPages = useMemo(() => {
    const userEmail = (user?.email || '').toLowerCase().trim();
    return pages.filter((p) => {
      if (p.isDeleted) return false;
      // 1. Zalogowany użytkownik jest na liście sharedWith
      if (userEmail && p.sharedWith?.some((em) => em.toLowerCase() === userEmail)) {
        return true;
      }
      // 2. Zalogowany użytkownik jest na liście sharedCollaborators
      if (userEmail && p.sharedCollaborators?.some((c) => c.email.toLowerCase() === userEmail)) {
        return true;
      }
      // 3. Notatka zawiera wzmiankę @email zalogowanego użytkownika
      if (userEmail && p.blocks?.some((b) => b.content.toLowerCase().includes(`@${userEmail}`))) {
        return true;
      }
      // 4. Notatka ma przypisanych współpracowników przez właściciela
      if ((p.sharedWith && p.sharedWith.length > 0) || (p.sharedCollaborators && p.sharedCollaborators.length > 0)) {
        return true;
      }
      // 5. Dowolny blok w notatce zawiera wzmiankę @email (np. @kamill@eskp.pl)
      if (p.blocks?.some((b) => /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.test(b.content))) {
        return true;
      }
      return false;
    });
  }, [pages, user]);
  const activePublicPage =
    publicPages.find((p) => p.id === activePublicPageId) ||
    (activeDoc?.isPublic
      ? {
          id: activeDoc.id,
          ownerId: activeDoc.ownerId || '',
          authorName: activeDoc.authorName || user?.displayName || 'Autor',
          authorPhoto: user?.photoURL || '',
          title: activeDoc.title,
          icon: activeDoc.icon,
          coverGradient: activeDoc.coverGradient,
          blocks: activeDoc.blocks,
          publicSlug: activeDoc.publicSlug,
          tags: activeDoc.tags,
          viewsCount: 0,
          likesCount: 0,
          updatedAt: activeDoc.updatedAt,
        }
      : undefined);

  // Helper check for Auth
  const ensureAuth = (): boolean => {
    return true; // Tryb lokalny SQLite działa bez wymogu logowania do chmury
  };

  // =========================================================================
  // RELACYJNY MAGAZYN DANYCH SQLITE + SYNCHRONIZACJA
  // =========================================================================

  const createPage = async (
    folderId?: string,
    title = 'Bez tytułu',
    initialBlocks?: DocBlock[],
    pageType: PageType = 'Document',
    icon?: string
  ): Promise<string> => {
    setSyncStatus('saving');
    const newId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const blocksToUse: DocBlock[] =
      initialBlocks && initialBlocks.length > 0
        ? initialBlocks.map((b, idx) => ({
            ...b,
            id: b.id || `b-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            order: b.order !== undefined ? b.order : idx,
          }))
        : [
            {
              id: `block-${Date.now()}`,
              type: 'p',
              content: 'Zacznij pisać treść...',
              order: 0,
            },
          ];

    const defaultIcon =
      icon ||
      (pageType === 'Database'
        ? '🗄️'
        : pageType === 'TaskList'
        ? '☑️'
        : pageType === 'Project'
        ? '🚀'
        : pageType === 'Research'
        ? '🔬'
        : pageType === 'Meeting'
        ? '🤝'
        : pageType === 'Collection'
        ? '📚'
        : pageType === 'Note'
        ? '📝'
        : '📄');

    const newPage = validateAndMigratePage({
      id: newId,
      ownerId: user?.uid || 'local-user',
      workspaceId: currentWorkspaceId,
      teamId: currentWorkspaceId !== 'ws-personal' ? currentWorkspaceId : undefined,
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Użytkownik',
      title,
      icon: defaultIcon,
      pageType,
      folderId: folderId || undefined,
      blocks: blocksToUse,
      isFavorite: false,
      isDeleted: false,
      isPublic: false,
      publicSlug: title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      tags: [],
      comments: [],
      versions: [],
      permissions: {
        accessLevel: 'workspace',
        role: 'Owner',
      },
      metadata: {
        pageType,
        createdVia: 'workspace',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    sqliteDb.savePage(newPage);
    setPages((prev) => [newPage, ...prev.filter((p) => p.id !== newId)]);
    setActivePageId(newId);
    setActiveView('doc');
    setSyncStatus('saved');
    addNotification('Utworzono stronę', `${pageType}: „${title}” został utworzony.`);

    if (user) {
      setDoc(doc(db, 'pages', newId), cleanFirestoreData(newPage)).catch(() => {});
    }
    return newId;
  };

  const updatePageType = async (pageId: string, pageType: PageType) => {
    setPages((prev) => {
      const updated = prev.map((p) =>
        p.id === pageId
          ? { ...p, pageType, metadata: { ...(p.metadata || {}), pageType }, updatedAt: Date.now() }
          : p
      );
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });
    addNotification('Zaktualizowano typ strony', `Typ zmieniony na: ${pageType}`);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        pageType,
        'metadata.pageType': pageType,
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const updatePageMetadata = async (pageId: string, metadataPatch: Record<string, any>) => {
    setPages((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== pageId) return p;
        const nextMeta = { ...(p.metadata || {}), ...metadataPatch };
        return { ...p, metadata: nextMeta, updatedAt: Date.now() };
      });
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });

    if (user) {
      const target = pages.find((p) => p.id === pageId);
      const nextMeta = { ...(target?.metadata || {}), ...metadataPatch };
      updateDoc(doc(db, 'pages', pageId), {
        metadata: cleanFirestoreData(nextMeta),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const updatePagePermissions = async (
    pageId: string,
    permissions: Partial<PagePermissions>
  ) => {
    setPages((prev) => {
      const page = prev.find((p) => p.id === pageId);
      const updatedPerms: PagePermissions = {
        ...(page?.permissions || { accessLevel: 'workspace', role: 'Owner' }),
        ...permissions,
      };
      const updated = prev.map((p) =>
        p.id === pageId ? { ...p, permissions: updatedPerms, updatedAt: Date.now() } : p
      );
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });

    if (user) {
      const page = pages.find((p) => p.id === pageId);
      const updated: PagePermissions = {
        ...(page?.permissions || { accessLevel: 'workspace', role: 'Owner' }),
        ...permissions,
      };
      updateDoc(doc(db, 'pages', pageId), {
        permissions: cleanFirestoreData(updated),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const seedProfileTemplates = async (profileType: UserProfileType) => {
    const config = USER_PROFILES[profileType];
    if (!config || !config.starterPageTemplates) return;

    let firstCreatedId = '';
    for (const template of config.starterPageTemplates) {
      const id = await createPage(
        undefined,
        template.title,
        template.blocks,
        template.pageType,
        template.icon
      );
      if (!firstCreatedId) firstCreatedId = id;
    }

    if (firstCreatedId) {
      setActivePageId(firstCreatedId);
      setActiveView('doc');
      addNotification(
        'Załadowano szablony profilu',
        `Przestrzeń została skonfigurowana dla profilu: ${config.title}.`,
        'success'
      );
    }
  };

  const updatePageTitle = async (pageId: string, title: string) => {
    setSyncStatus('saving');
    const detectedEmails = extractEmailsFromContent(title);

    setPages((prev) => {
      const updated = prev.map((p) => {
        if (p.id !== pageId) return p;
        let sharedWith = p.sharedWith || [];
        let sharedCollaborators = p.sharedCollaborators || [];
        let hasNewShare = false;

        if (detectedEmails.length > 0) {
          const existing = new Set(sharedWith.map((e) => e.toLowerCase()));
          const brandNew = detectedEmails.filter((e) => !existing.has(e));
          if (brandNew.length > 0) {
            hasNewShare = true;
            sharedWith = Array.from(new Set([...sharedWith, ...brandNew]));
            const newCollabs: SharedCollaborator[] = brandNew.map((em) => ({
              email: em,
              name: em.split('@')[0],
              role: 'admin',
              addedAt: Date.now(),
            }));
            sharedCollaborators = [...sharedCollaborators, ...newCollabs];
            for (const em of brandNew) {
              addNotification(
                '👥 Współdzielona notatka',
                `Użytkownik ${em} otrzymał pełny dostęp administratora do notatki "${title}"!`,
                'success',
                pageId
              );
            }
          }
        }

        return {
          ...p,
          title,
          sharedWith,
          sharedCollaborators,
          permissions: (hasNewShare ? { accessLevel: 'workspace', role: 'Admin' } : p.permissions) as PagePermissions,
          updatedAt: Date.now(),
        };
      });

      const target = updated.find((p) => p.id === pageId);
      if (target) {
        sqliteDb.savePage(target);
        if (target.pageType === 'Task' && target.metadata?.taskId) {
          const linkedTaskId = String(target.metadata.taskId);
          setTasks((prevTasks) => {
            const nextTasks = prevTasks.map((t) =>
              t.id === linkedTaskId ? { ...t, title, updatedAt: Date.now() } : t
            );
            const tObj = nextTasks.find((t) => t.id === linkedTaskId);
            if (tObj) sqliteDb.saveTask(tObj);
            return nextTasks;
          });
          if (user) {
            updateDoc(doc(db, 'tasks', linkedTaskId), { title, updatedAt: Date.now() }).catch(() => {});
          }
        }
      }
      return updated;
    });
    setSyncStatus('saved');

    if (user) {
      updateDoc(doc(db, 'pages', pageId), { title, updatedAt: Date.now() }).catch(() => {});
      const publicDocRef = doc(db, 'public_pages', pageId);
      getDoc(publicDocRef).then((publicSnap) => {
        if (publicSnap.exists()) {
          updateDoc(publicDocRef, { title, updatedAt: Date.now() }).catch(() => {});
        }
      }).catch(() => {});
    }
  };

  const updatePageIcon = async (pageId: string, icon: string) => {
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, icon, updatedAt: Date.now() } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });

    if (user) {
      updateDoc(doc(db, 'pages', pageId), { icon, updatedAt: Date.now() }).catch(() => {});
    }
  };

  const updatePageCover = async (pageId: string, coverGradient?: string) => {
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, coverGradient, updatedAt: Date.now() } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });

    if (user) {
      updateDoc(doc(db, 'pages', pageId), { coverGradient: coverGradient || null, updatedAt: Date.now() }).catch(() => {});
    }
  };

  const toggleFavorite = async (pageId: string) => {
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, isFavorite: !p.isFavorite } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });

    if (user) {
      const target = pages.find((p) => p.id === pageId);
      if (target) {
        updateDoc(doc(db, 'pages', pageId), { isFavorite: !target.isFavorite }).catch(() => {});
      }
    }
  };

  // Soft delete (moves to trash)
  const deletePage = async (pageId: string) => {
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, isDeleted: true, updatedAt: Date.now() } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });
    addNotification('Przeniesiono do kosza', 'Dokument znajduje się teraz w koszu.');
    if (activePageId === pageId) {
      const remaining = pages.filter((p) => p.id !== pageId && !p.isDeleted);
      setActivePageId(remaining[0]?.id || '');
    }

    if (user) {
      updateDoc(doc(db, 'pages', pageId), { isDeleted: true, updatedAt: Date.now() }).catch(() => {});
      deleteDoc(doc(db, 'public_pages', pageId)).catch(() => {});
    }
  };

  // Restore from trash
  const restorePage = async (pageId: string) => {
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, isDeleted: false, updatedAt: Date.now() } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });
    addNotification('Przywrócono dokument', 'Dokument został przywrócony z kosza.', 'success');

    if (user) {
      updateDoc(doc(db, 'pages', pageId), { isDeleted: false, updatedAt: Date.now() }).catch(() => {});
    }
  };

  // Permanently delete page
  const permanentlyDeletePage = async (pageId: string) => {
    sqliteDb.deletePage(pageId);
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    addNotification('Trwale usunięto', 'Dokument został bezpowrotnie usunięty.');

    if (user) {
      deleteDoc(doc(db, 'pages', pageId)).catch(() => {});
      deleteDoc(doc(db, 'public_pages', pageId)).catch(() => {});
    }
  };

  // Empty whole trash
  const emptyTrash = async () => {
    const deleted = pages.filter((p) => p.isDeleted);
    for (const p of deleted) {
      await permanentlyDeletePage(p.id);
    }
    addNotification('Opróżniono kosz', 'Wszystkie pliki w koszu zostały usunięte.');
  };

  // Team Workspaces and Invites (100% Local-First SQLite & Instant Sync)
  const createTeamWorkspace = async (
    name: string,
    icon: string = '🏢',
    description: string = 'Współdzielony pokój pracy zespołu'
  ): Promise<string> => {
    const teamId = `team-${Date.now()}`;
    const ownerUid = user?.uid || 'usr-local-owner';
    const ownerEmail = user?.email || 'kacper@searchpoint.pl';
    const ownerName = user?.displayName || user?.email?.split('@')[0] || 'Właściciel Zespołu';
    const newTeam: TeamWorkspace = {
      id: teamId,
      name: name.trim(),
      icon,
      description: description.trim(),
      ownerId: ownerUid,
      members: [
        {
          userId: ownerUid,
          email: ownerEmail,
          name: ownerName,
          role: 'Owner',
          joinedAt: Date.now(),
        },
      ],
      memberUids: [ownerUid],
      createdAt: Date.now(),
    };

    sqliteDb.saveTeam(newTeam);
    setTeamWorkspaces((prev) => [...prev.filter((t) => t.id !== teamId), newTeam]);
    setCurrentWorkspaceId(teamId);
    addNotification('Utworzono zespół', `Przestrzeń zespołu „${name}” jest gotowa do współpracy!`, 'success');
    return teamId;
  };

  const addTeamMemberDirectly = async (
    teamId: string,
    name: string,
    email: string,
    role: TeamRole = 'Editor'
  ) => {
    let targetTeamId = teamId;
    let team = teamWorkspaces.find((t) => t.id === targetTeamId) || sqliteDb.getAllTeams().find((t) => t.id === targetTeamId);
    if (!team || targetTeamId === 'ws-personal') {
      if (teamWorkspaces.length > 0) {
        team = teamWorkspaces[0];
        targetTeamId = team.id;
      } else {
        targetTeamId = await createTeamWorkspace('SearchPoint Core Team', '🏢');
        team = sqliteDb.getAllTeams().find((t) => t.id === targetTeamId);
      }
    }
    if (!team) return;

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const newMemberUid = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newMember: TeamMember = {
      userId: newMemberUid,
      email: cleanEmail,
      name: cleanName,
      role,
      joinedAt: Date.now(),
    };

    const updatedMembers = [
      ...(team.members || []).filter((m) => m.email.toLowerCase() !== cleanEmail),
      newMember,
    ];
    const updatedMemberUids = Array.from(new Set([...(team.memberUids || []), newMemberUid]));

    const updatedTeam: TeamWorkspace = {
      ...team,
      members: updatedMembers,
      memberUids: updatedMemberUids,
    };

    sqliteDb.saveTeam(updatedTeam);
    setTeamWorkspaces((prev) =>
      prev.map((t) => (t.id === targetTeamId ? updatedTeam : t))
    );
    addNotification(
      'Dodano członka do zespołu',
      `Pomyślnie dodano ${cleanName} (${cleanEmail}) jako ${role}.`,
      'success'
    );
  };

  const sendTeamInvite = async (teamId: string, email: string, role: TeamRole = 'Editor') => {
    let targetTeamId = teamId;
    let team = teamWorkspaces.find((t) => t.id === targetTeamId) || sqliteDb.getAllTeams().find((t) => t.id === targetTeamId);

    // Auto-create or select team if current workspace is personal
    if (!team || targetTeamId === 'ws-personal') {
      if (teamWorkspaces.length > 0) {
        team = teamWorkspaces[0];
        targetTeamId = team.id;
        setCurrentWorkspaceId(targetTeamId);
      } else {
        const teamName = user?.displayName ? `Zespół (${user.displayName})` : 'SearchPoint Core Team';
        targetTeamId = await createTeamWorkspace(teamName, '🏢', 'Współdzielona przestrzeń współpracy');
        team = sqliteDb.getAllTeams().find((t) => t.id === targetTeamId);
      }
    }
    if (!team) return;

    const cleanEmail = email.toLowerCase().trim();
    const inviteId = `inv-${Date.now()}`;
    const inviterUid = user?.uid || 'usr-local-owner';
    const inviterEmail = user?.email || 'admin@searchpoint.pl';
    const inviterName = user?.displayName || user?.email?.split('@')[0] || 'Koordynator Zespołu';

    const newInvite: TeamInvite = {
      id: inviteId,
      teamId: targetTeamId,
      teamName: team.name,
      inviterEmail,
      inviterId: inviterUid,
      inviteeEmail: cleanEmail,
      role,
      status: 'pending',
      createdAt: Date.now(),
    };

    sqliteDb.saveInvite(newInvite);
    setTeamInvites((prev) => [newInvite, ...prev.filter((i) => i.id !== inviteId)]);

    // Generujemy uniwersalny samowystarczalny link dołączenia
    const joinUrl = buildTeamInviteJoinUrl(inviteId, targetTeamId, team.name, role);
    try {
      await navigator.clipboard.writeText(joinUrl);
    } catch {}

    addNotification(
      'Zaproszenie utworzone!',
      `Unikalny link zaproszenia do zespołu "${team.name}" został skopiowany do schowka!`,
      'success'
    );

    // Opcjonalne wywołanie mailto (bezpieczne w try/catch)
    try {
      triggerSendInviteEmail({
        email: cleanEmail,
        teamName: team.name,
        inviterName,
        inviteId,
        teamId: targetTeamId,
        role,
      });
    } catch (e) {
      console.warn('triggerSendInviteEmail error:', e);
    }
  };

  const cancelTeamInvite = async (inviteId: string) => {
    sqliteDb.deleteInvite(inviteId);
    setTeamInvites((prev) => prev.filter((i) => i.id !== inviteId));
    addNotification('Anulowano zaproszenie', 'Zaproszenie zostało pomyślnie wycofane.', 'info');
  };

  const updateMemberRole = async (teamId: string, memberUserId: string, newRole: TeamRole) => {
    const teams = sqliteDb.getAllTeams();
    const team = teams.find((t) => t.id === teamId) || teamWorkspaces.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = (team.members || []).map((m) =>
      m.userId === memberUserId ? { ...m, role: newRole } : m
    );
    const updatedTeam: TeamWorkspace = {
      ...team,
      members: updatedMembers,
    };
    sqliteDb.saveTeam(updatedTeam);
    setTeamWorkspaces((prev) =>
      prev.map((t) => (t.id === teamId ? updatedTeam : t))
    );
    addNotification('Zaktualizowano uprawnienia', `Zmieniono rolę członka zespołu na ${newRole}.`, 'success');
  };

  const removeTeamMember = async (teamId: string, memberUserId: string) => {
    const teams = sqliteDb.getAllTeams();
    const team = teams.find((t) => t.id === teamId) || teamWorkspaces.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMembers = (team.members || []).filter((m) => m.userId !== memberUserId);
    const updatedTeam: TeamWorkspace = {
      ...team,
      members: updatedMembers,
    };
    sqliteDb.saveTeam(updatedTeam);
    setTeamWorkspaces((prev) =>
      prev.map((t) => (t.id === teamId ? updatedTeam : t))
    );
    if (memberUserId === user?.uid) {
      setCurrentWorkspaceId('ws-personal');
      addNotification('Opuszczono zespół', `Opuszczono przestrzeń ${team.name}.`, 'info');
    } else {
      addNotification('Usunięto członka', 'Członek został pomyślnie usunięty z zespołu.', 'info');
    }
  };

  const deleteTeamWorkspace = async (teamId: string) => {
    sqliteDb.deleteTeam(teamId);
    setTeamWorkspaces((prev) => prev.filter((t) => t.id !== teamId));
    if (currentWorkspaceId === teamId) {
      setCurrentWorkspaceId('ws-personal');
    }
    addNotification('Usunięto zespół', 'Przestrzeń zespołu została usunięta.', 'info');
  };

  const updateTeamSettings = async (
    teamId: string,
    updates: { name?: string; icon?: string; description?: string }
  ) => {
    const teams = sqliteDb.getAllTeams();
    const team = teams.find((t) => t.id === teamId) || teamWorkspaces.find((t) => t.id === teamId);
    if (!team) return;

    const updatedTeam: TeamWorkspace = {
      ...team,
      ...updates,
    };
    sqliteDb.saveTeam(updatedTeam);
    setTeamWorkspaces((prev) =>
      prev.map((t) => (t.id === teamId ? updatedTeam : t))
    );
    addNotification('Zapisano ustawienia zespołu', 'Dane pokoju pracy zostały pomyślnie zaktualizowane.', 'success');
  };

  const respondToInvite = async (inviteId: string, accept: boolean) => {
    const inv = teamInvites.find((i) => i.id === inviteId) || sqliteDb.getAllInvites().find((i) => i.id === inviteId);
    if (!inv) return;

    if (accept) {
      const teams = sqliteDb.getAllTeams();
      let team = teams.find((t) => t.id === inv.teamId);
      const memberUid = user?.uid || `usr-${Date.now()}`;
      const memberEmail = user?.email || inv.inviteeEmail;
      const memberName = user?.displayName || user?.email?.split('@')[0] || inv.inviteeEmail.split('@')[0];

      const newMember: TeamMember = {
        userId: memberUid,
        email: memberEmail,
        name: memberName,
        role: inv.role,
        joinedAt: Date.now(),
      };

      if (team) {
        const updatedMembers = [
          ...(team.members || []).filter((m) => m.userId !== memberUid && m.email !== memberEmail),
          newMember,
        ];
        const updatedMemberUids = Array.from(new Set([...(team.memberUids || []), memberUid]));
        const updatedTeam: TeamWorkspace = {
          ...team,
          members: updatedMembers,
          memberUids: updatedMemberUids,
        };
        sqliteDb.saveTeam(updatedTeam);
        setTeamWorkspaces((prev) =>
          prev.map((t) => (t.id === inv.teamId ? updatedTeam : t))
        );
      } else {
        const createdTeam: TeamWorkspace = {
          id: inv.teamId,
          name: inv.teamName,
          ownerId: inv.inviterId || 'owner',
          icon: '🏢',
          description: 'Współdzielony pokój pracy zespołu',
          members: [newMember],
          memberUids: [memberUid],
          createdAt: Date.now(),
        };
        sqliteDb.saveTeam(createdTeam);
        setTeamWorkspaces((prev) => [...prev, createdTeam]);
      }

      sqliteDb.deleteInvite(inviteId);
      setTeamInvites((prev) => prev.filter((i) => i.id !== inviteId));
      setCurrentWorkspaceId(inv.teamId);
      setActiveView('teams');
      addNotification('Dołączono do zespołu', `Pomyślnie dołączono do ${inv.teamName}!`, 'success');
    } else {
      sqliteDb.deleteInvite(inviteId);
      setTeamInvites((prev) => prev.filter((i) => i.id !== inviteId));
      addNotification('Odrzucono zaproszenie', `Odrzucono zaproszenie do ${inv.teamName}.`, 'info');
    }
  };

  // =========================================================================
  // WYSTAWIENIE NA PUBLIC (PUBLISH / UNPUBLISH TO WORLDWIDE READERS)
  // =========================================================================

  const publishPageToPublic = async (pageId: string) => {
    if (!ensureAuth()) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    setSyncStatus('saving');
    const publicData = cleanFirestoreData({
      id: page.id,
      ownerId: user!.uid,
      authorName: user!.displayName || user!.email?.split('@')[0] || 'Kacper',
      authorPhoto: user!.photoURL || '',
      title: page.title,
      icon: page.icon,
      coverGradient: page.coverGradient || null,
      blocks: page.blocks,
      publicSlug: page.publicSlug || page.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      tags: page.tags || [],
      viewsCount: 1,
      likesCount: 0,
      updatedAt: Date.now(),
    });

    try {
      // 1. Write to public_pages collection (readable by everyone)
      await setDoc(doc(db, 'public_pages', pageId), publicData);
      // 2. Mark page as public in user's collection
      await updateDoc(doc(db, 'pages', pageId), { isPublic: true, updatedAt: Date.now() });
      setSyncStatus('saved');
      addNotification('Opublikowano stronę', `Strona „${page.title}” jest teraz dostępna publicznie!`, 'success');
    } catch (err) {
      setSyncStatus('offline');
      handleFirestoreError(err, OperationType.WRITE, `public_pages/${pageId}`);
    }
  };

  const unpublishPageFromPublic = async (pageId: string) => {
    if (!ensureAuth()) return;
    try {
      await deleteDoc(doc(db, 'public_pages', pageId));
      await updateDoc(doc(db, 'pages', pageId), { isPublic: false, updatedAt: Date.now() });
      addNotification('Cofnięto publikację', 'Strona powróciła do statusu prywatnego.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `public_pages/${pageId}`);
    }
  };

  const togglePagePublic = async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    if (page.isPublic) {
      await unpublishPageFromPublic(pageId);
    } else {
      await publishPageToPublic(pageId);
    }
  };

  const addPageTag = async (pageId: string, tag: string) => {
    if (!ensureAuth()) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page || page.tags.includes(tag)) return;
    const newTags = [...page.tags, tag];
    try {
      await updateDoc(doc(db, 'pages', pageId), { tags: newTags });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${pageId}`);
    }
  };

  const removePageTag = async (pageId: string, tag: string) => {
    if (!ensureAuth()) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const newTags = page.tags.filter((t) => t !== tag);
    try {
      await updateDoc(doc(db, 'pages', pageId), { tags: newTags });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${pageId}`);
    }
  };

  // Helper do ekstrakcji adresów email ze składni @email (np. @kamill@eskp.pl lub @kamil@firma.pl)
  const extractEmailsFromContent = (text: string): string[] => {
    if (!text) return [];
    const matches = text.match(/@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.slice(1).toLowerCase().trim())));
  };

  // Udostępnianie notatki przez email współpracownika lub dyrektywę ALL_USER@GMAIAL.COM (Notion 1:1)
  const sharePageWithEmail = async (
    pageId: string,
    email: string,
    role: NotionAccessRole = 'can_edit'
  ) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const cleanEmail = email.toLowerCase().trim().replace(/^_+/, '');
    if (!isValidShareTarget(cleanEmail)) {
      throw new Error('Niepoprawny format adresu e-mail (RFC 5322) lub dyrektywy ALL_USER@GMAIAL.COM');
    }

    const shareRes = applyShareToWorkspacePages({
      pages,
      targetPageId: pageId,
      targetEmail: cleanEmail,
      role,
      actor: user || { uid: 'local-user', email: 'owner@searchpoint.pl' },
    });

    setPages(shareRes.updatedPages);
    for (const pid of shareRes.affectedPageIds) {
      const updated = shareRes.updatedPages.find((p) => p.id === pid);
      if (updated) {
        sqliteDb.savePage(updated);
        knowledgeIndex.indexPage(updated);
        if (user) {
          updateDoc(doc(db, 'pages', pid), {
            sharedWith: cleanFirestoreData(updated.sharedWith),
            sharedCollaborators: cleanFirestoreData(updated.sharedCollaborators),
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      }
    }

    addNotification(
      shareRes.isWorkspaceWide ? '🌐 Udostępniono cały Workspace' : '👥 Udostępniono stronę',
      shareRes.isWorkspaceWide
        ? `Dyrektywa ${cleanEmail.toUpperCase()} aktywna: nadano rolę "${shareRes.appliedRole}" do ${shareRes.affectedPageIds.length} stron w Workspace!`
        : `Użytkownik ${cleanEmail} otrzymał rolę ${shareRes.appliedRole} do strony "${page.title}"!`,
      'success',
      pageId
    );
  };

  const updateCollaboratorRole = async (
    pageId: string,
    email: string,
    role: NotionAccessRole
  ) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const cleanEmail = email.toLowerCase().trim().replace(/^_+/, '');

    const finalCollaborators = (page.sharedCollaborators || []).map((c) =>
      c.email.toLowerCase() === cleanEmail ? { ...c, role } : c
    );

    const updatedPage: WorkspacePage = {
      ...page,
      sharedCollaborators: finalCollaborators,
      updatedAt: Date.now(),
    };

    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);
    knowledgeIndex.indexPage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        sharedCollaborators: cleanFirestoreData(finalCollaborators),
        updatedAt: Date.now(),
      }).catch(() => {});
    }

    addNotification('Zmieniono rolę', `Zaktualizowano uprawnienia dla ${cleanEmail} na "${role}".`, 'info', pageId);
  };

  const removePageCollaborator = async (pageId: string, email: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const cleanEmail = email.toLowerCase().trim().replace(/^_+/, '');

    const revokeRes = revokeShareFromWorkspacePages({
      pages,
      targetPageId: pageId,
      targetEmail: cleanEmail,
      actor: user || { uid: 'local-user', email: 'owner@searchpoint.pl' },
    });

    setPages(revokeRes.updatedPages);
    for (const pid of revokeRes.affectedPageIds) {
      const updated = revokeRes.updatedPages.find((p) => p.id === pid);
      if (updated) {
        sqliteDb.savePage(updated);
        knowledgeIndex.indexPage(updated);
        if (user) {
          updateDoc(doc(db, 'pages', pid), {
            sharedWith: cleanFirestoreData(updated.sharedWith),
            sharedCollaborators: cleanFirestoreData(updated.sharedCollaborators),
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      }
    }

    addNotification('Cofnięto dostęp', `Usunięto współpracownika ${cleanEmail}.`, 'info', pageId);
  };

  // Tworzenie zagnieżdżonej podstrony (Notion Subpage)
  const createSubpage = async (parentPageId: string, title = 'New page') => {
    const parent = pages.find((p) => p.id === parentPageId);
    const newPageId = await createPage(undefined, title, undefined, 'Document', '📄');
    if (newPageId) {
      await setParentPage(newPageId, parentPageId);
      setActivePageId(newPageId);
      setActiveView('doc');
      addNotification('Nowa podstrona', `Utworzono podstronę w "${parent?.title || 'dokument nadrzędny'}".`, 'success', newPageId);
    }
    return newPageId;
  };

  const setParentPage = async (pageId: string, parentPageId?: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const updatedPage: WorkspacePage = {
      ...page,
      parentPageId: parentPageId || undefined,
      updatedAt: Date.now(),
    };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);
    knowledgeIndex.indexPage(updatedPage);
    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        parentPageId: parentPageId || null,
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const toggleInheritPermissions = async (pageId: string, inherit: boolean) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const updatedPage: WorkspacePage = {
      ...page,
      inheritPermissions: inherit,
      updatedAt: Date.now(),
    };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);
    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        inheritPermissions: inherit,
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  // Smart Merge i Samonaprawa Treści (pkt 5.2 specyfikacji)
  const smartMergePageWithResearch = async (
    pageId: string,
    researchResult: MultiSourceResearchResult
  ): Promise<HealedPageResult> => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) throw new Error('Strona nie istnieje w bazie wiedzy');

    const result = knowledgeIndex.smartMergeAndHeal(page, researchResult);
    setPages((prev) => prev.map((p) => (p.id === pageId ? result.updatedPage : p)));
    sqliteDb.savePage(result.updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(result.updatedPage.blocks),
        lastEditedBy: result.updatedPage.lastEditedBy,
        updatedAt: result.updatedPage.updatedAt,
      }).catch(() => {});
    }

    addNotification(
      'Samonaprawa danych',
      `Zaktualizowano notatkę "${page.title}" o ${result.healedChangesCount} zweryfikowanych faktów (Self-healing).`,
      'success',
      pageId
    );
    return result;
  };

  // Block manipulations
  const updateBlock = async (pageId: string, blockId: string, updates: Partial<DocBlock>) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const newBlocks = page.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b));

    // Bezpieczna detekcja JAWNYCH dyrektyw udostępniania (_email@gmail.com, #SHARE:email#, @share email, ALL_USER@GMAIAL.COM)
    // Zwykły adres e-mail w zdaniu lub cytacie NIE nadaje dostępu automatycznie.
    let updatedPagesList = pages.map((p) =>
      p.id === pageId ? { ...p, blocks: newBlocks, updatedAt: Date.now() } : p
    );

    if (updates.content) {
      const shareDirectives = extractExplicitShareDirectives(updates.content);
      for (const dir of shareDirectives) {
        try {
          const shareRes = applyShareToWorkspacePages({
            pages: updatedPagesList,
            targetPageId: pageId,
            targetEmail: dir.targetEmail,
            role: dir.role,
            actor: user || { uid: 'local-user', email: 'owner@searchpoint.pl' },
          });
          updatedPagesList = shareRes.updatedPages;
          addNotification(
            shareRes.isWorkspaceWide ? '🌐 Dyrektywa ALL_USER aktywna' : '👥 Udostępniono notatkę',
            shareRes.isWorkspaceWide
              ? `Nadano dostęp workspace-wide (${shareRes.appliedRole}) do ${shareRes.affectedPageIds.length} stron.`
              : `Użytkownik ${shareRes.normalizedEmail} otrzymał rolę ${shareRes.appliedRole} w "${page.title}".`,
            'success',
            pageId
          );
        } catch {
          // ignore unauthorized or duplicate share directives
        }
      }

      // Obsługa jawnych wzmianek / pingów (@ping email, #PING:email#)
      const pingDirectives = extractPingDirectives(updates.content);
      const currentTargetPage = updatedPagesList.find((p) => p.id === pageId) || page;
      for (const ping of pingDirectives) {
        const pingRes = createPingNotification({
          page: currentTargetPage,
          targetEmail: ping.targetEmail,
          message: ping.message,
          senderName: user?.displayName || user?.email || 'Współpracownik',
          allPages: updatedPagesList,
        });
        if (pingRes.allowed && pingRes.notification) {
          addNotification(
            pingRes.notification.title,
            pingRes.notification.message,
            'info',
            pageId,
            undefined,
            undefined,
            'Otwórz dokument',
            'doc'
          );
        }
      }
    }

    setPages(updatedPagesList);
    const updatedPage = updatedPagesList.find((p) => p.id === pageId);
    if (updatedPage) {
      sqliteDb.savePage(updatedPage);
      if (user) {
        updateDoc(doc(db, 'pages', pageId), {
          blocks: cleanFirestoreData(updatedPage.blocks),
          sharedWith: cleanFirestoreData(updatedPage.sharedWith),
          sharedCollaborators: cleanFirestoreData(updatedPage.sharedCollaborators),
          updatedAt: Date.now(),
        }).catch(() => {});
      }
    }
  };

  const insertBlocks = async (pageId: string, blocksToInsert: Partial<DocBlock>[], afterBlockId?: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const formattedBlocks: DocBlock[] = blocksToInsert.map((b, i) => ({
      ...b,
      id: b.id || `block-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      type: b.type || 'p',
      content: b.content || '',
      checked: b.checked,
      calloutType: b.calloutType,
      language: b.language,
      buttonUrl: b.buttonUrl,
      buttonColor: b.buttonColor,
      statValue: b.statValue,
      statTrend: b.statTrend,
      progressPercent: b.progressPercent,
      timelineDate: b.timelineDate,
      fileName: b.fileName,
      fileSize: b.fileSize,
      fileUrl: b.fileUrl,
      embedUrl: b.embedUrl,
      imageUrl: b.imageUrl,
      imageCaption: b.imageCaption,
      videoUrl: b.videoUrl,
      audioUrl: b.audioUrl,
      bookmarkUrl: b.bookmarkUrl,
      bookmarkTitle: b.bookmarkTitle,
      bookmarkDesc: b.bookmarkDesc,
      tableData: b.tableData,
      toggleDetails: b.toggleDetails,
      chartData: b.chartData,
      linkedDatabaseData: b.linkedDatabaseData,
      decisionMatrixData: b.decisionMatrixData,
      riskRegisterData: b.riskRegisterData,
      roadmapData: b.roadmapData,
      swotData: b.swotData,
      kpiScorecardData: b.kpiScorecardData,
      apiEndpointData: b.apiEndpointData,
      eventScheduleData: b.eventScheduleData,
      citationData: b.citationData,
      announcementData: b.announcementData,
      specTableData: b.specTableData,
      codeSandboxData: b.codeSandboxData,
      audioMemoData: b.audioMemoData,
      kanbanColumns: b.kanbanColumns,
      faqItems: b.faqItems,
      beforeAfterData: b.beforeAfterData,
      mentionUser: b.mentionUser,
      changelogData: b.changelogData,
      gaugeData: b.gaugeData,
      diagramType: b.diagramType,
      diagramSyntax: b.diagramSyntax,
    }));

    let newBlocks = [...page.blocks];
    if (afterBlockId) {
      const idx = newBlocks.findIndex((b) => b.id === afterBlockId);
      if (idx !== -1) {
        newBlocks.splice(idx + 1, 0, ...formattedBlocks);
      } else {
        newBlocks.push(...formattedBlocks);
      }
    } else {
      newBlocks.push(...formattedBlocks);
    }

    const updatedPage: WorkspacePage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(newBlocks),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const replaceAllBlocks = async (pageId: string, blocksToSet: DocBlock[]) => {
    const page = pages.find((p) => p.id === pageId) || sqliteDb.getPage(pageId);
    if (!page) return;

    const updatedPage: WorkspacePage = { ...page, blocks: blocksToSet, updatedAt: Date.now() };
    setPages((prev) => {
      const exists = prev.some((p) => p.id === pageId);
      if (exists) {
        return prev.map((p) => (p.id === pageId ? updatedPage : p));
      }
      return [updatedPage, ...prev];
    });
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(blocksToSet),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const addBlock = async (pageId: string, afterBlockId?: string, type: DocBlock['type'] = 'p') => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    const newBlock: DocBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      content: '',
      calloutType: type === 'callout' ? 'info' : undefined,
      language: type === 'code' ? 'javascript' : undefined,
    };

    let newBlocks = [...page.blocks];
    if (afterBlockId) {
      const idx = newBlocks.findIndex((b) => b.id === afterBlockId);
      if (idx !== -1) {
        newBlocks.splice(idx + 1, 0, newBlock);
      } else {
        newBlocks.push(newBlock);
      }
    } else {
      newBlocks.push(newBlock);
    }

    const updatedPage: WorkspacePage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(newBlocks),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const deleteBlock = async (pageId: string, blockId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const newBlocks = page.blocks.filter((b) => b.id !== blockId);
    const updatedPage: WorkspacePage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(newBlocks),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const moveBlock = async (pageId: string, blockId: string, direction: 'up' | 'down') => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const idx = page.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === page.blocks.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newBlocks = [...page.blocks];
    const [moved] = newBlocks.splice(idx, 1);
    newBlocks.splice(targetIdx, 0, moved);

    const updatedPage: WorkspacePage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(newBlocks),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const reorderBlocks = async (pageId: string, startIndex: number, endIndex: number) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const result = Array.from(page.blocks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const updatedPage: WorkspacePage = { ...page, blocks: result, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(result),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const duplicateBlock = async (pageId: string, blockId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const idx = page.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const original = page.blocks[idx];
    const clone: DocBlock = {
      ...original,
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    const newBlocks = [...page.blocks];
    newBlocks.splice(idx + 1, 0, clone);

    const updatedPage: WorkspacePage = { ...page, blocks: newBlocks, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        blocks: cleanFirestoreData(newBlocks),
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const createVersionSnapshot = async (pageId: string, label: string) => {
    if (!ensureAuth()) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const newVersion = cleanFirestoreData({
      id: `v-${Date.now()}`,
      timestamp: Date.now(),
      label,
      title: page.title,
      blocks: page.blocks,
    });
    const updatedVersions = [newVersion, ...(page.versions || [])].slice(0, 20);
    try {
      await updateDoc(doc(db, 'pages', pageId), {
        versions: cleanFirestoreData(updatedVersions),
      });
      addNotification('Zapisano wersję', `Utworzono migawkę „${label}”`, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${pageId}`);
    }
  };

  const restoreVersionSnapshot = async (pageId: string, versionId: string) => {
    if (!ensureAuth()) return;
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const targetVersion = (page.versions || []).find((v) => v.id === versionId);
    if (!targetVersion) return;
    try {
      await updateDoc(doc(db, 'pages', pageId), {
        title: targetVersion.title,
        blocks: cleanFirestoreData(targetVersion.blocks),
        updatedAt: Date.now(),
      });
      addNotification('Przywrócono wersję', `Przywrócono migawkę „${targetVersion.label}”`, 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `pages/${pageId}`);
    }
  };

  const getBacklinks = (pageTitle: string) => {
    const cleanTitle = pageTitle.toLowerCase();
    const results: { id: string; title: string; icon: string }[] = [];
    pages.forEach((p) => {
      if (p.title.toLowerCase() !== cleanTitle) {
        const mentions = p.blocks.some((b) => b.content && b.content.toLowerCase().includes(`[[${cleanTitle}]]`));
        if (mentions) {
          results.push({ id: p.id, title: p.title, icon: p.icon });
        }
      }
    });
    return results;
  };

  const [resources] = useState<WorkspaceResource[]>([]);

  // Real Tasks
  const addTask = async (task: Omit<TaskItem, 'id'>): Promise<string> => {
    const newId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const fullTask: TaskItem = {
      ...task,
      id: newId,
      ownerId: user?.uid || 'local-user',
      workspaceId: currentWorkspaceId,
      teamId: currentWorkspaceId !== 'ws-personal' ? currentWorkspaceId : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    sqliteDb.saveTask(fullTask);
    setTasks((prev) => [fullTask, ...prev]);
    addNotification('Dodano zadanie', `Zadanie „${task.title}” zostało zapisane w bazie SQLite.`, 'success');

    if (user) {
      setDoc(doc(db, 'tasks', newId), cleanFirestoreData(fullTask)).catch(() => {});
    }
    return newId;
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === taskId ? { ...t, status, isCompleted: status === 'Zrobione', updatedAt: Date.now() } : t
      );
      const target = updated.find((t) => t.id === taskId);
      if (target) sqliteDb.saveTask(target);
      return updated;
    });

    // Sync backing Task page if it exists
    setPages((prevPages) => {
      const updatedPages = prevPages.map((p) => {
        if (p.pageType === 'Task' && p.metadata?.taskId === taskId) {
          const nextPage = {
            ...p,
            icon: status === 'Zrobione' ? '✅' : '☑️',
            metadata: { ...(p.metadata || {}), status, isCompleted: status === 'Zrobione' },
            updatedAt: Date.now(),
          };
          sqliteDb.savePage(nextPage);
          return nextPage;
        }
        return p;
      });
      return updatedPages;
    });

    if (user) {
      updateDoc(doc(db, 'tasks', taskId), { status, isCompleted: status === 'Zrobione', updatedAt: Date.now() }).catch(() => {});
    }
  };

  const updateTask = async (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t));
      const target = updated.find((t) => t.id === taskId);
      if (target) sqliteDb.saveTask(target);
      return updated;
    });

    // Sync backing Task page if it exists
    setPages((prevPages) => {
      const updatedPages = prevPages.map((p) => {
        if (p.pageType === 'Task' && p.metadata?.taskId === taskId) {
          const nextPage: WorkspacePage = {
            ...p,
            title: updates.title !== undefined ? updates.title : p.title,
            icon: updates.status !== undefined ? (updates.status === 'Zrobione' ? '✅' : '☑️') : p.icon,
            metadata: {
              ...(p.metadata || {}),
              ...(updates.status !== undefined ? { status: updates.status } : {}),
              ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
              ...(updates.assignee !== undefined ? { assignee: updates.assignee, owner: updates.assignee } : {}),
              ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate } : {}),
              ...(updates.relationPageId !== undefined ? { relationProjectId: updates.relationPageId } : {}),
              ...(updates.relationPageTitle !== undefined ? { relationProjectTitle: updates.relationPageTitle } : {}),
            },
            updatedAt: Date.now(),
          };
          sqliteDb.savePage(nextPage);
          return nextPage;
        }
        return p;
      });
      return updatedPages;
    });

    if (user) {
      updateDoc(doc(db, 'tasks', taskId), cleanFirestoreData({ ...updates, updatedAt: Date.now() })).catch(() => {});
    }
  };

  const openTaskAsPage = async (taskId: string): Promise<string | undefined> => {
    const task = tasks.find((t) => t.id === taskId) || sqliteDb.getAllTasks().find((t) => t.id === taskId);
    if (!task) return undefined;

    const existingPage = pages.find(
      (p) => !p.isDeleted && p.pageType === 'Task' && p.metadata?.taskId === task.id
    );
    if (existingPage) {
      setActivePageId(existingPage.id);
      setActiveView('doc');
      return existingPage.id;
    }

    const initialBlocks: DocBlock[] = [
      {
        id: `b-task-${Date.now()}-1`,
        type: 'lead',
        content: task.description || 'Szczegółowy opis zadania, kryteria akceptacji oraz lista podzadań.',
      },
      {
        id: `b-task-${Date.now()}-2`,
        type: 'h2',
        content: 'Kryteria akceptacji i lista kontrolna',
      },
      ...(task.subtasks && task.subtasks.length > 0
        ? task.subtasks.map((st, idx) => ({
            id: `b-task-sub-${Date.now()}-${idx}`,
            type: 'todo' as const,
            content: st.title,
            checked: st.completed,
          }))
        : [
            {
              id: `b-task-${Date.now()}-3`,
              type: 'todo' as const,
              content: 'Zrealizować główny zakres zadania i zweryfikować wynik',
              checked: task.status === 'Zrobione',
            },
          ]),
      {
        id: `b-task-${Date.now()}-4`,
        type: 'h2',
        content: 'Notatki robocze i ustalenia',
      },
      {
        id: `b-task-${Date.now()}-5`,
        type: 'p',
        content: 'Wpisz dodatkowe ustalenia lub użyj / aby dodać bloki...',
      },
    ];

    const newPageId = await createPage(
      undefined,
      task.title,
      initialBlocks,
      'Task',
      task.status === 'Zrobione' ? '✅' : '☑️'
    );

    if (newPageId) {
      await updatePageMetadata(newPageId, {
        taskId: task.id,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee || 'Ty',
        owner: task.assignee || 'Ty',
        dueDate: task.dueDate,
        relationProjectId: task.relationPageId || task.pageId || '',
        relationProjectTitle: task.relationPageTitle || '',
        estimatedHours: task.estimatedHours || 2,
      });
      setActivePageId(newPageId);
      setActiveView('doc');
    }

    return newPageId;
  };

  const deleteTask = async (taskId: string) => {
    sqliteDb.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (user) {
      deleteDoc(doc(db, 'tasks', taskId)).catch(() => {});
    }
  };

  // Real Folders
  const createFolder = async (name: string, parentId?: string, icon = '📁'): Promise<string> => {
    const newId = `folder-${Date.now()}`;
    const newFolder: WorkspaceFolder = {
      id: newId,
      ownerId: user?.uid || 'local-user',
      name,
      icon,
      parentId: parentId || undefined,
      createdAt: Date.now(),
    };

    sqliteDb.saveFolder(newFolder);
    setFolders((prev) => [...prev, newFolder]);
    addNotification('Utworzono folder', `Folder „${name}” został utworzony.`);

    if (user) {
      setDoc(doc(db, 'folders', newId), cleanFirestoreData(newFolder)).catch(() => {});
    }
    return newId;
  };

  const deleteFolder = async (folderId: string) => {
    sqliteDb.deleteFolder(folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));

    if (user) {
      deleteDoc(doc(db, 'folders', folderId)).catch(() => {});
    }
  };

  const movePageToFolder = async (pageId: string, folderId?: string) => {
    setSyncStatus('saving');
    setPages((prev) => {
      const updated = prev.map((p) => (p.id === pageId ? { ...p, folderId: folderId || undefined, updatedAt: Date.now() } : p));
      const target = updated.find((p) => p.id === pageId);
      if (target) sqliteDb.savePage(target);
      return updated;
    });
    setSyncStatus('saved');

    if (user) {
      updateDoc(doc(db, 'pages', pageId), {
        folderId: folderId || null,
        updatedAt: Date.now(),
      }).catch(() => {});
    }
  };

  const autoOrganizePagesIntoThematicFolders = async (): Promise<{
    createdFoldersCount: number;
    organizedPagesCount: number;
  }> => {
    if (!ensureAuth()) return { createdFoldersCount: 0, organizedPagesCount: 0 };
    setSyncStatus('saving');

    const THEMATIC_CATEGORIES = [
      {
        name: 'Baza Wiedzy & Nauka',
        icon: '🧠',
        keywords: [
          'wikipedia', 'badanie', 'definicja', 'sztuczna inteligencja', 'inteligencja',
          'nauka', 'historia', 'biologia', 'psychologia', 'encyklopedia', 'koty',
          'zwierzeta', 'fizyka', 'kosmos', 'teoria', 'filozofia', 'wiedza'
        ],
      },
      {
        name: 'Projekty & Kod',
        icon: '💻',
        keywords: [
          'projekt', 'kod', 'api', 'react', 'typescript', 'javascript', 'architektura',
          'bazy', 'database', 'programowanie', 'backend', 'frontend', 'css', 'html',
          'git', 'system', 'aplikacja', 'software', 'dev', 'funkcja', 'komponent'
        ],
      },
      {
        name: 'Zespół & Spotkania',
        icon: '👥',
        keywords: [
          'spotkanie', 'zespół', 'zespol', 'daily', 'retro', 'standup', 'sprint',
          'scrum', 'teams', 'zaproszenie', 'klient', 'warsztat', 'notatka ze spotkania',
          'ustalenia', 'omówienie'
        ],
      },
      {
        name: 'Plany & Zadania',
        icon: '🎯',
        keywords: [
          'plan', 'zadania', 'todo', 'cele', 'roadmap', 'harmonogram', 'etap',
          'priorytety', 'kwartał', 'deadline', 'organizacja'
        ],
      },
      {
        name: 'Notatki Robocze',
        icon: '📝',
        keywords: [
          'notatka', 'szkic', 'pomysl', 'pomysł', 'robocza', 'dokument', 'zapiski',
          'konspekt', 'wersja', 'nowy'
        ],
      },
    ];

    let createdFoldersCount = 0;
    let organizedPagesCount = 0;

    try {
      const folderMap: Record<string, string> = {};
      const newFoldersToCreate: WorkspaceFolder[] = [];

      for (const cat of THEMATIC_CATEGORIES) {
        const existing =
          folders.find((f) => f.name.toLowerCase() === cat.name.toLowerCase()) ||
          newFoldersToCreate.find((f) => f.name.toLowerCase() === cat.name.toLowerCase());
        if (existing) {
          folderMap[cat.name] = existing.id;
        } else {
          const newFolderId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const newFolder: WorkspaceFolder = {
            id: newFolderId,
            ownerId: user?.uid || 'local-user',
            name: cat.name,
            icon: cat.icon,
            createdAt: Date.now(),
          };
          sqliteDb.saveFolder(newFolder);
          newFoldersToCreate.push(newFolder);
          folderMap[cat.name] = newFolderId;
          createdFoldersCount++;
          if (user) {
            setDoc(doc(db, 'folders', newFolderId), cleanFirestoreData(newFolder)).catch(() => {});
          }
        }
      }

      if (newFoldersToCreate.length > 0) {
        setFolders((prev) => [...prev, ...newFoldersToCreate]);
      }

      const unassignedPages = pages.filter((p) => !p.isDeleted && !p.folderId);
      const updatedPageMap = new Map<string, string>(); // pageId -> folderId

      for (const page of unassignedPages) {
        const textToAnalyze = `${page.title || ''} ${page.blocks?.map((b) => b.content).join(' ') || ''}`.toLowerCase();

        let bestCategory = THEMATIC_CATEGORIES[THEMATIC_CATEGORIES.length - 1];
        let highestScore = 0;

        for (const cat of THEMATIC_CATEGORIES.slice(0, 4)) {
          let score = 0;
          for (const kw of cat.keywords) {
            if (textToAnalyze.includes(kw)) {
              score += kw.length > 5 ? 2 : 1;
            }
          }
          if (score > highestScore) {
            highestScore = score;
            bestCategory = cat;
          }
        }

        const targetFolderId = folderMap[bestCategory.name];
        if (targetFolderId) {
          updatedPageMap.set(page.id, targetFolderId);
          organizedPagesCount++;
        }
      }

      if (updatedPageMap.size > 0) {
        setPages((prev) => {
          const updated = prev.map((p) => {
            const folderId = updatedPageMap.get(p.id);
            if (folderId) {
              const updatedPage = { ...p, folderId, updatedAt: Date.now() };
              sqliteDb.savePage(updatedPage);
              return updatedPage;
            }
            return p;
          });
          return updated;
        });

        if (user) {
          for (const [pageId, folderId] of updatedPageMap.entries()) {
            updateDoc(doc(db, 'pages', pageId), {
              folderId,
              updatedAt: Date.now(),
            }).catch(() => {});
          }
        }
      }

      setSyncStatus('saved');
      addNotification(
        'Uporządkowano notatki!',
        `Podzielono ${organizedPagesCount} notatek na foldery tematyczne.`,
        'success'
      );
    } catch (err) {
      setSyncStatus('offline');
      console.warn('Auto-organize error (local SQLite fallback active):', err);
    }

    return { createdFoldersCount, organizedPagesCount };
  };

  // Comments
  const addComment = async (pageId: string, text: string, blockId?: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const authorName = user?.displayName || user?.email?.split('@')[0] || (user?.email ? user.email : 'Współpracownik (Admin)');
    const authorEmail = user?.email || undefined;
    const authorId = user?.uid || `usr-${Date.now()}`;
    const avatar = (authorName || 'U')[0].toUpperCase();

    const newComment = cleanFirestoreData({
      id: `c-${Date.now()}`,
      blockId: blockId || undefined,
      author: authorName,
      authorId,
      authorEmail,
      avatar,
      text,
      timestamp: Date.now(),
      resolved: false,
    });
    const newComments = [...(page.comments || []), newComment];
    const updatedPage: WorkspacePage = { ...page, comments: newComments, updatedAt: Date.now() };

    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      try {
        await updateDoc(doc(db, 'pages', pageId), { comments: cleanFirestoreData(newComments) });
      } catch (err) {}
    }

    // Check for @mentions and notify
    const mentions = text.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+|[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/g);
    if (mentions && mentions.length > 0) {
      addNotification(
        'Oznaczenie w dyskusji',
        `${authorName} dodał komentarz w "${page.title || 'dokumentu'}": "${text.slice(0, 70)}..."`,
        'info',
        pageId
      );
    }
  };

  const resolveComment = async (pageId: string, commentId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const newComments = page.comments.map((c) => (c.id === commentId ? { ...c, resolved: !c.resolved } : c));
    const updatedPage: WorkspacePage = { ...page, comments: newComments, updatedAt: Date.now() };

    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      try {
        await updateDoc(doc(db, 'pages', pageId), { comments: cleanFirestoreData(newComments) });
      } catch (err) {}
    }
  };

  const replyToComment = async (pageId: string, commentId: string, text: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const authorName = user?.displayName || user?.email?.split('@')[0] || 'Współpracownik';
    const authorId = user?.uid || `usr-${Date.now()}`;
    const authorEmail = user?.email || undefined;
    const avatar = (authorName || 'U')[0].toUpperCase();

    const newComments = page.comments.map((c) => {
      if (c.id === commentId) {
        const replies = c.replies || [];
        return {
          ...c,
          replies: [
            ...replies,
            {
              id: `r-${Date.now()}`,
              author: authorName,
              authorId,
              authorEmail,
              avatar,
              text,
              timestamp: Date.now(),
            },
          ],
        };
      }
      return c;
    });

    const updatedPage: WorkspacePage = { ...page, comments: newComments, updatedAt: Date.now() };
    setPages((prev) => prev.map((p) => (p.id === pageId ? updatedPage : p)));
    sqliteDb.savePage(updatedPage);

    if (user) {
      try {
        await updateDoc(doc(db, 'pages', pageId), { comments: cleanFirestoreData(newComments) });
      } catch (err) {}
    }

    const mentions = text.match(/@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+|[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/g);
    if (mentions && mentions.length > 0) {
      addNotification(
        'Odpowiedź z oznaczeniem',
        `${authorName} oznaczył Cię w odpowiedzi: "${text.slice(0, 70)}..."`,
        'info',
        pageId
      );
    }
  };

  // Public interaction (likes & views)
  const likePublicPage = async (publicPageId: string) => {
    try {
      const publicRef = doc(db, 'public_pages', publicPageId);
      const snap = await getDoc(publicRef);
      if (snap.exists()) {
        const currentLikes = snap.data()?.likesCount || 0;
        await updateDoc(publicRef, { likesCount: currentLikes + 1 });
      }
    } catch (err) {
      console.warn('Could not like public page:', err);
    }
  };

  const incrementPublicPageView = async (publicPageId: string) => {
    try {
      const publicRef = doc(db, 'public_pages', publicPageId);
      const snap = await getDoc(publicRef);
      if (snap.exists()) {
        const currentViews = snap.data()?.viewsCount || 0;
        await updateDoc(publicRef, { viewsCount: currentViews + 1 });
      }
    } catch (err) {
      console.warn('Could not increment view count:', err);
    }
  };

  // Local notifications & Live Toasts
  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addNotification = (
    title: string,
    message: string,
    type: NotificationType = 'info',
    pageIdOrOptions?: string | { pageId?: string; teamId?: string; taskId?: string; category?: NotificationCategory; actionLabel?: string; silentToast?: boolean }
  ) => {
    let pageId: string | undefined;
    let teamId: string | undefined;
    let taskId: string | undefined;
    let category: NotificationCategory | undefined;
    let actionLabel: string | undefined;
    let silentToast = false;

    if (typeof pageIdOrOptions === 'string') {
      pageId = pageIdOrOptions;
    } else if (pageIdOrOptions && typeof pageIdOrOptions === 'object') {
      pageId = pageIdOrOptions.pageId;
      teamId = pageIdOrOptions.teamId;
      taskId = pageIdOrOptions.taskId;
      category = pageIdOrOptions.category;
      actionLabel = pageIdOrOptions.actionLabel;
      silentToast = Boolean(pageIdOrOptions.silentToast);
    }

    // 1. Anti-spam deduplication within 3.5 seconds
    const dedupKey = `${title.trim()}:::${message.trim()}`;
    const now = Date.now();
    const lastSeen = lastToastedMapRef.current.get(dedupKey) || 0;
    if (now - lastSeen < 3500) {
      // Ignoruj powtarzające się, zduplikowane powiadomienia
      return;
    }
    lastToastedMapRef.current.set(dedupKey, now);

    // Czyszczenie mapy deduplikacji
    if (lastToastedMapRef.current.size > 50) {
      for (const [k, v] of lastToastedMapRef.current.entries()) {
        if (now - v > 10000) lastToastedMapRef.current.delete(k);
      }
    }

    if (!category) {
      if (teamId || /zesp|pok|zaproszen/i.test(title + ' ' + message)) {
        category = 'team';
      } else if (taskId || /zada/i.test(title + ' ' + message)) {
        category = 'task';
      } else if (pageId || /stron|dokument|wersj|notatk|szablon/i.test(title + ' ' + message)) {
        category = 'doc';
      } else if (/komentarz/i.test(title + ' ' + message)) {
        category = 'comment';
      } else {
        category = 'general';
      }
    }

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: WorkspaceNotification = {
      id: notifId,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      type,
      category,
      pageId,
      teamId,
      taskId,
      actionLabel,
    };

    // Zapisz w centrum powiadomień (dzwonek)
    setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);

    // 2. Inteligentny filtr mikro-akcji dla wyskakujących dymków (toasts)
    const isTrivialMicroAction =
      /^(Dodano blok|AI analizuje|AI przekszta|Skopiowano|Zamieniono tekst|Pobieranie|Odblokowano sekcj|Zablokowano sekcj|Szablony)/i.test(title) ||
      /^(Tekst skopiowany|Polecenie skopiowane|Kod Mermaid|Wstawiono:|Przetwarzam tre|Transformacja zaznaczenia)/i.test(message);

    // W trybie cichym dymki są wyciszone (tylko krytyczne błędy). Mikro-akcje nigdy nie generują dymków.
    const shouldToast = !silentToast && !isTrivialMicroAction && (!isQuietMode || type === 'error' || type === 'warning');

    if (shouldToast) {
      // Maksymalnie 2 dymki na ekranie zamiast 4
      setActiveToasts((prev) => [newNotif, ...prev.slice(0, 1)]);

      // Krótszy czas wyświetlania (2.6s zamiast 4.5s)
      setTimeout(() => {
        setActiveToasts((prev) => prev.filter((t) => t.id !== notifId));
      }, 2600);
    }
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setActiveToasts([]);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        pages,
        sharedPages,
        sharePageWithEmail,
        updateCollaboratorRole,
        removePageCollaborator,
        createSubpage,
        setParentPage,
        toggleInheritPermissions,
        smartMergePageWithResearch,
        folders,
        tasks,
        publicPages,
        activePageId,
        activePublicPageId,
        activeView,
        searchQuery,
        isSearchOpen,
        isZenMode,
        isAiFullscreen,
        isAiSidePanelOpen,
        syncStatus,
        selectedTag,
        activeDoc,
        activePublicPage,
        workspaceName,
        setWorkspaceName,
        workspaces,
        // Multi-Tenancy Teams & Workspaces
        currentWorkspace,
        switchWorkspace,
        createTeamWorkspace,
        addTeamMemberDirectly,
        teamInvites,
        sendTeamInvite,
        respondToInvite,
        cancelTeamInvite,
        updateMemberRole,
        removeTeamMember,
        deleteTeamWorkspace,
        updateTeamSettings,

        // Trash actions
        restorePage,
        permanentlyDeletePage,
        emptyTrash,

        createFolder,
        deleteFolder,
        setActivePageId,
        setActivePublicPageId,
        setActiveView,
        setSearchQuery,
        setIsSearchOpen,
        setIsZenMode,
        setIsAiFullscreen,
        setIsAiSidePanelOpen,
        toggleAiSidePanel,
        setSelectedTag,
        isSettingsOpen,
        setIsSettingsOpen,
        recentlyViewedPages,
        favoritePages,
        userSearches,
        recordSearch,
        removeUserSearch,
        clearUserSearches,
        reorderPages,
        movePageToFolder,
        autoOrganizePagesIntoThematicFolders,
        createPage,
        updatePageTitle,
        updatePageIcon,
        updatePageCover,
        updatePageType,
        updatePageMetadata,
        updatePagePermissions,
        seedProfileTemplates,
        toggleFavorite,
        deletePage,
        togglePagePublic,
        publishPageToPublic,
        unpublishPageFromPublic,
        addPageTag,
        removePageTag,
        updateBlock,
        addBlock,
        insertBlocks,
        replaceAllBlocks,
        deleteBlock,
        moveBlock,
        reorderBlocks,
        duplicateBlock,
        createVersionSnapshot,
        restoreVersionSnapshot,
        getBacklinks,
        resources,
        openTaskAsPage,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        addComment,
        resolveComment,
        replyToComment,
        likePublicPage,
        incrementPublicPageView,
        notifications,
        activeToasts,
        unreadNotificationsCount: notifications.filter((n) => !n.read).length,
        isQuietMode,
        toggleQuietMode,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        removeNotification,
        dismissToast,
        clearNotifications,
        exportSqlDump: () => {
          sqliteDb.downloadSqlDump();
          addNotification('Baza SQLite wyeksportowana', 'Pobrano plik SQL ze wszystkimi tabelami i danymi.', 'success');
        },
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
