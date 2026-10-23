/**
 * Planista struktury dokumentu (Content Planner)
 *
 * Odpowiada za analizę materiału wejściowego i wyznaczenie architektury dokumentu:
 * - podział na logiczne sekcje z przypisaniem typów bloków z katalogu ~80 bloków,
 * - identyfikację kluczowych metryk (stat_grid), definicji (callout), tabel, diagramów i checklist,
 * - planowanie bazy wiedzy (Hub + 10 dedykowanych podstron) dla rozbudowanych tematów,
 * - eliminację monotonii (unika powtarzania tego samego typu bloku pod rząd).
 */

import type { BlockType } from '../../../types/workspace';
import type { DesignPersonality } from './designPersonality';
import { analyzeSourceText, SourceAnalysis } from './textAnalysis';
import type { DocumentPlan, PlanSection, SubpagePlan } from './types';

export interface PlannerOptions {
  depth?: 'quick_note' | 'standard' | 'deep_research';
  mode?: 'single_page' | 'knowledge_base';
  targetBlockCount?: number;
  subpageCount?: number; // domyślnie 10 dla bazy wiedzy
  includeVisuals?: boolean;
  includeCode?: boolean;
  includeFaq?: boolean;
  includeMermaid?: boolean;
}

export interface PlannedDocumentStructure {
  plan: DocumentPlan;
  analysis: SourceAnalysis;
  subpages?: SubpagePlan[];
}

/**
 * Rozpoznaje kategorię dziedzinową na podstawie analizy leksykalnej
 */
export function detectDomainCategory(topic: string, analysis: SourceAnalysis): 'tech' | 'science' | 'business' | 'history' | 'general' {
  const text = `${topic} ${analysis.keywords.join(' ')}`.toLowerCase();

  if (/(programow|typescript|javascript|react|kod|api|architektur|funkcj|kompil|framework|sql|baz danych|devops|docker|git)/.test(text)) {
    return 'tech';
  }
  if (/(badani|naukow|biolog|genetyk|genetycz|genom|medycyn|fizyk|chemicz|eksperyment|gatunk|zwierz|organizm|dna|ewolucj)/.test(text)) {
    return 'science';
  }
  if (/(biznes|finans|rynek|inwestycj|strategi|koszt|zysk|kpi|startup|klient|sprzeda|przychod)/.test(text)) {
    return 'business';
  }
  if (/(wiek|histori|rok|dynasti|wojn|powstani|traktat|starożytn|średniowiecz|kultur)/.test(text)) {
    return 'history';
  }
  return 'general';
}

/**
 * Planuje architekturę pojedynczego dokumentu na podstawie analizy materiału
 */
