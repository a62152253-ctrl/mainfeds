/**
 * Walidacja i automatyczna naprawa dokumentu przed zapisem.
 *
 * Walidator nie tylko raportuje błędy: tam, gdzie to możliwe, naprawia je (zamiana typu
 * bez renderera na zamiennik, wyrównanie tabeli, korekta zakresów, odrzucenie
 * niebezpiecznych adresów). Blok, którego nie da się uratować, jest usuwany i zliczany –
 * dzięki temu do bazy nie trafia nic, czego edytor nie potrafi wyświetlić.
 */

import type { BlockType, DocBlock } from '../../../types/workspace';
import { getBlockSpec, isSafeUrl, resolveRenderableType, validateBlockShape } from './blockCatalog';
import type { ValidationIssue, ValidationReport } from './types';
import { chunkParagraph } from './textAnalysis';
import { isSafeImage, isNsfwImage } from '../../../utils/contentFilter';

const URL_FIELDS: Array<keyof DocBlock> = ['imageUrl', 'videoUrl', 'audioUrl', 'bookmarkUrl', 'buttonUrl', 'fileUrl', 'embedUrl'];

type Mutable = Record<string, unknown>;

/** Mapuje dane typu bez renderera na pola typu zastępczego. */
function convertToFallback(block: DocBlock, issues: ValidationIssue[]): DocBlock {
  const target = resolveRenderableType(block.type);
  if (target === block.type) return block;
  const next: DocBlock = { ...block, type: target };
  switch (block.type) {
    case 'stepper': {
      const steps = block.stepperData?.steps || [];
      if (steps.length > 0) {
        next.content = steps.map((s, i) => `${i + 1}. ${s.label}${s.desc ? ` — ${s.desc}` : ''}`).join('\n');
        next.type = 'p';
      }
      break;
    }
    case 'persona_card': {
      const p = block.personaData;
      next.content = p?.name || block.content || 'Persona';
      next.toggleDetails = p ? `${p.role}. „${p.quote}". Cele: ${p.goals.join(', ')}. Bolączki: ${p.painPoints.join(', ')}.` : block.toggleDetails || '';
      break;
    }
    case 'user_story': {
      const u = block.userStoryData;
      next.content = u ? `Jako ${u.role}` : block.content || 'User story';
      next.toggleDetails = u ? `Chcę ${u.action}, aby ${u.benefit}. Kryteria: ${u.acceptanceCriteria.join('; ')}.` : block.toggleDetails || '';
      break;
    }
    case 'team_directory': {
      const members = block.teamMembers || [];
      next.content = members.map((m) => `${m.name} — ${m.role}`).join('\n') || block.content;
      break;
    }
    case 'release_notes':
      next.content = block.content || 'Notatki wydania';
      next.changelogData = block.changelogData || { version: '—', releaseDate: '—', items: [{ type: 'changed', text: block.content || '—' }] };
      break;
    case 'data_metric_bar':
      next.progressPercent = typeof block.progressPercent === 'number' ? block.progressPercent : 0;
      break;
    case 'pros_cons_matrix':
      next.toggleDetails = block.toggleDetails || '';
      break;
    default:
      break;
  }
  issues.push({
    severity: 'warning',
    code: 'fallback_applied',
    message: `Typ „${block.type}" nie ma renderera – zamieniono na „${next.type}".`,
    blockId: block.id,
    blockType: block.type,
    repaired: true,
  });
  return next;
}

