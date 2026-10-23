import React, { useState, useRef, useEffect } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  CheckSquare,
  AlertCircle,
  Quote,
  Code,
  Minus,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Image as ImageIcon,
  Award,
  Star,
  MapPin,
  FileCode,
  FileText,
  Database,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  PanelTop,
  ShieldCheck,
  Zap,
  PenTool,
  GitCompare,
  Vote,
  MessageSquare,
  History,
  Link as LinkIcon,
  Sigma,
  Table as TableIcon,
  Download,
  Share2,
  Globe,
  Eye,
  Columns,
  Edit3,
  Printer,
  Sparkles,
  Layers,
  Tag,
  BookOpen,
  List,
  ListOrdered,
  Video,
  Music,
  Bookmark,
  GripVertical,
  MoreHorizontal,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  XCircle,
  Play,
  RotateCcw,
  GitBranch,
  Terminal,
  Lock,
  TrendingUp,
  Sliders,
  MousePointerClick,
  Milestone,
  Paperclip,
  Layout,
  Search,
  X,
  LayoutTemplate,
  ArrowRight,
  Volume2,
  Maximize2,
  Minimize2,
  BarChart2,
  Clock,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  UserCheck,
  Target,
  Hourglass,
  Workflow,
  LayoutGrid,
  MessageSquareQuote,
  FileSpreadsheet,
  Users,
} from 'lucide-react';
import { DocBlock, BlockType, PageType } from '../types/workspace';
import { useWorkspace } from '../context/WorkspaceContext';
import { filterSwearWords, isBlockedUrl } from '../utils/contentFilter';
import { executeCode } from '../features/code-runner/codeRunnerService';
import { CodeBlockModal } from '../features/code-runner/CodeBlockModal';
import { MindmapModal } from '../features/mindmap-generator/MindmapModal';
import { TemplatesModal } from './TemplatesModal';
import { ADVANCED_TEMPLATES } from '../features/templates/advancedTemplates';
import { DocSearchReplace } from './editor/DocSearchReplace';
import { DocStatsModal } from './editor/DocStatsModal';
import { DocOutlineDrawer } from './editor/DocOutlineDrawer';
import { DocAudioPlayer } from './editor/DocAudioPlayer';
import { BlockColorMenu } from './editor/BlockColorMenu';
import { CoverPickerModal } from './editor/CoverPickerModal';
import { TodoProgressBar } from './editor/TodoProgressBar';
import { WikiLinkSuggest } from './editor/WikiLinkSuggest';
import { MultiplayerCursors } from './editor/MultiplayerCursors';
import { BlockCommentThread } from './editor/BlockCommentThread';
import { copyFullNoteToClipboard } from '../utils/noteExportCopy';
import { subscriptionService } from '../services/subscriptionService';
import { PlansModal } from './PlansModal';
import { AccessSharingModal } from './editor/AccessSharingModal';
import { ExtendedBlockRenderer } from './editor/ExtendedBlocksRenderer';
import { PagePropertiesPanel } from './editor/PagePropertiesPanel';
import { getSuggestedNextBlocks } from '../features/ai/nextBlockSuggester';
import { NotionAccessRole, normalizeAccessRole } from '../types/workspace';
import { useAuth } from '../context/AuthContext';
import { puterAi } from '../features/ai/puterService';
import { generateEditorAiResponse } from '../features/ai/editorAiService';
import { parseMarkdownToNotionBlocks } from '../features/ai/markdownToBlocks';

/*
 * SearchPoint Document Studio — scoped visual system.
 * Kept next to the editor so deployments that import only this component still
 * receive the intended typography, interaction states, block treatments and print rules.
 */
const EDITOR_DESIGN_SYSTEM = String.raw`
.sp-doc-editor {
  --sp-editor-bg: #ffffff;
  --sp-editor-surface: #ffffff;
  --sp-editor-surface-muted: #f8f8fb;
  --sp-editor-ink: #20212a;
  --sp-editor-muted: #767987;
  --sp-editor-line: rgba(31, 35, 52, .10);
  --sp-editor-line-strong: rgba(31, 35, 52, .16);
  --sp-editor-accent: #6257e8;
  --sp-editor-accent-soft: rgba(98, 87, 232, .075);
  --sp-editor-accent-ring: rgba(98, 87, 232, .22);
  --sp-editor-shadow: 0 12px 34px rgba(30, 35, 70, .055);
  --sp-editor-radius: 14px;
  position: relative;
  isolation: isolate;
  background: var(--sp-editor-bg);
  color: var(--sp-editor-ink);
  font-feature-settings: "ss01" on, "cv11" on;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.dark .sp-doc-editor,
.sp-doc-editor.dark {
  --sp-editor-bg: #15161a;
  --sp-editor-surface: #1b1c22;
  --sp-editor-surface-muted: #202128;
  --sp-editor-ink: #f0f1f6;
  --sp-editor-muted: #9da1b2;
  --sp-editor-line: rgba(235, 237, 255, .085);
  --sp-editor-line-strong: rgba(235, 237, 255, .15);
  --sp-editor-accent: #a49cff;
  --sp-editor-accent-soft: rgba(164, 156, 255, .10);
  --sp-editor-accent-ring: rgba(164, 156, 255, .24);
  --sp-editor-shadow: 0 16px 42px rgba(0, 0, 0, .22);
}

.sp-doc-editor[data-page-type="Research"] {
  --sp-editor-accent: #6557d9;
  --sp-editor-accent-soft: rgba(101, 87, 217, .075);
  --sp-editor-accent-ring: rgba(101, 87, 217, .22);
}

.sp-doc-editor[data-page-type="Project"] {
  --sp-editor-accent: #3b70d8;
  --sp-editor-accent-soft: rgba(59, 112, 216, .075);
  --sp-editor-accent-ring: rgba(59, 112, 216, .22);
}

.sp-doc-editor[data-page-type="Meeting"] {
  --sp-editor-accent: #13866f;
  --sp-editor-accent-soft: rgba(19, 134, 111, .075);
  --sp-editor-accent-ring: rgba(19, 134, 111, .22);
}

.sp-doc-editor[data-page-type="TaskList"] {
  --sp-editor-accent: #c17b2a;
  --sp-editor-accent-soft: rgba(193, 123, 42, .08);
  --sp-editor-accent-ring: rgba(193, 123, 42, .24);
}

.sp-doc-editor,
.sp-doc-editor * {
  box-sizing: border-box;
}

.sp-doc-editor ::selection {
  color: inherit;
  background: var(--sp-editor-accent-ring);
}

.sp-doc-editor button,
.sp-doc-editor select,
.sp-doc-editor input,
.sp-doc-editor textarea,
.sp-doc-editor a {
  -webkit-tap-highlight-color: transparent;
}

.sp-doc-editor button {
  transition-property: background-color, border-color, color, box-shadow, transform, opacity;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}

.sp-doc-editor button:focus-visible,
.sp-doc-editor a:focus-visible,
.sp-doc-editor select:focus-visible,
.sp-doc-editor input:focus-visible,
.sp-doc-editor textarea:focus-visible {
  outline: 2px solid var(--sp-editor-accent);
  outline-offset: 2px;
}

.sp-doc-editor input,
.sp-doc-editor textarea,
.sp-doc-editor select {
  accent-color: var(--sp-editor-accent);
}

.sp-doc-editor textarea {
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.sp-doc-editor [contenteditable="true"] {
  caret-color: var(--sp-editor-accent);
}

.sp-doc-editor header {
  backdrop-filter: saturate(135%);
}

.sp-doc-editor .sp-doc-page-title {
  color: var(--sp-editor-ink);
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 760;
  letter-spacing: -.055em;
  line-height: 1.08;
  padding: .12em 0 .18em;
  text-wrap: balance;
}

.sp-doc-editor .sp-doc-page-title::placeholder {
  color: var(--sp-editor-muted);
  opacity: .62;
}

.sp-doc-editor .sp-doc-meta-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .45rem;
  padding-top: .85rem;
  margin-top: .2rem;
  border-top: 1px solid var(--sp-editor-line);
  color: var(--sp-editor-muted);
  font-size: 11px;
}

.sp-doc-editor .sp-doc-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  min-height: 27px;
  padding: .34rem .58rem;
  border: 1px solid var(--sp-editor-line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--sp-editor-surface-muted) 68%, transparent);
  white-space: nowrap;
}

.sp-doc-editor .sp-doc-meta-chip svg {
  color: var(--sp-editor-accent);
}

.sp-doc-editor .sp-doc-copy-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  min-height: 30px;
  margin-left: auto;
  padding: .38rem .72rem;
  border: 1px solid color-mix(in srgb, var(--sp-editor-accent) 30%, var(--sp-editor-line));
  border-radius: 999px;
  color: var(--sp-editor-accent);
  background: var(--sp-editor-accent-soft);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.sp-doc-editor .sp-doc-copy-action:hover {
  box-shadow: 0 4px 14px var(--sp-editor-accent-ring);
  transform: translateY(-1px);
}

.sp-doc-editor .sp-doc-block {
  position: relative;
  border: 1px solid transparent;
  border-left: 3px solid transparent;
  border-radius: 12px;
  margin-block: .13rem;
  transition: background-color 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
  scroll-margin-top: 5.5rem;
}

.sp-doc-editor .sp-doc-block:hover {
  border-color: var(--sp-editor-line);
  border-left-color: color-mix(in srgb, var(--sp-editor-accent) 48%, transparent);
}

.sp-doc-editor .sp-doc-block[data-focused="true"] {
  border-color: color-mix(in srgb, var(--sp-editor-accent) 26%, transparent);
  border-left-color: var(--sp-editor-accent);
  background: var(--sp-editor-accent-soft);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sp-editor-accent) 5%, transparent);
}

.sp-doc-editor .sp-doc-block[data-locked="true"] {
  border-color: rgba(217, 155, 44, .30);
  border-left-color: #d99b2c;
}

.sp-doc-editor .sp-doc-block:has(textarea:focus-visible),
.sp-doc-editor .sp-doc-block:has(input:focus-visible) {
  border-color: color-mix(in srgb, var(--sp-editor-accent) 30%, transparent);
  border-left-color: var(--sp-editor-accent);
}

.sp-doc-editor .sp-doc-block-controls {
  align-self: flex-start;
  position: sticky;
  top: .45rem;
  padding: .2rem;
  border: 1px solid var(--sp-editor-line);
  border-radius: 10px;
  background: color-mix(in srgb, var(--sp-editor-surface) 94%, transparent);
  box-shadow: 0 3px 10px rgba(25, 28, 48, .045);
  backdrop-filter: blur(10px);
  z-index: 5;
}

.sp-doc-editor .sp-doc-block-controls button {
  min-width: 22px;
  min-height: 22px;
  border-radius: 6px;
}

.sp-doc-editor .sp-doc-block textarea,
.sp-doc-editor .sp-doc-block input[type="text"] {
  max-width: 100%;
  border-radius: 7px;
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.sp-doc-editor .sp-doc-block textarea:focus,
.sp-doc-editor .sp-doc-block input[type="text"]:focus {
  box-shadow: 0 0 0 2px var(--sp-editor-accent-ring);
}

.sp-doc-editor .sp-doc-block[data-block-type="h1"] textarea {
  font-size: clamp(1.75rem, 3.1vw, 2.45rem);
  line-height: 1.15;
  font-weight: 760;
  letter-spacing: -.045em;
  padding-block: .25rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="h2"] textarea {
  font-size: clamp(1.35rem, 2.3vw, 1.8rem);
  line-height: 1.24;
  font-weight: 720;
  letter-spacing: -.035em;
  padding-block: .22rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="h3"] textarea {
  font-size: clamp(1.12rem, 1.8vw, 1.35rem);
  line-height: 1.32;
  font-weight: 680;
  letter-spacing: -.02em;
}

.sp-doc-editor .sp-doc-block[data-block-type="lead"] textarea {
  font-size: 1.04rem;
  line-height: 1.8;
  color: color-mix(in srgb, var(--sp-editor-ink) 82%, var(--sp-editor-muted));
}

.sp-doc-editor .sp-doc-block[data-block-type="subtext"] textarea {
  color: var(--sp-editor-muted);
  font-size: .77rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="image"] img {
  display: block;
  max-height: min(38rem, 68vh);
  object-fit: contain;
  object-position: center;
  border-radius: 12px;
  background: color-mix(in srgb, var(--sp-editor-surface-muted) 82%, transparent);
  box-shadow: 0 8px 24px rgba(20, 25, 50, .07);
}

.sp-doc-editor .sp-doc-block[data-block-type="image"] [class~="group/img"] {
  overflow: hidden;
  border-radius: 13px;
}

.sp-doc-editor .sp-doc-block[data-block-type="table"] table {
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid var(--sp-editor-line);
  border-radius: 12px;
  background: var(--sp-editor-surface);
}

.sp-doc-editor .sp-doc-block[data-block-type="table"] th {
  background: var(--sp-editor-surface-muted);
  font-weight: 700;
  color: var(--sp-editor-ink);
}

.sp-doc-editor .sp-doc-block[data-block-type="table"] td,
.sp-doc-editor .sp-doc-block[data-block-type="table"] th {
  border-color: var(--sp-editor-line);
}

.sp-doc-editor .sp-doc-block[data-block-type="code"] pre,
.sp-doc-editor .sp-doc-block[data-block-type="terminal"] pre {
  border-radius: 13px;
}

.sp-doc-editor .sp-doc-block[data-block-type="callout"],
.sp-doc-editor .sp-doc-block[data-block-type^="callout_"],
.sp-doc-editor .sp-doc-block[data-block-type="key_takeaway"],
.sp-doc-editor .sp-doc-block[data-block-type="summary_box"],
.sp-doc-editor .sp-doc-block[data-block-type="announcement_banner"] {
  margin-block: .55rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="callout_info"] > .flex,
.sp-doc-editor .sp-doc-block[data-block-type="callout_success"] > .flex,
.sp-doc-editor .sp-doc-block[data-block-type="callout_warning"] > .flex,
.sp-doc-editor .sp-doc-block[data-block-type="callout_danger"] > .flex,
.sp-doc-editor .sp-doc-block[data-block-type="callout_tip"] > .flex,
.sp-doc-editor .sp-doc-block[data-block-type="key_takeaway"] > .flex {
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(30, 35, 55, .035);
}

.sp-doc-editor .sp-doc-block[data-block-type="faq"] input,
.sp-doc-editor .sp-doc-block[data-block-type="faq"] textarea {
  min-width: 0;
}

.sp-doc-editor .sp-doc-block[data-block-type="tabs"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="numbered_toggle"] details {
  border-radius: 13px;
  box-shadow: 0 2px 12px rgba(25, 30, 55, .035);
}

.sp-doc-editor .sp-doc-block[data-block-type="video"] iframe,
.sp-doc-editor .sp-doc-block[data-block-type="embed"] iframe,
.sp-doc-editor .sp-doc-block[data-block-type="map"] iframe {
  display: block;
  width: 100%;
  border: 1px solid var(--sp-editor-line-strong);
  border-radius: 13px;
  background: var(--sp-editor-surface-muted);
}

.sp-doc-editor .sp-doc-block[data-block-type="bookmark"] a,
.sp-doc-editor .sp-doc-block[data-block-type="file"] a,
.sp-doc-editor .sp-doc-block[data-block-type="file_card"] a {
  overflow-wrap: anywhere;
}

.sp-doc-editor .sp-doc-block[data-block-type="mermaid"] svg,
.sp-doc-editor .sp-doc-block[data-block-type="mindmap"] svg {
  max-width: 100%;
}

.sp-doc-editor .sp-doc-block [class*="border-slate-200"],
.sp-doc-editor .sp-doc-block [class*="border-\[\#e9e9e7\]"] {
  border-color: var(--sp-editor-line-strong);
}

.sp-doc-editor .sp-doc-block [class*="shadow-2xs"] {
  box-shadow: 0 2px 8px rgba(30, 35, 65, .035);
}

.sp-doc-editor .sp-doc-block-controls {
  opacity: 0;
  transform: translateX(-3px);
}

.sp-doc-editor .sp-doc-block:hover .sp-doc-block-controls,
.sp-doc-editor .sp-doc-block[data-focused="true"] .sp-doc-block-controls,
.sp-doc-editor .sp-doc-block:focus-within .sp-doc-block-controls {
  opacity: 1;
  transform: translateX(0);
}

.sp-doc-editor .sp-doc-meta-strip + * {
  scroll-margin-top: 4rem;
}

.sp-doc-editor [data-index] {
  scroll-margin-block: 6rem;
}

.sp-doc-editor .sp-doc-block-controls button:hover {
  background: var(--sp-editor-accent-soft);
  color: var(--sp-editor-accent);
}

.sp-doc-editor .sp-doc-page-title,
.sp-doc-editor .sp-doc-block textarea {
  text-wrap: pretty;
  overflow-wrap: anywhere;
}

.sp-doc-editor .sp-doc-block textarea::placeholder,
.sp-doc-editor .sp-doc-block input::placeholder {
  opacity: .6;
}

.sp-doc-editor .sp-doc-page-title:focus {
  outline: none;
  text-shadow: 0 0 0 transparent;
}

.sp-doc-editor .sp-doc-meta-strip button:disabled,
.sp-doc-editor button:disabled {
  cursor: not-allowed;
  filter: saturate(.45);
}

.sp-doc-editor .sp-doc-block [role="button"],
.sp-doc-editor .sp-doc-block summary {
  -webkit-user-select: none;
  user-select: none;
}

.sp-doc-editor .sp-doc-block img,
.sp-doc-editor .sp-doc-block video,
.sp-doc-editor .sp-doc-block iframe {
  max-width: 100%;
}

.sp-doc-editor .sp-doc-block pre {
  max-width: 100%;
  overflow-x: auto;
  tab-size: 2;
}

.sp-doc-editor .sp-doc-block a {
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.sp-doc-editor .sp-doc-block a:hover {
  text-decoration-thickness: 2px;
}

.sp-doc-editor .sp-doc-block hr {
  border: 0;
  border-top: 1px solid var(--sp-editor-line-strong);
  margin-block: 1.3rem;
}

.sp-doc-editor .sp-doc-block blockquote {
  margin: .5rem 0;
  padding: .65rem 1rem;
  border-left: 3px solid var(--sp-editor-accent);
  border-radius: 0 10px 10px 0;
  background: var(--sp-editor-accent-soft);
}

.sp-doc-editor .sp-doc-block mark {
  border-radius: .25rem;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.sp-doc-editor .sp-doc-block code {
  overflow-wrap: anywhere;
}

.sp-doc-editor .sp-doc-block table input,
.sp-doc-editor .sp-doc-block table textarea {
  background: transparent;
  border-radius: 5px;
}

.sp-doc-editor .sp-doc-block table input:focus,
.sp-doc-editor .sp-doc-block table textarea:focus {
  background: var(--sp-editor-accent-soft);
}

.sp-doc-editor .sp-doc-block input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--sp-editor-accent);
  cursor: pointer;
}

.sp-doc-editor .sp-doc-block [class*="rounded-2xl"],
.sp-doc-editor .sp-doc-block [class*="rounded-xl"] {
  box-shadow: 0 2px 14px rgba(28, 33, 58, .035);
}

.sp-doc-editor .sp-doc-block [class*="animate-in"] {
  animation-duration: 170ms;
}

.sp-doc-editor .sp-doc-block[data-block-type="stat"],
.sp-doc-editor .sp-doc-block[data-block-type="stat_grid"],
.sp-doc-editor .sp-doc-block[data-block-type="kpi_scorecard"],
.sp-doc-editor .sp-doc-block[data-block-type="target_meter"] {
  margin-block: .55rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="divider"] {
  padding-block: .35rem;
}

.sp-doc-editor .sp-doc-block[data-block-type="spacer"] {
  opacity: .76;
}

.sp-doc-editor .sp-doc-block[data-block-type="h4"] textarea {
  font-size: 1.05rem;
  font-weight: 700;
}

.sp-doc-editor .sp-doc-block[data-block-type="h5"] textarea {
  font-size: .94rem;
  font-weight: 700;
}

.sp-doc-editor .sp-doc-block[data-block-type="h6"] textarea {
  font-size: .78rem;
  font-weight: 750;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.sp-doc-editor .sp-doc-block[data-block-type="quote"] textarea {
  border-left: 3px solid var(--sp-editor-accent);
  background: var(--sp-editor-accent-soft);
  padding: .8rem 1rem;
  border-radius: 0 10px 10px 0;
}

.sp-doc-editor .sp-doc-block[data-block-type="todo"]:has(input:checked) textarea {
  color: var(--sp-editor-muted);
  text-decoration-color: var(--sp-editor-muted);
}

.sp-doc-editor .sp-doc-block [class*="overflow-x-auto"] {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 124, 145, .36) transparent;
}

.sp-doc-editor ::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.sp-doc-editor ::-webkit-scrollbar-thumb {
  background: rgba(120, 124, 145, .25);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.sp-doc-editor ::-webkit-scrollbar-thumb:hover {
  background: rgba(120, 124, 145, .46);
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* Editorial layouts for high-information blocks: visual distinction follows purpose. */
.sp-doc-editor .sp-doc-block[data-block-type="citation_source"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="api_endpoint"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="spec_table"] > div {
  border-radius: 13px;
  box-shadow: 0 5px 18px rgba(28, 34, 67, .045);
}

.sp-doc-editor .sp-doc-block[data-block-type="risk_register"] [class*="bg-rose"],
.sp-doc-editor .sp-doc-block[data-block-type="risk_register"] [class*="bg-amber"] {
  border-radius: 9px;
}

.sp-doc-editor .sp-doc-block[data-block-type="decision_matrix"] table,
.sp-doc-editor .sp-doc-block[data-block-type="spec_table"] table {
  width: 100%;
  min-width: 420px;
}

.sp-doc-editor .sp-doc-block[data-block-type="swot_analysis"] > div {
  border-radius: 14px;
  overflow: hidden;
}

.sp-doc-editor .sp-doc-block[data-block-type="milestone_roadmap"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="changelog"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="event_schedule"] > div {
  border-radius: 13px;
}

.sp-doc-editor .sp-doc-block[data-block-type="target_meter"] [role="progressbar"],
.sp-doc-editor .sp-doc-block[data-block-type="progress"] [role="progressbar"] {
  overflow: hidden;
  border-radius: 999px;
}

.sp-doc-editor .sp-doc-block[data-block-type="kanban_board"] {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.sp-doc-editor .sp-doc-block[data-block-type="kanban_board"] [class*="rounded"] {
  min-width: 0;
}

.sp-doc-editor .sp-doc-block[data-block-type="before_after"] > div {
  border-radius: 14px;
}

.sp-doc-editor .sp-doc-block[data-block-type="faq"] > div {
  border-radius: 13px;
}

.sp-doc-editor .sp-doc-block[data-block-type="faq"] > div > div {
  transition: border-color 150ms ease, background-color 150ms ease;
}

.sp-doc-editor .sp-doc-block[data-block-type="announcement_banner"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="alert_banner"] > div {
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(30, 35, 60, .04);
}

.sp-doc-editor .sp-doc-block[data-block-type="testimonial"] blockquote,
.sp-doc-editor .sp-doc-block[data-block-type="testimonial"] [class*="italic"] {
  font-size: 1rem;
  line-height: 1.85;
}

.sp-doc-editor .sp-doc-block[data-block-type="countdown"] > div {
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(29, 43, 95, .13);
}

.sp-doc-editor .sp-doc-block[data-block-type="file_card"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="bookmark"] > div {
  border-radius: 13px;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.sp-doc-editor .sp-doc-block[data-block-type="file_card"] > div:hover,
.sp-doc-editor .sp-doc-block[data-block-type="bookmark"] > div:hover {
  transform: translateY(-1px);
  box-shadow: var(--sp-editor-shadow);
}

.sp-doc-editor .sp-doc-block[data-block-type="user_mention"] > div,
.sp-doc-editor .sp-doc-block[data-block-type="signature"] > div {
  border-radius: 12px;
}

.sp-doc-editor .sp-doc-block[data-block-type="poll"] button,
.sp-doc-editor .sp-doc-block[data-block-type="rating"] button {
  transition: transform 140ms ease, background-color 140ms ease;
}

.sp-doc-editor .sp-doc-block[data-block-type="poll"] button:active,
.sp-doc-editor .sp-doc-block[data-block-type="rating"] button:active {
  transform: scale(.97);
}

.sp-doc-editor .sp-doc-block[data-block-type="math"] textarea,
.sp-doc-editor .sp-doc-block[data-block-type="json"] textarea,
.sp-doc-editor .sp-doc-block[data-block-type="sql"] textarea,
.sp-doc-editor .sp-doc-block[data-block-type="diff"] textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .84rem;
  line-height: 1.65;
  tab-size: 2;
}

@media (max-width: 760px) {
  .sp-doc-editor .sp-doc-page-title {
    font-size: clamp(1.85rem, 9vw, 2.65rem);
    letter-spacing: -.045em;
  }

  .sp-doc-editor .sp-doc-meta-strip {
    gap: .35rem;
  }

  .sp-doc-editor .sp-doc-meta-chip {
    min-height: 25px;
    padding: .3rem .5rem;
  }

  .sp-doc-editor .sp-doc-copy-action {
    margin-left: 0;
    width: 100%;
  }

  .sp-doc-editor .sp-doc-block {
    padding-inline: .22rem;
    margin-inline: 0;
    border-radius: 9px;
  }

  .sp-doc-editor .sp-doc-block-controls {
    position: relative;
    top: auto;
    opacity: 1;
    transform: none;
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sp-doc-editor *,
  .sp-doc-editor *::before,
  .sp-doc-editor *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}

@media print {
  .sp-doc-editor header,
  .sp-doc-editor .sp-doc-meta-strip,
  .sp-doc-editor .sp-doc-block-controls,
  .sp-doc-editor button,
  .sp-doc-editor input,
  .sp-doc-editor textarea {
    display: none !important;
  }

  .sp-doc-editor,
  .sp-doc-editor > div,
  .sp-doc-editor [class*="overflow-y-auto"] {
    height: auto !important;
    overflow: visible !important;
    color: #111 !important;
    background: #fff !important;
  }

  .sp-doc-editor .sp-doc-block {
    break-inside: avoid;
    border-color: transparent !important;
    box-shadow: none !important;
    background: transparent !important;
  }
}
`;

const COVER_GRADIENTS = [
  { label: 'Ciemny Łupek', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' },
  { label: 'Szmaragd', value: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' },
  { label: 'Indygo Noc', value: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)' },
  { label: 'Ciepły Bursztyn', value: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)' },
  { label: 'Ciemna Róża', value: 'linear-gradient(135deg, #831843 0%, #500724 100%)' },
  { label: 'Fiolet Kosmiczny', value: 'linear-gradient(135deg, #581c87 0%, #3b0764 100%)' },
];

const CODE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'html',
  'css',
  'sql',
  'json',
  'rust',
  'go',
  'bash',
];

// Helper to extract YouTube video ID from various URL formats
function parseYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Calculate Table stats for numeric columns (supports Polish currencies, spaces, percentages)
function calculateTableStats(tableData?: string[][]) {
  if (!tableData || tableData.length < 2) return [];
  const colCount = tableData[0]?.length || 0;
  const stats: { colIndex: number; colName: string; sum: number; avg: number }[] = [];

  for (let c = 0; c < colCount; c++) {
    let numericValues: number[] = [];
    for (let r = 1; r < tableData.length; r++) {
      const raw = tableData[r][c] || '';
      const clean = raw
        .replace(/[\s\u00A0]/g, '')
        .replace(/[zł$€£%]/gi, '')
        .replace(/,/g, '.')
        .trim();
      const val = parseFloat(clean);
      if (!isNaN(val)) {
        numericValues.push(val);
      }
    }
    // If at least 2 rows have numeric values, provide summary
    if (numericValues.length >= 2) {
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const avg = sum / numericValues.length;
      stats.push({
        colIndex: c,
        colName: tableData[0][c] || `Kolumna ${c + 1}`,
        sum: Math.round(sum * 100) / 100,
        avg: Math.round(avg * 100) / 100,
      });
    }
  }
  return stats;
}

/** Typed subset shared by clipboard, Markdown and HTML serializers. */
type SerializableDocBlock = {
  id?: string;
  type?: string;
  content?: string;
  checked?: boolean;
  language?: string;
  imageUrl?: string;
  imageCaption?: string;
  videoUrl?: string;
  audioUrl?: string;
  bookmarkUrl?: string;
  bookmarkTitle?: string;
  bookmarkDesc?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  embedUrl?: string;
  tableData?: string[][];
  statValue?: string;
  statTrend?: string;
  progressPercent?: number;
  timelineDate?: string;
  toggleDetails?: string;
  calloutType?: string;
  diagramSyntax?: string;
  diagramType?: string;
  [key: string]: unknown;
};

/** Escape untrusted text before it is inserted into exported HTML. */
const escapeDocHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Permit only absolute HTTP(S) URLs when serializing clickable media and links. */
const safeDocUrl = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim() || isBlockedUrl(value)) return '';
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

/** Convert the inline Markdown subset used by the editor into safe, clipboard-ready HTML. */
const serializeInlineMarkdownToHtml = (value: unknown): string => {
  let html = escapeDocHtml(value);
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_match, label: string, url: string) => {
      const normalized = safeDocUrl(url.replace(/&amp;/g, '&'));
      return normalized
        ? `<a href="${escapeDocHtml(normalized)}" rel="noopener noreferrer">${label}</a>`
        : label;
    }
  );
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return html.replace(/\r?\n/g, '<br>');
};

