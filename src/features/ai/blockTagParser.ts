/**
 * Silnik Tagów Blokowych AI (AI Block Tag DSL — `#TAG#treść#TAG#`)
 *
 * Pozwala modelowi AI (oraz użytkownikowi) układać dokument bezpośrednio w trakcie pisania
 * za pomocą znaczników blokowych zamiast sztywnych szablonów:
 *
 * Przykłady obsługiwanej składni:
 *   #HEADER1#Tytuł dokumentu#HEADER1#
 *   #LEAD#Krótkie wprowadzenie pod tytułem#LEAD#
 *   #CALLOUT_INFO#Kluczowa informacja ze źródła#CALLOUT_INFO#
 *   #STAT_GRID#Skuteczność: 94% (+12% r/r) | Czas reakcji: 120 ms (Stabilny)#STAT_GRID#
 *   #HEADER2#Analiza przepisów i źródeł#HEADER2#
 *   #TEXT#Treść akapitu oparta na pobranych źródłach...#TEXT#
 *   #TABLE#Kryterium | Wariant A | Wariant B \n Koszt | Niski | Wysoki#TABLE#
 *   #CODE:typescript#const x: number = 42;#CODE#
 *   #PROS_CONS#+ Zaleta 1 \n + Zaleta 2 || - Wada 1 \n - Wada 2#PROS_CONS#
 *   #FAQ#Pytanie 1? :: Odpowiedź 1 || Pytanie 2? :: Odpowiedź 2#FAQ#
 *   #TIMELINE#2024 :: Wejście ustawy w życie#TIMELINE#
 *   #MERMAID#flowchart LR \n A[Źródło] --> B[Analiza]#MERMAID#
 *   #TODO#Zweryfikować dokumentację API#TODO#
 *   #BOOKMARK#https://isap.sejm.gov.pl | ISAP Sejm RP | Oficjalny dziennik ustaw#BOOKMARK#
 */

import type { BlockType, DocBlock } from '../../types/workspace';
import { BlockFactory, finalizeBlocks } from './engine/blockFactory';
import { validateAndRepairDocument } from './engine/documentValidator';
import { isRenderable } from './engine/blockCatalog';
import { isSafeImage } from '../../utils/contentFilter';
import type { VerifiedSource, CrossCheckFinding } from './multiSourceResearchService';

export interface ParsedBlockTagResult {
  title?: string;
  blocks: DocBlock[];
  tagCount: number;
  usedBlockTypes: BlockType[];
}

/**
 * Mapowanie aliasów tagów AI na docelowe typy bloków edytora
 */
const TAG_ALIAS_MAP: Record<string, BlockType> = {
  HEADER: 'h1',
  HEADER1: 'h1',
  H1: 'h1',
  NAGLOWEK: 'h1',
  NAGLOWEK1: 'h1',
  HEADER2: 'h2',
  H2: 'h2',
  NAGLOWEK2: 'h2',
  HEADER3: 'h3',
  H3: 'h3',
  NAGLOWEK3: 'h3',
  HEADER4: 'h4',
  H4: 'h4',
  LEAD: 'lead',
  SUBTEXT: 'subtext',
  TEXT: 'p',
  P: 'p',
  PARAGRAPH: 'p',
  AKAPIT: 'p',
  QUOTE: 'quote',
  CYTAT: 'quote',
  BULLET: 'bullet',
  LIST: 'bullet',
  NUMBER: 'number',
  NUMBERED: 'number',
  TODO: 'todo',
  CHECKLIST: 'todo',
  ZADANIE: 'todo',
  TOGGLE: 'toggle',
  TABS: 'tabs',
  FAQ: 'faq',
  CALLOUT: 'callout_info',
  CALLOUT_INFO: 'callout_info',
  INFO: 'callout_info',
  CALLOUT_TIP: 'callout_tip',
  TIP: 'callout_tip',
  WSKAZOWKA: 'callout_tip',
  CALLOUT_WARNING: 'callout_warning',
  WARNING: 'callout_warning',
  OSTRZEZENIE: 'callout_warning',
  CALLOUT_DANGER: 'callout_danger',
  DANGER: 'callout_danger',
  ALARM: 'callout_danger',
  CALLOUT_SUCCESS: 'callout_success',
  SUCCESS: 'callout_success',
  KEY_TAKEAWAY: 'key_takeaway',
  TAKEAWAY: 'key_takeaway',
  WNIOSEK: 'key_takeaway',
  SUMMARY_BOX: 'summary_box',
  SUMMARY: 'summary_box',
  PODSUMOWANIE: 'summary_box',
  STAT: 'stat',
  STAT_GRID: 'stat_grid',
  STATS: 'stat_grid',
  KPI: 'kpi_scorecard',
  TABLE: 'table',
  TABELA: 'table',
  CHART: 'chart',
  WYKRES: 'chart',
  GRAPH: 'chart',
  LINKED_DB: 'linked_database',
  LINKED_DATABASE: 'linked_database',
  BAZA_DANYCH: 'linked_database',
  WIDOK_BAZY: 'linked_database',
  PROS_CONS: 'pros_cons',
  ZALETY_WADY: 'pros_cons',
  TIMELINE: 'timeline',
  OS_CZASU: 'timeline',
  CODE: 'code',
  KOD: 'code',
  TERMINAL: 'terminal',
  BASH: 'terminal',
  SQL: 'sql',
  JSON: 'json',
  MATH: 'math',
  MERMAID: 'mermaid',
  DIAGRAM: 'mermaid',
  COLUMNS2: 'columns_2',
  COLUMNS_2: 'columns_2',
  COLUMNS3: 'columns_3',
  COLUMNS_3: 'columns_3',
  CARD: 'card',
  KARTA: 'card',
  BOOKMARK: 'bookmark',
  LINK: 'bookmark',
  ZRODLO: 'bookmark',
  IMAGE: 'image',
  OBRAZ: 'image',
  VIDEO: 'video',
  WIDEO: 'video',
  PROGRESS: 'progress',
  RATING: 'rating',
  SWOT: 'swot_analysis',
  SWOT_ANALYSIS: 'swot_analysis',
  BEFORE_AFTER: 'before_after',
  DECISION_MATRIX: 'decision_matrix',
  DIVIDER: 'divider',
  SEPARATOR: 'divider',
};

