/**
 * Wspólne typy silnika dokumentów AI (Document Engine).
 *
 * Silnik działa w etapach: Understand → Plan → Research → Compose → Structure →
 * Validate → Save → Verify. Każdy etap ma własny, jawny typ danych, dzięki czemu
 * planowanie, generowanie i zapis są od siebie niezależne i testowalne.
 */

import type { BlockType, DocBlock, PageType, WorkspacePage } from '../../../types/workspace';

// ---------------------------------------------------------------------------
// 1. INTENCJE
// ---------------------------------------------------------------------------

export type EngineIntentKind =
  | 'create_note'            // „daj mi notatkę o fotosyntezie" → jedna notatka
  | 'create_knowledge_base'  // „kompletna notatka o AI", „zrób 10 podstron" → folder + strona główna + podstrony
  | 'research_note'          // „znajdź informacje i przygotuj notatkę"
  | 'research_replace'       // „wyszukaj i podmień tę notatkę"
  | 'improve_content'        // „ulepsz tę notatkę"
  | 'improve_design'         // „ulepsz design"
  | 'expand'                 // „rozwiń temat"
  | 'shorten'                // „skróć"
  | 'redo_better'            // „zrób to lepiej"
  | 'add_subpage'            // „dodaj podstronę o X"
  | 'delete_page'            // „usuń notatkę X"
  | 'move_page'              // „przenieś X do folderu Y"
  | 'organize'               // „uporządkuj notatki"
  | 'summarize'              // „streszcz"
  | 'none';                  // zwykła rozmowa – obsługuje ją dotychczasowy silnik czatu

export type NoteLength = 'short' | 'standard' | 'long';

export interface IntentModifiers {
  length?: NoteLength;
  /** true = użytkownik chce podstron, false = wyraźnie nie chce, undefined = silnik zdecyduje. */
  wantsSubpages?: boolean;
  pageCountHint?: number;
  wantsSources?: boolean;
  includeMedia?: boolean;
  /** Fraza identyfikująca stronę docelową („notatka o psach", „tę notatkę"). */
  targetPageQuery?: string;
  folderQuery?: string;
  /** Styl wybrany słowami („akademicki", „minimalistyczny"). */
  styleHint?: StyleHint;
  /** Użytkownik prosi o zastąpienie istniejącej treści. */
  replaceExisting?: boolean;
  /** „Zrób to lepiej" – kierunek poprawy odczytany z kontekstu. */
  improveFocus?: 'design' | 'content' | 'both';
}

export type StyleHint =
  | 'academic'
  | 'minimal'
  | 'visual'
  | 'technical'
  | 'school'
  | 'business'
  | 'creative';

export interface EngineIntent {
  kind: EngineIntentKind;
  topic: string;
  confidence: number;
  modifiers: IntentModifiers;
  /** Krótkie uzasadnienie klasyfikacji – do logów i testów, nie do czatu. */
  reasons: string[];
  /** Czy do wykonania potrzebny jest otwarty dokument. */
  needsDocument: boolean;
}

/** Kontekst rozmowy i aplikacji przekazywany do routera intencji. */
export interface EngineContext {
  activePage?: WorkspacePage | null;
  pages: WorkspacePage[];
  /** Ostatnia akcja silnika w tej rozmowie – potrzebna do „zrób to lepiej". */
  lastAction?: LastEngineAction | null;
  /** Ostatni temat rozmowy – dla „rozwiń", „zrób to lepiej". */
  lastTopic?: string;
}

export interface LastEngineAction {
  kind: EngineIntentKind;
  pageIds: string[];
  topic: string;
  at: number;
}

// ---------------------------------------------------------------------------
// 2. MATERIAŁ (wynik researchu lub analizy istniejącego dokumentu)
// ---------------------------------------------------------------------------

export type SectionTheme =
  | 'overview'        // definicja, czym jest
  | 'history'         // historia, geneza, oś czasu
  | 'how_it_works'    // mechanizm, zasada działania
  | 'types'           // rodzaje, klasyfikacja
  | 'techniques'      // metody, techniki, narzędzia
  | 'applications'    // zastosowania, przykłady z życia
  | 'risks'           // ryzyka, krytyka, ograniczenia, etyka
  | 'people'          // osoby, twórcy
  | 'future'          // przyszłość, trendy
  | 'trivia'          // ciekawostki
  | 'see_also'        // zobacz też, powiązane
  | 'references'      // bibliografia, przypisy
  | 'other';

export interface MaterialSection {
  id: string;
  title: string;
  level: number;
  text: string;
  paragraphs: string[];
  theme: SectionTheme;
  keywords: string[];
}

export interface MaterialImage {
  url: string;
  title: string;
  caption?: string;
  credit?: string;
  license?: string;
  /** Strona opisu pliku (Commons), jeśli znana. */
  descriptionUrl?: string;
}

export interface MaterialSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  publisher?: string;
  year?: string;
  snippet: string;
  confidence: number;
}

export type ClaimStatus = 'confirmed' | 'single_source' | 'uncertain';

export interface ClaimCheck {
  claim: string;
  status: ClaimStatus;
  /** ID źródeł, w których znaleziono pokrycie twierdzenia. */
  sourceIds: string[];
}

