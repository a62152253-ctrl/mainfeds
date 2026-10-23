import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Check,
  X,
  Shield,
  Plus,
  Share2,
  Trash2,
  Search,
  FileText,
  Pin,
  Megaphone,
  Activity,
  Settings,
  AlertCircle,
  Copy,
  Layers,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { TeamRole, DocBlock } from '../types/workspace';
import { buildTeamInviteJoinUrl } from '../features/team/teamEmailService';
import {
  buildProjectRecords,
  buildMeetingRecords,
} from '../features/database/viewConfigService';
import { LinkedDatabaseBlockView } from './editor/LinkedDatabaseBlockView';

const TEAM_ICONS = ['🏢', '🚀', '💻', '🎨', '📈', '⚡', '🎯', '🔬', '🌐', '🛡️', '⭐', '💡'];

const ROLE_CONFIG: Record<TeamRole, { label: string; desc: string }> = {
  Owner: {
    label: 'Owner',
    desc: 'Pełna kontrola nad przestrzenią, członkami, bazami danych i ustawieniami.',
  },
  Admin: {
    label: 'Admin',
    desc: 'Zarządzanie członkami, zaproszeniami i strukturą stron w Teamspace.',
  },
  Editor: {
    label: 'Editor',
    desc: 'Tworzenie i edycja stron, projektów, zadań i spotkań w przestrzeni.',
  },
  Viewer: {
    label: 'Viewer',
    desc: 'Przeglądanie stron i baz danych oraz dodawanie komentarzy.',
  },
};

interface TeamAnnouncement {
  id: string;
  teamId: string;
  title: string;
  content: string;
  category: 'Ważne' | 'Sprint' | 'Spotkanie' | 'Informacja';
  authorName: string;
  authorEmail: string;
  pinned: boolean;
  createdAt: number;
}

