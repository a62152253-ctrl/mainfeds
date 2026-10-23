export type BlockType =
  | 'p'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'quote'
  | 'lead'
  | 'subtext'
  | 'bullet'
  | 'number'
  | 'todo'
  | 'toggle'
  | 'numbered_toggle'
  | 'tabs'
  | 'callout'
  | 'callout_info'
  | 'callout_success'
  | 'callout_warning'
  | 'callout_danger'
  | 'callout_tip'
  | 'key_takeaway'
  | 'code'
  | 'terminal'
  | 'math'
  | 'json'
  | 'diff'
  | 'sql'
  | 'table'
  | 'stat'
  | 'stat_grid'
  | 'progress'
  | 'rating'
  | 'poll'
  | 'image'
  | 'video'
  | 'audio'
  | 'bookmark'
  | 'file'
  | 'embed'
  | 'map'
  | 'badge'
  | 'divider'
  | 'spacer'
  | 'columns_2'
  | 'columns_3'
  | 'card'
  | 'timeline'
  | 'button'
  | 'alert_banner'
  | 'ai_prompt'
  | 'signature'
  | 'pros_cons'
  | 'mermaid'
  | 'kanban_board'
  | 'countdown'
  | 'faq'
  | 'before_after'
  | 'user_mention'
  | 'file_card'
  | 'changelog'
  | 'testimonial'
  | 'target_meter'
  | 'decision_matrix'
  | 'risk_register'
  | 'milestone_roadmap'
  | 'api_endpoint'
  | 'swot_analysis'
  | 'user_story'
  | 'math_equation_card'
  | 'stepper'
  | 'kpi_scorecard'
  | 'pros_cons_matrix'
  | 'code_sandbox'
  | 'audio_memo'
  | 'team_directory'
  | 'interactive_poll'
  | 'citation_source'
  | 'event_schedule'
  | 'embed_figma'
  | 'embed_github'
  | 'summary_box'
  | 'announcement_banner'
  | 'spec_table'
  | 'persona_card'
  | 'release_notes'
  | 'data_metric_bar'
  | 'meeting_action_item'
  | 'chart'
  | 'linked_database';

