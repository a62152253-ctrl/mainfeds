/**
 * Silnik Ulepszania Designu i Formatowania (Design Improver)
 *
 * Przekształca surowe, monotonne notatki w nowoczesne, estetycznie dopracowane dokumenty.
 *
 * Zasady działania:
 * - Likwiduje ściany tekstu (zamiana długich akapitów na callouty, karty, gridy statystyk).
 * - Konwertuje listy zalet i wad na natywne bloki `pros_cons`.
 * - Konwertuje pytania i odpowiedzi na interaktywne akordeony `faq`.
 * - Konwertuje wyliczenia kroków na checklisty `todo` lub numerowane sekcje.
 * - Stosuje zróżnicowane style wizualne (DesignPersonality) przy każdym uruchomieniu.
 * - BEZWZGLĘDNA ZASADA: Nigdy nie usuwa merytorycznej treści ani kodu użytkownika.
 */

import type { DocBlock, BlockType, WorkspacePage } from '../../../types/workspace';
import { BlockFactory, finalizeBlocks } from './blockFactory';
import { DesignPersonality, getRandomPersonality, getPersonalityById } from './designPersonality';
import { validateAndRepairDocument } from './documentValidator';
import { extractNumbers, extractDates, chunkParagraph, stripInlineMarkdown } from './textAnalysis';

export interface ImproveDesignOptions {
  personalityId?: string;
  seed?: number | string;
  accentColor?: string;
  splitLongParagraphs?: boolean;
}

export interface DesignImprovementResult {
  improvedBlocks: DocBlock[];
  appliedPersonality: DesignPersonality;
  stats: {
    originalBlocksCount: number;
    improvedBlocksCount: number;
    wallsOfTextEliminated: number;
    blocksUpgradedCount: number;
  };
}

/**
 * Główna funkcja ulepszająca design bloków dokumentu
 */
export function improveDocumentDesign(
  blocks: DocBlock[],
  options: ImproveDesignOptions = {}
): DesignImprovementResult {
  const seed = options.seed ?? Date.now();
  const personality = options.personalityId
    ? getPersonalityById(options.personalityId)
    : getRandomPersonality(seed);

  const factory = new BlockFactory();
  const output: DocBlock[] = [];

  let wallsEliminated = 0;
  let upgradedCount = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const content = block.content || '';

    // 1. Zwykły akapit (p) — sprawdź czy nie jest ścianą tekstu
    if (block.type === 'p') {
      const isWallOfText = content.length > 350;

      if (isWallOfText && options.splitLongParagraphs !== false) {
        wallsEliminated++;
        upgradedCount++;

        // Sprawdź czy zawiera liczby kwalifikujące się na statystykę
        const numbers = extractNumbers(content);
        if (numbers.length >= 1 && i < 4) {
          const second = numbers[1] || { raw: '100%', value: 100 };
          output.push(factory.statGrid([
            { label: 'Główny parametr', value: numbers[0].raw, trend: 'Wskaźnik kluczowy' },
            { label: 'Wartość odniesienia', value: second.raw, trend: 'Zmierzone' },
          ]));
        }

        // Sprawdź czy nie jest to definicja lub kluczowa zasada
        if (/^(definicja|kluczow|warto pamiętać|zasada|uwaga|ważne)/i.test(content.trim())) {
          output.push(factory.callout('info', content));
        } else {
          // Rozbij ścianę tekstu na 2 zwięzłe akapity
          const chunks = chunkParagraph(content, 260);
          for (const ch of chunks) {
            output.push(factory.p(ch));
          }
        }
        continue;
      }

      // Wykrycie cytatu ze źródła
      if (/^["„”].*["„”]/.test(content.trim()) && content.length < 250) {
        output.push(factory.quote(content.replace(/["„”]/g, '').trim()));
        upgradedCount++;
        continue;
      }

      output.push(block);
      continue;
    }

    // 2. Wykrywanie zalet i wad w blokach tekstowych lub listach
    if (block.type === 'bullet' || block.type === 'p') {
      if (/zalety|korzyści|plusy/i.test(content) && i + 1 < blocks.length) {
        // Sprawdź czy kolejny blok to wady
        const nextBlock = blocks[i + 1];
        if (/wady|minusy|zagrożenia/i.test(nextBlock.content || '')) {
          output.push(factory.prosCons(
            [content.replace(/^(zalety|korzyści|plusy):?/i, '').trim() || 'Wysoka elastyczność i jakość'],
            [nextBlock.content.replace(/^(wady|minusy|zagrożenia):?/i, '').trim() || 'Wymaga początkowego nakładu pracy']
          ));
          upgradedCount++;
          i++; // pomiń kolejny blok, bo został zintegrowany
          continue;
        }
      }
    }

    // 3. Sprawdź format pytań i odpowiedzi (Q&A -> FAQ)
    if ((block.type === 'h3' || block.type === 'p') && content.endsWith('?') && i + 1 < blocks.length) {
      const answerBlock = blocks[i + 1];
      if (answerBlock.type === 'p') {
        output.push(factory.faq(content, [{
          question: content,
          answer: answerBlock.content || 'Brak dodatkowego opisu.',
        }]));
        upgradedCount++;
        i++; // pomijamy odpowiedź, bo weszła do akordeonu
        continue;
      }
    }

    // 4. Zachowaj istniejące bloki specjalistyczne bez utraty danych
    output.push(block);
  }

  // Dodaj elegancki separator i podsumowanie na końcu
  if (output.length > 3 && !output.some((b) => b.type === 'divider')) {
    output.push(factory.divider());
    output.push(factory.keyTakeaway('Dokument zoptymalizowany pod kątem czytelności i przejrzystości struktury.'));
  }

  const finalized = finalizeBlocks(output);
  const { repairedBlocks } = validateAndRepairDocument(finalized);

  return {
    improvedBlocks: repairedBlocks,
    appliedPersonality: personality,
    stats: {
      originalBlocksCount: blocks.length,
      improvedBlocksCount: repairedBlocks.length,
      wallsOfTextEliminated: wallsEliminated,
      blocksUpgradedCount: upgradedCount,
    },
  };
}

/**
 * Ulepsza design całej strony WorkspacePage
 */
export function improvePageDesign(
  page: WorkspacePage,
  options: ImproveDesignOptions = {}
): WorkspacePage {
  const { improvedBlocks, appliedPersonality } = improveDocumentDesign(page.blocks || [], options);

  return {
    ...page,
    blocks: improvedBlocks,
    updatedAt: new Date().toISOString(),
    tags: Array.from(new Set([...(page.tags || []), 'Ulepszony Design', appliedPersonality.name])),
  };
}