export function planSingleDocument(
  topic: string,
  rawSourceText: string,
  personality: DesignPersonality,
  options: PlannerOptions = {}
): PlannedDocumentStructure {
  const analysis = analyzeSourceText(rawSourceText || topic);
  const domain = detectDomainCategory(topic, analysis);
  const depth = options.depth || 'standard';

  const sections: PlanSection[] = [];

  // 1. Sekcja wprowadzająca (Hero / Executive Summary)
  sections.push({
    title: 'Wprowadzenie i Teza Główna',
    level: 1,
    role: 'intro',
    suggestedBlocks: [
      'h1',
      'lead',
      personality.calloutStyle === 'quote' ? 'quote' : 'callout_info',
    ],
    priority: 1,
  });

  // 2. Jeśli wykryto liczby lub kluczowe wskaźniki -> Stat Grid / KPI
  if (analysis.numbers.length >= 2 || domain === 'business' || domain === 'tech') {
    sections.push({
      title: 'Kluczowe Wskaźniki i Metryki',
      level: 2,
      role: 'stats',
      suggestedBlocks: ['h2', 'stat_grid'],
      priority: 2,
    });
  }

  // 3. Rdzeń merytoryczny: Kluczowe koncepcje i definicje
  sections.push({
    title: 'Fundamenty i Kluczowe Pojęcia',
    level: 2,
    role: 'concepts',
    suggestedBlocks: [
      'h2',
      'p',
      personality.calloutStyle === 'tip' ? 'callout_tip' : 'callout_info',
      'bullet',
    ],
    priority: 1,
  });

  // 4. Diagram / Architektura / Przebieg procesowy (Mermaid lub Timeline)
  if (options.includeMermaid !== false && (domain === 'tech' || domain === 'science' || domain === 'business')) {
    sections.push({
      title: 'Architektura i Przepływ Informacji',
      level: 2,
      role: 'architecture',
      suggestedBlocks: ['h2', 'mermaid', 'p'],
      priority: 2,
    });
  } else if (analysis.dates.length >= 2 || domain === 'history') {
    sections.push({
      title: 'Oś Czasu i Chronologia Wydarzeń',
      level: 2,
      role: 'timeline',
      suggestedBlocks: ['h2', 'timeline', 'timeline'],
      priority: 2,
    });
  }

  // 5. Analiza porównawcza / Tabela / Za i przeciw
  if (personality.preferredTable === 'decision_matrix' || domain === 'business') {
    sections.push({
      title: 'Macierz Decyzyjna i Kryteria Wyboru',
      level: 2,
      role: 'comparison',
      suggestedBlocks: ['h2', 'table', 'p'],
      priority: 2,
    });
  } else {
    sections.push({
      title: 'Zestawienie Porównawcze i Analiza',
      level: 2,
      role: 'comparison',
      suggestedBlocks: ['h2', 'table', 'pros_cons'],
      priority: 2,
    });
  }

  // 6. Kod lub Praktyczna implementacja (dla domen technicznych)
  if (domain === 'tech' || options.includeCode) {
    sections.push({
      title: 'Implementacja Praktyczna i Wzorce Kodu',
      level: 2,
      role: 'implementation',
      suggestedBlocks: ['h2', 'p', 'code', 'callout_tip'],
      priority: 1,
    });
  }

  // 7. Plan Działania / Checklisty / Następne Kroki
  sections.push({
    title: 'Plan Działania i Checklista Wdrożeniowa',
    level: 2,
    role: 'action_plan',
    suggestedBlocks: ['h2', 'todo', 'todo', 'todo', 'todo'],
    priority: 2,
  });

  // 8. FAQ / Najczęstsze Pytania i Odpowiedzi (dla pełnych opracowań)
  if (options.includeFaq !== false && (depth === 'deep_research' || depth === 'standard')) {
    sections.push({
      title: 'Często Zadawane Pytania (FAQ)',
      level: 2,
      role: 'faq',
      suggestedBlocks: ['h2', 'faq'],
      priority: 3,
    });
  }

  // 9. Podsumowanie i Wnioski
  sections.push({
    title: 'Podsumowanie i Kluczowe Wnioski',
    level: 2,
    role: 'summary',
    suggestedBlocks: [
      'h2',
      'key_takeaway',
      'summary_box',
      'divider',
    ],
    priority: 1,
  });

  // Obliczenie docelowej liczby bloków
  const targetBlockCount = options.targetBlockCount ||
    (depth === 'deep_research' ? 24 : depth === 'standard' ? 16 : 10);

  const plan: DocumentPlan = {
    title: topic,
    topic,
    purpose: `Wyczerpujące opracowanie tematu "${topic}" w stylu ${personality.name}.`,
    sections,
    targetBlockCount,
    personalityId: personality.id,
  };

  return { plan, analysis };
}

/**
 * Szablony 10 podstron dla bazy wiedzy zależnie od domeny
 */
const DOMAIN_SUBPAGE_BLUEPRINTS: Record<
  'tech' | 'science' | 'business' | 'history' | 'general',
  Array<{ titleSuffix: string; role: string; desc: string }>