export interface LinkedDatabaseBlockData {
  entityKind: 'projects' | 'tasks' | 'meetings';
  viewMode: 'table' | 'board' | 'calendar' | 'list' | 'gallery';
  projectFilter?: string; // 'auto' (current page if Project) or specific project ID
  statusFilter?: string;
  priorityFilter?: string;
  ownerFilter?: string;
  title?: string;
  searchQuery?: string;
  limit?: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartBlockData {
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  title: string;
  unit?: string;
  dataPoints: ChartDataPoint[];
  sourceLabel?: string;
}

export interface DocBlock {
  id: string;
  type: BlockType;
  content: string;
  order?: number; // block ordering index
  parentId?: string; // nested/child block parent ID
  childrenIds?: string[]; // IDs of nested blocks
  indent?: number; // indentation level for hierarchy (0-5)
  relatedBlockIds?: string[]; // links/relations to other blocks
  checked?: boolean; // for todo
  calloutType?: 'info' | 'success' | 'warning' | 'danger' | 'tip';
  language?: string; // for code
  toggleDetails?: string; // for toggle, timeline details, columns, etc.
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string; // for video / youtube
  audioUrl?: string; // for audio / podcast
  bookmarkUrl?: string;
  bookmarkTitle?: string;
  bookmarkDesc?: string;
  tableData?: string[][]; // for interactive tables, tabs, polls
  taskId?: string; // linked task ID for data consistency!
  statValue?: string; // for stat/kpi block
  statTrend?: string;
  progressPercent?: number; // for progress block (0-100)
  ratingStars?: number; // for rating block (1-5)
  pollOptions?: { label: string; votes: number }[]; // for poll block
  activeTabIndex?: number; // for tabs block
  buttonUrl?: string; // for button/cta
  buttonColor?: string;
  timelineDate?: string; // for timeline block or signature date
  fileName?: string; // for file block
  fileSize?: string;
  fileUrl?: string;
  embedUrl?: string; // for embed iframe
  textColor?: string; // custom block text color
  bgColor?: string; // custom block background color
  textAlign?: 'left' | 'center' | 'right'; // text alignment
  lockedBy?: { userId: string; userName: string; userEmail: string; lockedAt: number } | null; // Section Locking
  targetDate?: string; // for countdown / timer (e.g. '2026-11-01T12:00')
  countdownTitle?: string; // for countdown event label
  faqItems?: { question: string; answer: string; isOpen?: boolean }[]; // for faq block
  beforeAfterData?: { beforeTitle: string; beforePoints: string[]; afterTitle: string; afterPoints: string[] }; // for before_after
  mentionUser?: { name: string; email?: string; role?: string; avatar?: string; status?: string }; // for user_mention
  changelogData?: { version: string; releaseDate: string; items: { type: 'added' | 'fixed' | 'changed' | 'security'; text: string }[] }; // for changelog
  quoteAuthor?: string; // for testimonial
  quoteRole?: string; // for testimonial
  quoteCompany?: string; // for testimonial
  quoteAvatar?: string; // for testimonial
  gaugeData?: { current: number; target: number; unit: string; label: string }; // for target_meter
  diagramSyntax?: string; // for mermaid / diagram
  diagramType?: 'flowchart' | 'sequence' | 'mindmap' | 'architecture'; // for mermaid
  kanbanColumns?: { id: string; title: string; color: string; items: { id: string; title: string; tag?: string }[] }[]; // for kanban_board
  decisionMatrixData?: { criteria: string[]; options: { name: string; scores: number[]; totalScore: number }[] }; // for decision_matrix
  riskRegisterData?: { risk: string; likelihood: 'Niska' | 'Średnia' | 'Wysoka'; impact: 'Niski' | 'Średni' | 'Wysoki' | 'Krytyczny'; mitigation: string }[]; // for risk_register
  roadmapData?: { quarter: string; title: string; status: 'completed' | 'in_progress' | 'planned'; owner?: string }[]; // for milestone_roadmap
  apiEndpointData?: { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; path: string; status: number; responseJson?: string }; // for api_endpoint
  swotData?: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }; // for swot_analysis
  userStoryData?: { role: string; action: string; benefit: string; acceptanceCriteria: string[] }; // for user_story
  stepperData?: { steps: { label: string; desc: string; done: boolean }[]; currentStepIndex: number }; // for stepper
  kpiScorecardData?: { metricName: string; currentValue: string; targetValue: string; trendPercent: string; status: 'on_track' | 'at_risk' | 'behind' }; // for kpi_scorecard
  codeSandboxData?: { code: string; language: string; outputConsole?: string }; // for code_sandbox
  audioMemoData?: { title: string; duration: string; recordedAt?: string; audioBlobUrl?: string }; // for audio_memo
  teamMembers?: { name: string; role: string; email: string; avatarUrl?: string }[]; // for team_directory
  citationData?: { title: string; authors: string; journalOrSource: string; year: string; doi?: string; url?: string }; // for citation_source
  eventScheduleData?: { timeStart: string; timeEnd: string; title: string; speakerOrLead?: string; roomOrLink?: string }; // for event_schedule
  specTableData?: { key: string; value: string; note?: string }[]; // for spec_table
  personaData?: { name: string; role: string; quote: string; goals: string[]; painPoints: string[] }; // for persona_card
  announcementData?: { title: string; message: string; bannerType: 'info' | 'success' | 'warning' | 'alert'; actionText?: string }; // for announcement_banner
  chartData?: ChartBlockData; // for interactive SVG chart block (#CHART#)
  linkedDatabaseData?: LinkedDatabaseBlockData; // for embedded linked database view (#LINKED_DB#)
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'general' | 'team' | 'doc' | 'task' | 'comment';

export interface WorkspaceNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: NotificationType;
  category?: NotificationCategory;
  pageId?: string;
  teamId?: string;
  taskId?: string;
  actionLabel?: string;
}

export interface WorkspaceResource {
  id: string;
  name: string;
  url: string; // base64 or url
  size: string;
  createdAt: number;
}