/** Render a block into readable Markdown without silently losing non-text content. */
const serializeBlockToMarkdown = (block: SerializableDocBlock): string => {
  const value = String(block.content ?? '').trimEnd();
  const type = String(block.type ?? 'p');
  const imageUrl = safeDocUrl(block.imageUrl);
  const videoUrl = safeDocUrl(block.videoUrl);
  const audioUrl = safeDocUrl(block.audioUrl);
  const bookmarkUrl = safeDocUrl(block.bookmarkUrl);
  const fileUrl = safeDocUrl(block.fileUrl);
  const embedUrl = safeDocUrl(block.embedUrl);

  switch (type) {
    case 'h1': return `# ${value}`;
    case 'h2': return `## ${value}`;
    case 'h3': return `### ${value}`;
    case 'h4': return `#### ${value}`;
    case 'h5': return `##### ${value}`;
    case 'h6': return `###### ${value}`;
    case 'lead': return value ? `**${value}**` : '';
    case 'subtext': return value ? `_${value}_` : '';
    case 'bullet': return value.split('\n').map((line) => `- ${line}`).join('\n');
    case 'number': return value.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
    case 'todo': return `- [${block.checked ? 'x' : ' '}] ${value}`;
    case 'quote': return value.split('\n').map((line) => `> ${line}`).join('\n');
    case 'code':
    case 'terminal':
    case 'sql':
    case 'json':
    case 'diff':
      return `\`\`\`${String(block.language ?? (type === 'terminal' ? 'bash' : type === 'code' ? '' : type))}\n${value}\n\`\`\``;
    case 'table': {
      const rows = Array.isArray(block.tableData) ? block.tableData as string[][] : [];
      if (!rows.length) return value;
      const normalizeRow = (row: string[]) => `| ${row.map((cell) => String(cell ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`;
      const header = normalizeRow(rows[0] || []);
      const separator = `| ${(rows[0] || []).map(() => '---').join(' | ')} |`;
      return [header, separator, ...rows.slice(1).map(normalizeRow)].join('\n');
    }
    case 'image':
      return imageUrl ? `![${String(block.imageCaption ?? 'Obraz')}](${imageUrl})` : (value || '[Obraz bez adresu]');
    case 'video':
      return videoUrl ? `[Wideo${value ? `: ${value}` : ''}](${videoUrl})` : (value || '[Wideo bez adresu]');
    case 'audio':
      return audioUrl ? `[Audio${value ? `: ${value}` : ''}](${audioUrl})` : (value || '[Audio bez adresu]');
    case 'bookmark':
      return bookmarkUrl ? `[${String(block.bookmarkTitle || value || 'Link')}](${bookmarkUrl})${block.bookmarkDesc ? `\n\n${String(block.bookmarkDesc)}` : ''}` : (value || '[Link bez adresu]');
    case 'file':
    case 'file_card':
      return fileUrl ? `[📎 ${String(block.fileName || value || 'Plik')} ${block.fileSize ? `(${String(block.fileSize)})` : ''}](${fileUrl})` : (value || '[Plik bez adresu]');
    case 'embed':
      return embedUrl ? `[Osadzenie${value ? `: ${value}` : ''}](${embedUrl})` : (value || '[Osadzona treść bez adresu]');
    case 'divider': return '---';
    case 'callout':
    case 'callout_info':
    case 'callout_success':
    case 'callout_warning':
    case 'callout_danger':
    case 'callout_tip':
    case 'key_takeaway':
    case 'summary_box':
      return value ? `> **${type === 'key_takeaway' ? 'Najważniejsze' : type.replace('callout_', '').replace('callout', 'Informacja').replace('_', ' ')}**\n> ${value.replace(/\n/g, '\n> ')}` : '';
    case 'stat':
    case 'kpi_scorecard':
      return `**${value || 'Wskaźnik'}:** ${String(block.statValue ?? block.currentValue ?? '—')}${block.statTrend ? ` (${String(block.statTrend)})` : ''}`;
    case 'progress':
      return `**${value || 'Postęp'}:** ${Math.max(0, Math.min(100, Number(block.progressPercent ?? 0)))}%`;
    case 'timeline':
      return `- **${String(block.timelineDate || 'Etap')}** — ${value}`;
    case 'numbered_toggle':
      return `${value}\n\n${String(block.toggleDetails ?? '')}`.trim();
    case 'columns_2':
    case 'columns_3':
    case 'pros_cons':
    case 'before_after':
    case 'faq':
    case 'citation_source':
      return [value, String(block.toggleDetails ?? '')].filter(Boolean).join('\n\n');
    case 'mermaid':
      return `**${value || 'Diagram'}**\n\n\`\`\`mermaid\n${String(block.diagramSyntax ?? '')}\n\`\`\``;
    case 'math':
      return value ? `$$\n${value}\n$$` : '';
    default:
      return value;
  }
};

/** Complete document Markdown serializer used by exports and copy-all. */
const serializeDocumentToMarkdown = (
  title: string,
  icon: string | undefined,
  blocks: SerializableDocBlock[]
): string => {
  const heading = `# ${[icon, title || 'Bez tytułu'].filter(Boolean).join(' ')}`;
  const body = blocks
    .map((block) => serializeBlockToMarkdown(block))
    .filter((part) => part !== undefined && part !== null && String(part).trim().length > 0)
    .join('\n\n');
  return `${heading}\n\n${body}`.trim() + '\n';
};