> = {
  tech: [
    { titleSuffix: 'Architektura i Fundamenty', role: 'foundations', desc: 'Podstawowe zasady, model pamięci i główne komponenty systemu.' },
    { titleSuffix: 'Zaawansowany System Typów i Wzorców', role: 'types', desc: 'Zaawansowane reguły, wnioskowanie i prewencja błędów.' },
    { titleSuffix: 'Konfiguracja Środowiska i Narzędzia', role: 'tooling', desc: 'Narzędzia kompilatora, linery, bundlery i optymalizacja setupu.' },
    { titleSuffix: 'Integracja z Ekosystemem i Bibliotekami', role: 'ecosystem', desc: 'Współpraca z frameworkami, zewnętrznymi API i bazami danych.' },
    { titleSuffix: 'Wzorce Projektowe i Dobra Architektura', role: 'patterns', desc: 'Wzorce architektoniczne, modularność i zasady SOLID.' },
    { titleSuffix: 'Testowanie, Jakość i Bezpieczeństwo', role: 'testing', desc: 'Testy jednostkowe, integracyjne, audyt bezpieczeństwa i lintery.' },
    { titleSuffix: 'Wydajność, Profilowanie i Skalowalność', role: 'performance', desc: 'Optymalizacja kompilacji, zużycia pamięci i czasu wykonania.' },
    { titleSuffix: 'Częste Błędy i Antywzorce (Anti-Patterns)', role: 'pitfalls', desc: 'Najpopularniejsze pułapki, jak ich unikać i metody debugowania.' },
    { titleSuffix: 'Przykłady Projektowe Real-World', role: 'case_studies', desc: 'Studia przypadków z produkcji, architektura mikroserwisów i aplikacji.' },
    { titleSuffix: 'Cheat Sheet, Komendy i Skróty', role: 'cheatsheet', desc: 'Szybka ściągawka, tabele składni, skróty i FAQ programisty.' },
  ],
  science: [
    { titleSuffix: 'Metodologia Badań i Podstawy Teoretyczne', role: 'foundations', desc: 'Aparatura pojęciowa, hipotezy badawcze i modele matematyczne.' },
    { titleSuffix: 'Przegląd Literatury i Stan Wiedzy', role: 'literature', desc: 'Kluczowe publikacje recenzowane, historia odkrycia i autorytety.' },
    { titleSuffix: 'Klasyfikacja i Systematyka Zjawisk', role: 'taxonomy', desc: 'Kategorie, cechy dystynktywne i macierz podziału.' },
    { titleSuffix: 'Mechanizmy Fizykochemiczne i Procesy', role: 'mechanisms', desc: 'Szczegółowy opis zjawisk na poziomie molekularnym i makro.' },
    { titleSuffix: 'Dane Doświadczalne i Analiza Empiryczna', role: 'data', desc: 'Wyniki pomiarów, rozkłady statystyczne i przedziały ufności.' },
    { titleSuffix: 'Modele Matematyczne i Symulacje', role: 'models', desc: 'Równania różniczkowe, aproksymacje i wyniki symulacji numerycznych.' },
    { titleSuffix: 'Zastosowania Praktyczne i Przemysłowe', role: 'applications', desc: 'Wdrożenia laboratoryjne, patenty i komercjalizacja technologii.' },
    { titleSuffix: 'Ograniczenia i Debaty Naukowe', role: 'debates', desc: 'Nierozwiązane problemy, anomalie i polemiki w środowisku badaczy.' },
    { titleSuffix: 'Wpływ Środowiskowy i Etyczny', role: 'ethics', desc: 'Oddziaływanie na ekosystem, bioetyka i standardy zrównoważonego rozwoju.' },
    { titleSuffix: 'Glosariusz Pojęć, Wzory i Źródła', role: 'glossary', desc: 'Kompletny słownik terminologiczny, wzory i baza źródeł z DOI.' },
  ],
  business: [
    { titleSuffix: 'Analiza Rynku i Otoczenia Konkurencyjnego', role: 'market', desc: 'Wielkość rynku TAM/SAM/SOM, konkurenci i bariery wejścia.' },
    { titleSuffix: 'Model Biznesowy i Strumienie Przychodów', role: 'business_model', desc: 'Monetyzacja, struktura marży i unit economics (LTV/CAC).' },
    { titleSuffix: 'Segmentacja Klientów i Persony Zakupowe', role: 'customers', desc: 'Profile odbiorców, potrzeby, motywacje i mapa empatii.' },
    { titleSuffix: 'Strategia Marketingowa i Go-to-Market', role: 'marketing', desc: 'Kanały akwizycji, lejek konwersji i pozycjonowanie marki.' },
    { titleSuffix: 'Operacje, Łańcuch Dostaw i Procesy', role: 'operations', desc: 'Optymalizacja kosztowa, dostawcy i procedury SLA.' },
    { titleSuffix: 'Metryki KPI, Finanse i Budżetowanie', role: 'kpi_finance', desc: 'P&L, cash flow, runway, wskaźniki rentowności i tabele KPI.' },
    { titleSuffix: 'Zarządzanie Ryzykiem i Zgodność Prawna', role: 'risk_legal', desc: 'Rejestr ryzyk, RODO/GDPR, umowy i plany ciągłości działania.' },
    { titleSuffix: 'Struktura Organizacyjna i Zespół', role: 'team_hr', desc: 'Ramy ról, rekrutacja, kultura organizacyjna i system motywacyjny.' },
    { titleSuffix: 'Plan Skalowania i Ekspansji Zagranicznej', role: 'scaling', desc: 'Wchodzenie na nowe rynki, partnerstwa strategiczne i M&A.' },
    { titleSuffix: 'Playbook Operacyjny i Szablony Umów', role: 'playbook', desc: 'Szablony dokumentów, checklisty audytowe i protokoły decyzji.' },
  ],
  history: [
    { titleSuffix: 'Geneza, Tło Epoki i Przyczyny', role: 'origins', desc: 'Sytuacja społeczno-polityczna, uwarunkowania gospodarcze i katalizatory.' },
    { titleSuffix: 'Kluczowe Postacie i Przywódcy', role: 'biographies', desc: 'Biogramy, motywacje, decyzje i wpływ na losy wydarzeń.' },
    { titleSuffix: 'Przebieg Chronologiczny i Kampanie', role: 'chronology', desc: 'Kalendarium dzień po dniu, bitwy, traktaty i punkty zwrotne.' },
    { titleSuffix: 'Aspekty Społeczne i Życie Codzienne', role: 'society', desc: 'Losy ludności cywilnej, warunki bytowe, demografia i kultura.' },
    { titleSuffix: 'Gospodarka Wojenna i Finansowanie', role: 'economy', desc: 'Podatki, produkcja, inflacja, zaopatrzenie i handel.' },
    { titleSuffix: 'Dokumenty Źródłowe, Traktaty i Relacje', role: 'sources', desc: 'Analiza tekstów źródłowych, manifestów, pamiętników i korespondencji.' },
    { titleSuffix: 'Wpływ Międzynarodowy i Dyplomacja', role: 'diplomacy', desc: 'Sojusze, gry mocarstw, konferencje pokojowe i granice.' },
    { titleSuffix: 'Skutki Długofalowe i Dziedzictwo', role: 'consequences', desc: 'Przemiany ustrojowe, ewolucja granic, pamięć zbiorowa i tożsamość.' },
    { titleSuffix: 'Historiografia, Mity i Kontrowersje', role: 'historiography', desc: 'Różnice w interpretacjach historyków polskich i zagranicznych.' },
    { titleSuffix: 'Kalendarium, Mapy i Bibliografia', role: 'references', desc: 'Kompletna oś czasu, wykaz źródeł archiwalnych i literatura.' },
  ],
  general: [
    { titleSuffix: 'Wprowadzenie i Podstawowe Pojęcia', role: 'foundations', desc: 'Geneza, definicje i ramy pojęciowe zagadnienia.' },
    { titleSuffix: 'Struktura, Elementy i Organizacja', role: 'structure', desc: 'Budowa wewnętrzna, relacje między częściami i klasyfikacja.' },
    { titleSuffix: 'Zastosowania Praktyczne i Metody', role: 'methods', desc: 'Jak stosować wiedzę w praktyce krok po kroku.' },
    { titleSuffix: 'Porównanie Metod i Alternatyw', role: 'alternatives', desc: 'Zalety, wady, ograniczenia i zestawienia tabelaryczne.' },
    { titleSuffix: 'Kluczowe Zasady i Najlepsze Praktyki', role: 'best_practices', desc: 'Złote reguły, standardy branżowe i wytyczne jakości.' },
    { titleSuffix: 'Narzędzia, Zasoby i Środowisko', role: 'tools', desc: 'Oprogramowanie, literatura i niezbędne wyposażenie.' },
    { titleSuffix: 'Częste Błędy i Jak Ich Unikać', role: 'mistakes', desc: 'Analiza typowych potknięć i strategie zapobiegawcze.' },
    { titleSuffix: 'Studia Przypadków i Przykłady', role: 'case_studies', desc: 'Rzeczywiste przykłady sukcesów i wyciągnięte lekcje.' },
    { titleSuffix: 'Trendy Rozwojowe i Przyszłość', role: 'future', desc: 'Kierunki ewolucji, nowe technologie i prognozy na kolejne lata.' },
    { titleSuffix: 'Przewodnik Szybki, FAQ i Źródła', role: 'faq_summary', desc: 'Najczęstsze pytania, skrót wiedzy i polecane materiały.' },
  ],
};