function repairBlock(input: DocBlock, issues: ValidationIssue[]): DocBlock | null {
  let block: DocBlock = { ...input };
  const note = (code: string, message: string, severity: ValidationIssue['severity'] = 'info') =>
    issues.push({ severity, code, message, blockId: block.id, blockType: block.type, repaired: true });

  if (!getBlockSpec(block.type)) {
    note('unknown_type', `Nieznany typ „${String(block.type)}" zamieniono na akapit.`, 'warning');
    block = { ...block, type: 'p' as BlockType };
  }
  block = convertToFallback(block, issues);
  if (typeof block.content !== 'string') block.content = block.content == null ? '' : String(block.content);

  // Adresy URL: niebezpieczne pola są czyszczone; blok zależny od adresu może zostać odrzucony.
  for (const field of URL_FIELDS) {
    const raw = (block as unknown as Mutable)[field as string];
    if (typeof raw === 'string' && raw.trim()) {
      const allowInternal = field === 'buttonUrl' || field === 'bookmarkUrl';
      if (!isSafeUrl(raw, allowInternal)) {
        (block as unknown as Mutable)[field as string] = '';
        note('bad_url', `Usunięto niepoprawny adres w polu ${String(field)}.`, 'warning');
      } else {
        (block as unknown as Mutable)[field as string] = raw.trim();
      }
    }
  }

  switch (block.type) {
    case 'table': {
      const rows = (block.tableData || []).map((r) => r.map((c) => String(c ?? '')));
      if (rows.length === 0) return null;
      const width = Math.max(...rows.map((r) => r.length));
      if (width < 2) {
        // Jednokolumnowa „tabela" to w praktyce lista.
        note('table_to_list', 'Tabela z jedną kolumną zamieniona na listę.', 'warning');
        return { ...block, type: 'bullet', content: rows.map((r) => r[0]).join('\n'), tableData: undefined };
      }
      if (rows.some((r) => r.length !== width)) {
        note('table_ragged', 'Wyrównano liczbę kolumn w tabeli.');
      }
      block.tableData = rows.map((r) => (r.length < width ? [...r, ...Array(width - r.length).fill('—')] : r));
      break;
    }
    case 'stat_grid': {
      const labels = (block.content || '').split('|').map((s) => s.trim());
      const values = (block.statValue || '').split('|').map((s) => s.trim());
      const trends = (block.statTrend || '').split('|').map((s) => s.trim());
      const n = Math.min(labels.length, values.length);
      if (n === 0 || !values[0]) return null;
      if (labels.length !== values.length) note('stat_grid_mismatch', 'Wyrównano liczbę etykiet i wartości w siatce statystyk.');
      block.content = labels.slice(0, n).join(' | ');
      block.statValue = values.slice(0, n).join(' | ');
      block.statTrend = Array.from({ length: n }, (_, i) => trends[i] || '—').join(' | ');
      break;
    }
    case 'stat':
      if (!block.statValue) return null;
      break;
    case 'tabs': {
      const titles = (block.content || '').split('|').map((s) => s.trim()).filter(Boolean);
      const bodies = (block.toggleDetails || '').split('|').map((s) => s.trim());
      const n = Math.min(titles.length, bodies.length);
      if (n < 2) {
        note('tabs_degenerate', 'Zakładki z jednym wariantem zamieniono na kartę.', 'warning');
        return { ...block, type: 'card', content: titles[0] || 'Treść', toggleDetails: bodies[0] || '', activeTabIndex: undefined };
      }
      block.content = titles.slice(0, n).join(' | ');
      block.toggleDetails = bodies.slice(0, n).join(' | ');
      block.activeTabIndex = Math.min(block.activeTabIndex || 0, n - 1);
      break;
    }
    case 'progress': {
      const pct = typeof block.progressPercent === 'number' ? block.progressPercent : 0;
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      if (clamped !== pct) note('progress_range', 'Skorygowano zakres postępu do 0–100.');
      block.progressPercent = clamped;
      break;
    }
    case 'rating': {
      const stars = typeof block.ratingStars === 'number' ? block.ratingStars : 3;
      const clamped = Math.max(1, Math.min(5, Math.round(stars)));
      if (clamped !== stars) note('rating_range', 'Skorygowano zakres oceny do 1–5.');
      block.ratingStars = clamped;
      break;
    }
    case 'mermaid': {
      const syntax = (block.diagramSyntax || '').trim();
      if (!syntax) return null;
      if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|mindmap|gantt|pie|timeline)/m.test(syntax)) {
        block.diagramSyntax = `graph TD\n${syntax}`;
        note('mermaid_prefix', 'Dodano nagłówek typu diagramu.');
      }
      break;
    }
    case 'faq': {
      const items = (block.faqItems || []).filter((f) => f.question?.trim() && f.answer?.trim());
      if (items.length === 0) return null;
      block.faqItems = items;
      break;
    }
    case 'pros_cons': {
      const fix = (text: string | undefined, sign: '+' | '-') =>
        (text || '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => (l.startsWith(sign) ? l : `${sign} ${l.replace(/^[+-]\s*/, '')}`))
          .join('\n');
      const pros = fix(block.content, '+');
      const cons = fix(block.toggleDetails, '-');
      if (!pros && !cons) return null;
      block.content = pros;
      block.toggleDetails = cons;
      break;
    }
    case 'timeline':
      if (!block.timelineDate) {
        note('timeline_no_date', 'Oś czasu bez daty zamieniona na akapit.', 'warning');
        return { ...block, type: 'p' };
      }
      break;
    case 'code':
      if (!block.language) block.language = 'plaintext';
      if (!block.content.trim()) return null;
      break;
    case 'bookmark':
      if (!block.bookmarkUrl) {
        if (!block.content.trim()) return null;
        note('bookmark_no_url', 'Zakładka bez adresu zamieniona na akapit.', 'warning');
        return { ...block, type: 'p' };
      }
      if (!block.bookmarkTitle) block.bookmarkTitle = block.content || block.bookmarkUrl;
      break;
    case 'image':
      if (!block.imageUrl || !isSafeImage(block.imageUrl, block.content, block.imageCaption)) {
        note('image_nsfw_or_missing', 'Obraz odrzucony ze względów bezpieczeństwa (NSFW/brak URL).', 'warning');
        return null;
      }
      break;
    case 'video':
      if (!block.videoUrl) return null;
      break;
    case 'button':
      if (!block.buttonUrl) {
        if (!block.content.trim()) return null;
        return { ...block, type: 'p' };
      }
      break;
    case 'embed':
    case 'map':
      if (!block.embedUrl) return null;
      break;
    case 'toggle':
    case 'numbered_toggle':
    case 'card':
    case 'columns_2':
      if (!block.content.trim() && !(block.toggleDetails || '').trim()) return null;
      if (!block.toggleDetails) block.toggleDetails = '';
      break;
    case 'swot_analysis': {
      const d = block.swotData;
      if (!d || ![d.strengths, d.weaknesses, d.opportunities, d.threats].some((a) => Array.isArray(a) && a.length > 0)) return null;
      block.swotData = {
        strengths: d.strengths || [],
        weaknesses: d.weaknesses || [],
        opportunities: d.opportunities || [],
        threats: d.threats || [],
      };
      break;
    }
    case 'risk_register':
      if (!block.riskRegisterData || block.riskRegisterData.length === 0) return null;
      break;
    case 'milestone_roadmap':
      if (!block.roadmapData || block.roadmapData.length === 0) return null;
      break;
    case 'spec_table':
      if (!block.specTableData || block.specTableData.length === 0) return null;
      break;
    case 'decision_matrix': {
      const d = block.decisionMatrixData;
      if (!d || d.options.length === 0 || d.criteria.length === 0) return null;
      block.decisionMatrixData = {
        criteria: d.criteria,
        options: d.options.map((o) => ({ ...o, scores: d.criteria.map((_, i) => o.scores[i] ?? 0), totalScore: d.criteria.reduce((s, _, i) => s + (o.scores[i] ?? 0), 0) })),
      };
      break;
    }
    case 'citation_source':
      if (!block.citationData?.title) return null;
      break;
    default:
      break;
  }

  // Bloki tekstowe: pusta treść = zbędny blok.
  const textual: BlockType[] = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'lead', 'subtext', 'quote', 'bullet', 'number', 'todo', 'callout', 'callout_info', 'callout_success', 'callout_warning', 'callout_danger', 'callout_tip', 'key_takeaway', 'summary_box', 'math', 'terminal', 'json', 'sql', 'diff'];
  if (textual.includes(block.type) && !block.content.trim()) return null;

  return block;
}

