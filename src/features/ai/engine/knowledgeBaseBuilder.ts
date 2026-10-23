/**
 * Kreator Wielostronicowej Bazy Wiedzy (Knowledge Base Builder)
 *
 * Odpowiada za orkiestrację i generowanie pełnej struktury wiedzy:
 * - 1 Strona Główna (Hub / Dokument nadrzędny)
 * - 10 Dedykowanych Podstron z unikalnymi zagadnieniami
 * - Ustanowienie hierarchii (parentPageId na każdej podstronie)
 * - Dwukierunkowe linkowanie wewnętrzne za pomocą tagów [[Nazwa Strony]]
 * - Automatyczne generowanie spisu treści i kart podstron na stronie głównej
 */

import type { WorkspacePage, DocBlock } from '../../../types/workspace';
import { ContentComposer, ComposeMaterial } from './contentComposer';
import { planKnowledgeBaseStructure } from './contentPlanner';
import { getPersonalityById, getRandomPersonality, DesignPersonality } from './designPersonality';
import { SourceAnalysis, analyzeSourceText } from './textAnalysis';
import type { SubpagePlan } from './types';

export interface KnowledgeBaseBuildResult {
  hubPage: WorkspacePage;
  subpages: WorkspacePage[];
  totalBlocksCount: number;
  totalPagesCount: number;
  hierarchySummary: string;
}

export interface KnowledgeBaseBuildOptions {
  personalityId?: string;
  subpageCount?: number; // domyślnie 10
  seed?: number | string;
  workspaceId?: string;
  userId?: string;
  folderId?: string;
}

/**
 * Generuje kompletny zestaw obiektów WorkspacePage (1 Hub + 10 podstron)
 */
export function buildKnowledgeBase(
  mainTopic: string,
  material: ComposeMaterial,
  options: KnowledgeBaseBuildOptions = {}
): KnowledgeBaseBuildResult {
  const seed = options.seed ?? Date.now();
  const personality = options.personalityId
    ? getPersonalityById(options.personalityId)
    : getRandomPersonality(seed);

  const rawText = `${material.summary || ''} ${material.extract || ''} ${(material.sections || []).map((s) => s.content).join(' ')}`;
  const { plan: hubPlan, analysis, subpages: subpagePlans } = planKnowledgeBaseStructure(
    mainTopic,
    rawText,
    personality,
    {
      depth: 'deep_research',
      mode: 'knowledge_base',
      subpageCount: options.subpageCount || 10,
    }
  );

  const actualSubpagePlans: SubpagePlan[] = subpagePlans || [];
  const now = new Date().toISOString();
  const hubId = `kb-hub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const composer = new ContentComposer(personality, seed);

  // 1. Wygeneruj bloki dla Strony Głównej (Hub)
  const hubBlocks = composer.composeDocument(
    hubPlan,
    material,
    analysis,
    {
      subpages: actualSubpagePlans,
    }
  );

  const hubPage: WorkspacePage = {
    id: hubId,
    title: `${mainTopic} — Kompletna Baza Wiedzy`,
    blocks: hubBlocks,
    icon: '📚',
    tags: ['Baza Wiedzy', 'AI', 'Hub', mainTopic],
    createdAt: now,
    updatedAt: now,
    workspaceId: options.workspaceId || 'ws-personal',
    folderId: options.folderId,
    isFavorite: true,
  };

  // 2. Wygeneruj 10 podstron powiązanych z Hubem
  const subpages: WorkspacePage[] = [];
  let totalBlocks = hubBlocks.length;

  for (let i = 0; i < actualSubpagePlans.length; i++) {
    const spPlan = actualSubpagePlans[i];
    const subpageId = `kb-sub-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`;

    // Każda podstrona ma nieco zmodyfikowany styl osobowości dla świeżości
    const subPersonality = getRandomPersonality(typeof seed === 'number' ? seed + i + 1 : `${seed}-${i}`);

    const subComposer = new ContentComposer(subPersonality, typeof seed === 'number' ? seed + i + 1 : `${seed}-${i}`);

    // Materiał dla podstrony wywiedziony z głównego tematu i sekcji planu
    const subMaterial: ComposeMaterial = {
      topic: spPlan.title,
      summary: spPlan.purpose,
      extract: `Kompleksowa podstrona bazy wiedzy poświęcona zagadnieniu: "${spPlan.title}". Zawiera szczegółową analizę, wytyczne techniczne oraz odnośniki do strony głównej [[${hubPage.title}]].`,
      sources: material.sources?.slice(0, 3),
      images: material.images?.slice(i % 2, (i % 2) + 1),
    };

    const subAnalysis: SourceAnalysis = analyzeSourceText(subMaterial.extract || spPlan.title);

    const subpageDocumentPlan = {
      title: spPlan.title,
      topic: spPlan.title,
      purpose: spPlan.purpose,
      sections: spPlan.sections,
      targetBlockCount: 14,
      personalityId: subPersonality.id,
    };

    const subBlocks = subComposer.composeDocument(
      subpageDocumentPlan,
      subMaterial,
      subAnalysis,
      {
        parentTitle: hubPage.title,
      }
    );

    totalBlocks += subBlocks.length;

    const subPage: WorkspacePage = {
      id: subpageId,
      title: spPlan.title,
      blocks: subBlocks,
      icon: getSubpageIcon(i),
      tags: ['Baza Wiedzy', 'Podstrona', mainTopic],
      createdAt: now,
      updatedAt: now,
      parentPageId: hubId, // Bezpośrednie powiązanie hierarchiczne z Hubem
      workspaceId: options.workspaceId || 'ws-personal',
      folderId: options.folderId,
    };

    subpages.push(subPage);
  }

  const hierarchySummary =
    `Wygenerowano Bazę Wiedzy dla "${mainTopic}":\n` +
    `• Strona Główna: "${hubPage.title}" (${hubBlocks.length} bloków)\n` +
    `• ${subpages.length} Podstron tematycznych z relacją hierarchiczną parentPageId:\n` +
    subpages.map((sp, idx) => `  ${idx + 1}. [[${sp.title}]] (${sp.blocks.length} bloków)`).join('\n') +
    `\nŁącznie: ${totalBlocks} bloków w ${subpages.length + 1} powiązanych dokumentach.`;

  return {
    hubPage,
    subpages,
    totalBlocksCount: totalBlocks,
    totalPagesCount: subpages.length + 1,
    hierarchySummary,
  };
}

/**
 * Dobiera ikonę dla kolejnych podstron
 */
function getSubpageIcon(index: number): string {
  const icons = ['🏛️', '⚡', '🛠️', '🔗', '📐', '🧪', '🚀', '⚠️', '💼', '📑'];
  return icons[index % icons.length];
}