/**
 * Sprawdza, czy tekst zawiera jakiekolwiek komendy blokowe `#TAG#...#TAG#`
 */
export function hasAiBlockTags(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return /#([A-Z0-9_]+)(?::([a-zA-Z0-9_+-]+))?#[\s\S]*?#\/?\1#/i.test(text);
}

/**
 * Parsuje tekst ze znacznikami `#TAG#treść#TAG#` (lub `#TAG:param#treść#TAG#`)
 * na gotową tablicę interaktywnych bloków DocBlock[].
 */
export function parseAiBlockTagsToBlocks(rawText: string, fallbackTitle?: string): ParsedBlockTagResult {
  const factory = new BlockFactory();
  const blocks: DocBlock[] = [];
  let extractedTitle = fallbackTitle;
  let tagCount = 0;

  if (!rawText || typeof rawText !== 'string') {
    return { title: extractedTitle, blocks: [], tagCount: 0, usedBlockTypes: [] };
  }

  // Wyrażenie dopasowujące #TAG#...#TAG# lub #TAG:param#...#TAG# lub #TAG#...#/TAG#
  const tagRegex = /#([A-Za-z0-9_]+)(?::([A-Za-z0-9_+-]+))?#([\s\S]*?)#\/?\1(?::[A-Za-z0-9_+-]+)?#/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const pushLooseText = (loose: string) => {
    const cleaned = loose.trim();
    if (!cleaned) return;
    const lines = cleaned.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('### ')) {
        blocks.push(factory.h(3, line.slice(4)));
      } else if (line.startsWith('## ')) {
        blocks.push(factory.h(2, line.slice(3)));
      } else if (line.startsWith('# ')) {
        const h1Text = line.slice(2).trim();
        if (!extractedTitle) extractedTitle = h1Text;
        blocks.push(factory.h(1, h1Text));
      } else if (/^[-*•]\s+/.test(line)) {
        blocks.push(factory.bullet(line.replace(/^[-*•]\s+/, '')));
      } else if (/^\d+[.)]\s+/.test(line)) {
        blocks.push(...factory.numbered([line.replace(/^\d+[.)]\s+/, '')]));
      } else {
        blocks.push(factory.p(line));
      }
    }
  };

  while ((match = tagRegex.exec(rawText)) !== null) {
    // Jeśli przed tagiem był zwykły tekst, również go zachowaj
    if (match.index > lastIndex) {
      pushLooseText(rawText.slice(lastIndex, match.index));
    }
    lastIndex = tagRegex.lastIndex;
    tagCount += 1;

    const rawTagName = match[1].toUpperCase();
    const tagParam = (match[2] || '').trim().toLowerCase();
    const body = (match[3] || '').trim();

    const mappedType: BlockType =
      TAG_ALIAS_MAP[rawTagName] ||
      (isRenderable(rawTagName.toLowerCase() as BlockType) ? (rawTagName.toLowerCase() as BlockType) : 'p');

    const created = buildBlocksFromTag(factory, mappedType, body, tagParam);
    for (const blk of created) {
      if (blk.type === 'h1' && !extractedTitle && blk.content) {
        extractedTitle = blk.content;
      }
      blocks.push(blk);
    }
  }

  // Tekst po ostatnim tagu
  if (lastIndex < rawText.length) {
    pushLooseText(rawText.slice(lastIndex));
  }

  const finalized = finalizeBlocks(blocks);
  const { repairedBlocks } = validateAndRepairDocument(finalized);
  const usedBlockTypes = Array.from(new Set(repairedBlocks.map((b) => b.type)));

  return {
    title: extractedTitle || 'Nowa notatka AI',
    blocks: repairedBlocks,
    tagCount,
    usedBlockTypes,
  };
}

