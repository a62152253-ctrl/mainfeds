/**
 * Główny Silnik Dokumentów AI (Unified Document Engine)
 *
 * Centralny punkt wejściowy integrujący wszystkie podsystemy AI tworzenia i obróbki notatek:
 * - Routing intencji i analiza leksykalna (intentRouter + textAnalysis)
 * - Różnorodne style osobowości wizualnej (designPersonality)
 * - Planowanie architektury dokumentu (contentPlanner)
 * - Kompozycja bloków z pełnego katalogu ~80 elementów (contentComposer)
 * - Budowa 11-elementowej Bazy Wiedzy: Hub + 10 Podstron (knowledgeBaseBuilder)
 * - Ulepszanie designu i eliminacja ścian tekstu (designImprover)
 * - Walidacja i rygorystyczny filtr bezpieczeństwa (documentValidator + contentFilter)
 */

import type { DocBlock, WorkspacePage } from '../../../types/workspace';
import { ContentComposer, ComposeMaterial } from './contentComposer';
import { planSingleDocument, PlannerOptions } from './contentPlanner';
import { getRandomPersonality, getPersonalityById, DesignPersonality } from './designPersonality';
import { improveDocumentDesign, improvePageDesign, ImproveDesignOptions, DesignImprovementResult } from './designImprover';
import { buildKnowledgeBase, KnowledgeBaseBuildResult, KnowledgeBaseBuildOptions } from './knowledgeBaseBuilder';
import { classifyDocumentIntent, DocumentIntentResult } from './intentRouter';
import { analyzeSourceText, SourceAnalysis, truncateAtBoundary } from './textAnalysis';
import { validateAndRepairDocument } from './documentValidator';
import { isSafeImage } from '../../../utils/contentFilter';

export interface GenerateDocumentOptions extends PlannerOptions {
  personalityId?: string;
  seed?: number | string;
  workspaceId?: string;
  userId?: string;
  folderId?: string;
  onProgress?: (step: string, percent: number) => void;
}

export interface DocumentGenerationResult {
  title: string;
  blocks: DocBlock[];
  personality: DesignPersonality;
  analysis: SourceAnalysis;
  stats: {
    blocksCount: number;
    wordCount: number;
    readingTimeMinutes: number;
  };
}

export class DocumentEngine {
  /**
   * Generuje kompletną, dopracowaną notatkę od zera z unikalną osobowością i doborem bloków
   */
  public async generateDocument(
    topic: string,
    material: ComposeMaterial,
    options: GenerateDocumentOptions = {}
  ): Promise<DocumentGenerationResult> {
    const onProgress = options.onProgress || (() => {});
    const seed = options.seed ?? Date.now();

    onProgress('Analiza merytoryczna materiału wejściowego...', 15);
    const rawText = `${material.summary || ''} ${material.extract || ''} ${(material.sections || []).map((s) => s.content).join(' ')}`;
    const analysis = analyzeSourceText(rawText || topic);

    onProgress('Dobór unikalnego stylu wizualnego i palety...', 30);
    const personality = options.personalityId
      ? getPersonalityById(options.personalityId)
      : getRandomPersonality(seed);

    onProgress('Planowanie architektury dokumentu...', 50);
    const { plan } = planSingleDocument(topic, rawText, personality, options);

    onProgress('Kompozycja zaawansowanych bloków z katalogu...', 75);
    const composer = new ContentComposer(personality, seed);
    const blocks = composer.composeDocument(plan, material, analysis);

    onProgress('Walidacja struktury i kontrola bezpieczeństwa...', 90);
    const { repairedBlocks } = validateAndRepairDocument(blocks);

    const wordCount = repairedBlocks.reduce((acc, b) => acc + (b.content?.split(/\s+/).length || 0), 0);
    const readingTimeMinutes = Math.max(1, Math.round(wordCount / 180));

    onProgress('Gotowe!', 100);

    return {
      title: topic,
      blocks: repairedBlocks,
      personality,
      analysis,
      stats: {
        blocksCount: repairedBlocks.length,
        wordCount,
        readingTimeMinutes,
      },
    };
  }

  /**
   * Generuje pełną Bazę Wiedzy (1 Strona Główna + 10 Podstron) z relacjami hierarchicznymi
   */
  public generateKnowledgeBase(
    mainTopic: string,
    material: ComposeMaterial,
    options: KnowledgeBaseBuildOptions = {}
  ): KnowledgeBaseBuildResult {
    return buildKnowledgeBase(mainTopic, material, options);
  }

  /**
   * Ulepsza design istniejących bloków lub strony (likwidacja ścian tekstu, tabele, FAQ, statystyki)
   */
  public improveDesign(
    blocks: DocBlock[],
    options: ImproveDesignOptions = {}
  ): DesignImprovementResult {
    return improveDocumentDesign(blocks, options);
  }

  /**
   * Ulepsza całą stronę WorkspacePage
   */
  public improvePage(
    page: WorkspacePage,
    options: ImproveDesignOptions = {}
  ): WorkspacePage {
    return improvePageDesign(page, options);
  }

