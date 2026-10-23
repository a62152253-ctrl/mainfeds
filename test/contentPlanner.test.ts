import test from 'node:test';
import assert from 'node:assert/strict';
import {
  planSingleDocument,
  planKnowledgeBaseStructure,
  detectDomainCategory,
} from '../src/features/ai/engine/contentPlanner';
import { getPersonalityById, getRandomPersonality } from '../src/features/ai/engine/designPersonality';
import { analyzeSourceText } from '../src/features/ai/engine/textAnalysis';

test('detectDomainCategory precyzyjnie rozpoznaje domenę wiedzy', () => {
  const techAnalysis = analyzeSourceText('TypeScript i kompilator kodu JavaScript z systemem typów i interfejsów.');
  assert.equal(detectDomainCategory('TypeScript', techAnalysis), 'tech');

  const scienceAnalysis = analyzeSourceText('Biologia molekularna i badania genetyczne nad sekwencjonowaniem DNA.');
  assert.equal(detectDomainCategory('Genetyka', scienceAnalysis), 'science');

  const bizAnalysis = analyzeSourceText('Analiza rynku startupów, wycena LTV/CAC i optymalizacja budżetu.');
  assert.equal(detectDomainCategory('Finanse', bizAnalysis), 'business');

  const historyAnalysis = analyzeSourceText('Bitwa warszawska 1920 roku, traktat pokojowy i geneza konfliktu.');
  assert.equal(detectDomainCategory('Historia Polski', historyAnalysis), 'history');
});

test('planSingleDocument tworzy spójną strukturę sekcji bez powtórzeń', () => {
  const personality = getPersonalityById('editorial');
  const sourceText = 'TypeScript to język programowania wprowadzony przez firmę Microsoft w 2012 roku. Zapewnia silne typowanie statyczne, co zmniejsza liczbę błędów o 38% w dużych projektach produkcyjnych.';
  const { plan } = planSingleDocument('TypeScript', sourceText, personality, { depth: 'standard' });

  assert.equal(plan.title, 'TypeScript');
  assert.ok(plan.sections.length >= 6, 'Powinien zaplanować co najmniej 6 sekcji');

  // Sprawdź obecność kluczowych ról sekcji
  const roles = plan.sections.map((s) => s.role);
  assert.ok(roles.includes('intro'), 'Musi zawierać sekcję intro');
  assert.ok(roles.includes('concepts'), 'Musi zawierać sekcję concepts');
  assert.ok(roles.includes('summary'), 'Musi zawierać sekcję summary');
  assert.ok(roles.includes('comparison'), 'Musi zawierać sekcję comparison');
});

test('planKnowledgeBaseStructure planuje Hub oraz dokładnie 10 dedykowanych podstron', () => {
  const personality = getRandomPersonality(42);
  const sourceText = 'Kompletna baza wiedzy o architekturze oprogramowania, wzorcach projektowych, mikroserwisach i chmurze obliczeniowej.';
  const { plan, subpages } = planKnowledgeBaseStructure('Architektura Systemów', sourceText, personality, { subpageCount: 10 });

  assert.ok(subpages, 'Musi wygenerować tablicę podstron');
  assert.equal(subpages.length, 10, 'Musi zaplanować dokładnie 10 podstron');

  // Sprawdź czy sekcja indexu podstron trafiła do Hubu
  const hasSubpageIndex = plan.sections.some((s) => s.role === 'subpage_index');
  assert.ok(hasSubpageIndex, 'Strona główna Hub musi zawierać sekcję subpage_index');

  // Sprawdź unikalność tytułów podstron
  const titles = new Set(subpages.map((sp) => sp.title));
  assert.equal(titles.size, 10, 'Wszystkie podstrony muszą mieć unikalne tytuły');

  // Każda podstrona musi mieć własne sekcje
  for (const sp of subpages) {
    assert.ok(sp.sections.length >= 3, `Podstrona ${sp.title} musi mieć co najmniej 3 sekcje`);
    assert.ok(sp.purpose.length > 10, `Podstrona ${sp.title} musi mieć opis celu`);
  }
});