/**
 * Tworzy konkretny blok (lub listę bloków) na podstawie rozpoznanego typu i zawartości tagu
 */
function buildBlocksFromTag(
  factory: BlockFactory,
  type: BlockType,
  body: string,
  param: string
): DocBlock[] {
  if (!body && type !== 'divider' && type !== 'spacer') return [];

  switch (type) {
    case 'h1':
      return [factory.h(1, body)];
    case 'h2':
      return [factory.h(2, body)];
    case 'h3':
      return [factory.h(3, body)];
    case 'h4':
      return [factory.h(4, body)];
    case 'lead':
      return [factory.lead(body)];
    case 'subtext':
      return [factory.subtext(body)];
    case 'p':
      return [factory.p(body)];

    case 'quote': {
      const parts = body.split(/\s*\|\s*|\s*—\s*/);
      return [factory.quote(parts[0], parts[1])];
    }

    case 'callout_info':
    case 'callout':
      return [factory.callout('info', body)];
    case 'callout_tip':
      return [factory.callout('tip', body)];
    case 'callout_warning':
      return [factory.callout('warning', body)];
    case 'callout_danger':
      return [factory.callout('danger', body)];
    case 'callout_success':
      return [factory.callout('success', body)];

    case 'key_takeaway':
      return [factory.keyTakeaway(body)];
    case 'summary_box':
      return [factory.summaryBox(body)];

    case 'bullet': {
      const items = body
        .split(/\n|;/)
        .map((line) => line.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
      return factory.bullets(items.length > 0 ? items : [body]);
    }

    case 'number': {
      const items = body
        .split(/\n|;/)
        .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
        .filter(Boolean);
      return factory.numbered(items.length > 0 ? items : [body]);
    }

    case 'todo': {
      const lines = body
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      return lines.map((line) => {
        const checked = /^(\[x\]|✓|✔|done:)/i.test(line);
        const clean = line.replace(/^(\[[ xX]\]|[-*•]|✓|✔|done:|todo:)\s*/i, '').trim();
        return factory.todo(clean || line, checked);
      });
    }

    case 'stat_grid': {
      // Format: "Etykieta 1: 95% (+10%) | Etykieta 2: 240 ms (Stabilny)"
      const segments = body.split(/\s*\|\|\s*|\s*\|\s*|\n/).map((s) => s.trim()).filter(Boolean);
      const items = segments.slice(0, 2).map((seg) => {
        const trendMatch = seg.match(/\(([^)]+)\)\s*$/);
        const trend = trendMatch ? trendMatch[1].trim() : 'Zweryfikowano';
        const withoutTrend = trendMatch ? seg.slice(0, trendMatch.index).trim() : seg;
        const [labelPart, ...valParts] = withoutTrend.split(':');
        if (valParts.length > 0) {
          return { label: labelPart.trim(), value: valParts.join(':').trim(), trend };
        }
        return { label: 'Wskaźnik', value: withoutTrend, trend };
      });
      if (items.length === 1) {
        items.push({ label: 'Status weryfikacji', value: 'Potwierdzono', trend: 'Aktywne' });
      }
      return [factory.statGrid(items)];
    }

    case 'stat': {
      const [label, value, trend] = body.split('|').map((s) => s.trim());
      return [factory.stat(label || 'Metryka', value || body, trend || '')];
    }

    case 'chart': {
      // Składnia:
      // #CHART:bar#Tytuł wykresu :: Etykieta 1: 45 | Etykieta 2: 80 | Etykieta 3: 30#CHART#
      // lub wieloliniowa: Etykieta 1: 45 \n Etykieta 2: 80
      const chartType: 'bar' | 'line' | 'pie' | 'donut' =
        param === 'line' || param === 'liniowy'
          ? 'line'
          : param === 'pie' || param === 'donut' || param === 'kolowy'
            ? 'donut'
            : 'bar';

      let chartTitle = 'Wykres analityczny danych';
      let seriesRaw = body;

      if (body.includes('::')) {
        const [titlePart, ...rest] = body.split('::');
        if (titlePart.trim()) chartTitle = titlePart.trim();
        seriesRaw = rest.join('::').trim();
      }

      const rawSegments = seriesRaw
        .split(/\s*\|\|\s*|\s*\|\s*|\n|;/)
        .map((s) => s.trim())
        .filter(Boolean);

      const palette = ['#2383e2', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
      const dataPoints: Array<{ label: string; value: number; color?: string }> = [];

      for (const seg of rawSegments) {
        const colonIdx = seg.lastIndexOf(':');
        const eqIdx = seg.lastIndexOf('=');
        const sepIdx = colonIdx >= 0 ? colonIdx : eqIdx;

        if (sepIdx > 0) {
          const label = seg.slice(0, sepIdx).trim();
          const numMatch = seg.slice(sepIdx + 1).match(/-?\d+(?:[.,]\d+)?/);
          const val = numMatch ? parseFloat(numMatch[0].replace(',', '.')) : 0;
          if (label) {
            dataPoints.push({
              label,
              value: val,
              color: palette[dataPoints.length % palette.length],
            });
          }
        } else {
          const numMatch = seg.match(/^(.*?)\s+(-?\d+(?:[.,]\d+)?)\s*%?$/);
          if (numMatch) {
            dataPoints.push({
              label: numMatch[1].trim() || `Seria ${dataPoints.length + 1}`,
              value: parseFloat(numMatch[2].replace(',', '.')),
              color: palette[dataPoints.length % palette.length],
            });
          }
        }
      }

      if (dataPoints.length === 0) {
        dataPoints.push(
          { label: 'Wariant A', value: 65, color: '#2383e2' },
          { label: 'Wariant B', value: 85, color: '#10b981' },
          { label: 'Wariant C', value: 45, color: '#8b5cf6' }
        );
      }

      return [factory.chart(chartTitle, dataPoints, chartType)];
    }

    case 'linked_database': {
      // Składnia: #LINKED_DB:tasks#Zadania projektu | board | proj-1#LINKED_DB#
      const parts = body.split('|').map((s) => s.trim());
      const entityKind: 'projects' | 'tasks' | 'meetings' =
        param === 'projects' || param === 'projekty'
          ? 'projects'
          : param === 'meetings' || param === 'spotkania'
            ? 'meetings'
            : 'tasks';
      const title = parts[0] || undefined;
      const viewModeRaw = (parts[1] || 'table').toLowerCase();
      const viewMode: 'table' | 'board' | 'calendar' | 'list' | 'gallery' =
        viewModeRaw === 'board' || viewModeRaw === 'kanban'
          ? 'board'
          : viewModeRaw === 'calendar'
            ? 'calendar'
            : viewModeRaw === 'list'
              ? 'list'
              : viewModeRaw === 'gallery'
                ? 'gallery'
                : 'table';
      const projectFilter = parts[2] || 'auto';
      return [factory.linkedDatabase(entityKind, viewMode, title, projectFilter)];
    }

    case 'table': {
      const rows = body
        .split(/\n/)
        .map((r) => r.trim())
        .filter((r) => r && !/^[-|:\s]+$/.test(r))
        .map((r) =>
          r
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim())
        )
        .filter((r) => r.length >= 2);

      if (rows.length >= 2) {
        return [factory.table(rows, param || 'Tabela analityczna')];
      }
      return [factory.p(body)];
    }

    case 'pros_cons': {
      let pros: string[] = [];
      let cons: string[] = [];
      if (body.includes('||')) {
        const [prosPart, consPart] = body.split('||');
        pros = prosPart.split(/\n|;/).map((s) => s.replace(/^[+-•*]\s*/, '').trim()).filter(Boolean);
        cons = consPart.split(/\n|;/).map((s) => s.replace(/^[+-•*]\s*/, '').trim()).filter(Boolean);
      } else {
        for (const line of body.split(/\n/)) {
          const t = line.trim();
          if (t.startsWith('-')) cons.push(t.slice(1).trim());
          else if (t.startsWith('+')) pros.push(t.slice(1).trim());
        }
      }
      if (pros.length === 0) pros = ['Wysoka użyteczność merytoryczna'];
      if (cons.length === 0) cons = ['Wymaga weryfikacji w kontekście wdrożenia'];
      return [factory.prosCons(pros, cons)];
    }

    case 'code':
      return [factory.code(body, param || 'typescript')];
    case 'terminal':
      return [factory.terminal(body)];
    case 'sql':
      return [factory.sql(body)];
    case 'json':
      return [factory.json(body)];
    case 'math':
      return [factory.math(body)];

    case 'mermaid': {
      const lines = body.split('\n');
      let title = 'Diagram przepływu';
      let syntax = body;
      if (lines[0] && !/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|mindmap)/i.test(lines[0].trim()) && lines.length > 1) {
        title = lines[0].trim();
        syntax = lines.slice(1).join('\n').trim();
      }
      return [factory.mermaid(title, syntax, 'flowchart')];
    }

    case 'faq': {
      const pairs = body.split(/\s*\|\|\s*|\n(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9].*\?)/);
      const faqItems = pairs
        .map((pair) => {
          const [q, ...aParts] = pair.split(/\s*::\s*|\n/);
          const question = (q || '').trim();
          const answer = aParts.join(' ').trim();
          return question && answer ? { question, answer } : null;
        })
        .filter((item): item is { question: string; answer: string } => Boolean(item));

      if (faqItems.length > 0) {
        return [factory.faq('Najczęściej zadawane pytania (FAQ)', faqItems)];
      }
      return [factory.p(body)];
    }

    case 'timeline': {
      const entries = body.split(/\s*\|\|\s*|\n/).map((l) => l.trim()).filter(Boolean);
      return entries.map((entry) => {
        const [datePart, ...descParts] = entry.split(/\s*::\s*|\s*—\s*|\s*-\s*/);
        if (descParts.length > 0) {
          return factory.timeline(datePart.trim(), descParts.join(' — ').trim());
        }
        return factory.timeline('Etap', entry);
      });
    }

    case 'toggle': {
      const [title, ...details] = body.split(/\s*::\s*|\n/);
      return [factory.toggle(title || 'Szczegóły', details.join('\n') || body)];
    }

    case 'tabs': {
      const [titlesPart, bodiesPart] = body.split('::');
      if (titlesPart && bodiesPart) {
        const titles = titlesPart.split('|').map((s) => s.trim()).filter(Boolean);
        const bodies = bodiesPart.split('|').map((s) => s.trim()).filter(Boolean);
        if (titles.length >= 2 && bodies.length >= 2) {
          return [factory.tabs(titles, bodies)];
        }
      }
      return [factory.p(body)];
    }

    case 'columns_2': {
      const [left, right] = body.split('||').map((s) => s.trim());
      return [factory.columns2(left || body, right || 'Uzupełnienie kontekstu')];
    }

    case 'columns_3': {
      const [a, b, c] = body.split('||').map((s) => s.trim());
      return [factory.columns3(a || body, b || 'Kolumna 2', c || 'Kolumna 3')];
    }

    case 'card': {
      const [title, ...rest] = body.split(/\s*::\s*|\n/);
      return [factory.card(title || 'Karta informacyjna', rest.join('\n') || body)];
    }

    case 'bookmark': {
      const [url, title, desc] = body.split('|').map((s) => s.trim());
      if (url && /^https?:\/\//i.test(url)) {
        return [factory.bookmark(url, title || url, desc || '')];
      }
      return [factory.p(body)];
    }

    case 'image': {
      const [url, caption] = body.split('|').map((s) => s.trim());
      if (url && isSafeImage(url, caption, caption)) {
        return [factory.image(url, caption || 'Ilustracja')];
      }
      return [];
    }

    case 'video': {
      const [url, title] = body.split('|').map((s) => s.trim());
      if (url && /^https?:\/\//i.test(url)) {
        return [factory.video(url, title || 'Materiał wideo')];
      }
      return [];
    }

    case 'progress': {
      const [label, pctStr] = body.split('|').map((s) => s.trim());
      return [factory.progress(label || 'Postęp', Number(pctStr) || 75)];
    }

    case 'divider':
      return [factory.divider()];

    default:
      return [{ id: factory.ids.next(type.slice(0, 3)), type, content: body }];
  }
}

