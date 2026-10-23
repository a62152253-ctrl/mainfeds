/**
 * Serwis Zaawansowanych Operacji na Notatkach (Note Operations Service)
 * Realizuje inteligentne operacje Notion/Mem-style:
 * 1. Streszczanie istniejącej notatki (Executive Summary, Key Takeaways, Stats)
 * 2. Ekstrakcja zadań z notatki do tablicy Kanban (Action Items Extractor)
 * 3. Szablon notatki ze spotkania (Meeting Notes Generator z agendą i tabelą)
 * 4. Audyt jakości i ulepszanie notatki (Quality Audit & Improvement Suggestions)
 */

import { DocBlock, WorkspacePage } from '../../types/workspace';

export interface NoteSummaryResult {
  pageId: string;
  pageTitle: string;
  executiveSummary: string;
  keyTakeaways: string[];
  mainPoints: string[];
  stats: {
    blocksCount: number;
    wordCount: number;
    readingTimeMinutes: number;
  };
  suggestedTasks: string[];
}

export interface ExtractedActionItem {
  id: string;
  title: string;
  priority: 'Krytyczny' | 'Wysoki' | 'Średni' | 'Niski';
  contextSnippet?: string;
}

export interface NoteAuditResult {
  pageId: string;
  pageTitle: string;
  scorePercent: number;
  readabilityRating: 'Znakomita' | 'Dobra' | 'Wymaga Uzupełnienia';
  strengths: string[];
  improvements: string[];
  recommendedAdditions: DocBlock[];
}

/**
 * Wyciąga czysty tekst ze wszystkich bloków strony
 */