export type Priority = 'Niski' | 'Średni' | 'Wysoki' | 'Krytyczny';
export type TaskStatus = 'Do zrobienia' | 'W trakcie' | 'Zrobione';
export type PropertyType =
  | 'text'
  | 'number'
  | 'date'
  | 'status'
  | 'person'
  | 'relation'
  | 'checkbox'
  | 'url'
  | 'select'
  | 'multi_select';

export interface TaskItem {
  id: string;
  ownerId?: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  tag: string;
  pageId?: string;
  assignee?: string;
  workspaceId?: string;
  teamId?: string;
  estimatedHours?: number; // Workload & Burnout estimation
  url?: string;
  isCompleted?: boolean;
  relationPageId?: string;
  relationPageTitle?: string;
  selectVal?: string;
  multiSelect?: string[];
  coverImage?: string;
  description?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  customProperties?: Record<string, any>;
  createdAt?: number;
  updatedAt?: number;
}

export interface PageComment {
  id: string;
  blockId?: string; // Linked block for contextual discussions
  author: string;
  authorId?: string;
  authorEmail?: string;
  avatar: string;
  text: string;
  timestamp: number;
  resolved: boolean;
  replies?: {
    id?: string;
    author: string;
    authorId?: string;
    authorEmail?: string;
    avatar?: string;
    text: string;
    timestamp: number;
  }[];
}

export interface CollaboratorPresence {
  userId: string;
  userName: string;
  userEmail: string;
  userColor: string;
  userAvatar?: string;
  activeBlockId?: string;
  cursor?: { x: number; y: number };
  lastActive: number;
  isTyping?: boolean;
}

export interface PageVersion {
  id: string;
  timestamp: number;
  label: string;
  title: string;
  blocks: DocBlock[];
}

export type PageType =
  | 'Note'
  | 'Document'
  | 'Project'
  | 'Database'
  | 'Collection'
  | 'TaskList'
  | 'Research'
  | 'Meeting'
  | 'Task';

export type UserProfileType =
  | 'Student'
  | 'Developer'
  | 'Founder'
  | 'Team / Company'
  | 'Personal'
  | 'Other';

export type NotionAccessRole = 'full_access' | 'can_edit' | 'can_comment' | 'can_view';

export interface PagePermissions {
  accessLevel: 'private' | 'workspace' | 'public';
  allowedUserIds?: string[];
  role?: 'Owner' | 'Admin' | 'Editor' | 'Viewer' | NotionAccessRole;
}

export interface SharedCollaborator {
  email: string;
  name?: string;
  role: NotionAccessRole | 'admin' | 'editor' | 'viewer';
  addedAt: number;
}

export interface WorkspacePage {
  id: string;
  pageType?: PageType;
  ownerId?: string;
  workspaceId?: string;
  teamId?: string;
  authorName?: string;
  authorPhoto?: string;
  title: string;
  icon: string;
  coverGradient?: string;
  folderId?: string;
  parentPageId?: string; // ID of parent page for subpage hierarchy tree
  inheritPermissions?: boolean; // Whether to inherit access from parentPageId
  blocks: DocBlock[];
  metadata?: Record<string, any>;
  permissions?: PagePermissions;
  sharedWith?: string[]; // Adresy e-mail mające dostęp (np. kamill@eskp.pl)
  sharedCollaborators?: SharedCollaborator[]; // Lista współpracowników z rolą full_access / can_edit / can_comment / can_view
  isFavorite: boolean;
  isDeleted: boolean;
  isPublic: boolean;
  publicSlug?: string;
  tags: string[];
  comments: PageComment[];
  versions: PageVersion[];
  viewsCount?: number;
  likesCount?: number;
  lastEditedBy?: string;
  lastViewedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Walidacja składni adresu email według standardu RFC 5322
 */
export function isValidRfcEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const rfcRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return rfcRegex.test(trimmed);
}

/**
 * Mapuje legacy role do standardu ról Notion
 */
export function normalizeAccessRole(role?: string): NotionAccessRole {
  if (!role) return 'can_view';
  if (role === 'admin' || role === 'Owner' || role === 'Admin' || role === 'full_access') return 'full_access';
  if (role === 'editor' || role === 'Editor' || role === 'can_edit') return 'can_edit';
  if (role === 'can_comment') return 'can_comment';
  return 'can_view';
}

/**
 * Waliduje i migruje dowolny obiekt strony do aktualnego modelu WorkspacePage
 */