export interface ValidateOptions {
  /** Dziel akapity dłuższe niż limit na kilka bloków (zwalcza „ściany tekstu"). */
  splitLongParagraphs?: boolean;
  maxParagraphChars?: number;
  /** Usuń powtórzone sąsiednie separatory i puste odstępy. */
  collapseDividers?: boolean;
}

/** Waliduje, naprawia i normalizuje listę bloków. Wynik zawiera tylko renderowalne bloki. */
export function validateAndRepairBlocks(blocks: DocBlock[], options: ValidateOptions = {}): ValidationReport {
  const { splitLongParagraphs = true, maxParagraphChars = 520, collapseDividers = true } = options;
  const issues: ValidationIssue[] = [];
  const out: DocBlock[] = [];
  let repaired = 0;
  let dropped = 0;
  const usedIds = new Set<string>();

  for (const original of blocks || []) {
    if (!original || typeof original !== 'object') {
      dropped += 1;
      issues.push({ severity: 'error', code: 'not_object', message: 'Pominięto wpis, który nie jest blokiem.' });
      continue;
    }
    const before = issues.length;
    const fixed = repairBlock(original, issues);
    if (!fixed) {
      dropped += 1;
      issues.push({ severity: 'warning', code: 'dropped', message: `Usunięto niepoprawny blok „${original.type}".`, blockId: original.id, blockType: original.type });
      continue;
    }
    if (issues.length > before) repaired += 1;

    const shape = validateBlockShape(fixed).filter((i) => i.severity === 'error' && i.code !== 'no_renderer');
    if (shape.length > 0) {
      issues.push(...shape);
      dropped += 1;
      continue;
    }

    if (splitLongParagraphs && fixed.type === 'p' && fixed.content.length > maxParagraphChars) {
      const parts = chunkParagraph(fixed.content, Math.round(maxParagraphChars * 0.8));
      if (parts.length > 1) {
        parts.forEach((part, i) => {
          out.push({ ...fixed, id: i === 0 ? fixed.id : `${fixed.id}-s${i}`, content: part });
        });
        issues.push({ severity: 'info', code: 'split_paragraph', message: 'Podzielono długi akapit.', blockId: fixed.id, blockType: 'p', repaired: true });
        continue;
      }
    }
    out.push(fixed);
  }

  const cleaned: DocBlock[] = [];
  for (const b of out) {
    if (collapseDividers && (b.type === 'divider' || b.type === 'spacer')) {
      const prev = cleaned[cleaned.length - 1];
      if (!prev || prev.type === 'divider' || prev.type === 'spacer') continue;
    }
    let id = b.id || `blk-${cleaned.length}`;
    let n = 1;
    while (usedIds.has(id)) id = `${b.id || 'blk'}-${n++}`;
    usedIds.add(id);
    cleaned.push({ ...b, id, order: cleaned.length });
  }
  while (cleaned.length && (cleaned[cleaned.length - 1].type === 'divider' || cleaned[cleaned.length - 1].type === 'spacer')) cleaned.pop();

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    issues,
    blocks: cleaned,
    repairedCount: repaired,
    droppedCount: dropped,
  };
}