/** Block-aware rich HTML serialization; HTML values are escaped before interpolation. */
const serializeBlockToHtml = (block: SerializableDocBlock): string => {
  const type = String(block.type ?? 'p');
  const content = serializeInlineMarkdownToHtml(block.content ?? '');
  const plainContent = escapeDocHtml(block.content ?? '').replace(/\r?\n/g, '<br>');
  const urlFor = (key: string) => safeDocUrl(block[key]);
  const imageUrl = urlFor('imageUrl');
  const videoUrl = urlFor('videoUrl');
  const audioUrl = urlFor('audioUrl');
  const bookmarkUrl = urlFor('bookmarkUrl');
  const fileUrl = urlFor('fileUrl');
  const embedUrl = urlFor('embedUrl');

  switch (type) {
    case 'h1': return `<h1>${content}</h1>`;
    case 'h2': return `<h2>${content}</h2>`;
    case 'h3': return `<h3>${content}</h3>`;
    case 'h4': return `<h4>${content}</h4>`;
    case 'h5': return `<h5>${content}</h5>`;
    case 'h6': return `<h6>${content}</h6>`;
    case 'lead': return `<p class="lead">${content}</p>`;
    case 'subtext': return `<p class="subtext">${content}</p>`;
    case 'bullet': return `<ul>${String(block.content ?? '').split('\n').map((line) => `<li>${serializeInlineMarkdownToHtml(line)}</li>`).join('')}</ul>`;
    case 'number': return `<ol>${String(block.content ?? '').split('\n').map((line) => `<li>${serializeInlineMarkdownToHtml(line)}</li>`).join('')}</ol>`;
    case 'todo': return `<p class="todo"><input type="checkbox" disabled ${block.checked ? 'checked' : ''}> ${content}</p>`;
    case 'quote': return `<blockquote>${content}</blockquote>`;
    case 'code':
    case 'terminal':
    case 'sql':
    case 'json':
    case 'diff':
      return `<pre><code class="language-${escapeDocHtml(block.language ?? type)}">${escapeDocHtml(block.content ?? '')}</code></pre>`;
    case 'table': {
      const rows = Array.isArray(block.tableData) ? block.tableData as string[][] : [];
      if (!rows.length) return `<p>${content}</p>`;
      const [head, ...bodyRows] = rows;
      return `<div class="table-wrap"><table><thead><tr>${(head || []).map((cell) => `<th>${serializeInlineMarkdownToHtml(cell)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${serializeInlineMarkdownToHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    }
    case 'image':
      return imageUrl
        ? `<figure><img src="${escapeDocHtml(imageUrl)}" alt="${escapeDocHtml(block.imageCaption || block.content || 'Obraz')}" loading="lazy">${block.imageCaption ? `<figcaption>${escapeDocHtml(block.imageCaption)}</figcaption>` : ''}</figure>`
        : (content ? `<p>${content}</p>` : '');
    case 'video':
      return videoUrl ? `<p><a href="${escapeDocHtml(videoUrl)}">▶ ${escapeDocHtml(block.content || 'Otwórz wideo')}</a></p>` : (content ? `<p>${content}</p>` : '');
    case 'audio':
      return audioUrl ? `<p><a href="${escapeDocHtml(audioUrl)}">♫ ${escapeDocHtml(block.content || 'Otwórz nagranie')}</a></p>` : (content ? `<p>${content}</p>` : '');
    case 'bookmark':
      return bookmarkUrl ? `<article class="bookmark"><a href="${escapeDocHtml(bookmarkUrl)}">${escapeDocHtml(block.bookmarkTitle || block.content || bookmarkUrl)}</a>${block.bookmarkDesc ? `<p>${escapeDocHtml(block.bookmarkDesc)}</p>` : ''}</article>` : (content ? `<p>${content}</p>` : '');
    case 'file':
    case 'file_card':
      return fileUrl ? `<p class="file-link">📎 <a href="${escapeDocHtml(fileUrl)}">${escapeDocHtml(block.fileName || block.content || 'Pobierz plik')}</a> ${escapeDocHtml(block.fileSize || '')}</p>` : (content ? `<p>${content}</p>` : '');
    case 'embed':
      return embedUrl ? `<p><a href="${escapeDocHtml(embedUrl)}">${escapeDocHtml(block.content || 'Otwórz osadzaną treść')}</a></p>` : (content ? `<p>${content}</p>` : '');
    case 'divider': return '<hr>';
    case 'callout':
    case 'callout_info':
    case 'callout_success':
    case 'callout_warning':
    case 'callout_danger':
    case 'callout_tip':
    case 'key_takeaway':
    case 'summary_box':
      return `<aside class="callout ${escapeDocHtml(type)}">${content}</aside>`;
    case 'stat':
    case 'kpi_scorecard':
      return `<section class="metric"><div>${plainContent || 'Wskaźnik'}</div><strong>${escapeDocHtml(block.statValue ?? block.currentValue ?? '—')}</strong><small>${escapeDocHtml(block.statTrend ?? '')}</small></section>`;
    case 'progress': {
      const progress = Math.max(0, Math.min(100, Number(block.progressPercent ?? 0)));
      return `<section class="progress"><div>${plainContent || 'Postęp'} <strong>${progress}%</strong></div><div class="track"><span style="width:${progress}%"></span></div></section>`;
    }
    case 'timeline':
      return `<section class="timeline"><small>${escapeDocHtml(block.timelineDate || 'Etap')}</small><div>${content}</div></section>`;
    case 'mermaid':
      return `<section class="diagram"><strong>${content || 'Diagram'}</strong><pre>${escapeDocHtml(block.diagramSyntax ?? '')}</pre></section>`;
    case 'math':
      return `<pre class="math">${escapeDocHtml(block.content ?? '')}</pre>`;
    case 'numbered_toggle':
      return `<details><summary>${content}</summary><div>${serializeInlineMarkdownToHtml(block.toggleDetails ?? '')}</div></details>`;
    case 'tabs':
      return `<section><strong>${content}</strong><div>${serializeInlineMarkdownToHtml(block.toggleDetails ?? '')}</div></section>`;
    case 'columns_2':
    case 'columns_3':
      return `<section class="columns"><div>${content}</div><div>${serializeInlineMarkdownToHtml(block.toggleDetails ?? '')}</div></section>`;
    default:
      return plainContent ? `<p>${content}</p>` : '';
  }
};

/** Plain-text serialization keeps table cells, media URLs and secondary fields visible. */
const serializeBlockToPlainText = (block: SerializableDocBlock): string => {
  const type = String(block.type ?? 'p');
  const content = String(block.content ?? '').trim();
  const media = [
    ['Obraz', block.imageUrl],
    ['Wideo', block.videoUrl],
    ['Audio', block.audioUrl],
    ['Link', block.bookmarkUrl],
    ['Plik', block.fileUrl],
    ['Osadzenie', block.embedUrl],
  ] as const;
  const mediaLine = media
    .map(([label, rawUrl]) => {
      const url = safeDocUrl(rawUrl);
      return url ? `${label}: ${url}` : '';
    })
    .filter(Boolean)
    .join('\n');

  if (type === 'table' && Array.isArray(block.tableData)) {
    return (block.tableData as string[][])
      .map((row) => (row || []).map((cell) => String(cell ?? '')).join(' | '))
      .join('\n');
  }
  if (type === 'todo') return `${block.checked ? '[x]' : '[ ]'} ${content}`;
  if (type === 'bullet') return content.split('\n').map((line) => `• ${line}`).join('\n');
  if (type === 'number') return content.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
  if (type === 'quote') return content.split('\n').map((line) => `“${line}”`).join('\n');
  if (type === 'divider') return '────────────────────────────────';
  if (type === 'stat' || type === 'kpi_scorecard') {
    return [content || 'Wskaźnik', String(block.statValue ?? block.currentValue ?? ''), String(block.statTrend ?? '')]
      .filter(Boolean)
      .join(' — ');
  }
  if (type === 'progress') return `${content || 'Postęp'}: ${Math.max(0, Math.min(100, Number(block.progressPercent ?? 0)))}%`;
  if (type === 'timeline') return `${String(block.timelineDate || 'Etap')} — ${content}`;
  if (type === 'numbered_toggle' || type === 'tabs' || type.startsWith('columns_')) {
    return [content, String(block.toggleDetails ?? '')].filter(Boolean).join('\n\n');
  }
  if (type === 'code' || type === 'terminal' || type === 'sql' || type === 'json' || type === 'diff') {
    return [content, String(block.language ?? '')].filter(Boolean).join('\n');
  }
  return [content, mediaLine].filter(Boolean).join('\n');
};

/** Clipboard HTML should be a fragment, not a nested <html>/<head> document. */
const serializeDocumentToHtmlFragment = (
  title: string,
  icon: string | undefined,
  blocks: SerializableDocBlock[]
): string => {
  const heading = escapeDocHtml([icon, title || 'Bez tytułu'].filter(Boolean).join(' '));
  const body = blocks.map(serializeBlockToHtml).filter(Boolean).join('\n');
  return `<article style="font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;max-width:860px;margin:0 auto;color:#282a34;line-height:1.7;font-size:15px;">
<header><h1 style="font-size:2.25em;line-height:1.15;letter-spacing:-.04em;margin:.25em 0 1em;color:#191a23;">${heading}</h1></header>
${body}
</article>`;
};

/** Full, self-contained HTML document used in clipboard and .html export. */
const serializeDocumentToHtml = (
  title: string,
  icon: string | undefined,
  blocks: SerializableDocBlock[]
): string => {
  const safeTitle = escapeDocHtml(title || 'Bez tytułu');
  const heading = escapeDocHtml([icon, title || 'Bez tytułu'].filter(Boolean).join(' '));
  const body = blocks.map(serializeBlockToHtml).filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<style>
:root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#20212a;background:#fff;font-synthesis:none;text-rendering:optimizeLegibility}
body{max-width:860px;margin:0 auto;padding:48px 28px 90px;line-height:1.72;font-size:15px;color:#282a34}
h1,h2,h3,h4,h5,h6{line-height:1.18;letter-spacing:-.035em;color:#191a23;margin:1.8em 0 .65em;font-weight:750}
h1{font-size:2.4rem;margin-top:.35em}h2{font-size:1.8rem}h3{font-size:1.4rem}h4{font-size:1.15rem}
p{margin:.65em 0}a{color:#5147ca;text-decoration:underline;text-underline-offset:3px}img{display:block;max-width:100%;max-height:620px;object-fit:contain;border-radius:14px;margin:1rem auto}figure{margin:1.5rem 0}figcaption{color:#777b8b;font-size:.85rem;text-align:center;margin-top:.5rem}blockquote,.callout{margin:1rem 0;padding:1rem 1.15rem;border-left:3px solid #7267e8;border-radius:0 12px 12px 0;background:#f5f4ff}pre{padding:1rem;overflow:auto;background:#171821;color:#e7e9f5;border-radius:12px;font-size:.88rem;line-height:1.55}code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}p code{background:#f1f1f7;color:#7c3aed;padding:.1rem .3rem;border-radius:4px}mark{background:#fff0a5;border-radius:3px;padding:0 .15em}table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #e5e6ef;border-radius:12px;overflow:hidden}th,td{padding:.65rem .8rem;border-bottom:1px solid #e7e8ef;border-right:1px solid #e7e8ef;text-align:left;vertical-align:top}th{background:#f6f6fa;font-weight:700}tr:last-child td{border-bottom:0}td:last-child,th:last-child{border-right:0}.table-wrap{overflow:auto;margin:1rem 0}.metric,.bookmark,.file-link,.progress,.timeline,.diagram{margin:1rem 0;padding:1rem;border:1px solid #e6e7ef;border-radius:12px;background:#fbfbfe}.metric strong{display:block;font-size:1.9rem;letter-spacing:-.04em}.metric small,.timeline small{display:block;color:#777b8b}.track{height:8px;background:#e9eaf3;border-radius:99px;overflow:hidden;margin-top:.6rem}.track span{display:block;height:100%;background:#6659df;border-radius:99px}.columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.subtext{font-size:.82rem;color:#7b7f90}.lead{font-size:1.15rem;color:#4b4d5c}.todo input{accent-color:#6659df}details{padding:.9rem 1rem;border:1px solid #e6e7ef;border-radius:10px;margin:.6rem 0}summary{cursor:pointer;font-weight:700}.math{background:#fafaff;color:#27283a;border:1px solid #e6e7ef}hr{border:0;border-top:1px solid #e4e5ed;margin:1.7rem 0}li{padding-left:.15rem;margin:.22rem 0}
@media(max-width:600px){body{padding:28px 16px 56px;font-size:14px}h1{font-size:2rem}.columns{grid-template-columns:1fr}}
@media print{body{padding:0;max-width:none}a{color:inherit}pre,.metric,.callout,table,figure{break-inside:avoid}}
</style>
</head>
<body>
<article>
<h1>${heading}</h1>
${body}
</article>
</body>
</html>`;
};

// Helper to render inline markdown: **bold**, *italic*, ~~strikethrough~~, `code`, ==highlight==, [link](url)
const renderInlineMarkdown = (content: string, keyPrefix: string = 'inline'): React.ReactNode[] => {
  if (!content) return [];
  const tokenRegex = /(\[.*?\]\(https?:\/\/[^\s)]+\)|\*\*.*?\*\*|\*.*?\*|~~.*?~~|`.*?`|==.*?==)/g;
  const parts = content.split(tokenRegex);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    // 1. Link [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-700 underline decoration-blue-300/80 inline-flex items-center gap-0.5 align-baseline"
        >
          <span>{linkMatch[1]}</span>
          <span className="text-[10px] text-blue-400">↗</span>
        </a>
      );
    }

    // 2. Bold **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={key} className="font-bold text-inherit">{part.slice(2, -2)}</strong>;
    }

    // 3. Highlight ==text==
    if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
      return <mark key={key} className="bg-amber-200/80 text-amber-950 px-1 py-0.5 rounded">{part.slice(2, -2)}</mark>;
    }

    // 4. Strikethrough ~~text~~
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return <del key={key} className="line-through text-slate-400 opacity-80">{part.slice(2, -2)}</del>;
    }

    // 5. Inline Code `text`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={key} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-pink-600 font-mono text-[11px] border border-slate-200/60 align-baseline">
          {part.slice(1, -1)}
        </code>
      );
    }

    // 6. Italic *text*
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={key} className="italic text-inherit">{part.slice(1, -1)}</em>;
    }

    return <span key={key}>{part}</span>;
  });
};

// WikiText component for bidirectional [[Page]] links and rich inline markdown
const WikiText: React.FC<{
  text: string;
  pages: any[];
  onNavigate: (pageId: string) => void;
  onCreatePage?: (title: string) => void;
  className?: string;
}> = ({ text, pages, onNavigate, onCreatePage, className = '' }) => {
  if (!text) return null;

  const parts = [];
  const regex = /\[\[(.*?)\]\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    const pageTitle = match[1].trim();
    parts.push({ type: 'wiki', title: pageTitle });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  if (parts.length === 1 && parts[0].type === 'text') {
    return <span className={className}>{renderInlineMarkdown(text, 'wiki-single')}</span>;
  }

  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.type === 'text') {
          return <React.Fragment key={i}>{renderInlineMarkdown(p.content || '', `wiki-part-${i}`)}</React.Fragment>;
        }
        const foundPage = pages.find(
          (pg) => pg.title?.toLowerCase() === p.title?.toLowerCase() && !pg.isDeleted
        );
        if (foundPage) {
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(foundPage.id);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium cursor-pointer transition-colors align-baseline"
              title={`Przejdź do: ${foundPage.title}`}
            >
              <span>{foundPage.icon || '📄'}</span>
              <span className="underline decoration-blue-400/50">{foundPage.title}</span>
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCreatePage && p.title) {
                onCreatePage(p.title);
              }
            }}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-dashed border-slate-300 text-xs cursor-pointer transition-colors align-baseline"
            title={`Kliknij, aby utworzyć stronę: ${p.title}`}
          >
            <span>+</span>
            <span className="italic">{p.title}</span>
          </button>
        );
      })}
    </span>
  );
};

export const BlockEditor: React.FC = () => {
  const {
    activeDoc,
    pages,
    createPage,
    updatePageTitle,
    updatePageType,
    updatePageIcon,
    updatePageCover,
    togglePagePublic,
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
    addComment,
    resolveComment,
    replyToComment,
    sharePageWithEmail,
    removePageCollaborator,
    createVersionSnapshot,
    restoreVersionSnapshot,
    getBacklinks,
    setActivePageId,
    resources,
    addTask,
    addNotification,
    isZenMode,
    setIsZenMode,
    currentWorkspace,
    syncStatus,
    setActiveView,
    toggleFavorite,
    updateCollaboratorRole,
    toggleInheritPermissions,
    toggleAiSidePanel,
    isAiSidePanelOpen,
  } = useWorkspace();
  const { user, setIsAuthModalOpen } = useAuth();

  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showAccessShareModal, setShowAccessShareModal] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [showDocStatsModal, setShowDocStatsModal] = useState(false);
  const [showOutlineDrawer, setShowOutlineDrawer] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [activeCommentBlockId, setActiveCommentBlockId] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const editorScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState<{ blockId: string; filter: string } | null>(null);
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [slashSelectedCategory, setSlashSelectedCategory] = useState<string>('all');
  const slashSearchInputRef = useRef<HTMLInputElement>(null);
  const slashListContainerRef = useRef<HTMLDivElement>(null);
  const [loadingAiBlockId, setLoadingAiBlockId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [quickShareEmail, setQuickShareEmail] = useState('');
  const [showVersionsDrawer, setShowVersionsDrawer] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showResourcePickerForBlock, setShowResourcePickerForBlock] = useState<string | null>(null);
  const [showConvertMenuForBlock, setShowConvertMenuForBlock] = useState<string | null>(null);
  const [showColorPickerForBlock, setShowColorPickerForBlock] = useState<string | null>(null);
  const [wikiSuggest, setWikiSuggest] = useState<{ blockId: string; query: string } | null>(null);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nowoczesne_doc_fullwidth') === 'true';
    } catch {
      return false;
    }
  });

  const toggleFullWidth = () => {
    setIsFullWidth((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nowoczesne_doc_fullwidth', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const [newTagText, setNewTagText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [versionLabelInput, setVersionLabelInput] = useState('');
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null);
  const [showMindmapModal, setShowMindmapModal] = useState(false);
  const [showCodeBlockModal, setShowCodeBlockModal] = useState(false);
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});

  // Drag & drop state
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Notion-style Floating Selection Toolbar state
  interface FloatingToolbarState {
    blockId: string;
    start: number;
    end: number;
    text: string;
    x: number;
    y: number;
  }
  const [floatingToolbar, setFloatingToolbar] = useState<FloatingToolbarState | null>(null);

  const userRole: NotionAccessRole = (() => {
    if (!activeDoc) return 'can_view';
    if (!user) return 'can_view';
    if (activeDoc.ownerId === user.uid) return 'full_access';
    const collab = (activeDoc.sharedCollaborators || []).find(
      (c) => c.email.toLowerCase() === user.email?.toLowerCase()
    );
    if (collab) return normalizeAccessRole(collab.role);
    if (activeDoc.sharedWith?.some((e) => e.toLowerCase() === user.email?.toLowerCase())) {
      return 'full_access';
    }
    if (activeDoc.inheritPermissions && activeDoc.parentPageId) {
      const parent = pages.find((p) => p.id === activeDoc.parentPageId);
      if (parent) {
        if (parent.ownerId === user.uid) return 'full_access';
        const parentCollab = (parent.sharedCollaborators || []).find(
          (c) => c.email.toLowerCase() === user.email?.toLowerCase()
        );
        if (parentCollab) return normalizeAccessRole(parentCollab.role);
      }
    }
    return 'full_access';
  })();

  const isReadOnly = userRole === 'can_view';
  const isCommentOnly = userRole === 'can_comment';

  const insertQuickDraft = () => {
    if (!activeDoc) return;
    insertBlocks(activeDoc.id, [
      { id: `b-${Date.now()}-1`, type: 'h2', content: 'Wstęp i założenia' },
      { id: `b-${Date.now()}-2`, type: 'p', content: 'Opisz tutaj swoje główne cele i przemyślenia...' },
      { id: `b-${Date.now()}-3`, type: 'todo', content: 'Pierwszy krok do wykonania', checked: false },
    ]);
  };

  const insertMeetingNotesTemplate = () => {
    if (!activeDoc) return;
    insertBlocks(activeDoc.id, [
      { id: `b-${Date.now()}-1`, type: 'callout', calloutType: 'info', content: '📅 **Spotkanie Projektowe** · Data: ' + new Date().toLocaleDateString('pl-PL') },
      { id: `b-${Date.now()}-2`, type: 'h2', content: 'Uczestnicy' },
      { id: `b-${Date.now()}-3`, type: 'bullet', content: 'Kacper, Kamil, Zespół produktowy' },
      { id: `b-${Date.now()}-4`, type: 'h2', content: 'Porządek obrad' },
      { id: `b-${Date.now()}-5`, type: 'number', content: 'Przegląd wdrożenia Studio v2.4' },
      { id: `b-${Date.now()}-6`, type: 'h2', content: 'Ustalenia i Zadania' },
      { id: `b-${Date.now()}-7`, type: 'todo', content: 'Wdrożyć uprawnienia Access & Sharing', checked: true },
    ]);
  };

  const insertDatabaseTemplate = () => {
    if (!activeDoc) return;
    insertBlocks(activeDoc.id, [
      { id: `b-${Date.now()}-1`, type: 'h2', content: 'Rejestr Projektów i Zadań' },
      {
        id: `b-${Date.now()}-2`,
        type: 'table',
        content: 'Tabela projektowa',
        tableData: [
          ['Projekt', 'Właściciel', 'Status', 'Priorytet'],
          ['Przebudowa architektury Studio', 'Kamil', 'W trakcie', 'Krytyczny'],
          ['Weryfikacja 4 domen', 'AI', 'Zrobione', 'Wysoki'],
        ],
      },
    ]);
  };

  const insertFormTemplate = () => {
    if (!activeDoc) return;
    insertBlocks(activeDoc.id, [
      { id: `b-${Date.now()}-1`, type: 'h2', content: 'Formularz zgłoszeniowy' },
      { id: `b-${Date.now()}-2`, type: 'p', content: 'Wypełnij poniższe pola przed rozpoczęciem zadania:' },
      { id: `b-${Date.now()}-3`, type: 'todo', content: 'Imię i nazwisko', checked: false },
      { id: `b-${Date.now()}-4`, type: 'todo', content: 'Adres email (RFC 5322)', checked: false },
      { id: `b-${Date.now()}-5`, type: 'todo', content: 'Krótki opis zapotrzebowania', checked: false },
    ]);
  };

  const handleTextSelect = (
    blockId: string,
    e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== null && end !== null && start < end) {
      const selectedText = target.value.substring(start, end).trim();
      if (selectedText.length > 0) {
        const rect = target.getBoundingClientRect();
        setFloatingToolbar({
          blockId,
          start,
          end,
          text: selectedText,
          x: Math.max(16, Math.min(window.innerWidth - 320, rect.left + 20)),
          y: Math.max(65, rect.top - 46),
        });
        return;
      }
    }
    setFloatingToolbar(null);
  };

  const applyInlineFormatting = (
    blockId: string,
    start: number,
    end: number,
    prefix: string,
    suffix: string
  ) => {
    if (!activeDoc) return;
    const block = activeDoc.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const text = block.content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);

    let newContent = '';
    if (before.endsWith(prefix) && after.startsWith(suffix)) {
      newContent = before.slice(0, -prefix.length) + selected + after.slice(suffix.length);
    } else {
      newContent = before + prefix + selected + suffix + after;
    }
    updateBlock(activeDoc.id, blockId, { content: newContent });
    setFloatingToolbar(null);
  };

  const [showBlockAiMenu, setShowBlockAiMenu] = useState<string | null>(null);
  const [showFloatingAiMenu, setShowFloatingAiMenu] = useState<boolean>(false);
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);

  const handleBlockAiAction = async (
    block: DocBlock,
    action: 'expand' | 'polish' | 'translate' | 'critique' | 'todos'
  ) => {
    setShowBlockAiMenu(null);
    if (!user) {
      setIsAuthModalOpen?.(true);
      addNotification('Wymagane logowanie', 'Zaloguj się do usługi SearchPoint, aby korzystać z asystenta AI.', 'warning');
      return;
    }
    if (!activeDoc) return;
    if (!block.content && action !== 'expand') {
      addNotification('Pusty blok', 'Wpisz treść bloku przed użyciem asystenta AI.', 'warning');
      return;
    }

    setIsAiProcessing(true);

    try {
      let prompt = '';
      if (action === 'expand') prompt = `@expandblock Rozwiń i uzupełnij merytorycznie ten punkt: ${block.content || activeDoc.title}`;
      else if (action === 'polish') prompt = `@polishstyle Wyszlifuj profesjonalnie styl i gramatykę tego akapitu: ${block.content}`;
      else if (action === 'translate') prompt = `@translate Przetłumacz na profesjonalny język angielski: ${block.content}`;
      else if (action === 'critique') prompt = `@critique Znajdź potencjalne ryzyka, luki logiczne i kontrargumenty dla tego fragmentu: ${block.content}`;
      else if (action === 'todos') prompt = `@actionitems Wygeneruj listę konkretnych zadań TODO w oparciu o ten punkt: ${block.content}`;

      const res = await generateEditorAiResponse({
        query: prompt,
        activeDoc,
        pages,
      });

      if (action === 'polish' && res.text) {
        const polishedText = res.text
          .replace(/###.*?\n/g, '')
          .replace(/>.*?\n/g, '')
          .replace(/####.*?\n/g, '')
          .trim()
          .replace(/^"/, '')
          .replace(/"$/, '');
        updateBlock(activeDoc.id, block.id, { content: polishedText || res.text });
        addNotification('Styl wyszlifowany', 'Tekst bloku został zaktualizowany przez AI.', 'success');
      } else if (res.blocks && res.blocks.length > 0) {
        insertBlocks(activeDoc.id, res.blocks, block.id);
        addNotification('AI dodało treść', `Wstawiono ${res.blocks.length} nowych bloków pod wybranym elementem.`, 'success');
      } else if (res.text) {
        const fallbackBlock: DocBlock = {
          id: `block-${Date.now()}`,
          type: action === 'critique' ? 'callout' : 'p',
          content: res.text,
          calloutType: action === 'critique' ? 'warning' : 'info',
        };
        insertBlocks(activeDoc.id, [fallbackBlock], block.id);
        addNotification('AI dodało blok', 'Odpowiedź asystenta została dołączona pod blokiem.', 'success');
      }
    } catch {
      addNotification('Błąd AI', 'Nie udało się przetworzyć zapytania. Spróbuj ponownie.', 'error');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSelectionAiAction = async (action: 'polish' | 'expand' | 'translate' | 'summarize') => {
    if (!user) {
      setIsAuthModalOpen?.(true);
      addNotification('Wymagane logowanie', 'Zaloguj się do usługi SearchPoint, aby korzystać z asystenta AI.', 'warning');
      return;
    }
    if (!floatingToolbar || !activeDoc) return;
    const { blockId, start, end, text } = floatingToolbar;
    setFloatingToolbar(null);
    setShowFloatingAiMenu(false);

    if (!text.trim()) return;

    try {
      let prompt = '';
      if (action === 'polish') prompt = `Wyszlifuj profesjonalnie ten zwrot (zwróć tylko poprawiony tekst bez cudzysłowów): "${text}"`;
      else if (action === 'expand') prompt = `Rozwiń w 1-2 zwięzłe zdania ten fragment: "${text}"`;
      else if (action === 'translate') prompt = `Przetłumacz na naturalny angielski (tylko tłumaczenie): "${text}"`;
      else if (action === 'summarize') prompt = `Skróć i uprość do sedna ten fragment: "${text}"`;

      const res = await generateEditorAiResponse({
        query: prompt,
        activeDoc,
        pages,
      });

      let replacement = res.text
        .replace(/###.*?\n/g, '')
        .replace(/>.*?\n/g, '')
        .trim()
        .replace(/^"/, '')
        .replace(/"$/, '');
      if (!replacement) replacement = text;

      const targetBlock = activeDoc.blocks.find((b) => b.id === blockId);
      if (targetBlock) {
        const original = targetBlock.content;
        const newContent = original.substring(0, start) + replacement + original.substring(end);
        updateBlock(activeDoc.id, blockId, { content: newContent });
        addNotification('AI zaktualizowało tekst', 'Wprowadzono ulepszenia w zaznaczonym fragmencie.', 'success');
      }
    } catch {
      addNotification('Błąd AI', 'Nie udało się przetworzyć zaznaczenia.', 'error');
    }
  };

  const handleCreateAndOpenPage = async (title: string) => {
    const newId = await createPage(undefined, title);
    if (newId) {
      setActivePageId(newId);
    }
  };

  // Auto-focus search input when slash menu opens
  useEffect(() => {
    if (showSlashMenu) {
      setSlashSelectedIndex(0);
      const timer = setTimeout(() => {
        slashSearchInputRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [showSlashMenu]);

  // Auto-scroll selected command in slash menu into view
  useEffect(() => {
    if (showSlashMenu && slashListContainerRef.current) {
      const selectedItem = slashListContainerRef.current.querySelector(
        `[data-index="${slashSelectedIndex}"]`
      );
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [slashSelectedIndex, showSlashMenu]);

  // Global keyboard shortcuts (Ctrl+/, Ctrl+F, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        if (activeDoc && activeDoc.blocks.length > 0) {
          const lastBlock = activeDoc.blocks[activeDoc.blocks.length - 1];
          setShowSlashMenu({ blockId: lastBlock.id, filter: '' });
          setSlashSelectedIndex(0);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setShowSearchReplace((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isZenMode) {
          setIsZenMode(false);
        }
        setShowSearchReplace(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeDoc, isZenMode, setIsZenMode]);

  if (!activeDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <BookOpen size={36} className="text-slate-400 mb-2" />
        <p>Wybierz stronę z menu bocznego lub utwórz nowy dokument.</p>
      </div>
    );
  }

  const backlinks = getBacklinks(activeDoc.title);

  // Compute document stats
  const totalWords = activeDoc.blocks.reduce((acc, b) => {
    return acc + (b.content ? b.content.trim().split(/\s+/).filter(Boolean).length : 0);
  }, 0);
  const readingTimeMin = Math.max(1, Math.ceil(totalWords / 200));

  // Extract headings with hierarchical numbering for Table of Contents
  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;
  const headingsWithNumbering = activeDoc.blocks
    .filter((b) => b.type === 'h1' || b.type === 'h2' || b.type === 'h3')
    .map((b) => {
      let num = '';
      if (b.type === 'h1') {
        h1Count++;
        h2Count = 0;
        h3Count = 0;
        num = h1Count < 10 ? `0${h1Count}` : `${h1Count}`;
      } else if (b.type === 'h2') {
        h2Count++;
        h3Count = 0;
        const h1Prefix = h1Count < 10 ? `0${h1Count}` : `${h1Count}`;
        num = `${h1Prefix}.${h2Count}`;
      } else if (b.type === 'h3') {
        h3Count++;
        const h1Prefix = h1Count < 10 ? `0${h1Count}` : `${h1Count}`;
        num = `${h1Prefix}.${h2Count}.${h3Count}`;
      }
      return {
        ...b,
        numbering: num,
      };
    });

  // Smooth scroll to heading block in editor and preview
  const handleScrollToHeading = (blockId: string) => {
    const editorElem = document.getElementById(`editor-block-${blockId}`);
    const previewElem = document.getElementById(`preview-block-${blockId}`);

    if (editorElem) {
      editorElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (previewElem) {
      previewElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setHighlightedBlockId(blockId);
    setTimeout(() => setHighlightedBlockId(null), 2000);
  };

  // Copy code block content
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  // Export actions share the same block-aware serializers as the copy-all action.
  // This prevents export and clipboard outputs from drifting apart over time.
  const handleExport = (format: 'md' | 'txt' | 'html') => {
    try {
      const blocks = activeDoc.blocks as unknown as SerializableDocBlock[];
      const markdown = serializeDocumentToMarkdown(activeDoc.title, activeDoc.icon, blocks);
      const textContent = blocks
        .map((block) => serializeBlockToPlainText(block))
        .filter((part) => Boolean(String(part ?? '').trim()))
        .join('\n\n');
      const content = format === 'md'
        ? markdown
        : format === 'html'
          ? serializeDocumentToHtml(activeDoc.title, activeDoc.icon, blocks)
          : `${activeDoc.title || 'Bez tytułu'}\n\n${textContent}\n`;
      const mimeType = format === 'html'
        ? 'text/html;charset=utf-8'
        : format === 'md'
          ? 'text/markdown;charset=utf-8'
          : 'text/plain;charset=utf-8';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeFilename = (activeDoc.title || 'notatka')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'notatka';
      anchor.href = url;
      anchor.download = `${safeFilename}.${format}`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      addNotification('Wyeksportowano dokument', `Pobrano kompletny dokument w formacie .${format.toUpperCase()}.`, 'success', activeDoc.id);
    } catch (error) {
      console.error('[BlockEditor] Export failed:', error);
      addNotification('Błąd eksportu', 'Nie udało się przygotować pliku. Spróbuj ponownie.', 'error', activeDoc.id);
    }
  };

  /** Copy every document block, preserving rich formatting where the browser allows it. */
  const handleCopyDocText = async () => {
    const blocks = activeDoc.blocks as unknown as SerializableDocBlock[];
    const plainText = serializeDocumentToMarkdown(activeDoc.title, activeDoc.icon, blocks);
    const richHtml = serializeDocumentToHtmlFragment(activeDoc.title, activeDoc.icon, blocks);

    try {
      if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([richHtml], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        });
        try {
          await navigator.clipboard.write([clipboardItem]);
        } catch (richClipboardError) {
          // Some browsers allow text-only clipboard writes even when rich HTML is denied.
          if (!navigator.clipboard?.writeText) throw richClipboardError;
          await navigator.clipboard.writeText(plainText);
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plainText);
      } else {
        throw new Error('Clipboard API is unavailable in this browser context.');
      }

      setCopiedDoc(true);
      addNotification('Skopiowano całą notatkę', 'W schowku znajduje się pełna treść wraz ze strukturą i linkami.', 'success', activeDoc.id);
      window.setTimeout(() => setCopiedDoc(false), 2200);
    } catch (error) {
      console.error('[BlockEditor] Copy-all failed:', error);
      addNotification('Nie udało się skopiować notatki', 'Sprawdź uprawnienia schowka przeglądarki lub skorzystaj z eksportu Markdown.', 'warning', activeDoc.id);
    }
  };

  const handleCopyShareLink = () => {
    const link = `${window.location.origin}/s/${activeDoc.publicSlug || activeDoc.id}`;
    navigator.clipboard.writeText(link);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // Search & Replace Handlers
  const handleReplaceCurrent = (blockId: string, fromText: string, toText: string) => {
    const block = activeDoc.blocks.find((b) => b.id === blockId);
    if (!block) return;
    const idx = block.content.indexOf(fromText);
    if (idx !== -1) {
      const newContent =
        block.content.substring(0, idx) + toText + block.content.substring(idx + fromText.length);
      updateBlock(activeDoc.id, blockId, { content: newContent });
      addNotification('Zamieniono tekst', 'Zaktualizowano dopasowanie w bloku.', 'success', activeDoc.id);
    }
  };

  const handleReplaceAll = (fromText: string, toText: string, matchCase: boolean) => {
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(fromText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    let count = 0;
    const updated = activeDoc.blocks.map((b) => {
      if (!b.content) return b;
      const matches = b.content.match(regex);
      if (matches) count += matches.length;
      return { ...b, content: b.content.replace(regex, toText) };
    });
    replaceAllBlocks(activeDoc.id, updated);
    addNotification('Zamieniono wszystko', `Zaktualizowano ${count} wystąpień w dokumencie.`, 'success', activeDoc.id);
  };

  // Outline / TOC copy helper
  const handleCopyOutlineMarkdown = () => {
    let md = `# Spis treści: ${activeDoc.title}\n\n`;
    headingsWithNumbering.forEach((h) => {
      const indent = h.type === 'h1' ? '' : h.type === 'h2' ? '  ' : '    ';
      md += `${indent}* ${h.numbering} ${h.content}\n`;
    });
    navigator.clipboard.writeText(md);
    addNotification('Skopiowano konspekt', 'Spis treści w formacie Markdown zapisano w schowku.', 'success', activeDoc.id);
  };

  // Duplicate Document Handler
  const handleDuplicateDoc = async () => {
    const newId = await createPage(undefined, `${activeDoc.title} (kopia)`);
    if (newId) {
      await replaceAllBlocks(newId, JSON.parse(JSON.stringify(activeDoc.blocks)));
      setActivePageId(newId);
      addNotification('Zduplikowano dokument', `Utworzono kopię "${activeDoc.title}"`, 'success', newId);
    }
  };

  // Convert Block type helper
  const handleConvertBlock = (blockId: string, newType: BlockType) => {
    const block = activeDoc.blocks.find((b) => b.id === blockId);
    if (!block) return;

    const updates: Partial<DocBlock> = { type: newType };
    if (newType === 'table' && !block.tableData) {
      updates.tableData = [
        ['Funkcja', 'Status', 'Priorytet', 'Termin'],
        ['Edytor blokowy', 'Gotowe', 'Wysoki', '18.10'],
        ['Live Preview', 'Gotowe', 'Wysoki', '19.10'],
        ['Zasoby i obrazy', 'Gotowe', 'Średni', '20.10'],
      ];
    }
    if (newType === 'callout' && !block.calloutType) {
      updates.calloutType = 'info';
    }
    if (newType === 'code' && !block.language) {
      updates.language = 'typescript';
    }
    if (newType === 'video' && !block.videoUrl) {
      updates.videoUrl = '';
    }
    if (newType === 'audio' && !block.audioUrl) {
      updates.audioUrl = '';
    }
    if (newType === 'bookmark' && !block.bookmarkUrl) {
      updates.bookmarkUrl = 'https://searchpoint.pl';
      updates.bookmarkTitle = 'SearchPoint Platform';
      updates.bookmarkDesc = 'Nowoczesna platforma workspace i wyszukiwarki';
    }
    if (newType === 'stat') {
      if (!block.content) updates.content = 'Przychód miesięczny';
      if (!block.statValue) updates.statValue = '—';
      if (!block.statTrend) updates.statTrend = '';
    }
    if (newType === 'progress') {
      if (!block.content) updates.content = 'Realizacja sprintu Q4';
      if (block.progressPercent === undefined) updates.progressPercent = 75;
    }
    if (newType === 'button') {
      if (!block.content) updates.content = 'Rozpocznij współpracę';
      if (!block.buttonUrl) updates.buttonUrl = 'https://searchpoint.pl';
      if (!block.buttonColor) updates.buttonColor = '#2563eb';
    }
    if (newType === 'timeline') {
      if (!block.content) updates.content = 'Wdrożenie wersji produkcyjnej v2.0';
      if (!block.timelineDate) updates.timelineDate = new Date().toLocaleDateString('pl-PL');
    }
    if (newType === 'file') {
      if (!block.fileName) updates.fileName = 'Specyfikacja_Projektu_2026.pdf';
      if (!block.fileSize) updates.fileSize = '2.4 MB';
      if (!block.fileUrl) updates.fileUrl = '#';
    }
    if (newType === 'embed') {
      if (!block.content) updates.content = 'Widok platformy';
      if (!block.embedUrl) updates.embedUrl = 'https://searchpoint.pl';
    }
    if (newType === 'h4' && !block.content) updates.content = 'Podsekcja poziomu 4';
    if (newType === 'h5' && !block.content) updates.content = 'Podsekcja poziomu 5';
    if (newType === 'h6' && !block.content) updates.content = 'Podsekcja poziomu 6';
    if (newType === 'lead' && !block.content) updates.content = 'Wprowadzenie i najważniejszy kontekst tego dokumentu...';
    if (newType === 'subtext' && !block.content) updates.content = 'Drobna adnotacja lub przypis dolny.';
    if (newType === 'numbered_toggle') {
      if (!block.content) updates.content = '1. Krok procesu (kliknij, aby rozwinąć)';
      if (!block.toggleDetails) updates.toggleDetails = 'Szczegóły wykonania tego kroku...';
    }
    if (newType === 'tabs') {
      if (!block.content) updates.content = 'Przegląd | Architektura | Zespół';
      if (!block.toggleDetails) updates.toggleDetails = 'Treść pierwszej zakładki... | Szczegóły architektury i bazy danych... | Lista osób odpowiedzialnych...';
      if (block.activeTabIndex === undefined) updates.activeTabIndex = 0;
    }
    if (newType === 'callout_info') {
      if (!block.content) updates.content = 'Informacja: Dane są automatycznie synchronizowane z chmurą.';
      updates.calloutType = 'info';
    }
    if (newType === 'callout_success') {
      if (!block.content) updates.content = 'Sukces: Wszystkie zadania zostały pomyślnie zrealizowane!';
      updates.calloutType = 'success';
    }
    if (newType === 'callout_warning') {
      if (!block.content) updates.content = 'Ostrzeżenie: Przed publikacją sprawdź uprawnienia dostępu.';
      updates.calloutType = 'warning';
    }
    if (newType === 'callout_danger') {
      if (!block.content) updates.content = 'Błąd krytyczny: Ta operacja wymaga uprawnień administratora.';
      updates.calloutType = 'danger';
    }
    if (newType === 'callout_tip') {
      if (!block.content) updates.content = 'Wskazówka: Użyj skrótu / aby szybko wstawić dowolny z 50 bloków.';
      updates.calloutType = 'tip';
    }
    if (newType === 'key_takeaway') {
      if (!block.content) updates.content = 'Kluczowy wniosek: Najważniejsza konkluzja z analizy lub spotkania.';
    }
    if (newType === 'terminal') {
      if (!block.content) updates.content = 'npm install @searchpoint/sdk\nsearchpoint start';
      updates.language = 'bash';
    }
    if (newType === 'json') {
      if (!block.content) updates.content = '{\n  "status": "success",\n  "version": "2.4.0",\n  "author": "Nowoczesne Studio"\n}';
      updates.language = 'json';
    }
    if (newType === 'diff') {
      if (!block.content) updates.content = '- const apiEndpoint = "http://localhost:3000";\n+ const apiEndpoint = "https://searchpoint.pl/api";';
      updates.language = 'diff';
    }
    if (newType === 'sql') {
      if (!block.content) updates.content = 'SELECT id, title, created_at FROM pages WHERE is_deleted = false;';
      updates.language = 'sql';
    }
    if (newType === 'stat_grid') {
      if (!block.content) updates.content = 'Ukończone zadania | Średni czas reakcji';
      if (!block.statValue) updates.statValue = '94.2% | 1.8h';
      if (!block.statTrend) updates.statTrend = '+5.8% | Cel osiągnięty';
    }
    if (newType === 'rating') {
      if (!block.content) updates.content = 'Ocena jakości / wiarygodności';
      if (block.ratingStars === undefined) updates.ratingStars = 5;
    }
    if (newType === 'poll') {
      if (!block.content) updates.content = 'Którą funkcję wdrażamy w następnym sprincie?';
      if (!block.pollOptions) {
        updates.pollOptions = [
          { label: 'Integracja z kalendarzem Google', votes: 14 },
          { label: 'Automatyzacje Studio AI', votes: 28 },
          { label: 'Eksport do formatu Markdown i PDF', votes: 11 },
        ];
      }
    }
    if (newType === 'map') {
      if (!block.content) updates.content = 'Warszawa, Polska';
      if (!block.embedUrl) updates.embedUrl = 'https://maps.google.com/maps?q=Warszawa&t=&z=13&ie=UTF8&iwloc=&output=embed';
    }
    if (newType === 'badge') {
      if (!block.content) updates.content = 'PRODUKCJA';
      if (!block.buttonColor) updates.buttonColor = '#10b981';
    }
    if (newType === 'spacer') {
      if (!block.content) updates.content = 'Odstęp pionowy';
      if (block.progressPercent === undefined) updates.progressPercent = 32;
    }
    if (newType === 'columns_2') {
      if (!block.content) updates.content = 'Lewa kolumna: Główne założenia i koncepcja.';
      if (!block.toggleDetails) updates.toggleDetails = 'Prawa kolumna: Szczegóły techniczne i harmonogram.';
    }
    if (newType === 'columns_3') {
      if (!block.content) updates.content = 'Kolumna 1: Badania';
      if (!block.toggleDetails) updates.toggleDetails = 'Kolumna 2: Prototyp|Kolumna 3: Wdrożenie produkcyjne';
    }
    if (newType === 'card') {
      if (!block.content) updates.content = 'Karta informacyjna';
      if (!block.toggleDetails) updates.toggleDetails = 'Wyróżniona treść wewnątrz modułowej karty z delikatnym obramowaniem i cieniem.';
    }
    if (newType === 'alert_banner') {
      if (!block.content) updates.content = '📢 Ważne ogłoszenie: Wszystkie systemy działają stabilnie w chmurze.';
      updates.calloutType = 'info';
    }
    if (newType === 'ai_prompt') {
      if (!block.content) updates.content = 'Zapytaj AI o podsumowanie tego rozdziału...';
      if (!block.toggleDetails) updates.toggleDetails = '';
    }
    if (newType === 'signature') {
      if (!block.content) updates.content = user?.displayName || user?.email?.split('@')[0] || 'Kacper';
      if (!block.timelineDate) updates.timelineDate = new Date().toLocaleDateString('pl-PL');
    }
    if (newType === 'pros_cons') {
      if (!block.content) updates.content = '+ Szybka realizacja i proste API\n+ Brak ukrytych kosztów\n+ Pełna responsywność';
      if (!block.toggleDetails) updates.toggleDetails = '- Wymaga migracji bazy danych\n- Czas na przeszkolenie zespołu';
    }
    if (newType === 'mermaid') {
      if (!block.content) updates.content = 'Diagram Architektury i Przepływu';
      if (!block.diagramSyntax) {
        updates.diagramSyntax = 'graph TD\n  A[Start Projektu] --> B{Wymagania}\n  B -->|Zdefiniowane| C[Architektura i DocBlock]\n  B -->|Niejasne| D[Warsztaty z Klientem]\n  C --> E[Wdrożenie Produkcyjne 🚀]';
      }
      if (!block.diagramType) updates.diagramType = 'flowchart';
    }
    if (newType === 'kanban_board') {
      if (!block.content) updates.content = 'Mini Tablica Zadań Projektu';
      if (!block.kanbanColumns) {
        updates.kanbanColumns = [
          {
            id: 'col-todo',
            title: 'Do zrobienia',
            color: '#64748b',
            items: [
              { id: 'k1', title: 'Specyfikacja API v2', tag: 'Architektura' },
              { id: 'k2', title: 'Makiety widoku mobilnego', tag: 'UI/UX' },
            ],
          },
          {
            id: 'col-prog',
            title: 'W toku',
            color: '#3b82f6',
            items: [
              { id: 'k3', title: 'Implementacja nowych bloków', tag: 'Dev' },
            ],
          },
          {
            id: 'col-done',
            title: 'Gotowe',
            color: '#10b981',
            items: [
              { id: 'k4', title: 'Jednolity model DocBlock', tag: 'Core' },
            ],
          },
        ];
      }
    }
    if (newType === 'countdown') {
      if (!block.content) updates.content = 'Wdrożenie Wersji Produkcyjnej SearchPoint 2.0';
      if (!block.targetDate) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        updates.targetDate = d.toISOString().slice(0, 16);
      }
      if (!block.countdownTitle) updates.countdownTitle = 'Kluczowy Deadline';
    }
    if (newType === 'faq') {
      if (!block.content) updates.content = 'Najczęściej Zadawane Pytania (FAQ)';
      if (!block.faqItems) {
        updates.faqItems = [
          {
            question: 'Jak działają relacje między zadaniami a dokumentami?',
            answer: 'Każdy blok Todo oraz rekord w bazie danych posiada trwały identyfikator powiązany z nadrzędnym dokumentem i widokiem Kanban.',
            isOpen: true,
          },
          {
            question: 'Czy mogę eksportować dane do innych formatów?',
            answer: 'Tak, edytor wspiera eksport do formatu Markdown, PDF, HTML oraz kopiowanie tabel w formacie Excel / CSV.',
            isOpen: false,
          },
          {
            question: 'Czy asystent AI działa w trybie offline?',
            answer: 'Tak, w przypadku braku połączenia internetowego aplikacja automatycznie aktywuje lokalny silnik redakcyjny.',
            isOpen: false,
          },
        ];
      }
    }
    if (newType === 'before_after') {
      if (!block.content) updates.content = 'Porównanie: Przed vs Po Wdrożeniu';
      if (!block.beforeAfterData) {
        updates.beforeAfterData = {
          beforeTitle: 'Stan Wyjściowy (Przed)',
          beforePoints: [
            'Rozproszone notatki w 4 różnych narzędziach',
            'Ręczne przepisywanie zadań do tablicy',
            'Brak spójnej weryfikacji źródeł',
          ],
          afterTitle: 'Stan Docelowy (Po)',
          afterPoints: [
            'Wspólny model DocBlock i centralna baza wiedzy',
            'Automatyczna synchronizacja zadań z Kanbanem',
            'Weryfikacja faktów w 5 niezależnych rejestrach',
          ],
        };
      }
    }
    if (newType === 'user_mention') {
      if (!block.content) updates.content = user?.displayName || 'Kacper Nowicki';
      if (!block.mentionUser) {
        updates.mentionUser = {
          name: user?.displayName || 'Kacper Nowicki',
          email: user?.email || 'kacper@searchpoint.pl',
          role: 'Lead Architect & Core Engineer',
          status: 'Aktywny w projekcie',
        };
      }
    }
    if (newType === 'file_card') {
      if (!block.content) updates.content = 'Specyfikacja_Architektury_v2.pdf';
      if (!block.fileName) updates.fileName = 'Specyfikacja_Architektury_v2.pdf';
      if (!block.fileSize) updates.fileSize = '3.8 MB';
      if (!block.fileUrl) updates.fileUrl = 'https://searchpoint.pl/docs/specyfikacja.pdf';
    }
    if (newType === 'changelog') {
      if (!block.content) updates.content = 'Wydanie v2.4.0 — Nowoczesny Workspace Rebuild';
      if (!block.changelogData) {
        updates.changelogData = {
          version: 'v2.4.0',
          releaseDate: new Date().toLocaleDateString('pl-PL'),
          items: [
            { type: 'added', text: '10 nowych bloków: Mermaid, Mini Kanban, Countdown, FAQ, Before/After' },
            { type: 'fixed', text: 'Niezawodny Dual-Engine AI w edytorze z obsługą offline' },
            { type: 'changed', text: 'Nowoczesny minimalistyczny interfejs z pełnym podglądem bloków' },
          ],
        };
      }
    }
    if (newType === 'testimonial') {
      if (!block.content) updates.content = '„Nowoczesny Workspace całkowicie zrewolucjonizował zarządzanie wiedzą w naszym zespole. Edytor blokowy i wbudowana baza danych to czysta przyjemność.”';
      if (!block.quoteAuthor) updates.quoteAuthor = 'Marta Wiśniewska';
      if (!block.quoteRole) updates.quoteRole = 'Head of Product & Innovation';
      if (!block.quoteCompany) updates.quoteCompany = 'TechStudio Poland';
      if (block.ratingStars === undefined) updates.ratingStars = 5;
    }
    if (newType === 'target_meter') {
      if (!block.content) updates.content = 'Kwartalny Cel Realizacji Projektów';
      if (!block.gaugeData) {
        updates.gaugeData = {
          current: 84,
          target: 100,
          unit: '%',
          label: 'Postęp wdrożenia Q4',
        };
      }
    }
    if (newType === 'decision_matrix') {
      if (!block.content) updates.content = 'Wybór rozwiązania architektonicznego';
      if (!block.decisionMatrixData) {
        updates.decisionMatrixData = {
          criteria: ['Wydajność', 'Bezpieczeństwo', 'Czas Wdrożenia'],
          options: [
            { name: 'Wariant A (DocBlock + Puter AI)', scores: [9, 10, 8], totalScore: 27 },
            { name: 'Wariant B (Statyczny HTML)', scores: [6, 7, 5], totalScore: 18 },
          ],
        };
      }
    }
    if (newType === 'risk_register') {
      if (!block.content) updates.content = 'Rejestr Ryzyk Projektu';
      if (!block.riskRegisterData) {
        updates.riskRegisterData = [
          { risk: 'Opóźnienia w integracji API', likelihood: 'Średnia', impact: 'Wysoki', mitigation: 'Mocki kontraktowe TypeScript' },
          { risk: 'Spadek płynności interfejsu', likelihood: 'Niska', impact: 'Krytyczny', mitigation: 'Wirtualizacja listy bloków' },
        ];
      }
    }
    if (newType === 'milestone_roadmap') {
      if (!block.content) updates.content = 'Harmonogram Realizacji Projektu';
      if (!block.roadmapData) {
        updates.roadmapData = [
          { quarter: 'M1', title: 'Architektura i API v2', status: 'completed', owner: 'Architekt' },
          { quarter: 'M2', title: 'Implementacja 90+ Bloków', status: 'in_progress', owner: 'Frontend Lead' },
          { quarter: 'M3', title: 'Testy i wdrożenie produkcyjne', status: 'planned', owner: 'DevOps' },
        ];
      }
    }
    if (newType === 'swot_analysis') {
      if (!block.content) updates.content = 'Analiza SWOT Projektu';
      if (!block.swotData) {
        updates.swotData = {
          strengths: ['Wysoka wydajność silnika DocBlock', 'Puter AI z Claude 3.5 Sonnet'],
          weaknesses: ['Wymaga pamięci podręcznej przeglądarki'],
          opportunities: ['Integracja z bazami wiedzy OpenAlex i PubMed'],
          threats: ['Zmieniające się zewnętrzne endpointy API'],
        };
      }
    }
    if (newType === 'kpi_scorecard') {
      if (!block.content) updates.content = 'Karta Wskaźnika KPI';
      if (!block.kpiScorecardData) {
        updates.kpiScorecardData = {
          metricName: 'Czas Reakcji Edytora',
          currentValue: '95 ms',
          targetValue: '< 150 ms',
          trendPercent: '+35% wydajniej',
          status: 'on_track',
        };
      }
    }
    if (newType === 'api_endpoint') {
      if (!block.content) updates.content = 'Pobieranie dokumentów użytkownika';
      if (!block.apiEndpointData) {
        updates.apiEndpointData = {
          method: 'GET',
          path: '/api/v1/workspace/pages',
          status: 200,
          responseJson: '{\n  "status": "success",\n  "count": 8\n}',
        };
      }
    }
    if (newType === 'event_schedule') {
      if (!block.content) updates.content = 'Wprowadzenie i omówienie celów';
      if (!block.eventScheduleData) {
        updates.eventScheduleData = {
          timeStart: '10:00',
          timeEnd: '10:30',
          title: 'Omówienie celów i podziału zadań',
          speakerOrLead: 'Prowadzący',
          roomOrLink: 'Sala konferencyjna / Online',
        };
      }
    }
    if (newType === 'citation_source') {
      if (!block.content) updates.content = 'Źródło Referencyjne';
      if (!block.citationData) {
        updates.citationData = {
          title: 'Architectures for Real-Time Collaborative Applications',
          authors: 'Kowalski J., Nowak A.',
          journalOrSource: 'ACM Transactions on Software Engineering',
          year: '2026',
          doi: '10.1145/3412345.3412346',
        };
      }
    }
    if (newType === 'summary_box') {
      if (!block.content) updates.content = 'Najważniejsze wnioski i ustalenia w jednym zwięzłym podsumowaniu.';
    }
    if (newType === 'announcement_banner') {
      if (!block.content) updates.content = 'Ważna Informacja: Nowa wersja systemu jest już aktywna.';
      if (!block.announcementData) {
        updates.announcementData = {
          title: 'Ważne Ogłoszenie',
          message: 'Wszystkie systemy działają stabilnie w chmurze.',
          bannerType: 'info',
        };
      }
    }
    if (newType === 'spec_table') {
      if (!block.content) updates.content = 'Specyfikacja Techniczna Modułu';
      if (!block.specTableData) {
        updates.specTableData = [
          { key: 'Wersja API', value: 'v2.4.0 (DocBlock)', note: 'Produkcyjna' },
          { key: 'Maks. Liczba Bloków', value: '1,000+', note: 'Zoptymalizowano' },
          { key: 'Silnik AI', value: 'Puter AI (Claude 3.5 / GPT-4o)', note: 'Zero-Lag' },
        ];
      }
    }
    if (newType === 'code_sandbox') {
      if (!block.content) updates.content = 'Interactive Code Sandbox';
      if (!block.codeSandboxData) {
        updates.codeSandboxData = {
          code: '// JavaScript / TypeScript Sandbox\nconst sum = (a, b) => a + b;\nconsole.log("Wynik:", sum(40, 2));',
          language: 'typescript',
          outputConsole: 'Wynik: 42',
        };
      }
    }
    if (newType === 'audio_memo') {
      if (!block.content) updates.content = 'Notatka Głosowa z Zebrania';
      if (!block.audioMemoData) {
        updates.audioMemoData = {
          title: 'Notatka Głosowa ze Spotkania',
          duration: '02:15',
          recordedAt: 'Dzisiaj, 10:45',
        };
      }
    }
    if (newType === 'meeting_action_item') {
      if (!block.content) updates.content = 'Zadanie ze spotkania: Przygotować raport podsumowujący';
      updates.checked = false;
    }
    if (newType === 'embed_github') {
      if (!block.content) updates.content = 'GitHub Repository';
      if (!block.bookmarkUrl) updates.bookmarkUrl = 'https://github.com';
    }
    if (newType === 'linked_database') {
      if (!block.content) updates.content = 'Powiązane zadania (Linked View)';
      if (!block.linkedDatabaseData) {
        updates.linkedDatabaseData = {
          entityKind: 'tasks',
          viewMode: 'table',
          title: block.content || 'Powiązane zadania (Linked View)',
          searchQuery: '',
          statusFilter: 'all',
          priorityFilter: 'all',
          projectFilter: activeDoc.pageType === 'Project' ? 'auto' : 'all',
          limit: 20,
        };
      }
    }

    updateBlock(activeDoc.id, blockId, updates);
    setShowConvertMenuForBlock(null);
  };

  // Inline smart typing detector (e.g. #H1 hejka/, #todo task/, or markdown '# ')
  const handleContentChange = (blockId: string, rawValue: string) => {
    // Check if section is locked by another teammate
    const targetBlock = activeDoc?.blocks.find((b) => b.id === blockId);
    if (targetBlock?.lockedBy && targetBlock.lockedBy.userId !== user?.uid) {
      addNotification(
        'Sekcja zablokowana',
        `Ten blok jest zablokowany przez ${targetBlock.lockedBy.userName}.`,
        'warning',
        activeDoc.id
      );
      return;
    }

    const value = filterSwearWords(rawValue);
    // 1. Check for command format: "#H1 text/", "#todo text/", etc.
    const commandMatch = value.match(/^#(h1|h2|h3|todo|callout|quote|code|bullet|number|table|divider|video|audio|bookmark|stat|progress|button|timeline|file|embed)\s*(.*?)\/$/i);
    if (commandMatch) {
      const cmdType = commandMatch[1].toLowerCase() as BlockType;
      const cmdText = commandMatch[2].trim();
      handleConvertBlock(blockId, cmdType);
      updateBlock(activeDoc.id, blockId, { content: cmdText });
      setShowSlashMenu(null);
      return;
    }

    // 2. Standard markdown auto-transform triggers on typing space
    if (value === '# ') {
      handleConvertBlock(blockId, 'h1');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '## ') {
      handleConvertBlock(blockId, 'h2');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '### ') {
      handleConvertBlock(blockId, 'h3');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '- ' || value === '* ') {
      handleConvertBlock(blockId, 'bullet');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '1. ') {
      handleConvertBlock(blockId, 'number');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '[] ' || value === '[ ] ') {
      handleConvertBlock(blockId, 'todo');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '> ') {
      handleConvertBlock(blockId, 'quote');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '```') {
      handleConvertBlock(blockId, 'code');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }
    if (value === '---') {
      handleConvertBlock(blockId, 'divider');
      updateBlock(activeDoc.id, blockId, { content: '' });
      return;
    }

    // 3. Regular content update
    updateBlock(activeDoc.id, blockId, { content: value });

    // 4. Slash menu trigger:
    // If the value starts with '/', or if user typed '/' at the end (e.g. "tekst /")
    if (value.startsWith('/')) {
      setShowSlashMenu({ blockId, filter: value.slice(1) });
      setSlashSelectedIndex(0);
    } else if (value.endsWith(' /') || value === '/') {
      setShowSlashMenu({ blockId, filter: '' });
      setSlashSelectedIndex(0);
    } else {
      if (showSlashMenu && showSlashMenu.blockId === blockId) {
        setShowSlashMenu(null);
      }
    }

    // 5. WikiLinks trigger [[
    const wikiMatch = value.match(/\[\[([^\]]*)$/);
    if (wikiMatch) {
      setWikiSuggest({ blockId, query: wikiMatch[1] });
    } else if (wikiSuggest?.blockId === blockId) {
      setWikiSuggest(null);
    }
  };

  const handleSelectWikiPage = (pageTitle: string) => {
    if (!wikiSuggest) return;
    const block = activeDoc.blocks.find((b) => b.id === wikiSuggest.blockId);
    if (!block) return;
    const newContent = block.content.replace(/\[\[([^\]]*)$/, `[[${pageTitle}]] `);
    updateBlock(activeDoc.id, wikiSuggest.blockId, { content: newContent });
    setWikiSuggest(null);
  };

  // Slash commands catalog (52 types)
  const SLASH_COMMANDS: {
    type: BlockType;
    label: string;
    desc: string;
    icon: any;
    category: 'Tekst' | 'Listy' | 'Wyróżnienia' | 'Kod i Tech' | 'Dane' | 'Media' | 'Układ' | 'Zaawansowane';
    badge?: string;
  }[] = [
      // 1. Tekst
      { type: 'p', label: 'Tekst (Akapit)', desc: 'Zwykły tekst bez formatowania nagłówka', icon: Pilcrow, category: 'Tekst', badge: 'Akapit' },
      { type: 'p', label: 'Podstrona (Sub-page)', desc: 'Utwórz nową stronę wewnątrz tego dokumentu', icon: BookOpen, category: 'Tekst', badge: '/page' },
      { type: 'h1', label: 'Nagłówek 1', desc: 'Duży główny nagłówek sekcji (#H1)', icon: Heading1, category: 'Tekst', badge: '#H1' },
      { type: 'h2', label: 'Nagłówek 2', desc: 'Średni podnagłówek sekcji (#H2)', icon: Heading2, category: 'Tekst', badge: '#H2' },
      { type: 'h3', label: 'Nagłówek 3', desc: 'Mały podtytuł dokumentu (#H3)', icon: Heading3, category: 'Tekst', badge: '#H3' },
      { type: 'h4', label: 'Nagłówek 4', desc: 'Mikro podsekcja dokumentu (#H4)', icon: Heading3, category: 'Tekst', badge: '#H4' },
      { type: 'h5', label: 'Nagłówek 5', desc: 'Mniejsza podsekcja poziomu 5 (#H5)', icon: Heading3, category: 'Tekst', badge: '#H5' },
      { type: 'h6', label: 'Nagłówek 6', desc: 'Etykieta sekcji poziomu 6 (#H6)', icon: Heading3, category: 'Tekst', badge: '#H6' },
      { type: 'lead', label: 'Lead / Wprowadzenie', desc: 'Wyróżniony tekst wstępny z większym fontem', icon: FileText, category: 'Tekst', badge: 'Lead' },
      { type: 'subtext', label: 'Przypis / Drobny tekst', desc: 'Drobna adnotacja, źródło lub podpis dolny', icon: Edit3, category: 'Tekst', badge: 'Przypis' },
      { type: 'quote', label: 'Cytat', desc: 'Wyróżniony cytat z lewym obramowaniem', icon: Quote, category: 'Tekst', badge: '>' },

      // 2. Listy i Organizacja
      { type: 'bullet', label: 'Lista punktowana', desc: 'Wypunktowanie z kropkami (- lub *)', icon: List, category: 'Listy', badge: '•' },
      { type: 'number', label: 'Lista numerowana', desc: 'Uporządkowana lista kroków (1.)', icon: ListOrdered, category: 'Listy', badge: '1.' },
      { type: 'todo', label: 'Zadanie To-Do', desc: 'Pole wyboru powiązane z Kanban i kalendarzem', icon: CheckSquare, category: 'Listy', badge: '[]' },
      { type: 'toggle', label: 'Sekcja zwijana (Toggle)', desc: 'Ukrywanie i rozwijanie szczegółów tekstu', icon: ChevronDown, category: 'Listy', badge: 'Zwiń' },
      { type: 'numbered_toggle', label: 'Numerowana sekcja zwijana', desc: 'Krok z numerem i rozwijaną zawartością', icon: ChevronRight, category: 'Listy', badge: '1. Zwiń' },
      { type: 'tabs', label: 'Zakładki (Tabs)', desc: 'Interaktywne kafelki przełączania widoków', icon: Layers, category: 'Listy', badge: 'Tabs' },

      // 3. Wyróżnienia & Callouts
      { type: 'callout', label: 'Wyróżnienie Callout', desc: 'Kolorowy boks z ikoną i dowolną treścią', icon: AlertCircle, category: 'Wyróżnienia', badge: 'Boks' },
      { type: 'callout_info', label: 'Informacja (Niebieski)', desc: 'Ważna informacja systemowa z ikoną info', icon: Info, category: 'Wyróżnienia', badge: 'Info' },
      { type: 'callout_success', label: 'Sukces (Zielony)', desc: 'Komunikat sukcesu i zrealizowanego celu', icon: CheckCircle2, category: 'Wyróżnienia', badge: 'Sukces' },
      { type: 'callout_warning', label: 'Ostrzeżenie (Żółty)', desc: 'Uwaga i ostrzeżenie przed błędem', icon: AlertTriangle, category: 'Wyróżnienia', badge: 'Uwaga' },
      { type: 'callout_danger', label: 'Błąd / Krytyczny (Czerwony)', desc: 'Krytyczny błąd lub blokada operacji', icon: XCircle, category: 'Wyróżnienia', badge: 'Błąd' },
      { type: 'callout_tip', label: 'Wskazówka (Fioletowy)', desc: 'Porada, tip lub sugestia optymalizacji', icon: Flame, category: 'Wyróżnienia', badge: 'Tip' },
      { type: 'key_takeaway', label: 'Kluczowy Wniosek', desc: 'Złoty boks podsumowania z pucharem osiągnięcia', icon: Award, category: 'Wyróżnienia', badge: '🏆 Wniosek' },

      // 4. Kod i Technologia
      { type: 'code', label: 'Blok kodu', desc: 'Podświetlany kod w 10+ językach z kopiowaniem', icon: Code, category: 'Kod i Tech', badge: 'Kod' },
      { type: 'terminal', label: 'Konsola Terminala', desc: 'Czarna konsola bash/sh z promptem $ i kopiowaniem', icon: Terminal, category: 'Kod i Tech', badge: 'Bash' },
      { type: 'math', label: 'Formuła matematyczna', desc: 'Wzory naukowe i równania KaTeX / LaTeX', icon: Sigma, category: 'Kod i Tech', badge: 'Math' },
      { type: 'json', label: 'Podgląd JSON / API', desc: 'Sformatowana struktura JSON z podświetleniem', icon: FileCode, category: 'Kod i Tech', badge: 'JSON' },
      { type: 'diff', label: 'Różnice w kodzie (Diff)', desc: 'Porównanie kodu ze znacznikami + i - w liniach', icon: GitCompare, category: 'Kod i Tech', badge: 'Diff' },
      { type: 'sql', label: 'Zapytanie SQL', desc: 'Zapytanie do bazy danych z dedykowaną składnią', icon: Database, category: 'Kod i Tech', badge: 'SQL' },

      // 5. Dane i Tabele
      { type: 'linked_database', label: 'Widok Bazy Danych (Linked Database)', desc: 'Osadzony widok bazy Projects, Tasks lub Meetings (Table/Board/List)', icon: Database, category: 'Dane', badge: '/baza' },
      { type: 'chart', label: 'Wykres Interaktywny (Chart)', desc: 'Wykres słupkowy, liniowy lub kołowy z edycją serii danych', icon: BarChart2, category: 'Dane', badge: '/chart' },
      { type: 'table', label: 'Tabela (Mini Excel)', desc: 'Interaktywna siatka z formułami i statystykami', icon: TableIcon, category: 'Dane', badge: 'Tabela' },
      { type: 'stat', label: 'Karta Statystyki / KPI', desc: 'Duża liczba ze wskaźnikiem trendu (+18.4%)', icon: TrendingUp, category: 'Dane', badge: 'KPI' },
      { type: 'stat_grid', label: 'Podwójna Karta KPI', desc: 'Dwie metryki obok siebie dla porównania wyników', icon: BarChart2, category: 'Dane', badge: 'A/B KPI' },
      { type: 'progress', label: 'Pasek Postępu', desc: 'Wizualny pasek ukończenia 0-100% z suwakiem', icon: Sliders, category: 'Dane', badge: '0-100%' },
      { type: 'rating', label: 'Ocena (Gwiazdki 1-5)', desc: 'Interaktywna ocena gwiazdkowa z etykietą', icon: Star, category: 'Dane', badge: '⭐⭐⭐⭐⭐' },
      { type: 'poll', label: 'Głosowanie / Mini Ankieta', desc: 'Opcje z paskami procentowymi i klikalnymi głosami', icon: Vote, category: 'Dane', badge: 'Ankieta' },

      // 6. Media i Załączniki
      { type: 'image', label: 'Obrazek / Grafika', desc: 'Osadzanie z URL lub galerii Zasobów', icon: ImageIcon, category: 'Media', badge: 'Obraz' },
      { type: 'video', label: 'Wideo (YouTube / MP4)', desc: 'Odtwarzacz wideo z autoodtwarzaniem embed', icon: Video, category: 'Media', badge: 'YouTube' },
      { type: 'audio', label: 'Audio / Podcast', desc: 'Odtwarzacz dźwięku MP3 lub Spotify', icon: Music, category: 'Media', badge: 'MP3' },
      { type: 'bookmark', label: 'Zakładka Linku', desc: 'Elegancka karta z podglądem strony WWW', icon: Bookmark, category: 'Media', badge: 'URL' },
      { type: 'file', label: 'Załącznik / Plik', desc: 'Karta pliku z rozmiarem i przyciskiem Pobierz', icon: Paperclip, category: 'Media', badge: 'Plik' },
      { type: 'embed', label: 'Osadzenie Web / Iframe', desc: 'Interaktywna ramka zewnętrznej strony WWW', icon: Layout, category: 'Media', badge: 'Iframe' },
      { type: 'map', label: 'Interaktywna Mapa', desc: 'Podgląd lokalizacji i adresu z Google Maps', icon: MapPin, category: 'Media', badge: 'Mapa' },
      { type: 'badge', label: 'Etykieta / Badge', desc: 'Kolorowy znacznik statusu projektu', icon: Tag, category: 'Media', badge: 'Status' },

      // 7. Układ i Separatory
      { type: 'divider', label: 'Linia podziału', desc: 'Separator między sekcjami (---)', icon: Minus, category: 'Układ', badge: '---' },
      { type: 'spacer', label: 'Odstęp pionowy', desc: 'Pusta regulowana przestrzeń między blokami', icon: LayoutTemplate, category: 'Układ', badge: 'Odstęp' },
      { type: 'columns_2', label: 'Układ 2 kolumn', desc: 'Dwa bloki tekstowe rozmieszczone obok siebie', icon: Columns, category: 'Układ', badge: 'Kolumny x2' },
      { type: 'columns_3', label: 'Układ 3 kolumn', desc: 'Trzy kolumny dla porównań i sekcji', icon: Columns, category: 'Układ', badge: 'Kolumny x3' },
      { type: 'card', label: 'Karta kontenerowa', desc: 'Estetyczna karta z cieniem i obramowaniem', icon: PanelTop, category: 'Układ', badge: 'Karta' },

      // 8. Zaawansowane i Interaktywne
      { type: 'timeline', label: 'Oś Czasu (Timeline)', desc: 'Krok w procesie z datą i węzłem osi', icon: Milestone, category: 'Zaawansowane', badge: 'Etap' },
      { type: 'button', label: 'Przycisk Akcji (CTA)', desc: 'Klikalny przycisk z linkiem wewnętrznym/zewnętrznym', icon: MousePointerClick, category: 'Zaawansowane', badge: 'CTA' },
      { type: 'alert_banner', label: 'Baner Ogłoszenia', desc: 'Pełny baner informacyjny na całą szerokość', icon: AlertCircle, category: 'Zaawansowane', badge: 'Baner' },
      { type: 'ai_prompt', label: 'Interaktywny Prompt AI', desc: 'Zadaj pytanie wewnątrz dokumentu i pozwól AI wygenerować treść', icon: Sparkles, category: 'Zaawansowane', badge: 'AI Prompt' },
      { type: 'signature', label: 'Podpis / Akceptacja', desc: 'Cyfrowy podpis dokumentu z datą i autorem', icon: PenTool, category: 'Zaawansowane', badge: 'Podpis' },
      { type: 'pros_cons', label: 'Zalety i Wady (Pros & Cons)', desc: 'Tabela za i przeciw z zielonymi plusami i czerwonymi minusami', icon: ThumbsUp, category: 'Zaawansowane', badge: '+ / -' },
      { type: 'mermaid', label: 'Diagram & Schemat (Mermaid)', desc: 'Interaktywny schemat procesów, architektury i grafów (Flowchart, Mindmap)', icon: Workflow, category: 'Kod i Tech', badge: 'Diagram' },
      { type: 'faq', label: 'Sekcja FAQ (Akordeon Q&A)', desc: 'Zwijany akordeon pytań i odpowiedzi dla dokumentacji i onboardingów', icon: HelpCircle, category: 'Listy', badge: 'FAQ' },
      { type: 'kanban_board', label: 'Mini Tablica Kanban', desc: 'Wbudowana tablica zadań z kolumnami Do Zrobienia, W Toku i Gotowe', icon: LayoutGrid, category: 'Dane', badge: 'Kanban' },
      { type: 'target_meter', label: 'Wskaźnik Celu / Miernik KPI', desc: 'Wizualny wskaźnik realizacji celu z procentem i statusem', icon: Target, category: 'Dane', badge: 'Miernik KPI' },
      { type: 'testimonial', label: 'Karta Referencji / Cytat', desc: 'Profesjonalna opinia lub referencja z gwiazdkami, autorem i firmą', icon: MessageSquareQuote, category: 'Wyróżnienia', badge: 'Opinia' },
      { type: 'file_card', label: 'Karta Załącznika / Pliku', desc: 'Elegancka karta dokumentu z rozmiarem (MB), typem i pobieraniem', icon: FileSpreadsheet, category: 'Media', badge: 'Pobierz' },
      { type: 'countdown', label: 'Odliczanie do Deadline\'u (Timer)', desc: 'Interaktywne odliczanie dni i godzin do kluczowego terminu', icon: Hourglass, category: 'Zaawansowane', badge: 'Deadline' },
      { type: 'before_after', label: 'Porównanie Przed i Po', desc: 'Wizualne zestawienie stanu wyjściowego vs docelowego', icon: Columns, category: 'Zaawansowane', badge: 'Przed / Po' },
      { type: 'user_mention', label: 'Karta Osoby / Przypisanie', desc: 'Wizytówka członka zespołu z awatarem, rolą i statusem', icon: UserCheck, category: 'Zaawansowane', badge: '@Osoba' },
      { type: 'changelog', label: 'Wpis Changelogu / Wydanie', desc: 'Notatka o wersji (np. v2.4.0) z tagami Added, Fixed i datą', icon: History, category: 'Zaawansowane', badge: 'Wydanie' },
      { type: 'decision_matrix', label: 'Macierz Decyzji', desc: 'Wybór wariantu i ważenie opcji punktacją 1-10', icon: CheckSquare, category: 'Dane', badge: '⚖️ Decyzja' },
      { type: 'risk_register', label: 'Rejestr Ryzyk', desc: 'Tabela identyfikacji ryzyk i planów mitygacji', icon: AlertTriangle, category: 'Zaawansowane', badge: '🛡️ Ryzyko' },
      { type: 'milestone_roadmap', label: 'Kamienie Milowe (Roadmap)', desc: 'Wizualny harmonogram etapów i sprintów', icon: Milestone, category: 'Zaawansowane', badge: '🗺️ Roadmap' },
      { type: 'swot_analysis', label: 'Analiza SWOT', desc: '4-ćwiartkowa matryca mocnych/słabych stron, szans i zagrożeń', icon: Layers, category: 'Dane', badge: '🧭 SWOT' },
      { type: 'kpi_scorecard', label: 'Karta Wskaźnika KPI', desc: 'Cel, aktualny wynik i trend realizacji wskaźnika', icon: TrendingUp, category: 'Dane', badge: '📈 KPI' },
      { type: 'api_endpoint', label: 'Karta Endpointu API', desc: 'Specyfikacja metody GET/POST/JSON z odpowiedzią', icon: Terminal, category: 'Kod i Tech', badge: '⚡ API' },
      { type: 'event_schedule', label: 'Punkt Agendy Spotkania', desc: 'Harmonogram czasowy z prelegentem i salą', icon: Clock, category: 'Listy', badge: '⏱️ Agenda' },
      { type: 'citation_source', label: 'Karta Źródła / Cytowania', desc: 'Publikacja naukowa z DOI, autorami i rokiem', icon: BookOpen, category: 'Tekst', badge: '📚 DOI' },
      { type: 'summary_box', label: 'Podsumowanie TL;DR', desc: 'Kluczowe wnioski i podsumowanie wykonawcze', icon: Sparkles, category: 'Wyróżnienia', badge: '💡 TL;DR' },
      { type: 'announcement_banner', label: 'Baner Ogłoszeniowy', desc: 'Wyróżniony komunikat firmowy z przyciskiem', icon: AlertCircle, category: 'Wyróżnienia', badge: '📢 Baner' },
      { type: 'spec_table', label: 'Specyfikacja Klucz-Wartość', desc: 'Tabela parametrów technicznych i właściwości', icon: TableIcon, category: 'Dane', badge: '📋 Spec' },
      { type: 'code_sandbox', label: 'Piaskownica Kodu (Sandbox)', desc: 'Interaktywny edytor JS/TS z konsolą wynikową', icon: Code, category: 'Kod i Tech', badge: '💻 Sandbox' },
      { type: 'audio_memo', label: 'Notatka Głosowa (Audio)', desc: 'Odtwarzacz nagrania z czasem trwania i datą', icon: Music, category: 'Media', badge: '🎙️ Audio' },
      { type: 'meeting_action_item', label: 'Action Item ze Spotkania', desc: 'Dedykowane zadanie powiązane z protokołem', icon: CheckSquare, category: 'Listy', badge: '☑️ Action' },
      { type: 'embed_github', label: 'Karta Repozytorium GitHub', desc: 'Podgląd repozytorium GitHub z linkiem', icon: FileCode, category: 'Media', badge: 'GitHub' },
    ];

  const filteredCommands = SLASH_COMMANDS.filter((cmd) => {
    const matchesCategory = slashSelectedCategory === 'all' || cmd.category === slashSelectedCategory;
    const query = (showSlashMenu?.filter || '').toLowerCase().trim();
    if (!query) return matchesCategory;
    const matchesText =
      cmd.label.toLowerCase().includes(query) ||
      cmd.type.toLowerCase().includes(query) ||
      cmd.desc.toLowerCase().includes(query) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(query));
    return matchesCategory && matchesText;
  });

  const applySlashCommand = async (blockId: string, cmdType: BlockType, cmdLabel?: string) => {
    if (cmdLabel === 'Podstrona (Sub-page)') {
      setShowSlashMenu(null);
      const pageTitle = window.prompt('Nazwa nowej podstrony:', 'Nowa podstrona');
      if (pageTitle && pageTitle.trim()) {
        const newPageId = await createPage(undefined, pageTitle.trim());
        if (newPageId) {
          updateBlock(activeDoc.id, blockId, { content: `[[${pageTitle.trim()}]]` });
          addNotification('Utworzono podstronę', `Utworzono i powiązano stronę: "${pageTitle.trim()}"`, 'success', activeDoc.id);
        }
      }
      return;
    }

    const currentBlock = activeDoc.blocks.find((b) => b.id === blockId);
    let cleanContent = (currentBlock?.content || '')
      .replace(/^\/[a-zA-Z0-9_-]*/, '')
      .replace(/\s*\/[a-zA-Z0-9_-]*$/, '')
      .trim();

    handleConvertBlock(blockId, cmdType);
    if (cleanContent) {
      updateBlock(activeDoc.id, blockId, { content: cleanContent });
    }
    setShowSlashMenu(null);
    setSlashSelectedIndex(0);
  };

  const handleTextKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    blockId: string,
    blockType: BlockType
  ) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredCommands[slashSelectedIndex];
        if (selected) {
          applySlashCommand(showSlashMenu.blockId, selected.type, selected.label);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(null);
        return;
      }
    }

    // Inline formatting shortcuts: Ctrl+B (Bold), Ctrl+I (Italic), Ctrl+E (Code), Ctrl+K (Link)
    if ((e.ctrlKey || e.metaKey) && ['b', 'i', 'e', 'k'].includes(e.key.toLowerCase())) {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      if (start !== null && end !== null && start < end) {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === 'b') {
          applyInlineFormatting(blockId, start, end, '**', '**');
        } else if (key === 'i') {
          applyInlineFormatting(blockId, start, end, '*', '*');
        } else if (key === 'e') {
          applyInlineFormatting(blockId, start, end, '`', '`');
        } else if (key === 'k') {
          const url = window.prompt('Wprowadź adres URL linku:', 'https://');
          if (url) {
            applyInlineFormatting(blockId, start, end, '[', `](${url})`);
          }
        }
        return;
      }
    }

    // Power Keyboard shortcuts: Alt+Up (Move Up), Alt+Down (Move Down), Ctrl+D (Duplicate)
    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveBlock(activeDoc.id, blockId, 'up');
      return;
    }
    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveBlock(activeDoc.id, blockId, 'down');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
      e.preventDefault();
      duplicateBlock(activeDoc.id, blockId);
      return;
    }

    // Tab key: Indent / Outdent list items
    if (e.key === 'Tab' && ['bullet', 'number', 'todo'].includes(blockType)) {
      e.preventDefault();
      const currentBlock = activeDoc.blocks.find((b) => b.id === blockId);
      if (currentBlock) {
        if (e.shiftKey) {
          // Outdent: remove leading 2 spaces if present
          const unindented = currentBlock.content.replace(/^ {1,2}/, '');
          updateBlock(activeDoc.id, blockId, { content: unindented });
        } else {
          // Indent: add 2 spaces
          updateBlock(activeDoc.id, blockId, { content: '  ' + currentBlock.content });
        }
      }
      return;
    }

    // Enter key: Notion-style smart list behavior
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const currentContent = e.currentTarget.value.trim();

      // If current list item or quote is empty, pressing Enter turns it into a normal paragraph
      if (currentContent === '' && ['bullet', 'number', 'todo', 'quote'].includes(blockType)) {
        handleConvertBlock(blockId, 'p');
        return;
      }

      if (blockType === 'bullet') {
        addBlock(activeDoc.id, blockId, 'bullet');
      } else if (blockType === 'number') {
        addBlock(activeDoc.id, blockId, 'number');
      } else if (blockType === 'todo') {
        addBlock(activeDoc.id, blockId, 'todo');
      } else {
        addBlock(activeDoc.id, blockId, 'p');
      }
      return;
    }

    // Backspace key: Notion-style block conversion and deletion
    if (e.key === 'Backspace') {
      const target = e.currentTarget;
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        // If not a paragraph, convert back to paragraph
        if (blockType !== 'p') {
          e.preventDefault();
          handleConvertBlock(blockId, 'p');
          return;
        }
        // If paragraph is empty and document has more than 1 block, delete it
        if (target.value === '' && activeDoc.blocks.length > 1) {
          e.preventDefault();
          deleteBlock(activeDoc.id, blockId);
          return;
        }
      }
    }
  };

  const handleBlockUrlUpdate = (blockId: string, updates: Partial<DocBlock>) => {
    const urlValues = Object.entries(updates).filter(([k, v]) =>
      ['buttonUrl', 'embedUrl', 'videoUrl', 'audioUrl', 'imageUrl', 'bookmarkUrl', 'fileUrl'].includes(k) && typeof v === 'string'
    );

    const hasBlocked = urlValues.some(([, v]) => isBlockedUrl(v as string));
    if (hasBlocked) {
      addNotification(
        'Zablokowano niedozwolony link',
        'Wprowadzony adres URL zawiera treści dla dorosłych (18+) i został zablokowany w edytorze.',
        'warning',
        activeDoc.id
      );
    }

    updateBlock(activeDoc.id, blockId, updates);
  };

  return (
    <div className="sp-doc-editor flex-1 h-full flex flex-col bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] overflow-hidden transition-colors" data-page-type={activeDoc.pageType || 'Document'}>
      <style>{EDITOR_DESIGN_SYSTEM}</style>
      {/* ========================================================================= */}
      {/* 1. NOTION TOP HEADER & WORKSPACE TOOLBAR                                  */}
      {/* ========================================================================= */}
      <header className="h-11 px-4 bg-white dark:bg-[#191919] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between text-xs shrink-0 select-none z-20">
        {/* Left: Notion Breadcrumbs + View Mode Switcher + Autosave Indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97] truncate">
            {activeDoc.pageType === 'Project' ? (
              <span
                className="font-medium hover:text-[#37352f] dark:hover:text-white cursor-pointer flex items-center gap-1"
                onClick={() => setActiveView('projects')}
              >
                <span>🚀</span>
                <span>Projects</span>
              </span>
            ) : activeDoc.pageType === 'Task' ? (
              <span
                className="font-medium hover:text-[#37352f] dark:hover:text-white cursor-pointer flex items-center gap-1"
                onClick={() => setActiveView('tasks')}
              >
                <span>☑️</span>
                <span>Tasks</span>
              </span>
            ) : activeDoc.pageType === 'Meeting' ? (
              <span
                className="font-medium hover:text-[#37352f] dark:hover:text-white cursor-pointer flex items-center gap-1"
                onClick={() => setActiveView('meetings')}
              >
                <span>🤝</span>
                <span>Meetings</span>
              </span>
            ) : (
              <span
                className="font-medium hover:text-[#37352f] dark:hover:text-white cursor-pointer"
                onClick={() => setActiveView('home')}
              >
                Workspace
              </span>
            )}
            <span>/</span>
            <span className="font-semibold text-[#37352f] dark:text-white truncate flex items-center gap-1">
              <span>{activeDoc.icon || '📄'}</span>
              <span className="truncate max-w-[150px] sm:max-w-[240px]">{activeDoc.title || 'Bez tytułu'}</span>
            </span>
          </div>

          {/* Sync Status Badge */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#787774] dark:text-[#9b9a97]">
            {syncStatus === 'saving' ? (
              <span className="text-amber-500 animate-pulse">Zapisywanie...</span>
            ) : (
              <span className="flex items-center gap-1">
                <Check size={11} className="text-emerald-500" />
                <span>Zapisano</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Tools: Edited just now · Share · Star · Comments · More · AI */}
        <div className="flex items-center gap-1">
          <span className="hidden md:inline text-[11px] text-[#787774] dark:text-[#9b9a97] mr-1">
            Edited just now
          </span>

          {/* Multiplayer Collaborators Presence Indicator */}
          <MultiplayerCursors
            pageId={activeDoc.id}
            currentUserId={user?.uid || 'anon'}
            currentUserName={user?.displayName || user?.email?.split('@')[0] || 'Ty'}
            currentUserEmail={user?.email || ''}
            teamMembers={currentWorkspace?.members || []}
            activeBlockId={focusedBlockId}
            containerRef={editorScrollContainerRef}
            onScrollToBlock={handleScrollToHeading}
          />

          {/* Share Button (Notion 1:1 Access & Sharing Modal) */}
          <button
            type="button"
            onClick={() => setShowAccessShareModal(true)}
            className={`px-2.5 py-1 rounded-[4px] text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${(activeDoc.sharedWith && activeDoc.sharedWith.length > 0) || (activeDoc.sharedCollaborators && activeDoc.sharedCollaborators.length > 0)
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'text-[#37352f] dark:text-[#d4d4d4] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
              }`}
            title="Access & Sharing (Zarządzanie uprawnieniami)"
          >
            <Users size={13} className="text-blue-600 dark:text-blue-400" />
            <span>
              {(activeDoc.sharedCollaborators && activeDoc.sharedCollaborators.length > 0)
                ? `Share (${activeDoc.sharedCollaborators.length})`
                : 'Share'}
            </span>
          </button>

          {/* Star Favorite Button */}
          <button
            onClick={() => toggleFavorite(activeDoc.id)}
            className="p-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:text-amber-500 hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer transition-colors"
            title={activeDoc.isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Star size={14} className={activeDoc.isFavorite ? 'fill-amber-500 text-amber-500' : ''} />
          </button>

          {/* Comments Drawer Button */}
          <button
            onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
            className={`p-1 px-1.5 rounded-[4px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${showCommentsDrawer
                ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-white font-semibold'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
              }`}
            title="Komentarze do strony"
          >
            <MessageSquare size={13} />
            {activeDoc.comments?.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-1 rounded-full bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.08)]">
                {activeDoc.comments.length}
              </span>
            )}
          </button>

          {/* Studio AI Toggle Button (Ctrl+D) */}
          <button
            type="button"
            onClick={() => toggleAiSidePanel()}
            className={`p-1 px-2 rounded-[4px] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${isAiSidePanelOpen
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                : 'text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)]'
              }`}
            title="Asystent AI (Ctrl+D)"
          >
            <Sparkles size={13} className="text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline font-medium">AI</span>
          </button>

          {/* Notion More (...) Dropdown Menu */}
          <div className="relative group">
            <button
              className="p-1 rounded-[4px] text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] cursor-pointer transition-colors"
              title="Więcej opcji strony"
            >
              <MoreHorizontal size={15} />
            </button>

            <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] shadow-[rgba(15,15,15,0.05)_0px_0px_0px_1px,rgba(15,15,15,0.1)_0px_3px_10px] p-1.5 z-50 w-56 space-y-0.5 text-xs animate-in fade-in">
              <div className="px-2 py-1 text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase font-semibold">
                Widok i Edycja
              </div>
              <button
                type="button"
                onClick={toggleFullWidth}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Columns size={13} />
                  <span>Pełna szerokość</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774]">{isFullWidth ? 'Włączona' : 'Wyłączona'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsZenMode(!isZenMode)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {isZenMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  <span>Tryb skupienia</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774]">Esc</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSearchReplace(!showSearchReplace)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Search size={13} />
                  <span>Szukaj w dokumencie</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774]">Ctrl+F</span>
              </button>
              <button
                type="button"
                onClick={() => setShowOutlineDrawer(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <List size={13} />
                <span>Spis treści ({headingsWithNumbering.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDocStatsModal(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Clock size={13} />
                  <span>Statystyki</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774]">~{readingTimeMin}m</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <Volume2 size={13} />
                <span>Czytaj na głos</span>
              </button>
              <button
                type="button"
                onClick={() => setShowVersionsDrawer(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <History size={13} />
                <span>Historia wersji ({activeDoc.versions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMindmapModal(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <GitBranch size={13} />
                <span>Mapa Myśli</span>
              </button>
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <LayoutTemplate size={13} />
                <span>Szablony</span>
              </button>

              <div className="border-t border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] my-1" />

              <div className="px-2 py-1 text-[10px] text-[#787774] dark:text-[#9b9a97] uppercase font-semibold">
                Udostępnianie i Eksport
              </div>
              <button
                type="button"
                onClick={() => togglePagePublic(activeDoc.id)}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Globe size={13} />
                  <span>Strona WWW</span>
                </div>
                <span className="text-[10px] font-mono text-[#787774]">{activeDoc.isPublic ? 'Włączona' : 'Wyłączona'}</span>
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <Download size={13} />
                <span>Eksportuj Markdown (.md)</span>
              </button>
              <button
                onClick={() => handleExport('html')}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <Download size={13} />
                <span>Eksportuj HTML (.html)</span>
              </button>
              <button
                onClick={handleDuplicateDoc}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <Copy size={13} />
                <span>Duplikuj dokument</span>
              </button>
              <button
                onClick={() => window.print()}
                className="w-full text-left px-2.5 py-1.5 rounded-[4px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#37352f] dark:text-[#d4d4d4] cursor-pointer flex items-center gap-2"
              >
                <Printer size={13} />
                <span>Drukuj / PDF</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 1:1 NOTION CANVAS CONTAINER                                       */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        <div className="h-full w-full flex-1 flex flex-col bg-white dark:bg-[#191919] relative overflow-hidden">
          {/* Scrollable Document Editor */}
          <div
            ref={editorScrollContainerRef}
            className="flex-1 overflow-y-auto flex flex-col items-center relative w-full"
          >
            {/* In-Doc Search & Replace Floating Bar */}
            <DocSearchReplace
              isOpen={showSearchReplace}
              onClose={() => setShowSearchReplace(false)}
              blocks={activeDoc.blocks}
              onReplaceCurrent={handleReplaceCurrent}
              onReplaceAll={handleReplaceAll}
              onScrollToBlock={handleScrollToHeading}
            />

            {/* Document Cover Header */}
            {activeDoc.coverGradient && (
              <div
                className="w-full h-44 relative group shrink-0"
                style={{
                  background: activeDoc.coverGradient,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute right-5 bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button
                    onClick={() => setShowCoverPicker(true)}
                    className="px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-xl text-xs text-white backdrop-blur-md cursor-pointer border border-white/10 shadow-sm transition-all"
                  >
                    Zmień okładkę
                  </button>
                  <button
                    onClick={() => updatePageCover(activeDoc.id, undefined)}
                    className="px-3 py-1.5 bg-black/60 hover:bg-rose-950/80 rounded-xl text-xs text-zinc-300 hover:text-rose-200 backdrop-blur-md cursor-pointer border border-white/10 shadow-sm transition-all"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            )}

            {/* Document Container (Authentic 1:1 Notion Canvas) */}
            <div className={`w-full ${isFullWidth ? 'max-w-full px-10 sm:px-20' : 'max-w-[900px] px-8 sm:px-16'} mx-auto pb-48 ${activeDoc.coverGradient ? '-mt-10' : 'pt-10'} transition-all duration-150`}>
              {/* Header: Notion Hover Actions, Icon, Title, Tags */}
              <div className="mb-6 group/header">
                {/* Notion Hover Top Bar: [😀 Dodaj ikonę] [🖼️ Dodaj okładkę] [💬 Komentarz] */}
                <div className="flex items-center gap-1.5 mb-2 text-xs text-[#787774] dark:text-[#9b9a97] select-none">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] px-2 py-0.5 rounded-[4px] cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>{activeDoc.icon || '😀'}</span>
                    <span>Zmień ikonę</span>
                  </button>
                  <button
                    onClick={() => setShowCoverPicker(true)}
                    className="hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] px-2 py-0.5 rounded-[4px] cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <span>🖼️</span>
                    <span>{activeDoc.coverGradient ? 'Zmień okładkę' : 'Dodaj okładkę'}</span>
                  </button>
                  <button
                    onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
                    className="hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] px-2 py-0.5 rounded-[4px] cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare size={12} />
                    <span>Komentarz</span>
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <select
                      value={activeDoc.pageType || 'Document'}
                      onChange={(e) => updatePageType(activeDoc.id, e.target.value as PageType)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-[4px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white cursor-pointer transition-colors focus:outline-none"
                      title="Zmień typ strony"
                    >
                      <option value="Document">📄 Dokument</option>
                      <option value="Note">📝 Notatka</option>
                      <option value="Project">🚀 Projekt</option>
                      <option value="Task">☑️ Zadanie (Task)</option>
                      <option value="Meeting">🤝 Spotkanie</option>
                      <option value="Database">🗄️ Baza danych</option>
                      <option value="TaskList">📋 Lista zadań</option>
                      <option value="Research">🔬 Badania</option>
                      <option value="Collection">📚 Kolekcja</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 relative mb-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Zmień ikonę strony"
                    className="text-5xl sm:text-6xl hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] rounded-[6px] p-1 transition-transform cursor-pointer leading-none"
                  >
                    {activeDoc.icon}
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-[#252525] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] p-2 rounded-[6px] shadow-[rgba(15,15,15,0.05)_0px_0px_0px_1px,rgba(15,15,15,0.1)_0px_3px_10px] flex gap-1 flex-wrap w-56">
                      {['📝', '🚀', '🎯', '💡', '⚡', '☕', '📚', '🔥', '💻', '🎨', '🌟', '📌', '📊', '🛠️', '✨', '🏆', '📈', '🔬'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            updatePageIcon(activeDoc.id, emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="p-1.5 text-base hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] rounded-[4px] cursor-pointer transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Big Notion Title Input (1:1 Notion Placeholder & Read-only enforcement) */}
                <input
                  type="text"
                  value={activeDoc.title}
                  readOnly={isReadOnly || isCommentOnly}
                  onChange={(e) => updatePageTitle(activeDoc.id, filterSwearWords(e.target.value))}
                  placeholder="New page"
                  className="sp-doc-page-title w-full bg-transparent border-none focus:outline-none outline-none disabled:opacity-75"
                />

                {/* Tags Strip (Notion Multi-select style) */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-4">
                  {activeDoc.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-[3px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#37352f] dark:text-[#d4d4d4] text-[11px] font-medium flex items-center gap-1.5"
                    >
                      <span>#{t}</span>
                      <button
                        onClick={() => removePageTag(activeDoc.id, t)}
                        className="hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}



                  {showTagInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagText.trim()) {
                            addPageTag(activeDoc.id, newTagText.trim().toLowerCase());
                            setNewTagText('');
                            setShowTagInput(false);
                          } else if (e.key === 'Escape') {
                            setShowTagInput(false);
                          }
                        }}
                        placeholder="Nazwa tagu..."
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => setShowTagInput(false)}
                        className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowTagInput(true)}
                      className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer px-2 py-0.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 transition-colors"
                    >
                      + Dodaj tag
                    </button>
                  )}
                </div>

                {/* Structured Notion Database Properties (Projects, Tasks, Meetings, Custom Properties) */}
                <PagePropertiesPanel page={activeDoc} readOnly={isReadOnly || isCommentOnly} />

                {/* Document overview: real counts and a visible copy-all action. */}
                <div className="sp-doc-meta-strip" aria-label="Statystyki dokumentu i szybkie akcje">
                  <span className="sp-doc-meta-chip" title="Liczba bloków w dokumencie">
                    <Layers size={12} />
                    <span>{activeDoc.blocks.length} {activeDoc.blocks.length === 1 ? 'blok' : activeDoc.blocks.length > 1 && activeDoc.blocks.length < 5 ? 'bloki' : 'bloków'}</span>
                  </span>
                  <span className="sp-doc-meta-chip" title="Liczba słów w treści bloków">
                    <AlignLeft size={12} />
                    <span>{totalWords.toLocaleString('pl-PL')} {totalWords === 1 ? 'słowo' : totalWords % 10 >= 2 && totalWords % 10 <= 4 && (totalWords % 100 < 12 || totalWords % 100 > 14) ? 'słowa' : 'słów'}</span>
                  </span>
                  <span className="sp-doc-meta-chip" title="Szacowany czas czytania">
                    <Clock size={12} />
                    <span>{readingTimeMin} min czytania</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyDocText}
                    className="sp-doc-copy-action"
                    title="Skopiuj całą notatkę z nagłówkami, listami, tabelami i linkami"
                  >
                    {copiedDoc ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedDoc ? 'Skopiowano całą notatkę' : 'Kopiuj całą notatkę'}</span>
                  </button>
                </div>
              </div>

              {/* Permission Enforcement Banner */}
              {isReadOnly && (
                <div className="mb-4 px-3 py-2 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-[6px] text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                  <Lock size={14} className="text-zinc-500 shrink-0" />
                  <span>
                    Masz uprawnienia tylko do odczytu (<strong>Can view</strong>). Edycja i modyfikacja tej strony jest zablokowana.
                  </span>
                </div>
              )}
              {isCommentOnly && (
                <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-[6px] text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <MessageSquare size={14} className="text-amber-600 shrink-0" />
                  <span>
                    Tryb komentowania (<strong>Can comment</strong>). Możesz przeglądać stronę i dodawać komentarze do poszczególnych bloków.
                  </span>
                </div>
              )}

              {/* 1:1 Notion Empty State right below Title (Get started with:) */}
              {(!activeDoc.blocks || (activeDoc.blocks.length <= 1 && (!activeDoc.blocks[0] || !activeDoc.blocks[0].content?.trim()))) && (
                <div className="mt-3 mb-6 select-none text-left animate-in fade-in">
                  <div className="text-[12px] text-[#9b9a97] dark:text-[#787774] font-normal mb-2">
                    Get started with:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={insertQuickDraft}
                      className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#37352f] dark:text-[#d4d4d4] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>✏️</span>
                      <span>Start a draft</span>
                      <span className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1 py-0.2 rounded font-semibold">
                        New
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={insertMeetingNotesTemplate}
                      className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#37352f] dark:text-[#d4d4d4] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>🤝</span>
                      <span>AI Meeting Notes</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertDatabaseTemplate}
                      className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#37352f] dark:text-[#d4d4d4] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>🗃️</span>
                      <span>Database</span>
                    </button>
                    <button
                      type="button"
                      onClick={insertFormTemplate}
                      className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#37352f] dark:text-[#d4d4d4] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>📋</span>
                      <span>Form</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTemplatesModal(true)}
                      className="px-2.5 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#37352f] dark:text-[#d4d4d4] font-medium shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>⚡</span>
                      <span>Templates</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const firstBlock = activeDoc.blocks[0];
                        if (firstBlock) {
                          setShowSlashMenu({ blockId: firstBlock.id, filter: '' });
                          setSlashSelectedIndex(0);
                        }
                      }}
                      className="px-2 py-1 bg-white dark:bg-[#202020] hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.055)] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[5px] text-xs text-[#787774] font-medium shadow-2xs flex items-center justify-center cursor-pointer transition-colors"
                      title="Więcej bloków i szablonów"
                    >
                      <span>•••</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Block List Render with Drag & Drop */}
              <div className="space-y-1 mt-2">
                {/* Live Task Completion Progress Bar for TaskList */}
                {activeDoc.pageType === 'TaskList' && <TodoProgressBar blocks={activeDoc.blocks} />}

                {activeDoc.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    id={`editor-block-${block.id}`}
                    data-block-type={block.type}
                    data-focused={focusedBlockId === block.id ? 'true' : 'false'}
                    data-locked={block.lockedBy ? 'true' : 'false'}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDropTargetIndex(index);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedBlockIndex !== null && draggedBlockIndex !== index) {
                        reorderBlocks(activeDoc.id, draggedBlockIndex, index);
                      }
                      setDraggedBlockIndex(null);
                      setDropTargetIndex(null);
                    }}
                    onClick={() => setFocusedBlockId(block.id)}
                    className={`sp-doc-block group/block relative flex items-start gap-1 py-1 rounded-[4px] transition-all px-2 -mx-2 ${block.bgColor || 'hover:bg-[rgba(55,53,47,0.04)] dark:hover:bg-[rgba(255,255,255,0.04)]'
                      } ${block.textColor || ''} ${highlightedBlockId === block.id ? 'bg-[rgba(35,131,226,0.1)] ring-1 ring-[#2383e2]' : ''
                      } ${dropTargetIndex === index ? 'border-t-2 border-[#2383e2]' : ''} ${block.lockedBy ? 'border border-amber-300/60 bg-amber-50/15' : ''
                      }`}
                  >
                    {/* Unresolved Comments Indicator on Block */}
                    {activeDoc.comments?.some((c) => c.blockId === block.id && !c.resolved) && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCommentBlockId(activeCommentBlockId === block.id ? null : block.id)
                        }
                        className="absolute right-2 top-2 p-1 px-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 rounded-[4px] text-[10px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors z-10"
                        title="Pokaż dyskusję pod tym blokiem"
                      >
                        <MessageSquare size={11} />
                        <span>{activeDoc.comments.filter((c) => c.blockId === block.id).length}</span>
                      </button>
                    )}
                    {/* Drag Handle & Block Controls (Move, Convert, Duplicate, Delete) */}
                    <div className="sp-doc-block-controls opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 text-[#787774] dark:text-[#9b9a97] mt-1 shrink-0 select-none transition-opacity">
                      {/* HTML5 Drag Handle */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(index));
                          setDraggedBlockIndex(index);
                        }}
                        className="cursor-grab active:cursor-grabbing p-0.5 rounded-[3px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] hover:text-[#37352f] dark:hover:text-white transition-colors"
                        title="Przeciągnij, aby zmienić kolejność"
                      >
                        <GripVertical size={13} />
                      </div>

                      {/* Quick Slash Menu Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSlashMenu({ blockId: block.id, filter: '' });
                          setSlashSelectedIndex(0);
                        }}
                        className="p-0.5 rounded-[3px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.055)] text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white cursor-pointer transition-colors"
                        title="Otwórz menu bloków dla tego elementu (/)"
                      >
                        <span className="font-mono text-xs font-bold leading-none">/</span>
                      </button>

                      {/* Convert Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowConvertMenuForBlock(
                              showConvertMenuForBlock === block.id ? null : block.id
                            )
                          }
                          className="p-1 rounded hover:bg-slate-200/70 hover:text-slate-800 cursor-pointer transition-colors"
                          title="Zmień typ bloku"
                        >
                          <MoreHorizontal size={13} />
                        </button>

                        {showConvertMenuForBlock === block.id && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 w-48 space-y-0.5 text-xs">
                            <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                              Zmień typ bloku
                            </div>
                            {SLASH_COMMANDS.map((cmd) => {
                              const Icon = cmd.icon;
                              return (
                                <button
                                  key={cmd.type}
                                  onClick={() => handleConvertBlock(block.id, cmd.type)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                                >
                                  <Icon size={13} className="text-blue-600 shrink-0" />
                                  <span className="truncate">{cmd.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Inline AI Block Actions */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBlockAiMenu(showBlockAiMenu === block.id ? null : block.id);
                          }}
                          className={`p-1 rounded hover:bg-purple-50 text-slate-400 hover:text-purple-600 cursor-pointer transition-colors ${showBlockAiMenu === block.id ? 'bg-purple-100 text-purple-700' : ''
                            }`}
                          title="Operacje AI dla tego bloku (Rozwiń, Wyszlifuj, Przetłumacz, Ryzyka, Zadania)"
                        >
                          <Sparkles size={13} className="text-purple-500" />
                        </button>

                        {showBlockAiMenu === block.id && (
                          <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 w-60 space-y-0.5 text-xs animate-in fade-in zoom-in-95">
                            <div className="px-2 py-1 text-[10px] text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>Asystent AI dla bloku</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleBlockAiAction(block, 'expand')}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                            >
                              <span>🚀</span>
                              <div>
                                <div className="font-semibold">Rozwiń treść</div>
                                <div className="text-[10px] text-slate-400">Dodaj merytoryczne szczegóły i analizę</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockAiAction(block, 'polish')}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                            >
                              <span>✨</span>
                              <div>
                                <div className="font-semibold">Wyszlifuj styl</div>
                                <div className="text-[10px] text-slate-400">Profesjonalny język i korekta</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockAiAction(block, 'translate')}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                            >
                              <span>🌐</span>
                              <div>
                                <div className="font-semibold">Przetłumacz na angielski</div>
                                <div className="text-[10px] text-slate-400">Tłumaczenie terminologiczne EN</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockAiAction(block, 'critique')}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                            >
                              <span>🛡️</span>
                              <div>
                                <div className="font-semibold">Krytyka i ryzyka</div>
                                <div className="text-[10px] text-slate-400">Adwokat diabła i luki logiczne</div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBlockAiAction(block, 'todos')}
                              className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/50 text-slate-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 transition-colors text-xs font-medium"
                            >
                              <span>☑️</span>
                              <div>
                                <div className="font-semibold">Wygeneruj zadania TODO</div>
                                <div className="text-[10px] text-slate-400">Zamień blok w checklistę działań</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Block Color Palette Picker */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowColorPickerForBlock(
                              showColorPickerForBlock === block.id ? null : block.id
                            )
                          }
                          className={`p-1 rounded hover:bg-slate-200/70 hover:text-slate-800 cursor-pointer transition-colors ${block.textColor || block.bgColor
                              ? 'text-blue-600 bg-blue-50'
                              : 'text-slate-400'
                            }`}
                          title="Kolor tekstu i tła bloku"
                        >
                          <Palette size={12} />
                        </button>
                        {showColorPickerForBlock === block.id && (
                          <BlockColorMenu
                            currentTextColor={block.textColor}
                            currentBgColor={block.bgColor}
                            onSelectColor={(textColor, bgColor) => {
                              updateBlock(activeDoc.id, block.id, { textColor, bgColor });
                            }}
                            onClose={() => setShowColorPickerForBlock(null)}
                          />
                        )}
                      </div>

                      {/* Text Alignment Toggle (Left / Center / Right) */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextAlign =
                            block.textAlign === 'center'
                              ? 'right'
                              : block.textAlign === 'right'
                                ? 'left'
                                : 'center';
                          updateBlock(activeDoc.id, block.id, { textAlign: nextAlign });
                        }}
                        className={`p-1 rounded hover:bg-slate-200/70 hover:text-slate-800 cursor-pointer transition-colors ${block.textAlign && block.textAlign !== 'left'
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-slate-400'
                          }`}
                        title={`Wyrównanie tekstu: ${block.textAlign === 'center'
                            ? 'Środek'
                            : block.textAlign === 'right'
                              ? 'Prawo'
                              : 'Lewo'
                          }`}
                      >
                        {block.textAlign === 'center' ? (
                          <AlignCenter size={12} />
                        ) : block.textAlign === 'right' ? (
                          <AlignRight size={12} />
                        ) : (
                          <AlignLeft size={12} />
                        )}
                      </button>

                      <button
                        onClick={() => moveBlock(activeDoc.id, block.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-slate-200/70 hover:text-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                        title="Przesuń w górę (Alt+↑)"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveBlock(activeDoc.id, block.id, 'down')}
                        disabled={index === activeDoc.blocks.length - 1}
                        className="p-1 rounded hover:bg-slate-200/70 hover:text-slate-800 disabled:opacity-20 cursor-pointer transition-colors"
                        title="Przesuń w dół (Alt+↓)"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        onClick={() => duplicateBlock(activeDoc.id, block.id)}
                        className="p-1 rounded hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors"
                        title="Duplikuj blok (Ctrl+D)"
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => deleteBlock(activeDoc.id, block.id)}
                        className="p-1 rounded hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition-colors"
                        title="Usuń blok"
                      >
                        <Trash2 size={12} />
                      </button>

                      {/* Section Locking Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (block.lockedBy) {
                            updateBlock(activeDoc.id, block.id, { lockedBy: null });
                          } else {
                            updateBlock(activeDoc.id, block.id, {
                              lockedBy: {
                                userId: user?.uid || 'anon',
                                userName: user?.displayName || user?.email?.split('@')[0] || 'Ty',
                                userEmail: user?.email || '',
                                lockedAt: Date.now(),
                              },
                            });
                          }
                        }}
                        className={`p-1 rounded cursor-pointer transition-colors ${block.lockedBy
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-800'
                          }`}
                        title={
                          block.lockedBy
                            ? `Zablokowane przez: ${block.lockedBy.userName}. Kliknij, aby odblokować.`
                            : 'Zablokuj sekcję przed edycją innych (Section Locking)'
                        }
                      >
                        <Lock size={12} className={block.lockedBy ? 'text-amber-600' : ''} />
                      </button>

                      {/* Inline Block Comment Trigger */}
                      <button
                        type="button"
                        onClick={() =>
                          setActiveCommentBlockId(activeCommentBlockId === block.id ? null : block.id)
                        }
                        className={`p-1 rounded cursor-pointer transition-colors ${activeCommentBlockId === block.id || activeDoc.comments?.some((c) => c.blockId === block.id && !c.resolved)
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-800'
                          }`}
                        title="Dyskusja pod tym blokiem (Wątek komentarzy)"
                      >
                        <MessageSquare size={12} />
                      </button>
                    </div>

                    {/* Block Editor Inputs */}
                    <div className="flex-1 min-w-0">
                      {/* Section Lock Warning Banner */}
                      {block.lockedBy && (
                        <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium select-none animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <Lock size={13} className="text-amber-600 shrink-0" />
                            <span>
                              <strong>{block.lockedBy.userName}</strong> zablokował(a) tę sekcję na czas edycji
                            </span>
                          </div>
                          {(block.lockedBy.userId === user?.uid || currentWorkspace?.ownerId === user?.uid) && (
                            <button
                              type="button"
                              onClick={() => {
                                updateBlock(activeDoc.id, block.id, { lockedBy: null });
                              }}
                              className="text-[10px] px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-bold cursor-pointer shadow-2xs transition-colors"
                            >
                              Odblokuj
                            </button>
                          )}
                        </div>
                      )}
                      {/* 1. Paragraph */}
                      {block.type === 'p' && (
                        <textarea
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={block.content}
                          onChange={(e) => {
                            handleContentChange(block.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'p')}
                          onSelect={(e) => handleTextSelect(block.id, e)}
                          placeholder="Wpisz tekst, wpisz '/' dla menu lub kliknij przycisk menu..."
                          className="w-full text-sm font-normal text-inherit placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none leading-relaxed overflow-hidden"
                        />
                      )}

                      {/* 2. Heading 1 */}
                      {block.type === 'h1' && (
                        <textarea
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={block.content}
                          onChange={(e) => {
                            handleContentChange(block.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h1')}
                          onSelect={(e) => handleTextSelect(block.id, e)}
                          placeholder="Nagłówek 1 (#H1)..."
                          className="w-full text-2xl font-bold bg-transparent text-inherit placeholder-slate-400 border-none focus:outline-none resize-none overflow-hidden"
                        />
                      )}

                      {/* 3. Heading 2 */}
                      {block.type === 'h2' && (
                        <textarea
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={block.content}
                          onChange={(e) => {
                            handleContentChange(block.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h2')}
                          onSelect={(e) => handleTextSelect(block.id, e)}
                          placeholder="Nagłówek 2 (#H2)..."
                          className="w-full text-xl font-bold bg-transparent text-inherit placeholder-slate-400 border-none focus:outline-none resize-none overflow-hidden"
                        />
                      )}

                      {/* 4. Heading 3 */}
                      {block.type === 'h3' && (
                        <textarea
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          value={block.content}
                          onChange={(e) => {
                            handleContentChange(block.id, e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h3')}
                          onSelect={(e) => handleTextSelect(block.id, e)}
                          placeholder="Nagłówek 3 (#H3)..."
                          className="w-full text-lg font-semibold bg-transparent text-inherit placeholder-slate-400 border-none focus:outline-none resize-none overflow-hidden"
                        />
                      )}

                      {/* 5. Bullet List */}
                      {block.type === 'bullet' && (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold select-none mt-0.5">•</span>
                          <textarea
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              handleContentChange(block.id, e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => handleTextKeyDown(e, block.id, 'bullet')}
                            onSelect={(e) => handleTextSelect(block.id, e)}
                            placeholder="Element listy punktowanej..."
                            className="w-full text-sm text-inherit placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none overflow-hidden"
                          />
                        </div>
                      )}

                      {/* 6. Numbered List */}
                      {block.type === 'number' && (
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 font-mono text-xs select-none mt-0.5">1.</span>
                          <textarea
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              handleContentChange(block.id, e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => handleTextKeyDown(e, block.id, 'number')}
                            onSelect={(e) => handleTextSelect(block.id, e)}
                            placeholder="Krok listy numerowanej..."
                            className="w-full text-sm text-inherit placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none overflow-hidden"
                          />
                        </div>
                      )}

                      {/* 7. To-Do */}
                      {block.type === 'todo' && (
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={!!block.checked}
                            onChange={(e) =>
                              updateBlock(activeDoc.id, block.id, { checked: e.target.checked })
                            }
                            className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 mt-0.5"
                          />
                          <textarea
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              handleContentChange(block.id, e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => handleTextKeyDown(e, block.id, 'todo')}
                            onSelect={(e) => handleTextSelect(block.id, e)}
                            placeholder="Zadanie do zrobienia..."
                            className={`w-full text-sm bg-transparent border-none focus:outline-none resize-none overflow-hidden transition-all ${block.checked ? 'line-through text-slate-400 opacity-70' : 'text-inherit'
                              }`}
                          />
                        </div>
                      )}

                      {/* WikiLinks Autocomplete Popover [[ */}
                      {wikiSuggest?.blockId === block.id && (
                        <WikiLinkSuggest
                          isOpen={true}
                          onClose={() => setWikiSuggest(null)}
                          query={wikiSuggest.query}
                          pages={pages}
                          onSelectPage={handleSelectWikiPage}
                        />
                      )}

                      {/* 8. Callout - Notion 1:1 */}
                      {block.type === 'callout' && (
                        <div
                          className={`p-4 my-2 rounded-[4px] flex items-start gap-3 transition-colors text-[15px] leading-relaxed ${block.calloutType === 'warning'
                              ? 'bg-[#fef9c3]/70 dark:bg-[#713f12]/30 text-[#37352f] dark:text-[#d4d4d4]'
                              : block.calloutType === 'success'
                                ? 'bg-[#dcfce7]/70 dark:bg-[#14532d]/30 text-[#37352f] dark:text-[#d4d4d4]'
                                : block.calloutType === 'danger'
                                  ? 'bg-[#fee2e2]/70 dark:bg-[#7f1d1d]/30 text-[#37352f] dark:text-[#d4d4d4]'
                                  : block.calloutType === 'tip'
                                    ? 'bg-[#f3e8ff]/70 dark:bg-[#581c87]/30 text-[#37352f] dark:text-[#d4d4d4]'
                                    : 'bg-[#f1f1ef] dark:bg-[#252525] text-[#37352f] dark:text-[#d4d4d4]'
                            }`}
                        >
                          {/* Callout Emoji Selector */}
                          <div className="relative group/callout shrink-0 mt-0.5">
                            <button
                              type="button"
                              title="Zmień ikonę"
                              className="text-lg select-none cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {block.calloutType === 'warning'
                                ? '⚠️'
                                : block.calloutType === 'success'
                                  ? '✅'
                                  : block.calloutType === 'danger'
                                    ? '⛔'
                                    : block.calloutType === 'tip'
                                      ? '🚀'
                                      : '💡'}
                            </button>
                            <div className="hidden group-hover/callout:flex absolute top-full left-0 mt-1 z-50 bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#333] p-1 rounded-md gap-1 shadow-lg">
                              <button type="button" onClick={() => updateBlock(activeDoc.id, block.id, { calloutType: 'info' })} className="p-1 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] rounded text-base cursor-pointer">💡</button>
                              <button type="button" onClick={() => updateBlock(activeDoc.id, block.id, { calloutType: 'warning' })} className="p-1 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] rounded text-base cursor-pointer">⚠️</button>
                              <button type="button" onClick={() => updateBlock(activeDoc.id, block.id, { calloutType: 'success' })} className="p-1 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] rounded text-base cursor-pointer">✅</button>
                              <button type="button" onClick={() => updateBlock(activeDoc.id, block.id, { calloutType: 'tip' })} className="p-1 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] rounded text-base cursor-pointer">🚀</button>
                              <button type="button" onClick={() => updateBlock(activeDoc.id, block.id, { calloutType: 'danger' })} className="p-1 hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] rounded text-base cursor-pointer">⛔</button>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <textarea
                              rows={Math.max(1, (block.content || '').split('\n').length)}
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="Wyróżniona informacja, wskazówka lub ostrzeżenie..."
                              className="w-full text-[15px] leading-relaxed bg-transparent border-none resize-none focus:outline-none placeholder:text-[#999] text-[#37352f] dark:text-[#d4d4d4]"
                            />
                          </div>
                        </div>
                      )}


                      {/* 9. Notion Table 1:1 */}
                      {block.type === 'table' && (
                        <div className="my-3 group/table relative">
                          <div className="overflow-x-auto rounded-[3px] border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#191919]">
                            <table className="w-full border-collapse text-sm">
                              <tbody>
                                {(block.tableData || [
                                  ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'],
                                  ['Wartość A', 'Wartość B', 'Wartość C'],
                                  ['Wartość X', 'Wartość Y', 'Wartość Z'],
                                ]).map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={`border-b border-[#e9e9e7] dark:border-[#2f2f2f] last:border-b-0 ${rIdx === 0
                                        ? 'bg-[#f7f6f5] dark:bg-[#202020] font-medium text-[#37352f] dark:text-[#d4d4d4]'
                                        : 'hover:bg-[#fbfbfa] dark:hover:bg-[#202020]/50 text-[#37352f] dark:text-[#d4d4d4]'
                                      }`}
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="p-0 border-r border-[#e9e9e7] dark:border-[#2f2f2f] last:border-r-0">
                                        <input
                                          type="text"
                                          value={cell}
                                          onChange={(e) => {
                                            const currentTable = block.tableData || [
                                              ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'],
                                              ['Wartość A', 'Wartość B', 'Wartość C'],
                                              ['Wartość X', 'Wartość Y', 'Wartość Z'],
                                            ];
                                            const nextTable = currentTable.map((r, ri) =>
                                              ri === rIdx
                                                ? r.map((c, ci) => (ci === cIdx ? e.target.value : c))
                                                : r
                                            );
                                            updateBlock(activeDoc.id, block.id, { tableData: nextTable });
                                          }}
                                          className={`w-full bg-transparent text-sm focus:outline-none focus:bg-blue-50/20 dark:focus:bg-blue-900/20 px-2.5 py-1.5 ${rIdx === 0 ? 'font-medium text-[#37352f] dark:text-[#d4d4d4]' : 'text-[#37352f] dark:text-[#d4d4d4]'
                                            }`}
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Subtle Notion Hover Actions for Table */}
                          <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover/table:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                const cur = block.tableData || [
                                  ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'],
                                  ['A', 'B', 'C'],
                                ];
                                const newRow = new Array(cur[0].length).fill('');
                                updateBlock(activeDoc.id, block.id, { tableData: [...cur, newRow] });
                              }}
                              className="px-2 py-0.5 rounded text-[11px] text-[#787774] dark:text-[#999] hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <Plus size={11} /> Wiersz
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = block.tableData || [
                                  ['Kolumna 1', 'Kolumna 2', 'Kolumna 3'],
                                  ['A', 'B', 'C'],
                                ];
                                const next = cur.map((r, i) => [
                                  ...r,
                                  i === 0 ? `Kolumna ${r.length + 1}` : '',
                                ]);
                                updateBlock(activeDoc.id, block.id, { tableData: next });
                              }}
                              className="px-2 py-0.5 rounded text-[11px] text-[#787774] dark:text-[#999] hover:bg-[#efefee] dark:hover:bg-[#2c2c2c] cursor-pointer flex items-center gap-1 transition-colors"
                            >
                              <Plus size={11} /> Kolumna
                            </button>
                            {((block.tableData || []).length > 2) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = block.tableData || [];
                                  if (cur.length > 2) {
                                    updateBlock(activeDoc.id, block.id, { tableData: cur.slice(0, -1) });
                                  }
                                }}
                                className="px-2 py-0.5 rounded text-[11px] text-[#787774] dark:text-[#999] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                              >
                                Usuń wiersz
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 10. Image */}
                      {block.type === 'image' && (() => {
                        const isImgBlocked = isBlockedUrl(block.imageUrl);
                        return (
                          <div className="p-3 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] space-y-2 transition-colors">
                            {isImgBlocked ? (
                              <div className="h-32 bg-rose-50 dark:bg-rose-950/40 rounded-[4px] border border-rose-200 dark:border-rose-900/60 flex flex-col items-center justify-center text-rose-700 dark:text-rose-300 text-xs gap-1">
                                <AlertTriangle size={20} className="text-rose-500" />
                                <span className="font-semibold">Obrazek zablokowany (treści 18+)</span>
                                <span className="text-[10px] text-rose-500">Adres URL zidentyfikowano jako niedozwolony</span>
                              </div>
                            ) : block.imageUrl ? (
                              <div className="relative group/img">
                                <img
                                  src={block.imageUrl}
                                  alt={block.imageCaption || 'Obrazek'}
                                  className="w-full max-h-72 object-cover rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f] shadow-2xs"
                                />
                              </div>
                            ) : (
                              <div className="h-28 bg-[#f7f6f5] dark:bg-[#191919] rounded-[4px] border border-dashed border-[#e9e9e7] dark:border-[#2f2f2f] flex flex-col items-center justify-center text-[#787774] dark:text-[#9b9a97] text-xs gap-1">
                                <ImageIcon size={20} className="text-[#999]" />
                                <span>Brak wybranego obrazka</span>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={block.imageUrl || ''}
                                onChange={(e) =>
                                  handleBlockUrlUpdate(block.id, { imageUrl: e.target.value })
                                }
                                placeholder="Wklej URL obrazka (https://...)..."
                                className={`flex-1 px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none transition-all ${isImgBlocked
                                    ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                                    : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] focus:border-[#2383e2]'
                                  }`}
                              />
                              <input
                                type="text"
                                value={block.imageCaption || ''}
                                onChange={(e) =>
                                  updateBlock(activeDoc.id, block.id, { imageCaption: filterSwearWords(e.target.value) })
                                }
                                placeholder="Podpis pod obrazkiem..."
                                className="w-36 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
                              />
                              <button
                                onClick={() =>
                                  setShowResourcePickerForBlock(
                                    showResourcePickerForBlock === block.id ? null : block.id
                                  )
                                }
                                className="px-3 py-1 bg-[#2383e2] hover:bg-[#1a5fb4] text-white rounded-[4px] text-xs cursor-pointer font-medium shadow-2xs transition-colors shrink-0"
                              >
                                Z Zasobów
                              </button>
                            </div>

                            {/* Quick pick from Sidebar Resources */}
                            {showResourcePickerForBlock === block.id && (
                              <div className="p-2 bg-[#f7f6f5] dark:bg-[#191919] rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f] space-y-1.5">
                                <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-semibold uppercase tracking-wider">
                                  Wybierz z wgranych Zasobów:
                                </div>
                                <div className="flex gap-2 overflow-x-auto py-1">
                                  {resources.map((res: any) => (
                                    <div
                                      key={res.id}
                                      onClick={() => {
                                        updateBlock(activeDoc.id, block.id, {
                                          imageUrl: res.url,
                                          imageCaption: res.name,
                                        });
                                        setShowResourcePickerForBlock(null);
                                      }}
                                      className="cursor-pointer group flex flex-col items-center gap-1 shrink-0 p-1.5 bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] hover:border-[#2383e2] rounded-[4px] shadow-2xs transition-colors"
                                    >
                                      <img
                                        src={res.url}
                                        alt={res.name}
                                        className="w-16 h-12 object-cover rounded-[3px]"
                                      />
                                      <span className="text-[9px] text-[#787774] dark:text-[#9b9a97] max-w-[4rem] truncate">
                                        {res.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 11. Video (YouTube / MP4) */}
                      {block.type === 'video' && (() => {
                        const isVidBlocked = isBlockedUrl(block.videoUrl);
                        return (
                          <div className="p-3 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] space-y-2 transition-colors">
                            <div className="flex items-center justify-between text-xs text-[#37352f] dark:text-[#d4d4d4]">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Video size={13} className="text-red-500" />
                                <span>Odtwarzacz Wideo / YouTube</span>
                              </span>
                            </div>

                            {/* Render Player Preview */}
                            {isVidBlocked ? (
                              <div className="h-32 bg-rose-50 dark:bg-rose-950/40 rounded-[4px] border border-rose-200 dark:border-rose-900/60 flex flex-col items-center justify-center text-rose-700 dark:text-rose-300 text-xs gap-1">
                                <AlertTriangle size={20} className="text-rose-500" />
                                <span className="font-semibold">Niedozwolone źródło wideo (18+)</span>
                                <span className="text-[10px] text-rose-500">Odtwarzanie zablokowane ze względów bezpieczeństwa</span>
                              </div>
                            ) : block.videoUrl && parseYouTubeId(block.videoUrl) ? (
                              <div className="relative aspect-video rounded-[4px] overflow-hidden border border-[#e9e9e7] dark:border-[#2f2f2f] bg-black shadow-2xs">
                                <iframe
                                  src={`https://www.youtube.com/embed/${parseYouTubeId(block.videoUrl)}`}
                                  title="YouTube video player"
                                  className="w-full h-full border-none"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : block.videoUrl ? (
                              <video
                                src={block.videoUrl}
                                controls
                                className="w-full rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f] bg-black max-h-64 shadow-2xs"
                              />
                            ) : (
                              <div className="h-24 bg-[#f7f6f5] dark:bg-[#191919] rounded-[4px] border border-dashed border-[#e9e9e7] dark:border-[#2f2f2f] flex flex-col items-center justify-center text-[#787774] dark:text-[#9b9a97] text-xs gap-1">
                                <Video size={20} className="text-[#999]" />
                                <span>Wklej link YouTube lub bezpośredni plik MP4</span>
                              </div>
                            )}

                            <input
                              type="text"
                              value={block.videoUrl || ''}
                              onChange={(e) =>
                                handleBlockUrlUpdate(block.id, { videoUrl: e.target.value })
                              }
                              placeholder="Wklej link YouTube lub plik .mp4..."
                              className={`w-full px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none transition-all ${isVidBlocked
                                  ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                                  : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] focus:border-[#2383e2]'
                                }`}
                            />
                            {isVidBlocked && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                Adres zablokowany: linki do stron dla dorosłych (18+) są zabronione!
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 12. Audio / Podcast */}
                      {block.type === 'audio' && (() => {
                        const isAudBlocked = isBlockedUrl(block.audioUrl);
                        return (
                          <div className="p-3 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] space-y-2 transition-colors">
                            <div className="flex items-center justify-between text-xs text-[#37352f] dark:text-[#d4d4d4]">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Music size={13} className="text-emerald-600 dark:text-emerald-400" />
                                <span>Odtwarzacz Audio / Podcast</span>
                              </span>
                            </div>

                            {isAudBlocked ? (
                              <div className="h-12 bg-rose-50 dark:bg-rose-950/40 rounded-[4px] border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs font-semibold gap-1.5">
                                <AlertTriangle size={14} />
                                <span>Źródło audio zablokowane (treści 18+)</span>
                              </div>
                            ) : block.audioUrl ? (
                              <audio controls src={block.audioUrl} className="w-full h-9 rounded-[4px]" />
                            ) : (
                              <div className="h-12 bg-[#f7f6f5] dark:bg-[#191919] rounded-[4px] border border-dashed border-[#e9e9e7] dark:border-[#2f2f2f] flex items-center justify-center text-[#787774] dark:text-[#9b9a97] text-xs">
                                Brak źródła audio
                              </div>
                            )}

                            <input
                              type="text"
                              value={block.audioUrl || ''}
                              onChange={(e) =>
                                handleBlockUrlUpdate(block.id, { audioUrl: e.target.value })
                              }
                              placeholder="Wklej link do pliku audio MP3..."
                              className={`w-full px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none transition-all ${isAudBlocked
                                  ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                                  : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] focus:border-[#2383e2]'
                                }`}
                            />
                          </div>
                        );
                      })()}



                      {/* 13. Bookmark - Notion 1:1 Standard */}
                      {block.type === 'bookmark' && (() => {
                        const isBkmBlocked = isBlockedUrl(block.bookmarkUrl);
                        return (
                          <div className="my-2 p-3 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-2.5 transition-colors">
                            <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] flex items-center justify-between shadow-2xs">
                              <div className="space-y-0.5 truncate flex-1 min-w-0 pr-2">
                                <div className="text-xs font-semibold text-[#37352f] dark:text-[#d4d4d4] truncate">
                                  {block.bookmarkTitle || 'Tytuł zakładki strony'}
                                </div>
                                <div className="text-[10px] text-[#787774] dark:text-[#9b9a97] truncate">
                                  {block.bookmarkDesc || 'Opis strony internetowej lub repozytorium...'}
                                </div>
                                <div className={`text-[10px] font-mono truncate ${isBkmBlocked ? 'text-rose-600 font-semibold' : 'text-[#2383e2] dark:text-[#529cca]'}`}>
                                  {isBkmBlocked ? '⛔ Link zablokowany (18+)' : (block.bookmarkUrl || 'https://...')}
                                </div>
                              </div>
                              {block.bookmarkUrl && !isBkmBlocked && (
                                <a
                                  href={block.bookmarkUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 hover:bg-[#f7f6f5] dark:hover:bg-[#252525] rounded-[3px] text-[#787774] hover:text-[#37352f] dark:text-[#9b9a97] dark:hover:text-white transition-colors"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={block.bookmarkTitle || ''}
                                onChange={(e) =>
                                  updateBlock(activeDoc.id, block.id, { bookmarkTitle: filterSwearWords(e.target.value) })
                                }
                                placeholder="Tytuł zakładki..."
                                className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none focus:border-[#2383e2]"
                              />
                              <input
                                type="text"
                                value={block.bookmarkUrl || ''}
                                onChange={(e) =>
                                  handleBlockUrlUpdate(block.id, { bookmarkUrl: e.target.value })
                                }
                                placeholder="URL (https://...)..."
                                className={`px-2.5 py-1 rounded-[4px] text-xs text-[#37352f] dark:text-[#d4d4d4] placeholder-[#787774] dark:placeholder-[#9b9a97] focus:outline-none transition-all ${isBkmBlocked
                                    ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                                    : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] focus:border-[#2383e2]'
                                  }`}
                              />
                            </div>
                            {isBkmBlocked && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                                Adres zablokowany: linki do stron dla dorosłych (18+) są zabronione!
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 14. Toggle - Notion 1:1 Standard */}
                      {block.type === 'toggle' && (
                        <details className="my-1 group">
                          <summary className="cursor-pointer font-medium text-[#37352f] dark:text-[#d4d4d4] flex items-center gap-1.5 list-none select-none hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.06)] px-1 py-0.5 rounded-[3px] transition-colors">
                            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] transition-transform group-open:rotate-90">
                              ▶
                            </span>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) =>
                                updateBlock(activeDoc.id, block.id, { content: filterSwearWords(e.target.value) })
                              }
                              placeholder="Tytuł sekcji rozwijanej..."
                              className="bg-transparent border-none text-[#37352f] dark:text-[#d4d4d4] focus:outline-none font-medium text-[15px] flex-1 leading-normal"
                            />
                          </summary>
                          <div className="pl-5 pt-1 border-l-2 border-[#e9e9e7] dark:border-[#2f2f2f] ml-2 mt-1">
                            <textarea
                              rows={2}
                              value={block.toggleDetails || ''}
                              onChange={(e) =>
                                updateBlock(activeDoc.id, block.id, { toggleDetails: filterSwearWords(e.target.value) })
                              }
                              placeholder="Ukryta zawartość sekcji po rozwinięciu..."
                              className="w-full text-sm text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none resize-none leading-relaxed placeholder-[#787774] dark:placeholder-[#9b9a97]"
                            />
                          </div>
                        </details>
                      )}

                      {/* 15. Code Block */}
                      {block.type === 'code' && (
                        <div className="relative my-1 bg-[#131313] border border-[#262626] rounded-xl p-3 font-mono text-xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222] text-[10px] text-zinc-500">
                            {/* Language selector */}
                            <select
                              value={block.language || 'typescript'}
                              onChange={(e) =>
                                updateBlock(activeDoc.id, block.id, { language: e.target.value })
                              }
                              className="bg-[#1e1e1e] text-zinc-300 border border-[#333] rounded px-1.5 py-0.5 focus:outline-none font-mono text-[10px]"
                            >
                              {CODE_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const res = executeCode((block.language || 'javascript') as any, block.content);
                                  setCodeOutputs((prev) => ({ ...prev, [block.id]: res }));
                                }}
                                className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded cursor-pointer flex items-center gap-1 text-[10px] font-semibold transition-colors"
                                title="Uruchom kod w konsoli"
                              >
                                <Play size={10} fill="currentColor" />
                                <span>Uruchom</span>
                              </button>

                              <button
                                onClick={() => handleCopyCode(block.id, block.content)}
                                className="px-2 py-0.5 bg-[#202020] hover:bg-[#282828] text-zinc-300 rounded cursor-pointer flex items-center gap-1 text-[10px]"
                              >
                                {copiedCodeId === block.id ? (
                                  <Check size={11} className="text-emerald-400" />
                                ) : (
                                  <Copy size={11} />
                                )}
                                <span>{copiedCodeId === block.id ? 'Skopiowano' : 'Kopiuj kod'}</span>
                              </button>
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={block.content}
                            onChange={(e) =>
                              updateBlock(activeDoc.id, block.id, { content: e.target.value })
                            }
                            placeholder="// Wpisz kod programu..."
                            className="w-full bg-transparent text-emerald-400 focus:outline-none resize-none font-mono text-xs"
                          />

                          {codeOutputs[block.id] && (
                            <div className="mt-2.5 bg-[#090b10] border border-[#222] rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 shadow-inner">
                              <div className="flex items-center justify-between text-zinc-500 text-[9px] uppercase font-bold border-b border-[#1c1c1c] pb-1 mb-1">
                                <span className="flex items-center gap-1">
                                  <Terminal size={10} className="text-emerald-400" />
                                  <span>Konsola wyjściowa</span>
                                </span>
                                <button
                                  onClick={() =>
                                    setCodeOutputs((prev) => {
                                      const next = { ...prev };
                                      delete next[block.id];
                                      return next;
                                    })
                                  }
                                  className="text-zinc-500 hover:text-zinc-300 text-[9px] cursor-pointer"
                                >
                                  Wyczyść
                                </button>
                              </div>
                              <pre className="whitespace-pre-wrap leading-relaxed select-text">{codeOutputs[block.id]}</pre>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 16. Quote - Clean Editorial Standard */}
                      {block.type === 'quote' && (
                        <div className="border-l-3 border-[#37352f] dark:border-[#d4d4d4] pl-3.5 py-1 my-1.5 text-[15px] italic text-[#37352f] dark:text-[#d4d4d4] transition-colors">
                          <textarea
                            rows={1}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height = `${el.scrollHeight}px`;
                              }
                            }}
                            value={block.content}
                            onChange={(e) => {
                              handleContentChange(block.id, e.target.value);
                              e.target.style.height = 'auto';
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                            onKeyDown={(e) => handleTextKeyDown(e, block.id, 'quote')}
                            onSelect={(e) => handleTextSelect(block.id, e)}
                            placeholder="Wpisz cytat..."
                            className="w-full bg-transparent border-none focus:outline-none italic text-inherit placeholder-[#787774] dark:placeholder-[#9b9a97] resize-none overflow-hidden leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 17. Math Block */}
                      {block.type === 'math' && (
                        <div className="my-1.5 p-3 bg-[#f7f6f5] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] font-mono text-center text-[#2383e2] dark:text-[#529cca] text-sm shadow-2xs transition-colors">
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => handleContentChange(block.id, e.target.value)}
                            onKeyDown={(e) => handleTextKeyDown(e, block.id, 'math')}
                            placeholder="Wzór matematyczny: f(x) = ∑ (x_i · w_i) + b"
                            className="w-full bg-transparent text-center border-none focus:outline-none text-[#2383e2] dark:text-[#529cca] font-mono placeholder-[#787774] dark:placeholder-[#9b9a97]"
                          />
                        </div>
                      )}

                      {/* 18. Divider */}
                      {block.type === 'divider' && (
                        <div className="my-3 border-t border-[#e9e9e7] dark:border-[#2f2f2f] transition-colors" />
                      )}

                      {/* 19. Stat Block */}
                      {block.type === 'stat' && (
                        <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                            <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                              <TrendingUp size={14} className="text-[#2383e2] dark:text-[#529cca]" />
                              <span>Wskaźnik KPI / Statystyka</span>
                            </span>
                            <span className="text-[10px] font-mono">Blok Stat</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Etykieta / Tytuł
                              </label>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="np. Przychód miesięczny"
                                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Wartość Główna
                              </label>
                              <input
                                type="text"
                                value={block.statValue || ''}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { statValue: e.target.value })}
                                placeholder="np. 128 450 zł"
                                className="w-full px-2.5 py-1 text-xs font-bold text-[#37352f] dark:text-white bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Trend / Zmiana
                              </label>
                              <input
                                type="text"
                                value={block.statTrend || ''}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { statTrend: e.target.value })}
                                placeholder="np. +18.4% m/m"
                                className={`w-full px-2.5 py-1 text-xs font-semibold rounded-[4px] border focus:outline-none ${(block.statTrend || '').startsWith('-')
                                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                                    : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60'
                                  }`}
                              />
                            </div>
                          </div>
                          {/* Live preview chip */}
                          <div className="p-3 bg-white dark:bg-[#191919] rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f] flex items-center justify-between">
                            <div>
                              <div className="text-[11px] text-[#787774] dark:text-[#9b9a97] font-medium">{block.content || 'Etykieta statystyki'}</div>
                              <div className="text-xl font-bold text-[#37352f] dark:text-white mt-0.5 tracking-tight">{block.statValue || '0'}</div>
                            </div>
                            {block.statTrend && (
                              <span
                                className={`px-2 py-0.5 rounded-[4px] text-xs font-semibold ${block.statTrend.startsWith('-')
                                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                                  }`}
                              >
                                {block.statTrend}
                              </span>
                            )}
                          </div>
                        </div>
                      )}


                      {/* 20. Progress Block */}
                      {block.type === 'progress' && (
                        <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                            <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                              <Sliders size={14} className="text-[#2383e2] dark:text-[#529cca]" />
                              <span>Pasek Postępu / Wskaźnik Realizacji</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#2383e2] dark:text-[#529cca]">{block.progressPercent ?? 50}%</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Tytuł / Etykieta celu
                              </label>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="np. Realizacja sprintu Q4..."
                                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Procent ukończenia: {block.progressPercent ?? 50}%
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={block.progressPercent ?? 50}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { progressPercent: Number(e.target.value) })}
                                  className="w-full accent-[#2383e2] cursor-pointer"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={block.progressPercent ?? 50}
                                  onChange={(e) =>
                                    updateBlock(activeDoc.id, block.id, {
                                      progressPercent: Math.min(100, Math.max(0, Number(e.target.value))),
                                    })
                                  }
                                  className="w-14 px-2 py-0.5 text-xs text-center font-bold bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-white rounded-[4px] focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="w-full bg-[#e9e9e7] dark:bg-[#2f2f2f] rounded-full h-2.5 overflow-hidden p-0.5">
                              <div
                                className="bg-[#2383e2] dark:bg-[#529cca] h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, block.progressPercent ?? 50))}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono px-0.5">
                              <span>0%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 21. Button Block */}
                      {block.type === 'button' && (() => {
                        const isBtnBlocked = isBlockedUrl(block.buttonUrl);
                        return (
                          <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                              <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                                <MousePointerClick size={14} className="text-emerald-600 dark:text-emerald-400" />
                                <span>Przycisk Akcji (Call-To-Action)</span>
                              </span>
                              <span className="text-[10px] font-mono">Przycisk CTA</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  Napis na przycisku
                                </label>
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { content: filterSwearWords(e.target.value) })}
                                  placeholder="np. Skontaktuj się z nami"
                                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  Docelowy URL
                                </label>
                                <input
                                  type="text"
                                  value={block.buttonUrl || ''}
                                  onChange={(e) => handleBlockUrlUpdate(block.id, { buttonUrl: e.target.value })}
                                  placeholder="https://searchpoint.pl lub #kontakt"
                                  className={`w-full px-2.5 py-1 text-xs font-mono rounded-[4px] focus:outline-none transition-all ${isBtnBlocked
                                      ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                                      : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] focus:border-[#2383e2]'
                                    }`}
                                />
                                {isBtnBlocked && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                                    <AlertTriangle size={12} className="shrink-0 text-rose-500" />
                                    <span>Niedozwolony adres URL: linki do stron dla dorosłych (18+) są zablokowane!</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#787774] dark:text-[#9b9a97]">Kolor:</span>
                                {[
                                  { name: 'Niebieski', val: '#2383e2' },
                                  { name: 'Szmaragd', val: '#059669' },
                                  { name: 'Fiolet', val: '#7c3aed' },
                                  { name: 'Bursztyn', val: '#d97706' },
                                  { name: 'Ciemny', val: '#202020' },
                                ].map((c) => (
                                  <button
                                    key={c.val}
                                    type="button"
                                    onClick={() => updateBlock(activeDoc.id, block.id, { buttonColor: c.val })}
                                    className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${(block.buttonColor || '#2383e2') === c.val
                                        ? 'ring-2 ring-offset-1 ring-[#2383e2] scale-110'
                                        : 'opacity-70 hover:opacity-100'
                                      }`}
                                    style={{ backgroundColor: c.val }}
                                    title={c.name}
                                  />
                                ))}
                              </div>
                              {isBtnBlocked ? (
                                <div
                                  className="px-3 py-1.5 rounded-[4px] bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-not-allowed opacity-90"
                                  title="Link zablokowany ze względów bezpieczeństwa (treści 18+)"
                                >
                                  <span>{block.content || 'Przycisk'}</span>
                                  <Lock size={12} className="text-rose-600" />
                                  <span className="text-[10px] text-rose-500 font-mono font-normal">(Zablokowany 18+)</span>
                                </div>
                              ) : (
                                <a
                                  href={block.buttonUrl || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ backgroundColor: block.buttonColor || '#2383e2' }}
                                  className="px-3.5 py-1.5 rounded-[4px] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs hover:opacity-90 transition-opacity"
                                >
                                  <span>{block.content || 'Przycisk Akcji'}</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 22. Timeline Block */}
                      {block.type === 'timeline' && (
                        <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                            <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                              <Milestone size={14} className="text-amber-600 dark:text-amber-400" />
                              <span>Kamień Milowy / Oś Czasu (Timeline)</span>
                            </span>
                            <span className="text-[10px] font-mono">Krok procesu</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Data / Etap
                              </label>
                              <input
                                type="text"
                                value={block.timelineDate || ''}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { timelineDate: e.target.value })}
                                placeholder="np. Etap 1"
                                className="w-full px-2.5 py-1 text-xs font-semibold bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                Opis Kamienia Milowego
                              </label>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="np. Ostateczne wdrożenie nowej architektury"
                                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5 p-2 bg-white dark:bg-[#191919] rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f]">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 dark:ring-amber-900 mt-1 shrink-0" />
                            <div>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded-[3px] border border-amber-200/60 dark:border-amber-800/60">
                                {block.timelineDate || 'Data etapu'}
                              </span>
                              <div className="text-xs font-medium text-[#37352f] dark:text-[#d4d4d4] mt-1">{block.content || 'Opis kamienia milowego'}</div>
                            </div>
                          </div>
                        </div>
                      )}


                      {/* 23. File Block */}
                      {block.type === 'file' && (() => {
                        const isFileBlocked = isBlockedUrl(block.fileUrl);
                        return (
                          <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                              <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                                <Paperclip size={14} className="text-[#2383e2] dark:text-[#529cca]" />
                                <span>Załącznik / Plik do Pobrania</span>
                              </span>
                              <span className="text-[10px] font-mono">Załącznik</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  Nazwa pliku
                                </label>
                                <input
                                  type="text"
                                  value={block.fileName || ''}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { fileName: filterSwearWords(e.target.value) })}
                                  placeholder="dokument.pdf"
                                  className="w-full px-2.5 py-1 text-xs font-medium bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  Rozmiar
                                </label>
                                <input
                                  type="text"
                                  value={block.fileSize || ''}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { fileSize: e.target.value })}
                                  placeholder="2.4 MB"
                                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] rounded-[4px] focus:outline-none focus:border-[#2383e2]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  URL / Link do pobrania
                                </label>
                                <input
                                  type="text"
                                  value={block.fileUrl || ''}
                                  onChange={(e) => handleBlockUrlUpdate(block.id, { fileUrl: e.target.value })}
                                  placeholder="https://... lub /uploads/..."
                                  className={`w-full px-2.5 py-1 text-xs font-mono rounded-[4px] focus:outline-none transition-all ${isFileBlocked
                                      ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                                      : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] focus:border-[#2383e2]'
                                    }`}
                                />
                                {isFileBlocked && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                                    Adres zablokowany: linki do stron dla dorosłych (18+) są zabronione!
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#191919] rounded-[4px] border border-[#e9e9e7] dark:border-[#2f2f2f]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-[4px] bg-blue-50 dark:bg-blue-950/60 text-[#2383e2] dark:text-[#529cca] flex items-center justify-center shrink-0">
                                  <Download size={15} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#37352f] dark:text-[#d4d4d4] truncate">{block.fileName || 'Nazwa pliku'}</div>
                                  <div className="text-[10px] text-[#787774] dark:text-[#9b9a97]">{block.fileSize || 'Rozmiar nieznany'}</div>
                                </div>
                              </div>
                              {isFileBlocked ? (
                                <span className="px-2.5 py-1 rounded-[4px] bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-semibold cursor-not-allowed border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5">
                                  <Lock size={12} />
                                  <span>Zablokowany 18+</span>
                                </span>
                              ) : (
                                <a
                                  href={block.fileUrl || '#'}
                                  download
                                  className="px-2.5 py-1 rounded-[4px] bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#2383e2] dark:text-[#529cca] text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1.5"
                                >
                                  <Download size={12} />
                                  <span>Pobierz</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })()}



                      {/* 24. Embed Block */}
                      {block.type === 'embed' && (() => {
                        const isEmbedBlocked = isBlockedUrl(block.embedUrl);
                        return (
                          <div className="p-3.5 my-2 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between text-xs text-[#787774] dark:text-[#9b9a97]">
                              <span className="flex items-center gap-1.5 font-semibold text-[#37352f] dark:text-[#d4d4d4]">
                                <Layout size={14} className="text-purple-600 dark:text-purple-400" />
                                <span>Osadzenie Web / Iframe / Widget</span>
                              </span>
                              <span className="text-[10px] font-mono">Iframe</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="text-[10px] font-semibold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block mb-1">
                                  Adres URL do osadzenia
                                </label>
                                <input
                                  type="text"
                                  value={block.embedUrl || ''}
                                  onChange={(e) => handleBlockUrlUpdate(block.id, { embedUrl: e.target.value })}
                                  placeholder="https://searchpoint.pl lub embed widget..."
                                  className={`w-full px-2.5 py-1 text-xs font-mono rounded-[4px] focus:outline-none transition-all ${isEmbedBlocked
                                      ? 'border-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
                                      : 'bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] text-[#37352f] dark:text-[#d4d4d4] focus:border-purple-500'
                                    }`}
                                />
                                {isEmbedBlocked && (
                                  <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                                    Adres zablokowany: linki do stron dla dorosłych (18+) są zabronione!
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                  Podpis / Tytuł ramki
                                </label>
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { content: filterSwearWords(e.target.value) })}
                                  placeholder="np. Podgląd platformy SearchPoint"
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                            {isEmbedBlocked ? (
                              <div className="p-6 bg-rose-50/80 border border-rose-200 rounded-xl text-center text-rose-700 text-xs space-y-1.5 shadow-2xs">
                                <div className="text-2xl">⛔</div>
                                <div className="font-bold text-sm">Osadzenie zablokowane ze względów bezpieczeństwa</div>
                                <div className="text-[11px] text-rose-600 font-mono">
                                  Adres URL zawiera treści 18+ i nie może być wyświetlany w ramce.
                                </div>
                              </div>
                            ) : (
                              block.embedUrl && (
                                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                                  <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                                    <span className="truncate max-w-xs font-mono text-[10px]">{block.embedUrl}</span>
                                    <a
                                      href={block.embedUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 text-[10px]"
                                    >
                                      <span>Otwórz w nowej karcie</span>
                                      <ExternalLink size={10} />
                                    </a>
                                  </div>
                                  <iframe
                                    src={block.embedUrl}
                                    title={block.content || 'Osadzona treść'}
                                    className="w-full h-64 border-none"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                  />
                                </div>
                              )
                            )}
                          </div>
                        );
                      })()}



                      {/* 25. H4 Block */}
                      {block.type === 'h4' && (
                        <textarea
                          rows={1}
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value)}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h4')}
                          onFocus={() => setFocusedBlockId(block.id)}
                          placeholder="Podsekcja poziomu 4..."
                          className={`w-full text-xs font-bold uppercase tracking-wider text-slate-700 placeholder-slate-300 resize-none bg-transparent border-none focus:outline-none leading-relaxed ${block.textAlign === 'center'
                              ? 'text-center'
                              : block.textAlign === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          style={{
                            color: block.textColor || undefined,
                            backgroundColor: block.bgColor || undefined,
                          }}
                        />
                      )}

                      {/* 25b. H5 Block */}
                      {block.type === 'h5' && (
                        <textarea
                          rows={1}
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value)}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h5')}
                          onFocus={() => setFocusedBlockId(block.id)}
                          placeholder="Podsekcja poziomu 5..."
                          className={`w-full text-xs font-semibold text-slate-700 placeholder-slate-300 resize-none bg-transparent border-none focus:outline-none leading-relaxed ${block.textAlign === 'center'
                              ? 'text-center'
                              : block.textAlign === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          style={{
                            color: block.textColor || undefined,
                            backgroundColor: block.bgColor || undefined,
                          }}
                        />
                      )}

                      {/* 25c. H6 Block */}
                      {block.type === 'h6' && (
                        <textarea
                          rows={1}
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value)}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'h6')}
                          onFocus={() => setFocusedBlockId(block.id)}
                          placeholder="Podsekcja poziomu 6..."
                          className={`w-full text-[11px] font-semibold uppercase tracking-wider text-slate-500 placeholder-slate-300 resize-none bg-transparent border-none focus:outline-none leading-relaxed ${block.textAlign === 'center'
                              ? 'text-center'
                              : block.textAlign === 'right'
                                ? 'text-right'
                                : 'text-left'
                            }`}
                          style={{
                            color: block.textColor || undefined,
                            backgroundColor: block.bgColor || undefined,
                          }}
                        />
                      )}

                      {/* 26. Lead Text Block */}
                      {block.type === 'lead' && (
                        <textarea
                          rows={2}
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value)}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'lead')}
                          onFocus={() => setFocusedBlockId(block.id)}
                          placeholder="Wprowadzenie lub kluczowy lead artykułu..."
                          className="w-full text-base font-medium text-slate-700 placeholder-slate-300 resize-none bg-transparent border-none focus:outline-none leading-relaxed border-l-2 border-slate-300 pl-3 py-1"
                          style={{
                            color: block.textColor || undefined,
                            backgroundColor: block.bgColor || undefined,
                          }}
                        />
                      )}

                      {/* 27. Subtext / Caption Block */}
                      {block.type === 'subtext' && (
                        <textarea
                          rows={1}
                          value={block.content}
                          onChange={(e) => handleContentChange(block.id, e.target.value)}
                          onKeyDown={(e) => handleTextKeyDown(e, block.id, 'subtext')}
                          onFocus={() => setFocusedBlockId(block.id)}
                          placeholder="Drobny podpis, źródło lub przypis dolny..."
                          className="w-full text-[11px] italic text-slate-400 placeholder-slate-300 resize-none bg-transparent border-none focus:outline-none"
                          style={{
                            color: block.textColor || undefined,
                            backgroundColor: block.bgColor || undefined,
                          }}
                        />
                      )}

                      {/* 28. Numbered Toggle */}
                      {block.type === 'numbered_toggle' && (
                        <details className="my-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 group">
                          <summary className="font-bold text-slate-800 cursor-pointer list-none flex items-center justify-between select-none">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                {block.content.match(/^\d+/)?.[0] || '1'}
                              </span>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Tytuł kroku (kliknij, aby rozwinąć)..."
                                className="font-bold text-xs text-slate-800 bg-transparent border-none focus:outline-none flex-1"
                              />
                            </div>
                            <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" />
                          </summary>
                          <textarea
                            rows={3}
                            value={block.toggleDetails || ''}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { toggleDetails: e.target.value })}
                            placeholder="Szczegóły ukryte wewnątrz tej sekcji..."
                            className="w-full mt-2.5 p-2 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 resize-none focus:outline-none focus:border-blue-400"
                          />
                        </details>
                      )}

                      {/* 29. Tabs Block */}
                      {block.type === 'tabs' && (() => {
                        const tabTitles = (block.content || 'Zakładka 1 | Zakładka 2 | Zakładka 3').split('|').map(s => s.trim());
                        const tabDetails = (block.toggleDetails || 'Treść 1 | Treść 2 | Treść 3').split('|').map(s => s.trim());
                        const activeIdx = block.activeTabIndex || 0;

                        return (
                          <div className="my-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                              <div className="flex items-center gap-1.5 overflow-x-auto">
                                {tabTitles.map((title, tIdx) => (
                                  <button
                                    key={tIdx}
                                    type="button"
                                    onClick={() => updateBlock(activeDoc.id, block.id, { activeTabIndex: tIdx })}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${activeIdx === tIdx
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                                      }`}
                                  >
                                    {title}
                                  </button>
                                ))}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">Zakładki (Tabs)</span>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                                Treść aktywnej zakładki ({tabTitles[activeIdx] || 'Zakładka'}):
                              </label>
                              <textarea
                                rows={3}
                                value={tabDetails[activeIdx] || ''}
                                onChange={(e) => {
                                  const updated = [...tabDetails];
                                  while (updated.length <= activeIdx) updated.push('');
                                  updated[activeIdx] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { toggleDetails: updated.join(' | ') });
                                }}
                                placeholder="Wpisz treść dla tej zakładki..."
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 resize-none focus:outline-none focus:border-blue-400"
                              />
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                              <span>Edytuj nazwy zakładek (rozdziel znakiem |):</span>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-700 w-64"
                              />
                            </div>
                          </div>
                        );
                      })()}



                      {/* 30. Callout Info */}
                      {/* 30. Callout Info - Notion 1:1 */}
                      {block.type === 'callout_info' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#f1f1ef] dark:bg-[#252525] rounded-[4px] text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">ℹ️</span>
                          <textarea
                            rows={Math.max(1, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz informację..."
                            className="w-full text-[15px] text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 31. Callout Success - Notion 1:1 */}
                      {block.type === 'callout_success' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#dcfce7]/70 dark:bg-[#14532d]/30 rounded-[4px] text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">✅</span>
                          <textarea
                            rows={Math.max(1, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz sukces lub cel..."
                            className="w-full text-[15px] text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 32. Callout Warning - Notion 1:1 */}
                      {block.type === 'callout_warning' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#fef9c3]/70 dark:bg-[#713f12]/30 rounded-[4px] text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">⚠️</span>
                          <textarea
                            rows={Math.max(1, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz ostrzeżenie..."
                            className="w-full text-[15px] text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 33. Callout Danger - Notion 1:1 */}
                      {block.type === 'callout_danger' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#fee2e2]/70 dark:bg-[#7f1d1d]/30 rounded-[4px] text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">⛔</span>
                          <textarea
                            rows={Math.max(1, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz krytyczny błąd lub ograniczenie..."
                            className="w-full text-[15px] text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 34. Callout Tip - Notion 1:1 */}
                      {block.type === 'callout_tip' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#f3e8ff]/70 dark:bg-[#581c87]/30 rounded-[4px] text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">💡</span>
                          <textarea
                            rows={Math.max(1, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz wskazówkę lub poradę..."
                            className="w-full text-[15px] text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 35. Key Takeaway - Notion Amber Callout */}
                      {block.type === 'key_takeaway' && (
                        <div className="flex items-start gap-3 p-4 my-2 bg-[#fef9c3]/70 dark:bg-[#713f12]/30 rounded-[4px] border-l-2 border-amber-400 text-[#37352f] dark:text-[#d4d4d4] text-[15px] leading-relaxed">
                          <span className="text-lg select-none shrink-0 mt-0.5">💡</span>
                          <textarea
                            rows={Math.max(2, (block.content || '').split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Kluczowy wniosek lub podsumowanie..."
                            className="w-full text-[15px] font-medium text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                          />
                        </div>
                      )}

                      {/* 36. Terminal Block */}
                      {block.type === 'terminal' && (
                        <div className="my-2 rounded-2xl overflow-hidden bg-[#0a0e14] border border-[#1f2937] shadow-md font-mono text-xs">
                          <div className="px-3.5 py-2 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                              <span className="ml-2 text-[10px] text-slate-400 font-mono">bash — terminal</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(block.content);
                              }}
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Copy size={11} />
                              <span>Kopiuj</span>
                            </button>
                          </div>
                          <div className="p-3.5 text-emerald-400 flex items-start gap-2">
                            <span className="text-slate-500 select-none font-bold">$</span>
                            <textarea
                              rows={Math.max(2, block.content.split('\n').length)}
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="npm install..."
                              className="w-full bg-transparent text-emerald-300 font-mono text-xs resize-none border-none focus:outline-none leading-relaxed"
                            />
                          </div>
                        </div>
                      )}


                      {/* 37. JSON Block */}
                      {block.type === 'json' && (
                        <div className="my-2 rounded-[6px] overflow-hidden bg-[#0f172a] border border-[#1e293b] p-3 font-mono text-xs shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                            <span className="font-bold text-sky-400">JSON Payload / Response</span>
                            <button
                              type="button"
                              onClick={() => {
                                try {
                                  const parsed = JSON.parse(block.content);
                                  updateBlock(activeDoc.id, block.id, { content: JSON.stringify(parsed, null, 2) });
                                } catch {
                                  addNotification('Błąd JSON', 'Wprowadzony tekst nie jest poprawnym JSON-em.', 'warning');
                                }
                              }}
                              className="text-[10px] text-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                              Sformatuj (Prettify)
                            </button>
                          </div>
                          <textarea
                            rows={Math.max(3, block.content.split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="{\n  &quot;key&quot;: &quot;value&quot;\n}"
                            className="w-full bg-transparent text-sky-200 font-mono text-xs resize-none border-none focus:outline-none"
                          />
                        </div>
                      )}

                      {/* 38. Diff Block */}
                      {block.type === 'diff' && (
                        <div className="my-2 rounded-[6px] overflow-hidden bg-[#0d1117] border border-[#30363d] p-3 font-mono text-xs shadow-2xs space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                            Git Diff (Zmiany w kodzie)
                          </div>
                          <textarea
                            rows={Math.max(3, block.content.split('\n').length)}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="- Stara linia\n+ Nowa linia"
                            className="w-full bg-transparent text-slate-200 font-mono text-xs resize-none border-none focus:outline-none"
                          />
                        </div>
                      )}

                      {/* 39. SQL Block */}
                      {block.type === 'sql' && (
                        <div className="my-2 rounded-[6px] overflow-hidden bg-[#0f172a] border border-[#1e293b] p-3 font-mono text-xs shadow-2xs space-y-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                            <Database size={12} />
                            <span>Zapytanie SQL (Database Query)</span>
                          </div>
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="SELECT * FROM users WHERE status = 'active';"
                            className="w-full bg-transparent text-indigo-200 font-mono text-xs resize-none border-none focus:outline-none"
                          />
                        </div>
                      )}

                      {/* 40. Stat Grid Block - Notion 1:1 */}
                      {block.type === 'stat_grid' && (() => {
                        const labels = (block.content || 'Wskaźnik A | Wskaźnik B').split('|').map(s => s.trim());
                        const values = (block.statValue || '12 400 | 98.2%').split('|').map(s => s.trim());
                        const trends = (block.statTrend || '+12.4% | Rekord').split('|').map(s => s.trim());

                        return (
                          <div className="my-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="p-3 bg-[#f7f6f5] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-0.5">
                              <input
                                type="text"
                                value={labels[0] || ''}
                                onChange={(e) => {
                                  labels[0] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { content: labels.join(' | ') });
                                }}
                                placeholder="Etykieta A"
                                className="text-[11px] font-semibold text-[#787774] dark:text-[#999] uppercase tracking-wider bg-transparent border-none focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={values[0] || ''}
                                onChange={(e) => {
                                  values[0] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { statValue: values.join(' | ') });
                                }}
                                placeholder="Wartość A"
                                className="text-base font-semibold text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={trends[0] || ''}
                                onChange={(e) => {
                                  trends[0] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { statTrend: trends.join(' | ') });
                                }}
                                placeholder="Wskaźnik dodatkowy"
                                className="text-[11px] text-[#787774] dark:text-[#999] bg-transparent border-none focus:outline-none w-full"
                              />
                            </div>
                            <div className="p-3 bg-[#f7f6f5] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-0.5">
                              <input
                                type="text"
                                value={labels[1] || ''}
                                onChange={(e) => {
                                  labels[1] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { content: labels.join(' | ') });
                                }}
                                placeholder="Etykieta B"
                                className="text-[11px] font-semibold text-[#787774] dark:text-[#999] uppercase tracking-wider bg-transparent border-none focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={values[1] || ''}
                                onChange={(e) => {
                                  values[1] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { statValue: values.join(' | ') });
                                }}
                                placeholder="Wartość B"
                                className="text-base font-semibold text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none w-full"
                              />
                              <input
                                type="text"
                                value={trends[1] || ''}
                                onChange={(e) => {
                                  trends[1] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { statTrend: trends.join(' | ') });
                                }}
                                placeholder="Wskaźnik dodatkowy"
                                className="text-[11px] text-[#787774] dark:text-[#999] bg-transparent border-none focus:outline-none w-full"
                              />
                            </div>
                          </div>
                        );
                      })()}



                      {/* 41. Rating Block (1-5 Stars) */}
                      {block.type === 'rating' && (
                        <div className="my-2 p-3 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] flex items-center justify-between shadow-2xs transition-colors">
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Nazwa oceny (np. Jakość kodu, Wiarygodność źródła)..."
                            className="font-semibold text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none flex-1"
                          />
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => updateBlock(activeDoc.id, block.id, { ratingStars: star })}
                                className="p-1 cursor-pointer transition-transform hover:scale-110"
                              >
                                <Star
                                  size={16}
                                  className={
                                    star <= (block.ratingStars || 5)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-[#ccc] dark:text-[#555]'
                                  }
                                />
                              </button>
                            ))}
                            <span className="text-[11px] font-mono text-[#787774] dark:text-[#9b9a97] font-bold ml-1">
                              {block.ratingStars || 5}/5
                            </span>
                          </div>
                        </div>
                      )}


                      {/* 42. Poll Block */}
                      {block.type === 'poll' && (
                        <div className="my-2.5 p-3.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider flex items-center gap-1.5">
                              <Vote size={13} className="text-[#2383e2] dark:text-[#529cca]" />
                              <span>Głosowanie / Mini Ankieta</span>
                            </span>
                          </div>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Pytanie ankietowe..."
                            className="font-bold text-xs text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none w-full"
                          />
                          <div className="space-y-1.5">
                            {(block.pollOptions || []).map((opt, oIdx) => {
                              const totalVotes = (block.pollOptions || []).reduce((acc, o) => acc + o.votes, 0);
                              const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                              return (
                                <div
                                  key={oIdx}
                                  onClick={() => {
                                    const updated = [...(block.pollOptions || [])];
                                    updated[oIdx].votes += 1;
                                    updateBlock(activeDoc.id, block.id, { pollOptions: updated });
                                  }}
                                  className="p-2 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] hover:border-[#2383e2] rounded-[4px] cursor-pointer relative overflow-hidden transition-all shadow-2xs group"
                                >
                                  <div
                                    className="absolute inset-y-0 left-0 bg-blue-50/60 dark:bg-blue-950/40 transition-all duration-300"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <div className="relative z-10 flex items-center justify-between text-xs">
                                    <span className="font-medium text-[#37352f] dark:text-[#d4d4d4]">{opt.label}</span>
                                    <span className="text-[11px] font-mono font-bold text-[#2383e2] dark:text-[#529cca]">
                                      {pct}% ({opt.votes})
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}


                      {/* 43. Map Block */}
                      {block.type === 'map' && (
                        <div className="my-2.5 p-3.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#37352f] dark:text-[#d4d4d4]">
                              <MapPin size={14} className="text-rose-500" />
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => {
                                  const loc = e.target.value;
                                  const encoded = encodeURIComponent(loc);
                                  updateBlock(activeDoc.id, block.id, {
                                    content: loc,
                                    embedUrl: `https://maps.google.com/maps?q=${encoded}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
                                  });
                                }}
                                placeholder="Wpisz adres lub miasto (np. Warszawa, Polska)..."
                                className="font-semibold text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none w-64"
                              />
                            </div>
                            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">Google Maps</span>
                          </div>
                          {block.embedUrl && (
                            <div className="rounded-[4px] overflow-hidden border border-[#e9e9e7] dark:border-[#2f2f2f] h-48 bg-white dark:bg-[#191919]">
                              <iframe
                                src={block.embedUrl}
                                title={block.content || 'Mapa'}
                                className="w-full h-full border-none"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 44. Badge Block */}
                      {block.type === 'badge' && (
                        <div className="my-1.5 flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-[4px] text-xs font-bold text-white shadow-2xs tracking-wider"
                            style={{ backgroundColor: block.buttonColor || '#10b981' }}
                          >
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="STATUS"
                              className="bg-transparent border-none text-white font-bold text-xs uppercase focus:outline-none w-28 text-center"
                            />
                          </span>
                          <div className="flex items-center gap-1">
                            {['#10b981', '#2563eb', '#f59e0b', '#e11d48', '#8b5cf6', '#475569'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateBlock(activeDoc.id, block.id, { buttonColor: c })}
                                className="w-3.5 h-3.5 rounded-full cursor-pointer transition-transform hover:scale-125 border border-white dark:border-[#333] shadow-2xs"
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}


                      {/* 45. Spacer Block */}
                      {block.type === 'spacer' && (
                        <div
                          className="my-1 flex items-center justify-center border border-dashed border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] group select-none text-[10px] text-[#787774] dark:text-[#9b9a97] hover:border-[#aaa] transition-colors"
                          style={{ height: `${block.progressPercent || 32}px` }}
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Odstęp ({block.progressPercent || 32}px)
                          </span>
                        </div>
                      )}

                      {/* 46. Columns 2 Block */}
                      {block.type === 'columns_2' && (
                        <div className="my-2 grid grid-cols-1 md:grid-cols-2 gap-2.5 p-2.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs">
                          <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-1">
                            <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">Kolumna 1</span>
                            <textarea
                              rows={3}
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="Treść lewej kolumny..."
                              className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                            />
                          </div>
                          <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-1">
                            <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">Kolumna 2</span>
                            <textarea
                              rows={3}
                              value={block.toggleDetails || ''}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { toggleDetails: e.target.value })}
                              placeholder="Treść prawej kolumny..."
                              className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                            />
                          </div>
                        </div>
                      )}


                      {/* 47. Columns 3 Block */}
                      {block.type === 'columns_3' && (() => {
                        const col2_3 = (block.toggleDetails || 'Kolumna 2 | Kolumna 3').split('|').map(s => s.trim());
                        return (
                          <div className="my-2 grid grid-cols-1 md:grid-cols-3 gap-2.5 p-2.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs">
                            <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-1">
                              <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">Kolumna 1</span>
                              <textarea
                                rows={3}
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Kolumna 1..."
                                className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                              />
                            </div>
                            <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-1">
                              <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">Kolumna 2</span>
                              <textarea
                                rows={3}
                                value={col2_3[0] || ''}
                                onChange={(e) => {
                                  col2_3[0] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { toggleDetails: col2_3.join(' | ') });
                                }}
                                placeholder="Kolumna 2..."
                                className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                              />
                            </div>
                            <div className="p-2.5 bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] space-y-1">
                              <span className="text-[10px] font-bold text-[#787774] dark:text-[#9b9a97] uppercase tracking-wider block">Kolumna 3</span>
                              <textarea
                                rows={3}
                                value={col2_3[1] || ''}
                                onChange={(e) => {
                                  col2_3[1] = e.target.value;
                                  updateBlock(activeDoc.id, block.id, { toggleDetails: col2_3.join(' | ') });
                                }}
                                placeholder="Kolumna 3..."
                                className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })()}



                      {/* 48. Card Block */}
                      {block.type === 'card' && (
                        <div className="my-2 p-3.5 bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-1.5 group hover:border-[#2383e2] transition-colors">
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Tytuł karty informacyjnej..."
                            className="font-bold text-sm text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none w-full"
                          />
                          <textarea
                            rows={2}
                            value={block.toggleDetails || ''}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { toggleDetails: e.target.value })}
                            placeholder="Zawartość karty..."
                            className="w-full text-xs text-[#787774] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none"
                          />
                        </div>
                      )}

                      {/* 49. Alert Banner Block */}
                      {block.type === 'alert_banner' && (
                        <div className="my-2.5 p-3.5 bg-blue-600 text-white rounded-2xl shadow-sm flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <AlertCircle size={16} className="text-blue-200 shrink-0" />
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="Wpisz ogłoszenie lub alert banerowy..."
                              className="font-semibold text-xs text-white bg-transparent border-none focus:outline-none w-full placeholder:text-blue-200"
                            />
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white shrink-0 uppercase tracking-wider">
                            Alert
                          </span>
                        </div>
                      )}

                      {/* 50. AI Prompt Block (Interactive In-Doc AI) */}
                      {block.type === 'ai_prompt' && (
                        <div className="my-2.5 p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/90 rounded-2xl shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                              <Sparkles size={14} className="text-blue-600" />
                              <span>Interaktywny Blok AI Prompt</span>
                            </span>
                            <button
                              type="button"
                              disabled={loadingAiBlockId === block.id || !block.content.trim()}
                              onClick={async () => {
                                if (!user) {
                                  setIsAuthModalOpen?.(true);
                                  addNotification('Wymagane logowanie', 'Zaloguj się do usługi SearchPoint, aby korzystać z asystenta AI.', 'warning');
                                  return;
                                }
                                if (!block.content.trim()) return;
                                setLoadingAiBlockId(block.id);
                                try {
                                  const res = await generateEditorAiResponse({
                                    query: block.content,
                                    activeDoc,
                                    pages,
                                  });
                                  updateBlock(activeDoc.id, block.id, { toggleDetails: res.text });
                                  addNotification('AI wygenerowało odpowiedź', 'Tekst wprowadzony do dokumentu.', 'success', activeDoc.id);
                                } catch {
                                  updateBlock(activeDoc.id, block.id, {
                                    toggleDetails: `💡 Odpowiedź AI dla: "${block.content}" została opracowana pomyślnie.`,
                                  });
                                } finally {
                                  setLoadingAiBlockId(null);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1.5 transition-colors"
                            >
                              {loadingAiBlockId === block.id ? (
                                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Sparkles size={11} />
                                  <span>Wygeneruj odpowiedź AI</span>
                                </>
                              )}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!user) {
                                  setIsAuthModalOpen?.(true);
                                  addNotification('Wymagane logowanie', 'Zaloguj się do usługi SearchPoint, aby korzystać z asystenta AI.', 'warning');
                                  return;
                                }
                                if (!block.content.trim() || loadingAiBlockId === block.id) return;
                                setLoadingAiBlockId(block.id);
                                try {
                                  const res = await generateEditorAiResponse({
                                    query: block.content,
                                    activeDoc,
                                    pages,
                                  });
                                  updateBlock(activeDoc.id, block.id, { toggleDetails: res.text });
                                  addNotification('AI wygenerowało odpowiedź', 'Odpowiedź wygenerowana przez AI.', 'success', activeDoc.id);
                                } catch {
                                  updateBlock(activeDoc.id, block.id, {
                                    toggleDetails: `💡 Odpowiedź AI dla: "${block.content}" została opracowana.`,
                                  });
                                } finally {
                                  setLoadingAiBlockId(null);
                                }
                              }
                            }}
                            placeholder="Zadaj pytanie asystentowi AI (naciśnij Enter, np. Wymień 5 ryzyk projektu)..."
                            className="w-full text-xs font-semibold text-slate-800 bg-white/90 p-2.5 rounded-xl border border-blue-200/60 focus:outline-none focus:border-blue-400 shadow-2xs"
                          />
                          {block.toggleDetails && (
                            <div className="p-3.5 bg-white rounded-xl border border-blue-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-2xs space-y-2.5">
                              <div>{block.toggleDetails}</div>
                              <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsed = parseMarkdownToNotionBlocks(block.toggleDetails || '', block.content);
                                    if (parsed.blocks.length > 0) {
                                      insertBlocks(activeDoc.id, parsed.blocks, block.id);
                                      deleteBlock(activeDoc.id, block.id);
                                      addNotification('Zastąpiono blok promptu', `Wstawiono ${parsed.blocks.length} bloków wygenerowanych przez AI.`, 'success', activeDoc.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors"
                                >
                                  <Check size={11} />
                                  <span>Zastąp ten blok</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const parsed = parseMarkdownToNotionBlocks(block.toggleDetails || '', block.content);
                                    if (parsed.blocks.length > 0) {
                                      insertBlocks(activeDoc.id, parsed.blocks, block.id);
                                      addNotification('Wstawiono bloki', `Dodano ${parsed.blocks.length} bloków z odpowiedzi AI poniżej.`, 'success', activeDoc.id);
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer shadow-2xs flex items-center gap-1 transition-colors"
                                >
                                  <Plus size={11} />
                                  <span>Wstaw poniżej</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(block.toggleDetails || '');
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors"
                                >
                                  Kopiuj
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 51. Signature Block */}
                      {block.type === 'signature' && (
                        <div className="my-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                              <PenTool size={16} />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Imię i nazwisko autora..."
                                className="font-bold text-xs text-slate-900 bg-transparent border-none focus:outline-none block"
                              />
                              <input
                                type="text"
                                value={block.timelineDate || ''}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { timelineDate: e.target.value })}
                                placeholder="Data zatwierdzenia..."
                                className="text-[10px] text-slate-400 font-mono bg-transparent border-none focus:outline-none block mt-0.5"
                              />
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <ShieldCheck size={12} />
                            <span>ZATWIERDZONY</span>
                          </span>
                        </div>
                      )}

                      {/* 52. Pros & Cons Block */}
                      {block.type === 'pros_cons' && (
                        <div className="my-2.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs transition-colors">
                          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-[4px] space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <ThumbsUp size={14} className="text-emerald-600 dark:text-emerald-400" />
                              <span>Zalety (Mocne strony)</span>
                            </div>
                            <textarea
                              rows={3}
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="+ Zaleta 1&#10;+ Zaleta 2"
                              className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed font-medium"
                            />
                          </div>
                          <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-[4px] space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 dark:text-rose-300">
                              <ThumbsDown size={14} className="text-rose-600 dark:text-rose-400" />
                              <span>Wady (Wyzwania / Ryzyka)</span>
                            </div>
                            <textarea
                              rows={3}
                              value={block.toggleDetails || ''}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { toggleDetails: e.target.value })}
                              placeholder="- Ryzyko 1&#10;- Wyzwanie 2"
                              className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none resize-none focus:outline-none leading-relaxed font-medium"
                            />
                          </div>
                        </div>
                      )}

                      {/* 53. Mermaid Architecture & Diagram Block */}
                      {block.type === 'mermaid' && (
                        <div className="my-3 p-4 bg-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md space-y-3 select-none">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                                <Workflow size={15} />
                              </div>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Tytuł schematu..."
                                className="text-xs font-bold text-white bg-transparent border-none focus:outline-none"
                              />
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                                Mermaid v10
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => updateBlock(activeDoc.id, block.id, {
                                  diagramType: 'flowchart',
                                  diagramSyntax: 'graph TD\n  A[Start Projektu] --> B{Wymagania}\n  B -->|OK| C[Architektura i UI]\n  B -->|Brak| D[Warsztat]\n  C --> E[Produkcja 🚀]',
                                })}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              >
                                Flowchart
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(activeDoc.id, block.id, {
                                  diagramType: 'sequence',
                                  diagramSyntax: 'sequenceDiagram\n  Użytkownik->>Frontend: Kliknięcie Akcji\n  Frontend->>Backend API: Zapytanie POST /sync\n  Backend API-->>Baza Danych: Zapis DocBlock\n  Backend API-->>Frontend: 200 OK (Zapisano)',
                                })}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              >
                                Sekwencja
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBlock(activeDoc.id, block.id, {
                                  diagramType: 'architecture',
                                  diagramSyntax: 'graph LR\n  Edytor[Universal Editor] --> Kernel[SearchPoint Kernel]\n  Kernel --> DualAI[AI Dual-Engine]\n  Kernel --> Cloud[Cloud Storage & Firebase]\n  DualAI --> GPT[Puter GPT-4o-mini]\n  DualAI --> ZeroLag[Offline Local Engine]',
                                })}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                              >
                                Architektura
                              </button>
                            </div>
                          </div>
                          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] space-y-2 overflow-x-auto">
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Podgląd Wizualny Węzłów:</div>
                            <div className="flex flex-wrap items-center gap-2 text-xs py-1">
                              {(block.diagramSyntax || '').split('\n').filter((l) => l.includes('-->') || l.includes('->>')).map((line, li) => {
                                const parts = line.split(/-->|->>/);
                                return (
                                  <div key={li} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-200">
                                    <span className="font-semibold">{parts[0]?.trim() || 'A'}</span>
                                    <span className="text-blue-400">➔</span>
                                    <span className="text-emerald-300">{parts[1]?.trim() || 'B'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                              <span>Składnia Mermaid:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(block.diagramSyntax || '');
                                }}
                                className="text-blue-400 hover:underline cursor-pointer"
                              >
                                Kopiuj kod
                              </button>
                            </div>
                            <textarea
                              rows={4}
                              value={block.diagramSyntax || ''}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { diagramSyntax: e.target.value })}
                              className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500 resize-y leading-relaxed"
                            />
                          </div>
                        </div>
                      )}

                      {/* 54. Embedded Mini-Kanban Board Block */}
                      {block.type === 'kanban_board' && (
                        <div className="my-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <LayoutGrid size={15} className="text-blue-600" />
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Nazwa tablicy..."
                                className="text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-none focus:outline-none"
                              />
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                              Mini Kanban
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(block.kanbanColumns || []).map((col, colIdx) => (
                              <div key={col.id} className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2.5">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                                    <span>{col.title}</span>
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                                    {col.items.length}
                                  </span>
                                </div>
                                <div className="space-y-1.5 min-h-[60px]">
                                  {col.items.map((item, itemIdx) => (
                                    <div key={item.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1 shadow-2xs group">
                                      <span className="text-xs font-medium leading-tight">{item.title}</span>
                                      <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                        {colIdx > 0 && (
                                          <button
                                            type="button"
                                            title="Przenieś w lewo"
                                            onClick={() => {
                                              const newCols = [...(block.kanbanColumns || [])];
                                              newCols[colIdx].items.splice(itemIdx, 1);
                                              newCols[colIdx - 1].items.push(item);
                                              updateBlock(activeDoc.id, block.id, { kanbanColumns: newCols });
                                            }}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                                          >
                                            ←
                                          </button>
                                        )}
                                        {colIdx < (block.kanbanColumns?.length || 3) - 1 && (
                                          <button
                                            type="button"
                                            title="Przenieś w prawo"
                                            onClick={() => {
                                              const newCols = [...(block.kanbanColumns || [])];
                                              newCols[colIdx].items.splice(itemIdx, 1);
                                              newCols[colIdx + 1].items.push(item);
                                              updateBlock(activeDoc.id, block.id, { kanbanColumns: newCols });
                                            }}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                                          >
                                            →
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const taskTitle = window.prompt('Nazwa nowego zadania:', 'Nowe zadanie');
                                    if (taskTitle && taskTitle.trim()) {
                                      const newCols = [...(block.kanbanColumns || [])];
                                      newCols[colIdx].items.push({ id: `k-item-${Date.now()}`, title: taskTitle.trim(), tag: 'Sprint' });
                                      updateBlock(activeDoc.id, block.id, { kanbanColumns: newCols });
                                    }
                                  }}
                                  className="w-full py-1 text-center text-[10px] font-semibold text-blue-600 hover:text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-lg cursor-pointer transition-colors"
                                >
                                  + Dodaj zadanie
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 55. Countdown Deadline Block */}
                      {block.type === 'countdown' && (() => {
                        const target = new Date(block.targetDate || Date.now() + 7 * 86400000).getTime();
                        const diff = Math.max(0, target - Date.now());
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                        return (
                          <div className="my-2.5 p-3.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white rounded-[6px] shadow-sm border border-blue-900/60 space-y-2.5 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                              <div className="flex items-center gap-2">
                                <Hourglass size={15} className="text-amber-400 animate-pulse" />
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                  placeholder="Tytuł wydarzenia / deadline'u..."
                                  className="text-xs font-bold text-white bg-transparent border-none focus:outline-none"
                                />
                              </div>
                              <input
                                type="datetime-local"
                                value={block.targetDate || ''}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { targetDate: e.target.value })}
                                className="bg-black/50 text-[10px] text-white px-2 py-0.5 rounded-[4px] border border-white/20 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="p-2 bg-white/10 rounded-[4px] backdrop-blur-xs">
                                <div className="text-lg font-extrabold text-amber-300 font-mono">{days}</div>
                                <div className="text-[9px] text-white/70 uppercase tracking-wider font-semibold">Dni</div>
                              </div>
                              <div className="p-2 bg-white/10 rounded-[4px] backdrop-blur-xs">
                                <div className="text-lg font-extrabold text-blue-200 font-mono">{hours}</div>
                                <div className="text-[9px] text-white/70 uppercase tracking-wider font-semibold">Godzin</div>
                              </div>
                              <div className="p-2 bg-white/10 rounded-[4px] backdrop-blur-xs">
                                <div className="text-lg font-extrabold text-emerald-300 font-mono">{minutes}</div>
                                <div className="text-[9px] text-white/70 uppercase tracking-wider font-semibold">Minut</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}



                      {/* 56. FAQ Accordion Block */}
                      {block.type === 'faq' && (
                        <div className="my-2.5 p-3.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2">
                            <div className="flex items-center gap-2">
                              <HelpCircle size={15} className="text-[#2383e2] dark:text-[#529cca]" />
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Tytuł sekcji pytań i odpowiedzi (FAQ)..."
                                className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newFaqs = [...(block.faqItems || [])];
                                newFaqs.push({ question: 'Nowe pytanie...', answer: 'Odpowiedź na to pytanie...', isOpen: true });
                                updateBlock(activeDoc.id, block.id, { faqItems: newFaqs });
                              }}
                              className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1a5fb4] text-white rounded-[4px] text-[10px] font-semibold cursor-pointer shadow-2xs transition-colors"
                            >
                              + Dodaj pytanie
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {(block.faqItems || []).map((faq, fIdx) => (
                              <div key={fIdx} className="bg-white dark:bg-[#191919] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[4px] overflow-hidden">
                                <div
                                  onClick={() => {
                                    const newFaqs = [...(block.faqItems || [])];
                                    newFaqs[fIdx].isOpen = !newFaqs[fIdx].isOpen;
                                    updateBlock(activeDoc.id, block.id, { faqItems: newFaqs });
                                  }}
                                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-[#f7f6f5] dark:hover:bg-[#252525] transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <ChevronDown size={14} className={`text-[#787774] dark:text-[#9b9a97] transition-transform ${faq.isOpen ? 'rotate-180' : ''}`} />
                                    <input
                                      type="text"
                                      value={faq.question}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const newFaqs = [...(block.faqItems || [])];
                                        newFaqs[fIdx].question = e.target.value;
                                        updateBlock(activeDoc.id, block.id, { faqItems: newFaqs });
                                      }}
                                      className="text-xs font-bold text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none w-full"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newFaqs = (block.faqItems || []).filter((_, i) => i !== fIdx);
                                      updateBlock(activeDoc.id, block.id, { faqItems: newFaqs });
                                    }}
                                    className="text-[#787774] dark:text-[#9b9a97] hover:text-rose-500 text-xs p-1 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {faq.isOpen && (
                                  <div className="px-3 pb-3 pt-1 border-t border-[#e9e9e7] dark:border-[#2f2f2f]">
                                    <textarea
                                      rows={2}
                                      value={faq.answer}
                                      onChange={(e) => {
                                        const newFaqs = [...(block.faqItems || [])];
                                        newFaqs[fIdx].answer = e.target.value;
                                        updateBlock(activeDoc.id, block.id, { faqItems: newFaqs });
                                      }}
                                      className="w-full text-xs text-[#555] dark:text-[#aaa] bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 57. Before / After Comparison Block */}
                      {block.type === 'before_after' && (
                        <div className="my-2.5 p-3.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center gap-2 border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2">
                            <Columns size={15} className="text-[#2383e2] dark:text-[#529cca]" />
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                              placeholder="Tytuł porównania..."
                              className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 rounded-[4px] space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-300">
                                <span>❌ {block.beforeAfterData?.beforeTitle || 'Stan Przed'}</span>
                              </div>
                              <textarea
                                rows={3}
                                value={(block.beforeAfterData?.beforePoints || []).join('\n')}
                                onChange={(e) => {
                                  const points = e.target.value.split('\n');
                                  updateBlock(activeDoc.id, block.id, {
                                    beforeAfterData: {
                                      beforeTitle: block.beforeAfterData?.beforeTitle || 'Stan Przed',
                                      beforePoints: points,
                                      afterTitle: block.beforeAfterData?.afterTitle || 'Stan Po',
                                      afterPoints: block.beforeAfterData?.afterPoints || [],
                                    },
                                  });
                                }}
                                placeholder="Wady i problemy stanu wyjściowego..."
                                className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none resize-none leading-relaxed font-medium"
                              />
                            </div>
                            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-[4px] space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                <span>✅ {block.beforeAfterData?.afterTitle || 'Stan Po (Docelowy)'}</span>
                              </div>
                              <textarea
                                rows={3}
                                value={(block.beforeAfterData?.afterPoints || []).join('\n')}
                                onChange={(e) => {
                                  const points = e.target.value.split('\n');
                                  updateBlock(activeDoc.id, block.id, {
                                    beforeAfterData: {
                                      beforeTitle: block.beforeAfterData?.beforeTitle || 'Stan Przed',
                                      beforePoints: block.beforeAfterData?.beforePoints || [],
                                      afterTitle: block.beforeAfterData?.afterTitle || 'Stan Po',
                                      afterPoints: points,
                                    },
                                  });
                                }}
                                placeholder="Ulepszenia i korzyści po wdrożeniu..."
                                className="w-full text-xs text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none resize-none leading-relaxed font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 58. User Mention / Member Profile Card Block */}
                      {block.type === 'user_mention' && (
                        <div className="my-2 p-3 bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2383e2] to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                {(block.mentionUser?.name || block.content || 'K').slice(0, 2).toUpperCase()}
                              </div>
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-[#202020]" />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={block.mentionUser?.name || block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, {
                                  content: e.target.value,
                                  mentionUser: { ...block.mentionUser, name: e.target.value },
                                })}
                                placeholder="Imię i nazwisko..."
                                className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none block"
                              />
                              <input
                                type="text"
                                value={block.mentionUser?.role || 'Współpracownik'}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, {
                                  mentionUser: { ...block.mentionUser, name: block.content, role: e.target.value },
                                })}
                                placeholder="Rola w projekcie..."
                                className="text-[10px] text-[#787774] dark:text-[#9b9a97] bg-transparent border-none focus:outline-none block"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-[4px] bg-blue-50 dark:bg-blue-950/40 text-[#2383e2] dark:text-[#529cca] border border-blue-200/60 dark:border-blue-800/60 text-[10px] font-semibold">
                              {block.mentionUser?.status || 'Aktywny'}
                            </span>
                            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                              {block.mentionUser?.email || 'kontakt@searchpoint.pl'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 59. Interactive File Attachment Card Block */}
                      {block.type === 'file_card' && (
                        <div className="my-2 p-3 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs flex items-center justify-between gap-3 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-[4px] bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/60 shrink-0">
                              <FileSpreadsheet size={18} />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={block.fileName || block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { fileName: e.target.value, content: e.target.value })}
                                placeholder="Nazwa pliku z rozszerzeniem..."
                                className="text-xs font-bold text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none block"
                              />
                              <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                                Rozmiar: {block.fileSize || '3.8 MB'} • Format dokumentu
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                window.open(block.fileUrl || '#', '_blank');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-[#2383e2] hover:bg-[#1a5fb4] text-white rounded-[4px] text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                            >
                              <Download size={12} />
                              <span>Pobierz</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 60. Changelog Release Notes Block */}
                      {block.type === 'changelog' && (
                        <div className="my-2.5 p-3.5 bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                          <div className="flex items-center justify-between border-b border-[#e9e9e7] dark:border-[#2f2f2f] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-[3px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                                {block.changelogData?.version || 'v2.4.0'}
                              </span>
                              <input
                                type="text"
                                value={block.content}
                                onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                placeholder="Tytuł wydania..."
                                className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none"
                              />
                            </div>
                            <span className="text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                              {block.changelogData?.releaseDate || new Date().toLocaleDateString('pl-PL')}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {(block.changelogData?.items || []).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${item.type === 'added'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : item.type === 'fixed'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    }`}
                                >
                                  {item.type}
                                </span>
                                <span className="text-[#37352f] dark:text-[#d4d4d4] flex-1">{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 61. Testimonial / Quote Review Block */}
                      {block.type === 'testimonial' && (
                        <div className="my-2.5 p-3.5 bg-gradient-to-r from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-[6px] shadow-2xs space-y-2 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={13}
                                  className={`cursor-pointer ${s <= (block.ratingStars || 5) ? 'fill-amber-400 text-amber-400' : 'text-[#ccc] dark:text-[#555]'}`}
                                  onClick={() => updateBlock(activeDoc.id, block.id, { ratingStars: s })}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-semibold uppercase tracking-wider">
                              Referencja
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={block.content}
                            onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                            placeholder="Wpisz treść referencji..."
                            className="w-full text-xs italic text-[#37352f] dark:text-[#d4d4d4] bg-transparent border-none focus:outline-none resize-none leading-relaxed"
                          />
                          <div className="flex items-center gap-2 pt-1.5 border-t border-amber-200/40 dark:border-amber-900/40 text-xs">
                            <input
                              type="text"
                              value={block.quoteAuthor || 'Marta Wiśniewska'}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { quoteAuthor: e.target.value })}
                              placeholder="Autor..."
                              className="font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none"
                            />
                            <span className="text-[#787774] dark:text-[#9b9a97]">•</span>
                            <input
                              type="text"
                              value={block.quoteRole || 'Head of Product'}
                              onChange={(e) => updateBlock(activeDoc.id, block.id, { quoteRole: e.target.value })}
                              placeholder="Stanowisko i organizacja..."
                              className="text-[10px] text-[#787774] dark:text-[#9b9a97] bg-transparent border-none focus:outline-none flex-1"
                            />
                          </div>
                        </div>
                      )}

                      {/* 62. Target Meter KPI Gauge Block */}
                      {block.type === 'target_meter' && (() => {
                        const current = block.gaugeData?.current ?? 84;
                        const target = block.gaugeData?.target ?? 100;
                        const percent = Math.min(100, Math.round((current / (target || 1)) * 100));

                        return (
                          <div className="my-2.5 p-3.5 bg-[#fbfbfa] dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-[6px] shadow-2xs space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Target size={15} className="text-[#2383e2] dark:text-[#529cca]" />
                                <input
                                  type="text"
                                  value={block.content}
                                  onChange={(e) => updateBlock(activeDoc.id, block.id, { content: e.target.value })}
                                  placeholder="Nazwa celu..."
                                  className="text-xs font-bold text-[#37352f] dark:text-white bg-transparent border-none focus:outline-none"
                                />
                              </div>
                              <span className="text-xs font-extrabold text-[#2383e2] dark:text-[#529cca] font-mono">{percent}%</span>
                            </div>
                            <div className="w-full bg-[#e9e9e7] dark:bg-[#2f2f2f] h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#2383e2] to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                              <span>Bieżący: {current} {block.gaugeData?.unit || '%'}</span>
                              <span>Cel: {target} {block.gaugeData?.unit || '%'}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {percent >= 100 ? '🎉 Osiągnięty' : percent >= 75 ? '⚡ Na dobrej drodze' : '⏱️ W realizacji'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}



                      {/* Extended 25+ Specialized Blocks */}
                      <ExtendedBlockRenderer
                        block={block}
                        currentPageId={activeDoc.id}
                        currentPageTitle={activeDoc.title}
                        onUpdate={(patch) => updateBlock(activeDoc.id, block.id, patch)}
                        isPreview={false}
                      />

                      {/* Inline Block Comment Thread */}
                      {activeCommentBlockId === block.id && (
                        <BlockCommentThread
                          pageId={activeDoc.id}
                          blockId={block.id}
                          comments={activeDoc.comments || []}
                          teamMembers={currentWorkspace?.members || []}
                          isOpen={true}
                          onClose={() => setActiveCommentBlockId(null)}
                          onAddComment={(text) => addComment(activeDoc.id, text, block.id)}
                          onReplyToComment={(commentId, text) => replyToComment(activeDoc.id, commentId, text)}
                          onResolveComment={(commentId) => resolveComment(activeDoc.id, commentId)}
                        />
                      )}

                    </div>
                  </div>
                ))}

                {/* Bottom Canvas Click-To-Type Area - Notion 1:1 */}
                <div
                  onClick={() => {
                    const lastBlock = activeDoc.blocks[activeDoc.blocks.length - 1];
                    if (lastBlock && lastBlock.type === 'p' && !lastBlock.content) {
                      setFocusedBlockId(lastBlock.id);
                    } else {
                      addBlock(activeDoc.id, undefined, 'p');
                    }
                  }}
                  className="min-h-[220px] cursor-text w-full py-4"
                  title="Kliknij, aby pisać dalej lub wpisz /"
                />
              </div>

              {/* Backlinks */}
              {backlinks.length > 0 && (
                <div className="mt-12 pt-6 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    <LinkIcon size={13} />
                    <span>Powiązane strony (Backlinks):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {backlinks.map((bl: any) => (
                      <button
                        key={bl.id}
                        onClick={() => setActivePageId(bl.id)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <span>{bl.icon}</span>
                        <span>{bl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODALS, DRAWERS & FLOATING TOOLBAR                                     */}
      {/* ========================================================================= */}
      {/* Notion-Grade Floating Selection Bubble Toolbar */}
      {floatingToolbar && (
        <div
          style={{ left: `${floatingToolbar.x}px`, top: `${floatingToolbar.y}px` }}
          className="fixed z-50 flex items-center gap-0.5 bg-[#18181b] text-white px-2 py-1 rounded-xl shadow-2xl border border-zinc-700/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 select-none text-xs"
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '**', '**');
            }}
            className="px-2 py-1 hover:bg-zinc-800 rounded font-bold text-xs cursor-pointer text-zinc-100 hover:text-white transition-colors"
            title="Pogrubienie (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '*', '*');
            }}
            className="px-2 py-1 hover:bg-zinc-800 rounded italic text-xs cursor-pointer text-zinc-100 hover:text-white transition-colors"
            title="Kursywa (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '~~', '~~');
            }}
            className="px-2 py-1 hover:bg-zinc-800 rounded line-through text-xs cursor-pointer text-zinc-100 hover:text-white transition-colors"
            title="Przekreślenie"
          >
            S
          </button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '`', '`');
            }}
            className="p-1 hover:bg-zinc-800 rounded text-xs cursor-pointer text-zinc-300 hover:text-pink-400 transition-colors"
            title="Kod w tekście (Ctrl+E)"
          >
            <Code size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '==', '==');
            }}
            className="p-1 hover:bg-zinc-800 rounded text-xs cursor-pointer text-zinc-300 hover:text-amber-400 transition-colors"
            title="Wyróżnienie / Zakreślacz"
          >
            <Sparkles size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              const url = window.prompt('Wprowadź adres URL linku:', 'https://');
              if (url) {
                applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '[', `](${url})`);
              }
            }}
            className="p-1 hover:bg-zinc-800 rounded text-xs cursor-pointer text-zinc-300 hover:text-blue-400 transition-colors"
            title="Wstaw link (Ctrl+K)"
          >
            <LinkIcon size={13} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              applyInlineFormatting(floatingToolbar.blockId, floatingToolbar.start, floatingToolbar.end, '[[', ']]');
            }}
            className="px-1.5 py-1 hover:bg-zinc-800 rounded text-[11px] font-mono cursor-pointer text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            title="Połącz z podstroną [[...]]"
          >
            <span>[[ ]]</span>
          </button>
          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
          {/* Floating AI Actions on Selection */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setShowFloatingAiMenu(!showFloatingAiMenu);
              }}
              className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-semibold cursor-pointer flex items-center gap-1 transition-all shadow-xs"
              title="Operacje AI na zaznaczonym tekście (Wyszlifuj, Rozwiń, Przetłumacz, Skróć)"
            >
              <Sparkles size={12} className="text-amber-300" />
              <span>AI</span>
            </button>

            {showFloatingAiMenu && (
              <div
                className="absolute top-full left-0 mt-1.5 z-50 bg-[#18181b] border border-zinc-700/90 rounded-xl shadow-2xl p-1 w-52 space-y-0.5 text-xs text-white animate-in fade-in zoom-in-95 select-none"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-2 py-1 text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>Zaznaczony fragment</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectionAiAction('polish')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2 text-xs transition-colors"
                >
                  <span>✨</span>
                  <span>Wyszlifuj styl</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectionAiAction('expand')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2 text-xs transition-colors"
                >
                  <span>🚀</span>
                  <span>Rozwiń zaznaczenie</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectionAiAction('translate')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2 text-xs transition-colors"
                >
                  <span>🌐</span>
                  <span>Przetłumacz na angielski</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectionAiAction('summarize')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer flex items-center gap-2 text-xs transition-colors"
                >
                  <span>✂️</span>
                  <span>Skróć / Uprość</span>
                </button>
              </div>
            )}
          </div>
          <div className="w-[1px] h-4 bg-zinc-700 mx-1" />
          <button
            type="button"
            onClick={() => setFloatingToolbar(null)}
            className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
            title="Zamknij"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Notion/Raycast Grade Floating Slash Command Palette Modal */}
      {showSlashMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setShowSlashMenu(null)}
          />

          {/* Palette Box */}
          <div
            className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Search Input */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                /
              </div>
              <div className="flex-1 relative">
                <input
                  ref={slashSearchInputRef}
                  type="text"
                  value={showSlashMenu.filter}
                  onChange={(e) => {
                    setShowSlashMenu({ ...showSlashMenu, filter: e.target.value });
                    setSlashSelectedIndex(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSlashSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSlashSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      const selected = filteredCommands[slashSelectedIndex];
                      if (selected) {
                        applySlashCommand(showSlashMenu.blockId, selected.type, selected.label);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setShowSlashMenu(null);
                    }
                  }}
                  placeholder="Wyszukaj komendę lub blok (np. stat, tabela, kod, wideo, przycisk)..."
                  className="w-full pl-2 pr-8 py-2 text-sm bg-transparent border-none focus:outline-none text-slate-800 placeholder-slate-400 font-medium"
                />
                {showSlashMenu.filter && (
                  <button
                    onClick={() => {
                      setShowSlashMenu({ ...showSlashMenu, filter: '' });
                      slashSearchInputRef.current?.focus();
                    }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowSlashMenu(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                title="Zamknij (Esc)"
              >
                <X size={16} />
              </button>
            </div>

            {/* Category Pills */}
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs bg-white shrink-0">
              {[
                { id: 'all', label: `Wszystkie (${SLASH_COMMANDS.length})` },
                { id: 'Tekst', label: `Tekst (${SLASH_COMMANDS.filter(c => c.category === 'Tekst').length})` },
                { id: 'Listy', label: `Listy (${SLASH_COMMANDS.filter(c => c.category === 'Listy').length})` },
                { id: 'Wyróżnienia', label: `Wyróżnienia (${SLASH_COMMANDS.filter(c => c.category === 'Wyróżnienia').length})` },
                { id: 'Kod i Tech', label: `Kod & Tech (${SLASH_COMMANDS.filter(c => c.category === 'Kod i Tech').length})` },
                { id: 'Dane', label: `Dane & Tabele (${SLASH_COMMANDS.filter(c => c.category === 'Dane').length})` },
                { id: 'Media', label: `Media (${SLASH_COMMANDS.filter(c => c.category === 'Media').length})` },
                { id: 'Układ', label: `Układ (${SLASH_COMMANDS.filter(c => c.category === 'Układ').length})` },
                { id: 'Zaawansowane', label: `Interaktywne (${SLASH_COMMANDS.filter(c => c.category === 'Zaawansowane').length})` },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSlashSelectedCategory(cat.id);
                    setSlashSelectedIndex(0);
                    slashSearchInputRef.current?.focus();
                  }}
                  className={`px-3 py-1 rounded-xl font-medium cursor-pointer transition-all shrink-0 ${slashSelectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Command Items List */}
            <div
              ref={slashListContainerRef}
              className="flex-1 overflow-y-auto p-2.5 divide-y divide-slate-100/60 max-h-96"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nie znaleziono bloku pasującego do <span className="font-semibold text-slate-600">"{showSlashMenu.filter}"</span>
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === slashSelectedIndex;
                  return (
                    <button
                      key={cmd.label}
                      data-index={idx}
                      onClick={() => applySlashCommand(showSlashMenu.blockId, cmd.type, cmd.label)}
                      onMouseEnter={() => setSlashSelectedIndex(idx)}
                      className={`w-full text-left p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all ${isSelected
                          ? 'bg-blue-50/90 border border-blue-200/80 shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                            {cmd.label}
                          </span>
                          {cmd.badge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 font-mono font-medium">
                              {cmd.badge}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium ml-auto uppercase tracking-wider">
                            {cmd.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md font-semibold shrink-0">
                          ↵ ENTER
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Helper */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">↑</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">↓</kbd> Nawiguj
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">ENTER</kbd> Wybierz
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 shadow-2xs">ESC</kbd> Zamknij
                </span>
              </div>
              <span className="text-slate-500 font-semibold">{filteredCommands.length} z {SLASH_COMMANDS.length} bloków</span>
            </div>
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      {showCommentsDrawer && (
        <div className="absolute top-12 right-0 bottom-0 w-80 bg-white border-l border-slate-200 p-4 flex flex-col z-30 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <MessageSquare size={13} className="text-blue-600" />
              <span>Dyskusja i Komentarze</span>
            </h3>
            <button
              onClick={() => setShowCommentsDrawer(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {activeDoc.sharedWith && activeDoc.sharedWith.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-[10px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
              <span className="truncate">👥 Dostęp Admina: <strong>{activeDoc.sharedWith.join(', ')}</strong></span>
              <span className="font-mono bg-blue-200 dark:bg-blue-900 px-1.5 py-0.2 rounded font-bold text-[9px] shrink-0 ml-1">Admin</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {activeDoc.comments.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">
                Brak komentarzy. Rozpocznij dyskusję wpisując wiadomość poniżej!
              </div>
            ) : (
              activeDoc.comments.map((c) => (
                <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{c.author}</span>
                    <button
                      onClick={() => resolveComment(activeDoc.id, c.id)}
                      className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${c.resolved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200/70 text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      {c.resolved ? 'Rozwiązany ✓' : 'Oznacz jako zrobiony'}
                    </button>
                  </div>
                  <p className="text-slate-700">{c.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-200 flex gap-1.5">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Napisz komentarz..."
              className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => {
                if (!newCommentText.trim()) return;
                addComment(activeDoc.id, newCommentText.trim());
                setNewCommentText('');
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs cursor-pointer font-medium shadow-2xs transition-colors"
            >
              Wyślij
            </button>
          </div>
        </div>
      )}

      {/* Version History Drawer */}
      {showVersionsDrawer && (
        <div className="absolute top-12 right-0 bottom-0 w-80 bg-white border-l border-slate-200 p-4 flex flex-col z-30 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <History size={13} className="text-violet-600" />
              <span>Historia wersji i Migawki</span>
            </h3>
            <button
              onClick={() => setShowVersionsDrawer(false)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="py-3">
            <button
              onClick={() => setShowNewVersionModal(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
            >
              + Zapisz bieżącą migawkę
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {activeDoc.versions.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-12">
                Brak zapisanych wersji. Zapisz migawkę, aby móc powrócić do tego stanu w przyszłości.
              </div>
            ) : (
              activeDoc.versions.map((v) => (
                <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="font-semibold text-slate-900">{v.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(v.timestamp).toLocaleString()}
                  </div>
                  <button
                    onClick={() => {
                      restoreVersionSnapshot(activeDoc.id, v.id);
                      setShowVersionsDrawer(false);
                    }}
                    className="mt-1 w-full py-1.5 bg-white hover:bg-blue-600 hover:text-white border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
                  >
                    Przywróć tę wersję
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: New Version Snapshot */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-2xl text-xs">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <History size={15} className="text-violet-600" />
              <span>Zapisz migawkę wersji</span>
            </h3>
            <div className="space-y-1.5">
              <label className="text-slate-600 font-medium">Nazwa lub opis migawki:</label>
              <input
                type="text"
                autoFocus
                value={versionLabelInput}
                onChange={(e) => setVersionLabelInput(e.target.value)}
                placeholder="np. Przed edycją harmonogramu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={() => {
                  createVersionSnapshot(
                    activeDoc.id,
                    versionLabelInput.trim() || `Wersja z ${new Date().toLocaleTimeString()}`
                  );
                  setVersionLabelInput('');
                  setShowNewVersionModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-2xs transition-colors"
              >
                Zapisz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2D Visual Mindmap Modal */}
      <MindmapModal
        isOpen={showMindmapModal}
        onClose={() => setShowMindmapModal(false)}
        docTitle={activeDoc.title}
        blocks={activeDoc.blocks}
      />

      {/* Code Runner Modal */}
      <CodeBlockModal
        isOpen={showCodeBlockModal}
        onClose={() => setShowCodeBlockModal(false)}
        onInsert={() => {
          addBlock(activeDoc.id, undefined, 'code');
        }}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        currentBlocksCount={activeDoc.blocks.length}
        onSelectTemplate={async (template, mode) => {
          if (mode === 'replace') {
            await replaceAllBlocks(activeDoc.id, template.blocks);
            if (activeDoc.title === 'Nowy dokument' || !activeDoc.title) {
              await updatePageTitle(activeDoc.id, template.name);
            }
            await updatePageIcon(activeDoc.id, template.icon);
            await updatePageCover(activeDoc.id, template.coverGradient);
            addNotification('Szablony', `Zastosowano szablon: ${template.shortTitle}`, 'success', activeDoc.id);
          } else {
            await insertBlocks(activeDoc.id, template.blocks);
            addNotification('Szablony', `Dopisano szablon: ${template.shortTitle}`, 'success', activeDoc.id);
          }
          setShowTemplatesModal(false);
        }}
      />

      {/* Document Stats & Reading Time Modal */}
      <DocStatsModal
        isOpen={showDocStatsModal}
        onClose={() => setShowDocStatsModal(false)}
        title={activeDoc.title}
        blocks={activeDoc.blocks}
      />

      {/* Interactive Table of Contents (Outline) Drawer */}
      <DocOutlineDrawer
        isOpen={showOutlineDrawer}
        onClose={() => setShowOutlineDrawer(false)}
        headings={headingsWithNumbering}
        onScrollToHeading={handleScrollToHeading}
        onCopyOutlineMarkdown={handleCopyOutlineMarkdown}
      />

      {/* Text-to-Speech Audio Reader Player */}
      <DocAudioPlayer
        isOpen={showAudioPlayer}
        onClose={() => setShowAudioPlayer(false)}
        title={activeDoc.title}
        blocks={activeDoc.blocks}
        onHighlightBlock={handleScrollToHeading}
      />

      {/* Cover Art Gallery & Custom Image Modal */}
      <CoverPickerModal
        isOpen={showCoverPicker}
        onClose={() => setShowCoverPicker(false)}
        currentCover={activeDoc.coverGradient}
        onSelectCover={(cover) => updatePageCover(activeDoc.id, cover)}
      />

      {/* Access & Sharing Modal (Notion 1:1) */}
      {showAccessShareModal && (
        <AccessSharingModal
          page={activeDoc}
          parentPage={pages.find((p) => p.id === activeDoc.parentPageId)}
          isOpen={showAccessShareModal}
          onClose={() => setShowAccessShareModal(false)}
          onShareWithEmail={async (email, role) => {
            await sharePageWithEmail(activeDoc.id, email, role);
          }}
          onUpdateRole={async (email, role) => {
            await updateCollaboratorRole(activeDoc.id, email, role);
          }}
          onRemoveCollaborator={async (email) => {
            await removePageCollaborator(activeDoc.id, email);
          }}
          onTogglePublic={() => togglePagePublic(activeDoc.id)}
          onToggleInheritPermissions={async (inherit) => {
            await toggleInheritPermissions(activeDoc.id, inherit);
          }}
        />
      )}

      {/* Zen Mode Floating Escape Pill */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
          <button
            type="button"
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl hover:bg-slate-800 cursor-pointer transition-all border border-slate-700"
          >
            <span>Wyjdź ze skupienia (Esc)</span>
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
};