export function validateAndMigratePage(raw: any): WorkspacePage {
  const now = Date.now();
  const id = raw?.id || `page-${now}-${Math.random().toString(36).slice(2, 6)}`;
  const title = typeof raw?.title === 'string' && raw.title.trim() ? raw.title : 'Bez tytułu';
  const icon = typeof raw?.icon === 'string' ? raw.icon : '📄';

  let rawBlocks = Array.isArray(raw?.blocks) ? raw.blocks : [];
  if (rawBlocks.length === 0) {
    rawBlocks = [{ id: `b-${now}-0`, type: 'p', content: '' }];
  }

  // Wzbogacenie bloków o metadane porządkowe
  const blocks: DocBlock[] = rawBlocks.map((b: any, idx: number) => ({
    id: b?.id || `b-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    type: b?.type || 'p',
    content: typeof b?.content === 'string' ? b.content : '',
    order: typeof b?.order === 'number' ? b.order : idx,
    indent: typeof b?.indent === 'number' ? b.indent : 0,
    parentId: b?.parentId,
    childrenIds: Array.isArray(b?.childrenIds) ? b.childrenIds : undefined,
    relatedBlockIds: Array.isArray(b?.relatedBlockIds) ? b.relatedBlockIds : undefined,
    checked: typeof b?.checked === 'boolean' ? b.checked : undefined,
    calloutType: b?.calloutType,
    language: b?.language,
    toggleDetails: b?.toggleDetails,
    imageUrl: b?.imageUrl,
    imageCaption: b?.imageCaption,
    videoUrl: b?.videoUrl,
    audioUrl: b?.audioUrl,
    bookmarkUrl: b?.bookmarkUrl,
    bookmarkTitle: b?.bookmarkTitle,
    bookmarkDesc: b?.bookmarkDesc,
    tableData: Array.isArray(b?.tableData) ? b.tableData : undefined,
    taskId: b?.taskId,
    statValue: b?.statValue,
    statTrend: b?.statTrend,
    progressPercent: b?.progressPercent,
    ratingStars: b?.ratingStars,
    pollOptions: b?.pollOptions,
    activeTabIndex: b?.activeTabIndex,
    buttonUrl: b?.buttonUrl,
    buttonColor: b?.buttonColor,
    timelineDate: b?.timelineDate,
    fileName: b?.fileName,
    fileSize: b?.fileSize,
    fileUrl: b?.fileUrl,
    embedUrl: b?.embedUrl,
    textColor: b?.textColor,
    bgColor: b?.bgColor,
    lockedBy: b?.lockedBy,
    targetDate: b?.targetDate,
    countdownTitle: b?.countdownTitle,
    faqItems: b?.faqItems,
    beforeAfterData: b?.beforeAfterData,
    mentionUser: b?.mentionUser,
    changelogData: b?.changelogData,
    quoteAuthor: b?.quoteAuthor,
    quoteRole: b?.quoteRole,
    quoteCompany: b?.quoteCompany,
    quoteAvatar: b?.quoteAvatar,
    gaugeData: b?.gaugeData,
    diagramSyntax: b?.diagramSyntax,
    diagramType: b?.diagramType,
    kanbanColumns: b?.kanbanColumns,
    decisionMatrixData: b?.decisionMatrixData,
    riskRegisterData: b?.riskRegisterData,
    roadmapData: b?.roadmapData,
    apiEndpointData: b?.apiEndpointData,
    swotData: b?.swotData,
    userStoryData: b?.userStoryData,
    stepperData: b?.stepperData,
    kpiScorecardData: b?.kpiScorecardData,
    codeSandboxData: b?.codeSandboxData,
    audioMemoData: b?.audioMemoData,
    teamMembers: b?.teamMembers,
    citationData: b?.citationData,
    eventScheduleData: b?.eventScheduleData,
    specTableData: b?.specTableData,
    personaData: b?.personaData,
    announcementData: b?.announcementData,
    chartData: b?.chartData,
    linkedDatabaseData: b?.linkedDatabaseData,
  }));

  // Inteligentne wykrywanie PageType
  let pageType: PageType = raw?.pageType || 'Document';
  if (!raw?.pageType) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('spotkani') || titleLower.includes('meeting') || titleLower.includes('protokół')) {
      pageType = 'Meeting';
    } else if (titleLower.includes('badani') || titleLower.includes('research') || titleLower.includes('raport')) {
      pageType = 'Research';
    } else if (titleLower.includes('zadań') || titleLower.includes('task') || titleLower.includes('todo') || titleLower.includes('sprint')) {
      pageType = 'TaskList';
    } else if (titleLower.includes('projekt') || titleLower.includes('project')) {
      pageType = 'Project';
    } else if (titleLower.includes('baza') || titleLower.includes('database')) {
      pageType = 'Database';
    } else if (titleLower.includes('kolekcj') || titleLower.includes('collection')) {
      pageType = 'Collection';
    } else if (blocks.length <= 4) {
      pageType = 'Note';
    }
  }

  return {
    id,
    pageType,
    title,
    icon,
    coverGradient: raw?.coverGradient,
    folderId: raw?.folderId,
    parentPageId: raw?.parentPageId || undefined,
    inheritPermissions: typeof raw?.inheritPermissions === 'boolean' ? raw.inheritPermissions : true,
    workspaceId: raw?.workspaceId || 'ws-personal',
    teamId: raw?.teamId,
    ownerId: raw?.ownerId,
    authorName: raw?.authorName,
    authorPhoto: raw?.authorPhoto,
    blocks,
    metadata: raw?.metadata || {},
    permissions: raw?.permissions || {
      accessLevel: raw?.isPublic ? 'public' : 'workspace',
      role: 'Owner',
    },
    sharedWith: Array.isArray(raw?.sharedWith) ? raw.sharedWith : [],
    sharedCollaborators: Array.isArray(raw?.sharedCollaborators) ? raw.sharedCollaborators : [],
    isFavorite: Boolean(raw?.isFavorite),
    isDeleted: Boolean(raw?.isDeleted),
    isPublic: Boolean(raw?.isPublic),
    publicSlug: raw?.publicSlug,
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    comments: Array.isArray(raw?.comments) ? raw.comments : [],
    versions: Array.isArray(raw?.versions) ? raw.versions : [],
    viewsCount: typeof raw?.viewsCount === 'number' ? raw.viewsCount : 0,
    likesCount: typeof raw?.likesCount === 'number' ? raw.likesCount : 0,
    lastEditedBy: raw?.lastEditedBy,
    lastViewedAt: typeof raw?.lastViewedAt === 'number' ? raw?.lastViewedAt : now,
    createdAt: typeof raw?.createdAt === 'number' ? raw.createdAt : now,
    updatedAt: typeof raw?.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

export interface WorkspaceFolder {
  id: string;
  ownerId?: string;
  name: string;
  icon?: string;
  parentId?: string; // for nested folders
  createdAt?: number;
}

export interface PublicPage {
  id: string;
  ownerId: string;
  authorName: string;
  authorPhoto?: string;
  title: string;
  icon: string;
  coverGradient?: string;
  blocks: DocBlock[];
  publicSlug?: string;
  tags: string[];
  viewsCount: number;
  likesCount: number;
  updatedAt: number;
}

export type TeamRole = 'Owner' | 'Admin' | 'Editor' | 'Viewer';

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  joinedAt: number;
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  inviterEmail: string;
  inviterId?: string;
  inviteeEmail: string;
  role: TeamRole;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface TeamWorkspace {
  id: string;
  name: string;
  ownerId: string;
  icon?: string;
  description?: string;
  members: TeamMember[];
  memberUids?: string[];
  createdAt: number;
}

export interface UserSearchRecord {
  id: string;
  query: string;
  summary?: string;
  sourcesCount?: number;
  sources?: { title: string; url: string; snippet?: string }[];
  timestamp: number;
  pageId?: string;
  topic?: string;
}

export type WorkspaceView =
  | 'home'
  | 'ai'
  | 'doc'
  | 'all-pages'
  | 'projects'
  | 'tasks'
  | 'meetings'
  | 'kanban'
  | 'database'
  | 'calendar'
  | 'public'
  | 'trash'
  | 'teams'
  | 'searches'
  | 'settings'
  | 'admin';