export function extractPlainTextFromBlocks(blocks: DocBlock[] = []): string {
  return blocks
    .map((b) => {
      let t = b.content || '';
      if (b.toggleDetails) t += '\n' + b.toggleDetails;
      if (b.tableData) {
        t += '\n' + b.tableData.map((row) => row.join(' | ')).join('\n');
      }
      return t.trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Szuka notatki w kolekcji stron użytkownika (po dokładnym tytule, z cudzysłowami, fuzzy lub częściowo)
 */
export function findPageByTitleQuery(
  pages: WorkspacePage[],
  rawQuery: string
): WorkspacePage | null {
  if (!pages || pages.length === 0) return null;

  // 1. Oczyszczenie zapytania
  const clean = rawQuery
    .replace(
      /^(@streszcz\s*|@summarize\s*|@summary\s*|@zadania_z_notatki\s*|@actionitems\s*|@audit\s*|@improve\s*|\/streszcz\s*|\/summarize\s*)/i,
      ''
    )
    .replace(
      /^(streszcz mi notatkę|streszcz notatkę|streszcz mi notatke|streszcz notatke|streszcz dokument|streszcz mi|streszcz|podsumuj mi notatkę|podsumuj notatkę|podsumuj mi notatke|podsumuj notatke|podsumuj dokument|podsumuj|zadania z notatki|audytuj notatkę|audyt notatki)\s*(o|z|dla|notatkę|notatke|dokument)?\s*/i,
      ''
    )
    .replace(/["'„”«»]/g, '')
    .trim()
    .toLowerCase();

  if (!clean) return null;

  // 2. Szukanie dokładnego dopasowania (case-insensitive)
  const exact = pages.find(
    (p) => !p.isDeleted && p.title.trim().toLowerCase() === clean
  );
  if (exact) return exact;

  // 3. Szukanie gdy tytuł zawiera zapytanie lub zapytanie zawiera tytuł
  const contains = pages.find((p) => {
    if (p.isDeleted) return false;
    const pTitle = p.title.trim().toLowerCase();
    return pTitle.includes(clean) || clean.includes(pTitle);
  });
  if (contains) return contains;

  // 4. Szukanie słów kluczowych (np. "kot" z "Kot domowy")
  const words = clean.split(/\s+/).filter((w) => w.length > 2);
  if (words.length > 0) {
    const keywordMatch = pages.find((p) => {
      if (p.isDeleted) return false;
      const pTitle = p.title.toLowerCase();
      return words.every((w) => pTitle.includes(w));
    });
    if (keywordMatch) return keywordMatch;
  }

  return null;
}

/**
 * 1. Streszcza wybraną notatkę użytkownika
 */
export function summarizePage(page: WorkspacePage): NoteSummaryResult {
  const plainText = extractPlainTextFromBlocks(page.blocks);
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));

  // Wyszukaj kluczowe wnioski z bloków
  const takeawayBlocks = page.blocks.filter(
    (b) => b.type === 'key_takeaway' || b.type === 'callout_tip' || b.type === 'quote'
  );
  const headingBlocks = page.blocks.filter(
    (b) => b.type === 'h1' || b.type === 'h2' || b.type === 'h3'
  );
  const todoBlocks = page.blocks.filter((b) => b.type === 'todo');

  const keyTakeaways: string[] = [];
  takeawayBlocks.forEach((b) => {
    const clean = b.content.replace(/[🏆💡📌*]/g, '').trim();
    if (clean) keyTakeaways.push(clean);
  });

  if (keyTakeaways.length === 0) {
    const sentences = plainText
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 15);
    if (sentences.length > 0) {
      keyTakeaways.push(sentences[0].trim());
    }
    if (sentences.length > 1) {
      keyTakeaways.push(sentences[1].trim());
    }
  }

  const mainPoints: string[] = [];
  headingBlocks.slice(0, 4).forEach((h) => {
    if (h.content.trim()) mainPoints.push(h.content.trim());
  });

  const suggestedTasks: string[] = [];
  todoBlocks.forEach((t) => {
    if (t.content.trim()) suggestedTasks.push(t.content.trim());
  });

  const executiveSummary =
    keyTakeaways[0] ||
    `Notatka "${page.title}" zawiera ${page.blocks.length} bloków merytorycznych dotyczących kluczowych założeń i ustaleń.`;

  return {
    pageId: page.id,
    pageTitle: page.title,
    executiveSummary,
    keyTakeaways,
    mainPoints,
    stats: {
      blocksCount: page.blocks.length,
      wordCount,
      readingTimeMinutes,
    },
    suggestedTasks,
  };
}

/**
 * 2. Ekstrakcja zadań z notatki (Action Items Extractor)
 */
export function extractActionItemsFromPage(page: WorkspacePage): ExtractedActionItem[] {
  const items: ExtractedActionItem[] = [];

  page.blocks.forEach((b, idx) => {
    // 1. Bloki todo
    if (b.type === 'todo' && b.content.trim()) {
      items.push({
        id: `act-${Date.now()}-${idx}`,
        title: b.content.trim(),
        priority: b.content.toLowerCase().includes('pilne') || b.content.toLowerCase().includes('krytyczn')
          ? 'Krytyczny'
          : 'Wysoki',
        contextSnippet: `Z notatki: ${page.title}`,
      });
    }

    // 2. Listy punktowane zawierające zwroty zadaniowe
    if ((b.type === 'bullet' || b.type === 'number') && b.content.trim()) {
      const lower = b.content.toLowerCase();
      if (
        lower.startsWith('należy') ||
        lower.startsWith('trzeba') ||
        lower.startsWith('zrobić') ||
        lower.startsWith('przygotować') ||
        lower.startsWith('wdrożyć') ||
        lower.startsWith('skontaktować') ||
        lower.startsWith('sprawdzić') ||
        lower.startsWith('napisać') ||
        lower.includes('zadanie:') ||
        lower.includes('todo:')
      ) {
        items.push({
          id: `act-${Date.now()}-${idx}`,
          title: b.content.replace(/^(todo:|zadanie:)\s*/i, '').trim(),
          priority: 'Średni',
          contextSnippet: `Z notatki: ${page.title}`,
        });
      }
    }
  });

  // Jeśli brak jawnych zadań, wygeneruj sensowne z kontekstu notatki
  if (items.length === 0) {
    items.push({
      id: `act-${Date.now()}-1`,
      title: `Przejrzeć i zaktualizować wnioski z: "${page.title}"`,
      priority: 'Średni',
      contextSnippet: `Wdrożenie notatki: ${page.title}`,
    });
    items.push({
      id: `act-${Date.now()}-2`,
      title: `Udostępnić notatkę "${page.title}" zespołowi do akceptacji`,
      priority: 'Niski',
      contextSnippet: `Weryfikacja zespołowa: ${page.title}`,
    });
  }

  return items;
}

/**
 * 3. Generator Szablonu Notatki ze Spotkania (Meeting Notes Generator)
 */
export function createMeetingNotesBlocks(topic: string): DocBlock[] {
  const now = Date.now();
  const dateStr = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    {
      id: `meet-h1-${now}`,
      type: 'h1',
      content: `Notatka ze Spotkania: ${topic}`,
    },
    {
      id: `meet-stats-${now}`,
      type: 'stat_grid',
      content: 'Data Spotkania | Status Ustaleń',
      statValue: `${dateStr} | W trakcie realizacji`,
      statTrend: 'Formatka Studio | Pokoje Zespołów',
    },
    {
      id: `meet-key-${now}`,
      type: 'key_takeaway',
      content: `🏆 **Główny Cel Spotkania:** Omówienie postępów i podjęcie decyzji w obszarze: ${topic}.`,
    },
    {
      id: `meet-callout-${now}`,
      type: 'callout_info',
      content: `👥 **Uczestnicy:** Zespół projektowy, Product Owner, Tech Lead.\n📍 **Kanał:** Pokoje Zespołów (SearchPoint Live).`,
      calloutType: 'info',
    },
    {
      id: `meet-h2-agenda-${now}`,
      type: 'h2',
      content: `📋 Agenda i Przebieg Rozmowy`,
    },
    {
      id: `meet-bullet-1-${now}`,
      type: 'bullet',
      content: `1. Podsumowanie poprzednich ustaleń i weryfikacja wskaźników`,
    },
    {
      id: `meet-bullet-2-${now}`,
      type: 'bullet',
      content: `2. Przegląd bieżących wyzwań i wąskich gardeł w realizacji ${topic}`,
    },
    {
      id: `meet-bullet-3-${now}`,
      type: 'bullet',
      content: `3. Podział odpowiedzialności i plan działania na nadchodzący tydzień`,
    },
    {
      id: `meet-h2-decisions-${now}`,
      type: 'h2',
      content: `⚖️ Tabela Podjętych Decyzji`,
    },
    {
      id: `meet-table-${now}`,
      type: 'table',
      content: 'Decyzje i Ustalenia',
      tableData: [
        ['Obszar', 'Decyzja Zespołu', 'Właściciel Tematu'],
        ['Architektura', 'Akceptacja wdrożenia modułowego', 'Lead Developer'],
        ['Harmonogram', 'Finalizacja wersji roboczej do piątku', 'Project Manager'],
        ['Weryfikacja', 'Testy akceptacyjne i feedback zespołu', 'QA & Zespół'],
      ],
    },
    {
      id: `meet-h2-tasks-${now}`,
      type: 'h2',
      content: `✅ Zadania do Wykonania (Action Items)`,
    },
    {
      id: `meet-todo-1-${now}`,
      type: 'todo',
      content: `Przygotować dokumentację techniczną dla ustaleń ze spotkania: ${topic}`,
      checked: false,
    },
    {
      id: `meet-todo-2-${now}`,
      type: 'todo',
      content: `Rozpisać zadania na tablicy Kanban i przypisać członków zespołu`,
      checked: false,
    },
    {
      id: `meet-ai-prompt-${now}`,
      type: 'ai_prompt',
      content: `Poproś AI o sformułowanie maila podsumowującego to spotkanie do wszystkich uczestników...`,
    },
    {
      id: `meet-sig-${now}`,
      type: 'signature',
      content: `Protokół Spotkania • Zespół Projektowy`,
      timelineDate: dateStr,
    },
  ];
}

/**
 * 4. Audyt jakości i ulepszanie notatki (Quality Audit & Improvement)
 */
export function auditPageQuality(page: WorkspacePage): NoteAuditResult {
  const blocksCount = page.blocks.length;
  const hasH1 = page.blocks.some((b) => b.type === 'h1');
  const hasTakeaway = page.blocks.some((b) => b.type === 'key_takeaway');
  const hasCallout = page.blocks.some((b) => b.type.startsWith('callout'));
  const hasTable = page.blocks.some((b) => b.type === 'table');
  const hasTodo = page.blocks.some((b) => b.type === 'todo');

  let score = 50;
  if (hasH1) score += 10;
  if (hasTakeaway) score += 10;
  if (hasCallout) score += 10;
  if (hasTable) score += 10;
  if (hasTodo) score += 10;
  if (blocksCount >= 8) score += 10;

  score = Math.min(100, score);

  const strengths: string[] = [];
  const improvements: string[] = [];
  const recommendedAdditions: DocBlock[] = [];
  const now = Date.now();

  if (hasH1) strengths.push('Czytelna hierarchia nagłówków i wyraźny temat');
  if (hasTakeaway) strengths.push('Wyróżniony kluczowy wniosek (Key Takeaway)');
  if (hasTodo) strengths.push('Obecność konkretnych zadań do wykonania');
  if (hasTable) strengths.push('Ustrukturyzowane dane w formie tabelarycznej');

  if (!hasTakeaway) {
    improvements.push('Brak bloku Kluczowego Wniosku (@key_takeaway) na początku dokumentu');
    recommendedAdditions.push({
      id: `rec-key-${now}`,
      type: 'key_takeaway',
      content: `🏆 **Kluczowy Wniosek:** Podsumowanie istoty notatki "${page.title}" w jednym konkretnym zdaniu.`,
    });
  }

  if (!hasTodo) {
    improvements.push('Brak listy zadań (Action Items) — warto określić kolejne kroki');
    recommendedAdditions.push({
      id: `rec-todo-${now}`,
      type: 'todo',
      content: `Zweryfikować wnioski z notatki "${page.title}" w praktyce`,
      checked: false,
    });
  }

  if (!hasCallout) {
    improvements.push('Brak wyróżnienia Callout z istotną wskazówką lub kontekstem');
    recommendedAdditions.push({
      id: `rec-callout-${now}`,
      type: 'callout_tip',
      content: `💡 **Wskazówka:** Uzupełnij tę sekcję o praktyczne przykłady lub odnośniki do powiązanych dokumentów.`,
      calloutType: 'tip',
    });
  }

  return {
    pageId: page.id,
    pageTitle: page.title,
    scorePercent: score,
    readabilityRating: score >= 85 ? 'Znakomita' : score >= 65 ? 'Dobra' : 'Wymaga Uzupełnienia',
    strengths,
    improvements,
    recommendedAdditions,
  };
}
