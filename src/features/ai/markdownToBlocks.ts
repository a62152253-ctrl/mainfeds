import { DocBlock, BlockType } from '../../types/workspace';
import { hasAiBlockTags, parseAiBlockTagsToBlocks } from './blockTagParser';
import { BlockFactory, finalizeBlocks } from './engine/blockFactory';
import { validateAndRepairDocument } from './engine/documentValidator';

/**
 * Usuwa surową składnię pogrubienia i kursywy Markdown (`**tekst**`, `__tekst__`, `*tekst*`),
 * zachowując linki wewnętrzne `[[Strona]]` i czysty tekst w polach edytora.
 */
export function cleanMarkdownInlineSyntax(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|\s)\*(?=\S)(.+?)(?<=\S)\*(?=\s|[.,!?;:]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .trim();
}

/**
 * Intelligent Markdown & AI Output to Notion-Style Blocks Parser
 * Converts raw markdown, numbered plans (e.g. `1) **Step**`), bold headers (`**Title**`),
 * and `#TAG#` commands into rich Notion blocks:
 * - h1, h2, h3, h4, lead
 * - key_takeaway, summary_box, pros_cons, callout_tip, callout_info, callout_warning, callout_danger
 * - code, terminal, sql, json, diff, mermaid
 * - table, stat_grid, todo, bullet, number, divider
 */