export const TeamsWorkspaceView: React.FC = () => {
  const { user } = useAuth();
  const {
    currentWorkspace,
    workspaces,
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
    pages,
    tasks,
    createPage,
    setActivePageId,
    setActiveView,
  } = useWorkspace();

  const [activeSubSection, setActiveSubSection] = useState<'overview' | 'members' | 'announcements' | 'settings'>('overview');

  // Linked Database Blocks embedded directly inside Team HQ page
  const [teamProjectsBlock, setTeamProjectsBlock] = useState<DocBlock>({
    id: 'team-hq-linked-projects',
    type: 'linked_database',
    content: 'Projects',
    linkedDatabaseData: {
      entityKind: 'projects',
      viewMode: 'table',
      title: '🚀 Projects — Aktywne projekty zespołu',
      projectFilter: 'all',
    },
  });

  const [teamTasksBlock, setTeamTasksBlock] = useState<DocBlock>({
    id: 'team-hq-linked-tasks',
    type: 'linked_database',
    content: 'Tasks',
    linkedDatabaseData: {
      entityKind: 'tasks',
      viewMode: 'board',
      title: '☑️ Tasks — Tablica zadań zespołu',
      projectFilter: 'all',
    },
  });

  const [teamMeetingsBlock, setTeamMeetingsBlock] = useState<DocBlock>({
    id: 'team-hq-linked-meetings',
    type: 'linked_database',
    content: 'Meetings',
    linkedDatabaseData: {
      entityKind: 'meetings',
      viewMode: 'table',
      title: '🤝 Meetings — Harmonogram i notatki ze spotkań',
      projectFilter: 'all',
    },
  });

  // Modals & forms
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamIcon, setNewTeamIcon] = useState('🏢');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('Editor');
  const [copiedQuickLink, setCopiedQuickLink] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Settings edit state
  const [editName, setEditName] = useState(currentWorkspace.name);
  const [editIcon, setEditIcon] = useState(currentWorkspace.icon || '🏢');
  const [editDesc, setEditDesc] = useState(currentWorkspace.description || '');

  useEffect(() => {
    setEditName(currentWorkspace.name);
    setEditIcon(currentWorkspace.icon || '🏢');
    setEditDesc(currentWorkspace.description || '');
  }, [currentWorkspace]);

  // Announcements persisted per workspace
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem(`nowoczesne_team_announcements_${currentWorkspace.id}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'ann-1',
        teamId: currentWorkspace.id,
        title: 'Zunifikowana architektura Team HQ',
        content: 'Wszystkie projekty, zadania, spotkania oraz notatki zespołu działają na wspólnym silniku stron i bloków.',
        category: 'Ważne',
        authorName: user?.displayName || 'Owner',
        authorEmail: user?.email || 'owner@searchpoint.ai',
        pinned: true,
        createdAt: Date.now() - 3600000,
      },
    ];
  });

  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(`nowoczesne_team_announcements_${currentWorkspace.id}`, JSON.stringify(announcements));
    } catch {
      // ignore
    }
  }, [announcements, currentWorkspace.id]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const activeTeamPages = useMemo(
    () =>
      pages.filter(
        (p) =>
          !p.isDeleted &&
          (!p.pageType || p.pageType === 'Document') &&
          (p.workspaceId === currentWorkspace.id ||
            p.teamId === currentWorkspace.id ||
            currentWorkspace.id === 'ws-personal')
      ),
    [pages, currentWorkspace.id]
  );

  const projectCount = useMemo(() => buildProjectRecords(pages, tasks).length, [pages, tasks]);
  const meetingCount = useMemo(() => buildMeetingRecords(pages, tasks).length, [pages, tasks]);
  const openTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'Zrobione').length,
    [tasks]
  );

  const pendingInvitesForUser = useMemo(
    () =>
      teamInvites.filter(
        (inv) =>
          inv.inviteeEmail.toLowerCase() === (user?.email || '').toLowerCase() &&
          inv.status === 'pending'
      ),
    [teamInvites, user?.email]
  );

  const handleCopyTeamQuickLink = () => {
    const link = buildTeamInviteJoinUrl(
      `quick-${currentWorkspace.id}`,
      currentWorkspace.id,
      currentWorkspace.name,
      'Editor'
    );
    navigator.clipboard.writeText(link);
    setCopiedQuickLink(true);
    showToast('Skopiowano link zaproszenia do zespołu.');
    setTimeout(() => setCopiedQuickLink(false), 2500);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await createTeamWorkspace(
      newTeamName.trim(),
      newTeamIcon,
      newTeamDesc.trim() || 'Współdzielona przestrzeń robocza zespołu'
    );
    setNewTeamName('');
    setNewTeamDesc('');
    setIsCreatingTeam(false);
    showToast('Utworzono nową przestrzeń zespołową.');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    await addTeamMemberDirectly(
      currentWorkspace.id,
      inviteName.trim() || inviteEmail.split('@')[0],
      inviteEmail.trim(),
      inviteRole
    );
    await sendTeamInvite(currentWorkspace.id, inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteName('');
    showToast(`Dodano i wysłano zaproszenie do ${inviteEmail.trim()}.`);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
    setAnnouncements((prev) => [
      {
        id: `ann-${Date.now()}`,
        teamId: currentWorkspace.id,
        title: newAnnTitle.trim(),
        content: newAnnContent.trim(),
        category: 'Ważne',
        authorName: user?.displayName || 'Członek zespołu',
        authorEmail: user?.email || '',
        pinned: true,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setNewAnnTitle('');
    setNewAnnContent('');
    showToast('Dodano ogłoszenie na stronie Team HQ.');
  };

  const handleCreateSharedDoc = async () => {
    const pageId = await createPage(
      undefined,
      'Nowa notatka zespołowa',
      [
        {
          id: `b-doc-${Date.now()}`,
          type: 'p',
          content: 'Współdzielony dokument zespołu...',
        },
      ],
      'Document',
      '📄'
    );
    if (pageId) {
      setActivePageId(pageId);
      setActiveView('doc');
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] font-sans">
      {/* Top Notion Breadcrumb Bar */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#191919]/95 backdrop-blur-xs border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97]">
          <span>Teamspaces</span>
          <span>/</span>
          <span className="font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
            <span>{currentWorkspace.icon || '🏢'}</span>
            <span>{currentWorkspace.name}</span>
          </span>
          <span>/</span>
          <span className="text-[#37352f] dark:text-white font-medium">Team HQ</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Teamspace Switcher */}
          <select
            value={currentWorkspace.id}
            onChange={(e) => switchWorkspace(e.target.value)}
            className="bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[4px] px-2 py-1 text-xs text-[#37352f] dark:text-[#d4d4d4] outline-none cursor-pointer"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.icon || '🏢'} {ws.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleCopyTeamQuickLink}
            className="px-2.5 py-1 rounded-[4px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(55,53,47,0.04)] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            {copiedQuickLink ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
            <span>{copiedQuickLink ? 'Skopiowano' : 'Udostępnij'}</span>
          </button>

          <button
            onClick={() => setIsCreatingTeam(true)}
            className="px-2.5 py-1 rounded-[4px] bg-[#2383e2] hover:bg-[#1d6fc2] text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            <Plus size={12} />
            <span>Nowy Teamspace</span>
          </button>
        </div>
      </div>

      {/* Main Notion Page Container */}
      <div className="max-w-5xl mx-auto px-6 sm:px-12 py-8 space-y-8">
        {statusMessage && (
          <div className="px-3.5 py-2 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-[#787774] cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Incoming Pending Invites Banner */}
        {pendingInvitesForUser.length > 0 && (
          <div className="p-3.5 rounded-[6px] bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2">
            <div className="text-xs font-semibold text-[#2383e2]">
              Oczekujące zaproszenia do zespołów ({pendingInvitesForUser.length})
            </div>
            {pendingInvitesForUser.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between text-xs">
                <span>
                  Zaproszenie do <strong>{inv.teamName}</strong> (rola: {inv.role})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => respondToInvite(inv.id, true)}
                    className="px-2.5 py-0.5 rounded bg-[#2383e2] text-white text-[11px] font-medium cursor-pointer"
                  >
                    Dołącz
                  </button>
                  <button
                    onClick={() => respondToInvite(inv.id, false)}
                    className="px-2.5 py-0.5 rounded border border-[rgba(55,53,47,0.15)] text-[11px] cursor-pointer"
                  >
                    Odrzuć
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page Icon + Title + Description */}
        <div className="space-y-2">
          <div className="text-4xl select-none">
            {currentWorkspace.icon || (currentWorkspace.id === 'ws-personal' ? '🏠' : '🏢')}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#37352f] dark:text-white">
            {currentWorkspace.name} — Team HQ
          </h1>
          <p className="text-sm text-[#787774] dark:text-[#9b9a97] max-w-2xl leading-relaxed">
            {currentWorkspace.description ||
              'Centralna strona zespołu łącząca najważniejsze ogłoszenia, przypięte dokumenty oraz bazy Projects, Tasks i Meetings na żywo.'}
          </p>
        </div>

        {/* Page Properties / Quick Summary Strip (Notion Property Rows style) */}
        <div className="py-3 border-y border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <button
            onClick={() => setActiveView('projects')}
            className="flex items-center justify-between p-2 rounded-[5px] hover:bg-[#fbfbfa] dark:hover:bg-[#202020] text-left cursor-pointer transition-colors"
          >
            <span className="text-[#787774] flex items-center gap-1.5">
              <Layers size={13} />
              <span>Projects</span>
            </span>
            <span className="font-mono font-semibold text-[#37352f] dark:text-white">
              {projectCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('tasks')}
            className="flex items-center justify-between p-2 rounded-[5px] hover:bg-[#fbfbfa] dark:hover:bg-[#202020] text-left cursor-pointer transition-colors"
          >
            <span className="text-[#787774] flex items-center gap-1.5">
              <CheckSquare size={13} />
              <span>Open Tasks</span>
            </span>
            <span className="font-mono font-semibold text-[#37352f] dark:text-white">
              {openTasksCount}
            </span>
          </button>

          <button
            onClick={() => setActiveView('meetings')}
            className="flex items-center justify-between p-2 rounded-[5px] hover:bg-[#fbfbfa] dark:hover:bg-[#202020] text-left cursor-pointer transition-colors"
          >
            <span className="text-[#787774] flex items-center gap-1.5">
              <Calendar size={13} />
              <span>Meetings</span>
            </span>
            <span className="font-mono font-semibold text-[#37352f] dark:text-white">
              {meetingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveSubSection('members')}
            className="flex items-center justify-between p-2 rounded-[5px] hover:bg-[#fbfbfa] dark:hover:bg-[#202020] text-left cursor-pointer transition-colors"
          >
            <span className="text-[#787774] flex items-center gap-1.5">
              <Users size={13} />
              <span>Members</span>
            </span>
            <span className="font-mono font-semibold text-[#37352f] dark:text-white">
              {currentWorkspace.members?.length || 1}
            </span>
          </button>
        </div>

        {/* Sub-navigation inside Team HQ Page */}
        <div className="flex items-center gap-1 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] pb-2 text-xs">
          {(
            [
              { id: 'overview', label: 'Strona główna HQ (Bazy & Strony)' },
              { id: 'members', label: `Członkowie (${currentWorkspace.members?.length || 1})` },
              { id: 'announcements', label: `Ogłoszenia (${announcements.length})` },
              { id: 'settings', label: 'Ustawienia przestrzeni' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubSection(tab.id)}
              className={`px-3 py-1 rounded-[4px] font-medium cursor-pointer transition-colors ${
                activeSubSection === tab.id
                  ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                  : 'text-[#787774] hover:text-[#37352f] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* SECTION 1: TEAM HQ PAGE BODY (Announcements + Docs + Linked Databases) */}
        {/* ===================================================================== */}
        {activeSubSection === 'overview' && (
          <div className="space-y-8">
            {/* Callout / Pinned Announcements & Docs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pinned Announcements Block */}
              <div className="p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                    <Megaphone size={13} className="text-[#787774]" />
                    <span>Przypięte komunikaty zespołu</span>
                  </span>
                  <button
                    onClick={() => setActiveSubSection('announcements')}
                    className="text-[11px] text-[#787774] hover:text-[#37352f] cursor-pointer"
                  >
                    Zarządzaj →
                  </button>
                </div>
                <div className="space-y-2">
                  {announcements.slice(0, 2).map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.08)] text-xs space-y-1"
                    >
                      <div className="font-semibold text-[#37352f] dark:text-white">
                        📌 {ann.title}
                      </div>
                      <p className="text-[11px] text-[#787774] leading-relaxed">{ann.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shared Pages & Knowledge Base */}
              <div className="p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#37352f] dark:text-white flex items-center gap-1.5">
                    <FileText size={13} className="text-[#787774]" />
                    <span>Dokumenty i Wiki zespołu ({activeTeamPages.length})</span>
                  </span>
                  <button
                    onClick={handleCreateSharedDoc}
                    className="text-[11px] text-[#2383e2] font-medium hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>Nowa strona</span>
                  </button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {activeTeamPages.slice(0, 6).map((pg) => (
                    <div
                      key={pg.id}
                      onClick={() => {
                        setActivePageId(pg.id);
                        setActiveView('doc');
                      }}
                      className="px-2.5 py-1.5 rounded-[4px] hover:bg-white dark:hover:bg-[#191919] flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <span className="truncate font-medium">
                        {pg.icon || '📄'} {pg.title || 'Bez tytułu'}
                      </span>
                      <span className="text-[10px] text-[#787774] font-mono shrink-0 ml-2">
                        Otwórz
                      </span>
                    </div>
                  ))}
                  {activeTeamPages.length === 0 && (
                    <div className="text-xs text-[#787774] py-2">
                      Brak stron. Kliknij „+ Nowa strona”, aby utworzyć dokument.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Embedded Live Linked Database Views (Projects, Tasks, Meetings) */}
            <div className="space-y-6">
              <LinkedDatabaseBlockView
                block={teamProjectsBlock}
                onUpdate={(patch) => setTeamProjectsBlock((prev) => ({ ...prev, ...patch }))}
              />

              <LinkedDatabaseBlockView
                block={teamTasksBlock}
                onUpdate={(patch) => setTeamTasksBlock((prev) => ({ ...prev, ...patch }))}
              />

              <LinkedDatabaseBlockView
                block={teamMeetingsBlock}
                onUpdate={(patch) => setTeamMeetingsBlock((prev) => ({ ...prev, ...patch }))}
              />
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 2: TEAM MEMBERS & DIRECTORY                                   */}
        {/* ===================================================================== */}
        {activeSubSection === 'members' && (
          <div className="space-y-6">
            <form
              onSubmit={handleAddMember}
              className="p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] flex flex-wrap items-center gap-2 text-xs"
            >
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Imię / rola..."
                className="px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] outline-none"
              />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Adres e-mail członka zespołu..."
                className="flex-1 min-w-[200px] px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] outline-none"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                className="px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] outline-none"
              >
                <option value="Editor">Editor</option>
                <option value="Admin">Admin</option>
                <option value="Viewer">Viewer</option>
              </select>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-[4px] bg-[#2383e2] text-white font-medium cursor-pointer flex items-center gap-1"
              >
                <UserPlus size={13} />
                <span>Dodaj osobę</span>
              </button>
            </form>

            <div className="border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] divide-y divide-[rgba(55,53,47,0.06)]">
              {(currentWorkspace.members || []).map((m) => (
                <div
                  key={m.userId}
                  className="p-3 flex items-center justify-between text-xs hover:bg-[#fbfbfa] dark:hover:bg-[#202020]"
                >
                  <div>
                    <div className="font-semibold text-[#37352f] dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-[#787774]">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateMemberRole(currentWorkspace.id, m.userId, e.target.value as TeamRole)
                      }
                      className="px-2 py-0.5 rounded border border-[rgba(55,53,47,0.12)] bg-transparent text-[11px]"
                    >
                      {Object.keys(ROLE_CONFIG).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {m.role !== 'Owner' && (
                      <button
                        onClick={() => removeTeamMember(currentWorkspace.id, m.userId)}
                        className="p-1 text-[#787774] hover:text-rose-600 cursor-pointer"
                        title="Usuń z zespołu"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 3: ANNOUNCEMENTS                                              */}
        {/* ===================================================================== */}
        {activeSubSection === 'announcements' && (
          <div className="space-y-4">
            <form
              onSubmit={handleAddAnnouncement}
              className="p-4 rounded-[6px] bg-[#fbfbfa] dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] space-y-2.5 text-xs"
            >
              <input
                type="text"
                value={newAnnTitle}
                onChange={(e) => setNewAnnTitle(e.target.value)}
                placeholder="Tytuł ogłoszenia..."
                className="w-full px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] outline-none font-semibold"
              />
              <textarea
                rows={2}
                value={newAnnContent}
                onChange={(e) => setNewAnnContent(e.target.value)}
                placeholder="Treść ogłoszenia dla zespołu..."
                className="w-full px-2.5 py-1.5 rounded-[4px] bg-white dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] outline-none resize-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-[4px] bg-[#2383e2] text-white font-medium cursor-pointer"
              >
                Opublikuj komunikat
              </button>
            </form>

            <div className="space-y-2">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-3.5 rounded-[6px] border border-[rgba(55,53,47,0.09)] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-[#37352f] dark:text-white">
                      📌 {ann.title}
                    </div>
                    <p className="text-[#787774] leading-relaxed">{ann.content}</p>
                  </div>
                  <button
                    onClick={() =>
                      setAnnouncements((prev) => prev.filter((a) => a.id !== ann.id))
                    }
                    className="text-[#787774] hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SECTION 4: TEAMSPACE SETTINGS                                         */}
        {/* ===================================================================== */}
        {activeSubSection === 'settings' && (
          <div className="max-w-lg space-y-4 text-xs">
            <div className="p-4 rounded-[6px] border border-[rgba(55,53,47,0.09)] space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                  Ikona i nazwa przestrzeni
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    className="px-2 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.12)] bg-transparent text-base"
                  >
                    {TEAM_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.12)] bg-transparent font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#787774] mb-1">
                  Opis przestrzeni
                </label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.12)] bg-transparent resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={async () => {
                    await updateTeamSettings(currentWorkspace.id, {
                      name: editName.trim() || currentWorkspace.name,
                      icon: editIcon,
                      description: editDesc.trim(),
                    });
                    showToast('Zapisano ustawienia przestrzeni.');
                  }}
                  className="px-3 py-1.5 rounded-[4px] bg-[#2383e2] text-white font-medium cursor-pointer"
                >
                  Zapisz zmiany
                </button>

                {currentWorkspace.id !== 'ws-personal' && (
                  <button
                    onClick={() => deleteTeamWorkspace(currentWorkspace.id)}
                    className="px-3 py-1.5 rounded-[4px] text-rose-600 hover:bg-rose-50 font-medium cursor-pointer"
                  >
                    Usuń Teamspace
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create New Teamspace Modal */}
      {isCreatingTeam && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTeam}
            className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] rounded-[8px] max-w-md w-full p-5 space-y-4 text-xs shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#37352f] dark:text-white">
                Nowy Teamspace
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingTeam(false)}
                className="text-[#787774] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={newTeamIcon}
                onChange={(e) => setNewTeamIcon(e.target.value)}
                className="px-2 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.15)] bg-transparent text-base"
              >
                {TEAM_ICONS.map((ic) => (
                  <option key={ic} value={ic}>
                    {ic}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Nazwa przestrzeni (np. Product & Engineering)..."
                className="flex-1 px-2.5 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.15)] bg-transparent outline-none"
              />
            </div>

            <textarea
              rows={2}
              value={newTeamDesc}
              onChange={(e) => setNewTeamDesc(e.target.value)}
              placeholder="Cel i zakres przestrzeni..."
              className="w-full px-2.5 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.15)] bg-transparent outline-none resize-none"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingTeam(false)}
                className="px-3 py-1.5 rounded-[4px] border border-[rgba(55,53,47,0.15)] cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-[4px] bg-[#2383e2] text-white font-medium cursor-pointer"
              >
                Utwórz
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
