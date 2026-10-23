/**
 * Fabryka bloków – typowane konstruktory zgodne z konwencjami edytora.
 *
 * Konwencje zapisu (np. `stat_grid` = „A | B", `pros_cons` = plusy w `content`,
 * minusy w `toggleDetails`) są odwzorowane 1:1 z kodu BlockEditor, aby wygenerowany
 * dokument renderował się identycznie jak blok wstawiony ręcznie.
 */

import type { DocBlock, BlockType } from '../../../types/workspace';
import { stripInlineMarkdown, truncateAtBoundary } from './textAnalysis';
import { isSafeImage } from '../../../utils/contentFilter';

export type CalloutKind = 'info' | 'success' | 'warning' | 'danger' | 'tip';

export interface IdFactory {
  next: (prefix?: string) => string;
  readonly count: number;
}

/** Deterministyczny generator ID – unikalne w obrębie dokumentu i stabilne w testach. */
export function createIdFactory(seed: number | string = Date.now()): IdFactory {
  let counter = 0;
  const base = typeof seed === 'number' ? seed.toString(36) : String(seed).replace(/[^a-z0-9]/gi, '').slice(0, 8);
  return {
    next(prefix = 'b') {
      counter += 1;
      return `${prefix}-${base}-${counter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
    },
    get count() {
      return counter;
    },
  };
}

export class BlockFactory {
  readonly ids: IdFactory;

  constructor(ids: IdFactory = createIdFactory()) {
    this.ids = ids;
  }

  private make(type: BlockType, content: string, extra: Partial<DocBlock> = {}): DocBlock {
    const isCodeBlock = ['code', 'terminal', 'sql', 'json', 'diff', 'mermaid', 'math'].includes(type);
    const cleanedContent = isCodeBlock
      ? content
      : content
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/__(.+?)__/g, '$1')
          .replace(/(^|\s)\*(?=\S)(.+?)(?<=\S)\*(?=\s|[.,!?;:]|$)/g, '$1$2');
    return { id: this.ids.next(type.slice(0, 3)), type, content: cleanedContent, ...extra };
  }

  // ----- Tekst
  p(text: string, extra: Partial<DocBlock> = {}): DocBlock {
    return this.make('p', text.trim(), extra);
  }
  h(level: 1 | 2 | 3 | 4 | 5 | 6, text: string, extra: Partial<DocBlock> = {}): DocBlock {
    return this.make(`h${level}` as BlockType, stripInlineMarkdown(text).trim(), extra);
  }
  lead(text: string): DocBlock {
    return this.make('lead', text.trim());
  }
  subtext(text: string): DocBlock {
    return this.make('subtext', text.trim());
  }
  quote(text: string, author?: string): DocBlock {
    const content = author ? `${text.trim()}\n— ${author}` : text.trim();
    return this.make('quote', content, author ? { quoteAuthor: author } : {});
  }

  // ----- Listy
  bullet(text: string, indent = 0): DocBlock {
    return this.make('bullet', text.trim(), indent ? { indent } : {});
  }
  bullets(items: string[]): DocBlock[] {
    return items.filter((i) => i.trim()).map((i) => this.bullet(i));
  }
  numbered(items: string[]): DocBlock[] {
    return items.filter((i) => i.trim()).map((i) => this.make('number', i.trim()));
  }
  todo(text: string, checked = false): DocBlock {
    return this.make('todo', text.trim(), { checked });
  }
  todos(items: string[], checkedIdx: number[] = []): DocBlock[] {
    return items.map((t, i) => this.todo(t, checkedIdx.includes(i)));
  }
  toggle(title: string, details: string): DocBlock {
    return this.make('toggle', title.trim(), { toggleDetails: details.trim() });
  }
  numberedToggle(title: string, details: string): DocBlock {
    return this.make('numbered_toggle', title.trim(), { toggleDetails: details.trim() });
  }
  tabs(titles: string[], bodies: string[]): DocBlock {
    const n = Math.min(titles.length, bodies.length);
    return this.make('tabs', titles.slice(0, n).map((t) => t.replace(/\|/g, '/')).join(' | '), {
      toggleDetails: bodies.slice(0, n).map((b) => b.replace(/\|/g, '/')).join(' | '),
      activeTabIndex: 0,
    });
  }
  faq(title: string, items: Array<{ question: string; answer: string }>): DocBlock {
    return this.make('faq', title, {
      faqItems: items.map((it, i) => ({ question: it.question.trim(), answer: it.answer.trim(), isOpen: i === 0 })),
    });
  }

  // ----- Wyróżnienia
  callout(kind: CalloutKind, text: string): DocBlock {
    const type = (`callout_${kind}`) as BlockType;
    return this.make(type, text.trim(), { calloutType: kind });
  }
  keyTakeaway(text: string): DocBlock {
    return this.make('key_takeaway', text.trim());
  }
  summaryBox(text: string): DocBlock {
    return this.make('summary_box', text.trim());
  }
  badge(text: string, color = '#2383e2'): DocBlock {
    return this.make('badge', text.trim(), { buttonColor: color });
  }

  // ----- Kod
  code(source: string, language = 'typescript'): DocBlock {
    return this.make('code', source.replace(/\s+$/, ''), { language });
  }
  terminal(commands: string): DocBlock {
    return this.make('terminal', commands.trim(), { language: 'bash' });
  }
  math(expr: string): DocBlock {
    return this.make('math', expr.trim());
  }
  json(source: string): DocBlock {
    return this.make('json', source.trim(), { language: 'json' });
  }
  sql(source: string): DocBlock {
    return this.make('sql', source.trim(), { language: 'sql' });
  }
  mermaid(title: string, syntax: string, type: 'flowchart' | 'sequence' | 'mindmap' | 'architecture' = 'flowchart'): DocBlock {
    return this.make('mermaid', title, { diagramSyntax: syntax.trim(), diagramType: type });
  }

  // ----- Dane
  table(rows: string[][], caption?: string): DocBlock {
    const clean = rows.map((r) => r.map((c) => stripInlineMarkdown(String(c ?? '')).replace(/\n+/g, ' ').trim()));
    const width = Math.max(...clean.map((r) => r.length));
    const normalized = clean.map((r) => (r.length < width ? [...r, ...Array(width - r.length).fill('—')] : r));
    return this.make('table', caption || 'Tabela', { tableData: normalized });
  }
  stat(label: string, value: string, trend = ''): DocBlock {
    return this.make('stat', label.trim(), { statValue: value.trim(), statTrend: trend.trim() });
  }
  statGrid(items: Array<{ label: string; value: string; trend?: string }>): DocBlock {
    const picked = items.slice(0, 2);
    return this.make('stat_grid', picked.map((i) => i.label.replace(/\|/g, '/')).join(' | '), {
      statValue: picked.map((i) => i.value.replace(/\|/g, '/')).join(' | '),
      statTrend: picked.map((i) => (i.trend || '—').replace(/\|/g, '/')).join(' | '),
    });
  }
  progress(label: string, percent: number): DocBlock {
    return this.make('progress', label.trim(), { progressPercent: Math.max(0, Math.min(100, Math.round(percent))) });
  }
  rating(label: string, stars: number): DocBlock {
    return this.make('rating', label.trim(), { ratingStars: Math.max(1, Math.min(5, Math.round(stars))) });
  }
  poll(question: string, options: string[]): DocBlock {
    return this.make('poll', question.trim(), { pollOptions: options.map((label) => ({ label, votes: 0 })) });
  }
  prosCons(pros: string[], cons: string[]): DocBlock {
    return this.make('pros_cons', pros.map((p) => `+ ${p.trim()}`).join('\n'), {
      toggleDetails: cons.map((c) => `- ${c.trim()}`).join('\n'),
    });
  }
  beforeAfter(data: { beforeTitle: string; beforePoints: string[]; afterTitle: string; afterPoints: string[] }, title = 'Porównanie'): DocBlock {
    return this.make('before_after', title, { beforeAfterData: data });
  }
  swot(title: string, data: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] }): DocBlock {
    return this.make('swot_analysis', title, { swotData: data });
  }
  riskRegister(title: string, rows: NonNullable<DocBlock['riskRegisterData']>): DocBlock {
    return this.make('risk_register', title, { riskRegisterData: rows });
  }
  decisionMatrix(title: string, criteria: string[], options: Array<{ name: string; scores: number[] }>): DocBlock {
    return this.make('decision_matrix', title, {
      decisionMatrixData: {
        criteria,
        options: options.map((o) => ({ name: o.name, scores: o.scores, totalScore: o.scores.reduce((a, b) => a + b, 0) })),
      },
    });
  }
  roadmap(title: string, items: NonNullable<DocBlock['roadmapData']>): DocBlock {
    return this.make('milestone_roadmap', title, { roadmapData: items });
  }
  specTable(title: string, rows: Array<{ key: string; value: string; note?: string }>): DocBlock {
    return this.make('spec_table', title, { specTableData: rows });
  }
  kpi(title: string, data: NonNullable<DocBlock['kpiScorecardData']>): DocBlock {
    return this.make('kpi_scorecard', title, { kpiScorecardData: data });
  }
  targetMeter(title: string, data: NonNullable<DocBlock['gaugeData']>): DocBlock {
    return this.make('target_meter', title, { gaugeData: data });
  }
  timeline(date: string, text: string): DocBlock {
    return this.make('timeline', text.trim(), { timelineDate: date.trim() });
  }
  eventItem(data: NonNullable<DocBlock['eventScheduleData']>): DocBlock {
    return this.make('event_schedule', data.title, { eventScheduleData: data });
  }
  changelog(title: string, data: NonNullable<DocBlock['changelogData']>): DocBlock {
    return this.make('changelog', title, { changelogData: data });
  }
  chart(
    title: string,
    dataPoints: Array<{ label: string; value: number; color?: string }>,
    chartType: 'bar' | 'line' | 'pie' | 'donut' = 'bar',
    unit = '',
    sourceLabel = 'Zweryfikowane dane'
  ): DocBlock {
    return this.make('chart', title.trim(), {
      chartData: {
        chartType,
        title: title.trim(),
        unit,
        dataPoints: dataPoints.map((dp) => ({
          label: dp.label.trim(),
          value: Number.isFinite(dp.value) ? dp.value : 0,
          color: dp.color,
        })),
        sourceLabel,
      },
    });
  }
  linkedDatabase(
    entityKind: 'projects' | 'tasks' | 'meetings' = 'tasks',
    viewMode: 'table' | 'board' | 'calendar' | 'list' | 'gallery' = 'table',
    title?: string,
    projectFilter = 'auto'
  ): DocBlock {
    const defaultTitle =
      title ||
      (entityKind === 'projects'
        ? 'Powiązana baza projektów (Projects)'
        : entityKind === 'meetings'
          ? 'Powiązane spotkania (Meetings)'
          : 'Powiązane zadania (Tasks)');
    return this.make('linked_database', defaultTitle.trim(), {
      linkedDatabaseData: {
        entityKind,
        viewMode,
        projectFilter,
        title: defaultTitle.trim(),
      },
    });
  }

  // ----- Media
  image(url: string, caption?: string, alt?: string): DocBlock {
    if (!isSafeImage(url, alt, caption)) {
      // Bezpieczny fallback – zamiast niebezpiecznego/NSFW obrazu tworzymy bezpieczną zakładkę lub callout
      return this.callout('info', `📌 Odnośnik wizualny: ${caption || alt || 'Materiały źródłowe'}`);
    }
    return this.make('image', alt || caption || '', { imageUrl: url, imageCaption: caption || '' });
  }
  video(url: string, title: string): DocBlock {
    return this.make('video', title.trim(), { videoUrl: url });
  }
  bookmark(url: string, title: string, description = ''): DocBlock {
    return this.make('bookmark', title.trim(), {
      bookmarkUrl: url,
      bookmarkTitle: title.trim(),
      bookmarkDesc: truncateAtBoundary(description, 220),
    });
  }
  map(query: string): DocBlock {
    return this.make('map', query, { embedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=8&ie=UTF8&iwloc=&output=embed` });
  }
  citation(data: NonNullable<DocBlock['citationData']>): DocBlock {
    return this.make('citation_source', data.title, { citationData: data });
  }
  fileCard(name: string, size = '', url = '#'): DocBlock {
    return this.make('file_card', name, { fileName: name, fileSize: size, fileUrl: url });
  }

  // ----- Układ
  divider(): DocBlock {
    return this.make('divider', '');
  }
  spacer(): DocBlock {
    return this.make('spacer', '', { progressPercent: 24 });
  }
  columns2(left: string, right: string): DocBlock {
    return this.make('columns_2', left.trim(), { toggleDetails: right.trim() });
  }
  columns3(a: string, b: string, c: string): DocBlock {
    return this.make('columns_3', a.trim(), { toggleDetails: `${b.replace(/\|/g, '/').trim()}|${c.replace(/\|/g, '/').trim()}` });
  }
  card(title: string, body: string): DocBlock {
    return this.make('card', title.trim(), { toggleDetails: body.trim() });
  }

  // ----- Interakcja / nawigacja
  button(label: string, url: string, color = '#2383e2'): DocBlock {
    return this.make('button', label.trim(), { buttonUrl: url, buttonColor: color });
  }
  aiPrompt(placeholder: string): DocBlock {
    return this.make('ai_prompt', placeholder.trim(), { toggleDetails: '' });
  }
  /** Odnośnik wewnętrzny do strony po tytule – render przez WikiText jako klikalna etykieta. */
  pageLink(title: string): string {
    return `[[${title.replace(/[\[\]]/g, '')}]]`;
  }
  linkBullet(title: string, description?: string): DocBlock {
    return this.bullet(description ? `${this.pageLink(title)} — ${description}` : this.pageLink(title));
  }
}

/** Przypisuje kolejność i zapewnia unikalność ID w tablicy bloków. */
export function finalizeBlocks(blocks: DocBlock[]): DocBlock[] {
  const used = new Set<string>();
  return blocks.map((b, idx) => {
    let id = b.id;
    let n = 1;
    while (!id || used.has(id)) {
      id = `${b.id || 'blk'}-${n++}`;
    }
    used.add(id);
    return { ...b, id, order: idx };
  });
}

/** Zlicza typy bloków – używane w raportach i testach różnorodności. */
export function countBlockTypes(blocks: DocBlock[]): Record<string, number> {
  const usage: Record<string, number> = {};
  blocks.forEach((b) => {
    usage[b.type] = (usage[b.type] || 0) + 1;
  });
  return usage;
}