export function parseMarkdownToNotionBlocks(
  rawText: string,
  customTitle?: string
): { title: string; blocks: DocBlock[] } {
  const factory = new BlockFactory();

  if (!rawText || !rawText.trim()) {
    return {
      title: customTitle || 'Nowa Notatka',
      blocks: [factory.p('')],
    };
  }

  // Jeśli tekst zawiera znaczniki #TAG#...#TAG# (np. #HEADER1#, #TABLE#, #CALLOUT_INFO#), użyj bezpośrednio parsera tagów
  if (hasAiBlockTags(rawText)) {
    const tagged = parseAiBlockTagsToBlocks(rawText, customTitle);
    if (tagged.blocks.length > 0) {
      return {
        title: cleanMarkdownInlineSyntax(tagged.title || customTitle || 'Nowa Notatka'),
        blocks: tagged.blocks,
      };
    }
  }

  // Odfiltruj ewentualne stare stopki typu "Zadaj pytanie lub poproś AI..." / "SearchPoint AI Knowledge Engine"
  const rawLines = rawText
    .split('\n')
    .filter(
      (line) =>
        !/^Zadaj pytanie lub poproś AI o rozwinięcie/i.test(line.trim()) &&
        !/^SearchPoint AI Knowledge Engine$/i.test(line.trim())
    );

  let extractedTitle = customTitle ? cleanMarkdownInlineSyntax(customTitle) : undefined;
  const blocks: DocBlock[] = [];

  // 1. Wyodrębnij tytuł z pierwszych linii (obsługuje `# Tytuł`, `**Tytuł**`, `📄 Tytuł`)
  let startLineIndex = 0;
  if (!extractedTitle) {
    for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
      const line = rawLines[i].trim();
      if (!line) continue;
      if (line.startsWith('# ')) {
        extractedTitle = cleanMarkdownInlineSyntax(line.replace(/^#\s+/, '').replace(/^📄\s*/, ''));
        startLineIndex = i + 1;
        break;
      }
      if (/^\*\*[^*]+\*\*$/.test(line) && line.length <= 120) {
        extractedTitle = cleanMarkdownInlineSyntax(line);
        startLineIndex = i + 1;
        break;
      }
    }
  }

  if (!extractedTitle) {
    for (let i = 0; i < Math.min(rawLines.length, 6); i++) {
      const line = rawLines[i].trim();
      if (line.length > 0 && !line.startsWith('```') && !line.startsWith('>')) {
        extractedTitle = cleanMarkdownInlineSyntax(line.replace(/^#+\s*/, '')).slice(0, 80);
        break;
      }
    }
  }

  extractedTitle = extractedTitle || 'Notatka AI';

  // Dodaj główny nagłówek H1 na początku dokumentu, jeśli jeszcze go nie ma
  let hasH1 = false;

  // 2. Iteracja po liniach i budowa bogatych bloków
  let i = startLineIndex;
  while (i < rawLines.length) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Code block detection ```
    if (trimmed.startsWith('```')) {
      const langMatch = trimmed.match(/^```([a-zA-Z0-9_\-+]*)/);
      const rawLang = langMatch ? langMatch[1].toLowerCase() : '';
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
        i++;
      }

      const codeContent = codeLines.join('\n');
      if (['bash', 'sh', 'shell', 'zsh', 'terminal', 'cmd'].includes(rawLang)) {
        blocks.push(factory.terminal(codeContent));
      } else if (rawLang === 'sql') {
        blocks.push(factory.sql(codeContent));
      } else if (rawLang === 'json') {
        blocks.push(factory.json(codeContent));
      } else if (rawLang === 'mermaid') {
        blocks.push(factory.mermaid('Diagram Architektury', codeContent));
      } else {
        blocks.push(factory.code(codeContent, rawLang || 'typescript'));
      }
      continue;
    }

    // Markdown Table detection (| header | header |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
      const tableRows: string[][] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        const rowLine = rawLines[i].trim();
        if (!/^[|\s-:]+$/.test(rowLine)) {
          const cells = rowLine
            .split('|')
            .slice(1, -1)
            .map((c) => cleanMarkdownInlineSyntax(c.trim()));
          tableRows.push(cells);
        }
        i++;
      }

      if (tableRows.length > 0) {
        blocks.push(factory.table(tableRows, 'Tabela zestawienia'));
      }
      continue;
    }

    // Dividers
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push(factory.divider());
      i++;
      continue;
    }

    // Markdown Headings (#, ##, ###, ####)
    if (trimmed.startsWith('# ')) {
      const h1Text = cleanMarkdownInlineSyntax(trimmed.replace(/^#\s+/, '').replace(/^📄\s*/, ''));
      hasH1 = true;
      blocks.push(factory.h(1, h1Text));
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(factory.h(2, cleanMarkdownInlineSyntax(trimmed.replace(/^##\s+/, ''))));
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      const headingText = cleanMarkdownInlineSyntax(trimmed.replace(/^###\s+/, ''));
      if (/wnioski|takeaways|podsumowanie|kluczowe/i.test(headingText)) {
        const takeawayLines: string[] = [];
        i++;
        while (
          i < rawLines.length &&
          (rawLines[i].trim().startsWith('-') || rawLines[i].trim().startsWith('*') || rawLines[i].trim().startsWith('•'))
        ) {
          takeawayLines.push(cleanMarkdownInlineSyntax(rawLines[i].trim().replace(/^[-*•]\s*/, '')));
          i++;
        }
        blocks.push(
          factory.keyTakeaway(
            takeawayLines.length > 0
              ? `${headingText}:\n` + takeawayLines.map((t) => `• ${t}`).join('\n')
              : headingText
          )
        );
        continue;
      }

      if (/zalety|wady|plusy|minusy|pros|cons/i.test(headingText)) {
        const prosList: string[] = [];
        const consList: string[] = [];
        let currentMode: 'pros' | 'cons' = 'pros';
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('#')) {
          const checkLine = rawLines[i].trim();
          if (/zalety|plusy|pros/i.test(checkLine)) {
            currentMode = 'pros';
          } else if (/wady|minusy|cons/i.test(checkLine)) {
            currentMode = 'cons';
          } else if (checkLine.startsWith('-') || checkLine.startsWith('+') || checkLine.startsWith('*')) {
            const clean = cleanMarkdownInlineSyntax(checkLine.replace(/^[-+*]\s*/, ''));
            if (currentMode === 'pros') prosList.push(clean);
            else consList.push(clean);
          }
          i++;
        }
        blocks.push(
          factory.prosCons(
            prosList.length > 0 ? prosList : ['Kluczowe zalety i mocne strony rozwiązania'],
            consList.length > 0 ? consList : ['Kwestie wymagające uwagi lub ograniczenia']
          )
        );
        continue;
      }

      blocks.push(factory.h(3, headingText));
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push(factory.h(4, cleanMarkdownInlineSyntax(trimmed.replace(/^####\s+/, ''))));
      i++;
      continue;
    }

    // Samodzielna linia pogrubiona: np. `**Najlepszy plan (1): „1-tygodniowy MVP dla realnej sprzedaży”**`
    if (/^\*\*[^*]+\*\*[:?]?$/.test(trimmed) && trimmed.length <= 140) {
      const cleanHeading = cleanMarkdownInlineSyntax(trimmed);
      if (!hasH1 && blocks.length === 0) {
        hasH1 = true;
        blocks.push(factory.h(1, cleanHeading));
      } else {
        blocks.push(factory.h(2, cleanHeading));
      }
      i++;
      continue;
    }

    // Pogrubione podsumowanie / wniosek w jednej linii: np. `**Dlaczego ten plan jest najlepszy:** najszybciej weryfikuje...`
    const boldPrefixMatch = trimmed.match(/^\*\*([^*]{3,70}?)\*\*[:\s—-]+(.+)$/);
    if (boldPrefixMatch) {
      const label = boldPrefixMatch[1].trim();
      const rest = cleanMarkdownInlineSyntax(boldPrefixMatch[2].trim());
      if (/dlaczego|wniosek|podsumowanie|kluczow|cel|rezultat|ważne|wazne|wskazówka|tip|uwaga/i.test(label)) {
        if (/uwaga|ostrzeżenie|ryzyko/i.test(label)) {
          blocks.push(factory.callout('warning', `${label}: ${rest}`));
        } else if (/wskazówka|tip|rada/i.test(label)) {
          blocks.push(factory.callout('tip', `${label}: ${rest}`));
        } else {
          blocks.push(factory.keyTakeaway(`${label}: ${rest}`));
        }
        i++;
        continue;
      }
    }

    // Numerowane nagłówki kroków: np. `1) **Zdefiniuj problem i wynik (1–2h)**` lub `1. **Zidentyfikuj 1 segment...**`
    const numberedStepHeadingMatch = trimmed.match(/^(\d+)[.)]\s+\*\*([^*]+)\*\*\s*(.*)$/);
    if (numberedStepHeadingMatch) {
      const stepNum = numberedStepHeadingMatch[1];
      const stepTitle = cleanMarkdownInlineSyntax(numberedStepHeadingMatch[2]);
      const trailing = cleanMarkdownInlineSyntax(numberedStepHeadingMatch[3] || '');

      // Sprawdź, czy pod tym krokiem znajdują się podpunkty (`- ...` lub `• ...`)
      let lookahead = i + 1;
      while (lookahead < rawLines.length && !rawLines[lookahead].trim()) lookahead++;
      const nextLine = lookahead < rawLines.length ? rawLines[lookahead].trim() : '';
      const followedByBullets = /^[-*•]\s+/.test(nextLine);

      if (followedByBullets || !trailing) {
        blocks.push(factory.h(2, `${stepNum}. ${stepTitle}${trailing ? ` ${trailing}` : ''}`));
      } else {
        blocks.push(...factory.numbered([`${stepTitle}${trailing.startsWith(':') || trailing.startsWith('—') ? trailing : ` — ${trailing}`}`]));
      }
      i++;
      continue;
    }

    // Callout / Blockquotes (> or > [!NOTE])
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      let calloutType: 'info' | 'tip' | 'warning' | 'danger' | 'success' = 'info';
      let isKeyTakeaway = false;

      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        let qLine = rawLines[i].trim().replace(/^>\s?/, '');
        if (/\[!NOTE\]|\[!INFO\]/i.test(qLine)) {
          calloutType = 'info';
          qLine = qLine.replace(/\[!(NOTE|INFO)\]/i, '').trim();
        } else if (/\[!TIP\]/i.test(qLine)) {
          calloutType = 'tip';
          qLine = qLine.replace(/\[!TIP\]/i, '').trim();
        } else if (/\[!WARNING\]/i.test(qLine)) {
          calloutType = 'warning';
          qLine = qLine.replace(/\[!WARNING\]/i, '').trim();
        } else if (/\[!DANGER\]|\[!CAUTION\]/i.test(qLine)) {
          calloutType = 'danger';
          qLine = qLine.replace(/\[!(DANGER|CAUTION)\]/i, '').trim();
        } else if (/🏆|Kluczowy wniosek|Kluczowy cel|Sukces/i.test(qLine)) {
          isKeyTakeaway = true;
        }
        if (qLine) quoteLines.push(cleanMarkdownInlineSyntax(qLine));
        i++;
      }

      const combined = quoteLines.join('\n');
      if (isKeyTakeaway) {
        blocks.push(factory.keyTakeaway(combined));
      } else {
        blocks.push(factory.callout(calloutType, combined));
      }
      continue;
    }

    // Todo / Checkbox (- [ ] or - [x])
    if (/^[-*]\s+\[([ xX])\]\s+/.test(trimmed)) {
      const isChecked = /^[-*]\s+\[[xX]\]/.test(trimmed);
      const text = cleanMarkdownInlineSyntax(trimmed.replace(/^[-*]\s+\[([ xX])\]\s+/, ''));
      blocks.push(factory.todo(text, isChecked));
      i++;
      continue;
    }

    // Bullet List (- or * or •)
    if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push(factory.bullet(cleanMarkdownInlineSyntax(trimmed.replace(/^[-*•]\s+/, ''))));
      i++;
      continue;
    }

    // Numbered List (`1. tekst` lub `1) tekst`)
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const itemText = cleanMarkdownInlineSyntax(trimmed.replace(/^\d+[.)]\s+/, ''));
      blocks.push(...factory.numbered([itemText]));
      i++;
      continue;
    }

    // Inlined callout tips (💡, ⚠️, ℹ️, 🚨)
    if (trimmed.startsWith('💡') || trimmed.toLowerCase().startsWith('wskazówka:')) {
      blocks.push(factory.callout('tip', cleanMarkdownInlineSyntax(trimmed)));
      i++;
      continue;
    }
    if (trimmed.startsWith('⚠️') || trimmed.toLowerCase().startsWith('uwaga:')) {
      blocks.push(factory.callout('warning', cleanMarkdownInlineSyntax(trimmed)));
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push(factory.p(cleanMarkdownInlineSyntax(trimmed)));
    i++;
  }

  // Jeśli dokument nie ma nagłówka H1, dodaj go na górze
  if (!hasH1 && extractedTitle) {
    blocks.unshift(factory.h(1, extractedTitle));
  }

  // Ensure there is at least one content block
  if (blocks.length === 0) {
    blocks.push(factory.p(cleanMarkdownInlineSyntax(rawText)));
  }

  const finalized = finalizeBlocks(blocks);
  const { repairedBlocks } = validateAndRepairDocument(finalized);

  return {
    title: extractedTitle,
    blocks: repairedBlocks,
  };
}