/**
 * Planuje strukturę Bazy Wiedzy: Strona Główna (Hub) + 10 Dedykowanych Podstron
 */
export function planKnowledgeBaseStructure(
  mainTopic: string,
  rawSourceText: string,
  personality: DesignPersonality,
  options: PlannerOptions = {}
): PlannedDocumentStructure {
  const single = planSingleDocument(mainTopic, rawSourceText, personality, options);
  const domain = detectDomainCategory(mainTopic, single.analysis);
  const blueprints = DOMAIN_SUBPAGE_BLUEPRINTS[domain];

  const subpageCount = Math.min(blueprints.length, options.subpageCount || 10);
  const pickedBlueprints = blueprints.slice(0, subpageCount);

  const subpages: SubpagePlan[] = pickedBlueprints.map((bp, index) => {
    const subpageTitle = `${mainTopic}: ${bp.titleSuffix}`;
    const slug = `${mainTopic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${bp.role}`;

    // Każda podstrona ma zaplanowane unikalne sekcje i bloki
    const subSections: PlanSection[] = [
      {
        title: bp.titleSuffix,
        level: 1,
        role: 'subpage_hero',
        suggestedBlocks: ['h1', 'lead', 'callout_info'],
        priority: 1,
      },
      {
        title: 'Szczegółowe Omówienie i Kontekst',
        level: 2,
        role: 'deep_dive',
        suggestedBlocks: ['h2', 'p', 'bullet', 'bullet'],
        priority: 1,
      },
      {
        title: bp.role === 'cheatsheet' || bp.role === 'glossary' ? 'Zestawienie i Tabele Referencyjne' : 'Analiza i Przykłady Praktyczne',
        level: 2,
        role: 'analysis',
        suggestedBlocks: ['h2', 'table', 'callout_tip'],
        priority: 2,
      },
      {
        title: 'Podsumowanie i Powiązania z Hubem',
        level: 2,
        role: 'subpage_summary',
        suggestedBlocks: ['h2', 'key_takeaway', 'divider'],
        priority: 2,
      },
    ];

    return {
      title: subpageTitle,
      slug,
      purpose: bp.desc,
      sections: subSections,
      targetBlockCount: 14,
      crossReferences: [mainTopic],
    };
  });

  // Dodajemy sekcję nawigacyjną z odnośnikami do wszystkich 10 podstron w Hubie
  single.plan.sections.splice(2, 0, {
    title: `Kompletna Baza Wiedzy — 10 Podstron Tematycznych`,
    level: 2,
    role: 'subpage_index',
    suggestedBlocks: [
      'h2',
      'callout_info',
      ...Array(subpages.length).fill('bullet' as BlockType),
    ],
    priority: 1,
  });

  return {
    plan: single.plan,
    analysis: single.analysis,
    subpages,
  };
}