export interface ProviderStatus {
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface ResearchMaterial {
  topic: string;
  resolvedTitle: string;
  summary: string;
  sections: MaterialSection[];
  images: MaterialImage[];
  sources: MaterialSource[];
  claims: ClaimCheck[];
  providers: ProviderStatus[];
  origin: 'network' | 'document' | 'fixture';
  fetchedAt: number;
  /** Adres artykułu źródłowego, z którego pochodzi większość treści. */
  primaryUrl?: string;
}

// ---------------------------------------------------------------------------
// 3. PLAN DOKUMENTU
// ---------------------------------------------------------------------------

export type TopicArchetype =
  | 'concept_science'
  | 'technology'
  | 'history_event'
  | 'biology_nature'
  | 'business_market'
  | 'comparison'
  | 'how_to'
  | 'person_place'
  | 'health_medicine'
  | 'general';

export type Audience = 'student' | 'professional' | 'general' | 'developer' | 'researcher';
export type DetailLevel = 'brief' | 'standard' | 'thorough';

/** Rola semantyczna sekcji – decyduje o tym, jakie bloki zostaną użyte. */
export type SectionRole =
  | 'intro'
  | 'definition'
  | 'mechanism'
  | 'classification'
  | 'timeline'
  | 'applications'
  | 'comparison'
  | 'risks'
  | 'techniques'
  | 'people'
  | 'facts'
  | 'media'
  | 'future'
  | 'review'
  | 'sources'
  | 'generic';

export interface SectionPlan {
  id: string;
  role: SectionRole;
  title: string;
  icon: string;
  /** Odwołania do sekcji materiału, z których powstaje ta sekcja. */
  materialSectionIds: string[];
  /** Typy bloków, które planista uznał za sensowne dla tej sekcji. */
  preferredBlocks: BlockType[];
  /** Uzasadnienie wyboru – bloki muszą mieć konkretny cel. */
  rationale: string;
  /** Strona, na której ląduje sekcja (indeks w plan.pages). */
  pageIndex: number;
}

export interface PagePlan {
  id: string;
  title: string;
  icon: string;
  kind: 'hub' | 'content' | 'sources' | 'single';
  summary: string;
  sectionIds: string[];
}

export interface DocumentPlan {
  topic: string;
  title: string;
  archetype: TopicArchetype;
  audience: Audience;
  detail: DetailLevel;
  styleHint: StyleHint;
  multiPage: boolean;
  pages: PagePlan[];
  sections: SectionPlan[];
  includeMedia: boolean;
  includeReview: boolean;
  /** Powody wyboru struktury (dla testów/diagnostyki). */
  decisions: string[];
  seed: number;
}

// ---------------------------------------------------------------------------
// 4. PROJEKT STRON (przed zapisem)
// ---------------------------------------------------------------------------

export interface PageDraft {
  /** Tymczasowe ID szkicu, używane przez relacje (parent, linki). */
  draftId: string;
  title: string;
  icon: string;
  pageType: PageType;
  coverGradient?: string;
  parentDraftId?: string;
  blocks: DocBlock[];
  tags: string[];
}

export interface KnowledgeBaseDraft {
  folderName?: string;
  folderIcon?: string;
  pages: PageDraft[];
  hubDraftId: string;
}

// ---------------------------------------------------------------------------
// 5. WALIDACJA
// ---------------------------------------------------------------------------

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: IssueSeverity;
  blockId?: string;
  blockType?: BlockType;
  code: string;
  message: string;
  repaired?: boolean;
}

export interface ValidationReport {
  ok: boolean;
  issues: ValidationIssue[];
  blocks: DocBlock[];
  repairedCount: number;
  droppedCount: number;
}

// ---------------------------------------------------------------------------
// 6. WYKONANIE / OPERACJE NA WORKSPACE
// ---------------------------------------------------------------------------

/**
 * Minimalny interfejs operacji na workspace, którego potrzebuje silnik.
 * WorkspaceContext spełnia go w aplikacji, a testy podstawiają implementację w pamięci.
 */
export interface WorkspaceOps {
  getPages: () => WorkspacePage[];
  createPage: (
    folderId: string | undefined,
    title: string,
    blocks: DocBlock[],
    pageType: PageType,
    icon?: string
  ) => Promise<string>;
  setParentPage: (pageId: string, parentPageId?: string) => Promise<void>;
  replaceAllBlocks: (pageId: string, blocks: DocBlock[]) => Promise<void>;
  updatePageTitle?: (pageId: string, title: string) => Promise<void>;
  updatePageIcon?: (pageId: string, icon: string) => Promise<void>;
  updatePageCover?: (pageId: string, coverGradient?: string) => Promise<void>;
  addPageTag?: (pageId: string, tag: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  createFolder: (name: string, parentId?: string, icon?: string) => Promise<string>;
  movePageToFolder: (pageId: string, folderId?: string) => Promise<void>;
  createVersionSnapshot?: (pageId: string, label?: string) => Promise<void> | void;
}

export type EngineStage =
  | 'understand'
  | 'plan'
  | 'research'
  | 'compose'
  | 'structure'
  | 'enrich'
  | 'validate'
  | 'save'
  | 'verify';

export interface ProgressEvent {
  stage: EngineStage;
  label: string;
  /** 0–100. */
  percent: number;
  detail?: string;
}

export type ProgressHandler = (event: ProgressEvent) => void;

export interface CreatedPageRef {
  id: string;
  title: string;
  draftId?: string;
}

export interface EngineResult {
  ok: boolean;
  intent: EngineIntent;
  /** Krótka wiadomość do czatu (1–4 linie). */
  message: string;
  /** Strona, którą należy otworzyć w edytorze. */
  openPageId?: string;
  createdPages: CreatedPageRef[];
  updatedPageIds: string[];
  deletedPageIds: string[];
  folderId?: string;
  warnings: string[];
  /** Liczba bloków zapisanych/zmodyfikowanych. */
  blocksWritten: number;
  /** Zestawienie typów bloków użytych w wyniku. */
  blockTypeUsage: Record<string, number>;
  errors: string[];
  durationMs: number;
  /** Zapis do pamięci rozmowy („zrób to lepiej"). */
  lastAction?: LastEngineAction;
}

export interface RetryPolicy {
  attempts: number;
  baseDelayMs: number;
}