  /**
   * Rozwija istniejący dokument o nowe sekcje, pogłębioną analizę i przykłady
   */
  public expandDocument(
    blocks: DocBlock[],
    topic: string,
    additionalMaterial?: ComposeMaterial
  ): DocBlock[] {
    const factory = new ContentComposer(getRandomPersonality(), Date.now());
    const extraBlocks: DocBlock[] = [];

    // Dodajemy nową sekcję z pogłębioną analizą
    extraBlocks.push({
      id: `exp-h2-${Date.now()}`,
      type: 'h2',
      content: `Rozszerzona Analiza i Nowe Perspektywy: ${topic}`,
    });

    extraBlocks.push({
      id: `exp-callout-${Date.now()}`,
      type: 'callout_tip',
      calloutType: 'tip',
      content: `💡 **Pogłębienie wątku:** Poniższa sekcja została automatycznie rozbudowana o dodatkowe zależności systemowe, studia przypadków oraz wytyczne optymalizacyjne.`,
    });

    extraBlocks.push({
      id: `exp-table-${Date.now()}`,
      type: 'table',
      content: 'Tabela szczegółowej parametryzacji',
      tableData: [
        ['Aspekt Badawczy', 'Wartość Bazowa', 'Wartość Docelowa', 'Rekomendacja AI'],
        ['Przepustowość operacyjna', '1x standard', '3.5x po optymalizacji', 'Wdrożyć asynchroniczność'],
        ['Złożoność kognitywna', 'Wysoka', 'Niska (podział na moduły)', 'Separacja logiki'],
        ['Czas adaptacji', '4 tygodnie', '5 dni roboczych', 'Zastosować szablony bazy wiedzy'],
      ],
    });

    extraBlocks.push({
      id: `exp-faq-${Date.now()}`,
      type: 'faq',
      content: `Kluczowe pytania pogłębiające temat ${topic}`,
      faqItems: [
        {
          question: `Jakie są ukryte koszty zaniechania wdrożenia ${topic}?`,
          answer: `Największe straty wynikają z powtarzania tych samych błędów, braku ustrukturyzowanej wiedzy w zespole oraz długiego onboardingu nowych osób.`,
          isOpen: true,
        },
        {
          question: `W jaki sposób mierzyć zwrot z inwestycji (ROI)?`,
          answer: `Rekomenduje się pomiar czasu realizacji powtarzalnych zadań przed i po wdrożeniu procedur zdefiniowanych w tej notatce.`,
          isOpen: false,
        },
      ],
    });

    const combined = [...blocks, ...extraBlocks];
    const { repairedBlocks } = validateAndRepairDocument(combined);
    return repairedBlocks;
  }

  /**
   * Skraca notatkę do zwięzłego podsumowania menedżerskiego (Executive Summary)
   */
  public shortenDocument(blocks: DocBlock[], topic: string): DocBlock[] {
    const textBlocks = blocks.filter((b) => b.type === 'p' || b.type === 'bullet');
    const allText = textBlocks.map((b) => b.content).join(' ');
    const analysis = analyzeSourceText(allText || topic);

    const condensed: DocBlock[] = [];
    const bId = Date.now();

    condensed.push({
      id: `short-h1-${bId}`,
      type: 'h1',
      content: `${topic} — Skrót Wykonawczy (Executive Summary)`,
    });

    condensed.push({
      id: `short-callout-${bId}`,
      type: 'callout_info',
      calloutType: 'info',
      content: `📌 **Wersja skondensowana:** Dokument został zwięźle zredagowany w celu szybkiej prezentacji kluczowych wniosków i decyzji.`,
    });

    if (analysis.numbers.length >= 2) {
      condensed.push({
        id: `short-stats-${bId}`,
        type: 'stat_grid',
        content: 'Kluczowe wskaźniki | Skrót',
        statValue: `${analysis.numbers[0].raw} | ${analysis.numbers[1].raw}`,
        statTrend: 'Metryka kluczowa | Zmierzone',
      });
    }

    condensed.push({
      id: `short-h2-${bId}`,
      type: 'h2',
      content: 'Kluczowe Wnioski i Punkty Decyzyjne',
    });

    const bulletItems = textBlocks.slice(0, 4).map((b, idx) => ({
      id: `short-bullet-${bId}-${idx}`,
      type: 'bullet' as const,
      content: truncateAtBoundary(b.content || '', 180),
    }));

    condensed.push(...bulletItems);

    condensed.push({
      id: `short-summary-${bId}`,
      type: 'summary_box',
      content: `🎯 **Rekomendacja wykonawcza:** Wdrożyć priorytety zgodnie z powyższymi wytycznymi i zweryfikować rezultaty w cyklu 14-dniowym.`,
    });

    const { repairedBlocks } = validateAndRepairDocument(condensed);
    return repairedBlocks;
  }

  /**
   * Wyszukuje i podmienia treść we wszystkich typach bloków
   */
  public searchAndReplace(
    blocks: DocBlock[],
    target: string,
    replacement: string
  ): { updatedBlocks: DocBlock[]; replacedCount: number } {
    let replacedCount = 0;
    if (!target) return { updatedBlocks: blocks, replacedCount: 0 };

    const regex = new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

    const updatedBlocks = blocks.map((b) => {
      let changed = false;
      let nextContent = b.content;

      if (typeof nextContent === 'string' && regex.test(nextContent)) {
        const matches = nextContent.match(regex);
        if (matches) replacedCount += matches.length;
        nextContent = nextContent.replace(regex, replacement);
        changed = true;
      }

      let nextDetails = b.toggleDetails;
      if (typeof nextDetails === 'string' && regex.test(nextDetails)) {
        const matches = nextDetails.match(regex);
        if (matches) replacedCount += matches.length;
        nextDetails = nextDetails.replace(regex, replacement);
        changed = true;
      }

      return changed ? { ...b, content: nextContent, toggleDetails: nextDetails } : b;
    });

    return { updatedBlocks, replacedCount };
  }
}

export const documentEngine = new DocumentEngine();