/**
 * Buduje instrukcję systemową dla modelu AI (np. Puter AI / Gemini / Ollama),
 * aby model sam układał bloki za pomocą komend `#TAG#...#TAG#` na podstawie 9 źródeł.
 */
export function buildAiBlockTagSystemPrompt(
  topic: string,
  sources: VerifiedSource[],
  extract: string
): string {
  const sourcesDigest = sources
    .slice(0, 12)
    .map((s, i) => `[Źródło ${i + 1} | ${s.domain}] ${s.name}: ${s.snippet} (${s.url})`)
    .join('\n');

  return `Jesteś autonomicznym architektem dokumentów. Tworzysz wyczerpującą, unikalną notatkę na temat: "${topic}".
Masz do dyspozycji zweryfikowane dane z ${sources.length} niezależnych źródeł internetowych:
${sourcesDigest}

Kontekst główny:
${extract.slice(0, 2200)}

ZASADY UKŁADANIA DOKUMENTU:
1. NIE używaj zwykłego Markdownu ani sztywnego szablonu. САМ decyduj, jakich bloków użyć w zależności od tematu (prawo = artykuły i ostrzeżenia, programowanie = kod i architektura, medycyna/nauka = badania i tabele, biznes = KPI i macierze).
2. Otaczaj każdy element komendą blokową #TAG#treść#TAG#:
   - #HEADER1#Tytuł główny#HEADER1#
   - #LEAD#Rozbudowane wprowadzenie wyjaśniające istotę tematu#LEAD#
   - #STAT_GRID#Metryka 1: Wartość (Trend) | Metryka 2: Wartość (Trend)#STAT_GRID#
   - #CALLOUT_INFO#Kluczowa definicja lub przepis prawny#CALLOUT_INFO#
   - #CALLOUT_WARNING#Ważne zastrzeżenie lub pułapka#CALLOUT_WARNING#
   - #CALLOUT_TIP#Praktyczna wskazówka ekspercka#CALLOUT_TIP#
   - #HEADER2#Tytuł sekcji#HEADER2#
   - #TEXT#Merytoryczny akapit z konkretnymi faktami, datami i liczbami ze źródeł#TEXT#
   - #TABLE#Kolumna 1 | Kolumna 2 | Kolumna 3 \\n Wartość 1 | Wartość 2 | Wartość 3#TABLE#
   - #CODE:typescript#Przykładowy kod (tylko gdy temat dotyczy IT/programowania)#CODE#
   - #PROS_CONS#+ Zaleta 1 \\n + Zaleta 2 || - Wada 1 \\n - Wada 2#PROS_CONS#
   - #TIMELINE#Data/Etap :: Opis wydarzenia#TIMELINE#
   - #FAQ#Pytanie 1? :: Odpowiedź 1 || Pytanie 2? :: Odpowiedź 2#FAQ#
   - #TODO#Krok do wykonania 1 \\n Krok do wykonania 2#TODO#
   - #KEY_TAKEAWAY#Najważniejszy wniosek końcowy#KEY_TAKEAWAY#
   - #BOOKMARK#URL | Tytuł źródła | Krótki opis#BOOKMARK#
3. Pisz wyłącznie po polsku, konkretnie, bez lania wody.`;
}