/**
 * Zgodny alias dla silnika dokumentów: zwraca report oraz bezpośrednio naprawione bloki
 */
export function validateAndRepairDocument(blocks: DocBlock[], options: ValidateOptions = {}): { report: ValidationReport; repairedBlocks: DocBlock[] } {
  const report = validateAndRepairBlocks(blocks, options);
  return { report, repairedBlocks: report.blocks };
}


/** Szybka kontrola jakości końcowego dokumentu (kompletność, struktura, powtórzenia). */
export interface DocumentQuality {
  score: number;
  headings: number;
  distinctBlockTypes: number;
  words: number;
  hasIntro: boolean;
  hasSources: boolean;
  longestRun: number;
  notes: string[];
}

export function assessDocumentQuality(blocks: DocBlock[]): DocumentQuality {
  const notes: string[] = [];
  const headings = blocks.filter((b) => /^h[1-6]$/.test(b.type)).length;
  const types = new Set(blocks.map((b) => b.type));
  const words = blocks.reduce((s, b) => s + (b.content || '').split(/\s+/).filter(Boolean).length, 0);
  let run = 0;
  let longestRun = 0;
  for (const b of blocks) {
    if (b.type === 'p') {
      run += 1;
      longestRun = Math.max(longestRun, run);
    } else run = 0;
  }
  const hasIntro = blocks.slice(0, 5).some((b) => b.type === 'lead' || b.type === 'summary_box' || b.type === 'key_takeaway' || b.type === 'callout_info');
  const hasSources = blocks.some((b) => b.type === 'bookmark' || b.type === 'citation_source');
  let score = 40;
  if (headings >= 3) score += 15;
  if (types.size >= 6) score += 15;
  else if (types.size >= 4) score += 8;
  if (hasIntro) score += 10;
  if (hasSources) score += 8;
  if (longestRun <= 3) score += 8;
  else notes.push(`Ciąg ${longestRun} akapitów bez elementu wizualnego.`);
  if (words < 80) {
    score -= 15;
    notes.push('Dokument jest bardzo krótki.');
  }
  if (headings === 0 && words > 120) {
    score -= 15;
    notes.push('Brak nagłówków w dłuższym dokumencie.');
  }
  return { score: Math.max(0, Math.min(100, score)), headings, distinctBlockTypes: types.size, words, hasIntro, hasSources, longestRun, notes };
}