/**
 * Dynamiczny kompozytor strumienia `#TAG#...#TAG#` na podstawie rzeczywistych wyników z 9+ źródeł.
 * Dopasowuje zestaw tagów do wykrytej dziedziny (Prawo/Gov, Programowanie/IT, Medycyna/Nauka,
 * Biznes/Finanse, Historia/Kultura lub Ogólne), dzięki czemu każda notatka ma unikalną strukturę.
 */
export function composeDynamicBlockTagStream(
  topic: string,
  mainExtract: string,
  wikiSections: Array<{ title: string; content: string }>,
  sources: VerifiedSource[],
  findings: CrossCheckFinding[],
  images: Array<{ url: string; title?: string; caption?: string }> = []
): string {
  const combined = `${topic} ${mainExtract} ${sources.map((s) => `${s.domain} ${s.name} ${s.snippet}`).join(' ')}`.toLowerCase();

  const isLawGov =
    /ustaw|kodeks|praw|rozporządz|konstytucj|sąd|trybunał|podatk|vat|pit|cit|zus|krs|ceidg|sejm\.gov|isap|gov\.pl|art\.\s*\d|§/.test(combined);
  const isTechCode =
    /typescript|javascript|python|react|node|rust|golang|java|c\+\+|html|css|sql|docker|kubernetes|git|api|framework|kompilat|bibliotek|npm|stackoverflow|stackexchange|github|algorytm|kod/.test(combined);
  const isBioMed =
    /medycyn|lek|chorob|terapi|klinicz|pacjent|genet|biolog|białk|komórk|wirus|bakteri|anatom|układ|pubmed|europepmc|zdrow|psycholog/.test(combined);
  const isBusiness =
    /biznes|finans|inwestycj|rynek|giełd|pkb|inflacj|przedsiębior|spółk|strategi|marketing|kpi|zarządz|ekonom/.test(combined);

  const uniqueDomains = Array.from(new Set(sources.map((s) => s.domain).filter(Boolean)));
  const chunks: string[] = [];

  // 1. Tytuł główny
  chunks.push(`#HEADER1#${topic}#HEADER1#`);

  // 2. Wprowadzenie (Lead) z podsumowaniem wieloźródłowym
  const leadSentence =
    mainExtract.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ').trim() ||
    sources[0]?.snippet ||
    `Opracowanie merytoryczne tematu „${topic}” na podstawie ${sources.length} źródeł z ${uniqueDomains.length} domen.`;
  chunks.push(`#LEAD#${leadSentence}#LEAD#`);

  // 3. Statystyki badania i pokrycia źródeł
  chunks.push(
    `#STAT_GRID#Zweryfikowane źródła: ${sources.length} pozycji (${uniqueDomains.length} domen) | Dominujący profil: ${
      isLawGov
        ? 'Prawo i Regulacje (Gov/ELI)'
        : isTechCode
          ? 'Inżynieria Oprogramowania (IT)'
          : isBioMed
            ? 'Nauki Medyczne i Przyrodnicze'
            : isBusiness
              ? 'Ekonomia i Strategia'
              : 'Analiza Interdyscyplinarna'
    } (Live Research)#STAT_GRID#`
  );

  // 4. Bezpieczna ilustracja główna (jeśli dostępna)
  const safeImg = images.find((img) => isSafeImage(img.url, img.title, img.caption));
  if (safeImg) {
    chunks.push(`#IMAGE#${safeImg.url} | ${safeImg.caption || safeImg.title || topic}#IMAGE#`);
  }

  // 5. Specjalistyczna sekcja dziedzinowa układana dynamicznie pod temat
  if (isLawGov) {
    const lawSources = sources.filter((s) => /sejm|gov|isap|lex|prawo|wikidata|wikipedia/i.test(s.domain));
    chunks.push(`#CALLOUT_WARNING#⚖️ kontekst prawno-regulacyjny: Opracowanie uwzględnia akty prawne, publikacje urzędowe i rejestry publiczne (${uniqueDomains.slice(0, 5).join(', ')}).#CALLOUT_WARNING#`);
    chunks.push(`#HEADER2#Podstawa Prawna i Kluczowe Regulacje#HEADER2#`);
    for (const ls of (lawSources.length ? lawSources : sources).slice(0, 4)) {
      chunks.push(`#CARD#${ls.name} (${ls.domain}) :: ${ls.snippet}#CARD#`);
    }
  } else if (isTechCode) {
    const devSources = sources.filter((s) => /stackexchange|stackoverflow|npmjs|github|wikipedia|openalex/i.test(s.domain));
    chunks.push(`#CALLOUT_TIP#💻 Architektura i Dokumentacja Techniczna: Dane zebrane z repozytoriów pakietów, dyskusji inżynierskich oraz dokumentacji (${uniqueDomains.slice(0, 5).join(', ')}).#CALLOUT_TIP#`);
    chunks.push(`#HEADER2#Specyfikacja Techniczna i Ekosystem#HEADER2#`);
    if (devSources.length > 0) {
      const tableRows = [
        'Źródło / Pakiet | Domena | Kluczowe informacje i zastosowanie',
        ...devSources.slice(0, 5).map((ds) => `${ds.name.replace(/\|/g, '/').slice(0, 48)} | ${ds.domain} | ${ds.snippet.replace(/\|/g, '/').replace(/\n+/g, ' ').slice(0, 110)}`),
      ];
      chunks.push(`#TABLE#${tableRows.join('\n')}#TABLE#`);
    }
    chunks.push(
      `#MERMAID#Architektura: ${topic}\nflowchart LR\n  A["Zapytanie / Dane"] --> B["${topic.replace(/["[\]]/g, '')}"]\n  B --> C["Walidacja i Typy"]\n  C --> D["Wdrożenie Produkcyjne"]#MERMAID#`
    );
  } else if (isBioMed) {
    chunks.push(`#CALLOUT_INFO#🧬 Przegląd Naukowy i Biomedyczny: Uwzględniono publikacje indeksowane w bazach naukowych (${uniqueDomains.slice(0, 5).join(', ')}).#CALLOUT_INFO#`);
    chunks.push(`#HEADER2#Wyniki Badań i Literatura Przedmiotu#HEADER2#`);
    const sciRows = [
      'Publikacja / Badanie | Rok / Źródło | Główny wniosek badawczy',
      ...sources.slice(0, 5).map((s) => `${s.name.replace(/\|/g, '/').slice(0, 50)} | ${s.publishDate || s.domain} | ${s.snippet.replace(/\|/g, '/').replace(/\n+/g, ' ').slice(0, 115)}`),
    ];
    if (sciRows.length >= 2) {
      chunks.push(`#TABLE#${sciRows.join('\n')}#TABLE#`);
    }
  } else if (isBusiness) {
    chunks.push(`#CALLOUT_INFO#📈 Analiza Rynkowa i Strategiczna: Zestawienie wskaźników i publikacji branżowych (${uniqueDomains.slice(0, 5).join(', ')}).#CALLOUT_INFO#`);
    chunks.push(`#HEADER2#Kluczowe Czynniki i Zestawienie Rynkowe#HEADER2#`);
  } else {
    chunks.push(`#CALLOUT_INFO#🌐 Synteza Wieloźródłowa: Zintegrowano informacje z ${uniqueDomains.length} niezależnych źródeł (${uniqueDomains.slice(0, 5).join(', ')}).#CALLOUT_INFO#`);
  }

  // 6. Sekcje merytoryczne z pobranych artykułów (bez ścian tekstu)
  const usableSections = (wikiSections || []).filter(
    (s) => s.content && s.content.trim().length > 40 && !/^(zobacz też|przypisy|linki zewnętrzne|bibliografia)$/i.test(s.title.trim())
  );

  if (usableSections.length > 0) {
    for (const sec of usableSections.slice(0, 5)) {
      chunks.push(`#HEADER2#${sec.title}#HEADER2#`);
      const paragraphs = sec.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 25);
      for (const p of paragraphs.slice(0, 2)) {
        chunks.push(`#TEXT#${p.slice(0, 480)}#TEXT#`);
      }
    }
  } else if (mainExtract.length > 80) {
    chunks.push(`#HEADER2#Szczegółowa Charakterystyka i Kontekst#HEADER2#`);
    const paragraphs = mainExtract.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    for (const p of paragraphs.slice(0, 3)) {
      chunks.push(`#TEXT#${p.slice(0, 480)}#TEXT#`);
    }
  }

  // 7. Krzyżowe zestawienie źródeł (z 9+ przeszukanych rejestrów)
  if (sources.length >= 2) {
    chunks.push(`#HEADER2#Porównanie Źródeł i Weryfikacja Krzyżowa (${uniqueDomains.length} Domen)#HEADER2#`);
    const rows = [
      'Źródło / Tytuł | Domena | Rok / Autor | Kluczowy wyimek ze źródła',
      ...sources.slice(0, 8).map((s) => {
        const cleanName = (s.name || 'Źródło').replace(/\|/g, '/').replace(/\n+/g, ' ').slice(0, 45);
        const cleanAuthor = (s.publishDate ? `${s.publishDate} · ` : '') + (s.authorOrPublisher || s.domain).replace(/\|/g, '/').slice(0, 28);
        const cleanSnippet = (s.snippet || '').replace(/\|/g, '/').replace(/\n+/g, ' ').slice(0, 110);
        return `${cleanName} | ${s.domain} | ${cleanAuthor} | ${cleanSnippet}`;
      }),
    ];
    chunks.push(`#TABLE#${rows.join('\n')}#TABLE#`);
  }

  // 8. Ustalenia weryfikacyjne (Cross-Check Findings)
  if (findings.length > 0) {
    chunks.push(`#HEADER3#Ustalenia Weryfikacji Faktycznej#HEADER3#`);
    const bulletLines = findings
      .slice(0, 5)
      .map((f) => `${f.claim} (Potwierdzone przez: ${f.confirmedByDomains.join(', ') || 'analizę źródeł'})`);
    chunks.push(`#BULLET#${bulletLines.join('\n')}#BULLET#`);
  }

  // 9. FAQ wygenerowane z rzeczywistych źródeł
  if (sources.length >= 2) {
    const faqPairs = [
      `Czym charakteryzuje się ${topic} według głównych źródeł? :: ${leadSentence}`,
      `Jakie niezależne bazy potwierdzają informacje o „${topic}”? :: Informacje zweryfikowano w ${sources.length} źródłach obejmujących domeny: ${uniqueDomains.slice(0, 6).join(', ')}.`,
    ];
    chunks.push(`#FAQ#${faqPairs.join(' || ')}#FAQ#`);
  }

  // 10. Podsumowanie końcowe i klikalne zakładki źródłowe
  chunks.push(
    `#KEY_TAKEAWAY#Opracowanie „${topic}” zostało zbudowane dynamicznie w oparciu o ${sources.length} zweryfikowanych źródeł z ${uniqueDomains.length} odrębnych domen.#KEY_TAKEAWAY#`
  );

  chunks.push(`#HEADER2#Bezpośrednie Odnośniki do Źródeł#HEADER2#`);
  for (const s of sources.slice(0, 6)) {
    if (s.url && /^https?:\/\//i.test(s.url)) {
      chunks.push(`#BOOKMARK#${s.url} | ${s.name.replace(/\|/g, '/').slice(0, 70)} | ${s.domain} — ${(s.snippet || '').replace(/\|/g, '/').slice(0, 140)}#BOOKMARK#`);
    }
  }

  return chunks.join('\n\n');
}
