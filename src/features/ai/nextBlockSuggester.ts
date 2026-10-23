/**
 * Inteligentny Silnik Rekomendacji Kolejnego Bloku (Next-Block Smart Suggester)
 * Analizuje bieżący blok, typ strony (Meeting, Project, Research, TaskList, Note, itp.)
 * oraz historię dokumentu, podpowiadając użytkownikowi najbardziej logiczny,
 * produktywny i ergonomiczny kolejny krok w edytorze.
 */

import { BlockType, DocBlock, PageType } from '../../types/workspace';

export interface NextBlockSuggestion {
  type: BlockType;
  label: string;
  icon: string;
  category: 'popular' | 'text' | 'data' | 'action' | 'ai' | 'meeting' | 'project';
  reason: string;
  description: string;
  defaultBlock: Partial<DocBlock>;
}

export interface SuggesterContext {
  currentBlock?: DocBlock;
  pageType?: PageType;
  allBlocks?: DocBlock[];
  blockIndex?: number;
}

/**
 * Zwraca 3-4 najbardziej trafne rekomendacje następnego bloku
 */
export function getSuggestedNextBlocks(ctx: SuggesterContext): NextBlockSuggestion[] {
  const { currentBlock, pageType = 'Document', allBlocks = [], blockIndex = 0 } = ctx;
  const currentType = currentBlock?.type || 'p';
  const content = (currentBlock?.content || '').toLowerCase();

  // 1. Rekomendacje dla strony SPOTKANIE (Meeting)
  if (pageType === 'Meeting') {
    if (currentType === 'h1' || blockIndex === 0) {
      return [
        {
          type: 'event_schedule',
          label: 'Agenda Czasowa',
          icon: '⏱️',
          category: 'meeting',
          reason: 'Zaplanuj ramy czasowe i punkty dyskusji',
          description: 'Harmonogram 00:00 - 01:00 z prelegentami',
          defaultBlock: {
            type: 'event_schedule',
            content: 'Wprowadzenie i status prac',
            eventScheduleData: {
              timeStart: '10:00',
              timeEnd: '10:15',
              title: 'Wprowadzenie i omówienie celów',
              speakerOrLead: 'Prowadzący',
              roomOrLink: 'Google Meet / Sala 1',
            },
          },
        },
        {
          type: 'callout_info',
          label: 'Cel Spotkania',
          icon: '🎯',
          category: 'meeting',
          reason: 'Zdefiniuj mierzalny rezultat zebrania',
          description: 'Wyróżniony cel dla wszystkich uczestników',
          defaultBlock: {
            type: 'callout_info',
            content: 'Cel: Uzgodnienie architektury i podziału zadań na kolejny sprint.',
            calloutType: 'info',
          },
        },
        {
          type: 'decision_matrix',
          label: 'Lista Decyzji',
          icon: '⚖️',
          category: 'meeting',
          reason: 'Utrwal kluczowe postanowienia',
          description: 'Macierz wyboru rozwiązań i głosowania',
          defaultBlock: {
            type: 'decision_matrix',
            content: 'Rejestr kluczowych decyzji architektonicznych',
            decisionMatrixData: {
              criteria: ['Wydajność', 'Prostota', 'Bezpieczeństwo'],
              options: [
                { name: 'Wariant A (DocBlock + Puter AI)', scores: [9, 9, 10], totalScore: 28 },
                { name: 'Wariant B (Statyczny HTML)', scores: [5, 6, 6], totalScore: 17 },
              ],
            },
          },
        },
        {
          type: 'todo',
          label: 'Zadania (Action Items)',
          icon: '☑️',
          category: 'action',
          reason: 'Przypisz konkretne zadania po dyskusji',
          description: 'Lista kroków TODO z odpowiedzialnością',
          defaultBlock: {
            type: 'todo',
            content: 'Przygotować podsumowanie i przesłać do zespołu',
            checked: false,
          },
        },
      ];
    }

    if (currentType === 'event_schedule') {
      return [
        {
          type: 'event_schedule',
          label: 'Kolejny Punkt Agendy',
          icon: '⏱️',
          category: 'meeting',
          reason: 'Dodaj następną część agendy',
          description: 'Nowy blok czasowy spotkania',
          defaultBlock: {
            type: 'event_schedule',
            content: 'Dyskusja techniczna i analiza ryzyk',
            eventScheduleData: {
              timeStart: '10:15',
              timeEnd: '10:45',
              title: 'Główna dyskusja merytoryczna',
              speakerOrLead: 'Zespół techniczny',
            },
          },
        },
        {
          type: 'decision_matrix',
          label: 'Zapisz Decyzję',
          icon: '⚖️',
          category: 'meeting',
          reason: 'Podsumuj ustalenia z tego punktu',
          description: 'Rejestr decyzji podjętych w dyskusji',
          defaultBlock: {
            type: 'decision_matrix',
            content: 'Ustalenie w punkcie agendy',
            decisionMatrixData: {
              criteria: ['Zgodność z planem', 'Czas'],
              options: [{ name: 'Zaakceptowano wdrożenie', scores: [10, 9], totalScore: 19 }],
            },
          },
        },
        {
          type: 'todo',
          label: 'Zadanie po Spotkaniu',
          icon: '☑️',
          category: 'action',
          reason: 'Zanotuj zobowiązanie uczestnika',
          description: 'Krok TODO',
          defaultBlock: { type: 'todo', content: 'Zadanie do wykonania...', checked: false },
        },
      ];
    }
  }

  // 2. Rekomendacje dla strony PROJEKT (Project)
  if (pageType === 'Project') {
    if (currentType === 'h1' || blockIndex === 0) {
      return [
        {
          type: 'lead',
          label: 'Zakres i Cel Projektu',
          icon: '🚀',
          category: 'project',
          reason: 'Przedstaw wizję i cele biznesowe',
          description: 'Wyróżniony lead projektowy',
          defaultBlock: {
            type: 'lead',
            content: 'Projekt skupia się na dostarczeniu nowoczesnego, wysoce responsywnego modułu edytora z obsługą 90+ bloków i Puter AI.',
          },
        },
        {
          type: 'milestone_roadmap',
          label: 'Kamienie Milowe (Roadmap)',
          icon: '🗺️',
          category: 'project',
          reason: 'Rozpisz fazy realizacji i terminy',
          description: 'Wizualna mapa etapów projektu',
          defaultBlock: {
            type: 'milestone_roadmap',
            content: 'Główne etapy wdrożenia',
            roadmapData: [
              { quarter: 'Q1', title: 'Fundamenty danych i architektura', status: 'completed', owner: 'Lead Architect' },
              { quarter: 'Q2', title: 'Uniwersalny edytor i baza bloków', status: 'in_progress', owner: 'Frontend Lead' },
              { quarter: 'Q3', title: 'Testy i wdrożenie produkcyjne', status: 'planned', owner: 'DevOps & QA' },
            ],
          },
        },
        {
          type: 'kpi_scorecard',
          label: 'Karta KPI / Cele Sukcesu',
          icon: '📈',
          category: 'project',
          reason: 'Zdefiniuj wskaźniki mierzalnego sukcesu',
          description: 'Metryka docelowa i postęp',
          defaultBlock: {
            type: 'kpi_scorecard',
            content: 'Kluczowe wskaźniki wdrożenia',
            kpiScorecardData: {
              metricName: 'Czas ładowania i reakcji edytora',
              currentValue: '120 ms',
              targetValue: '< 150 ms',
              trendPercent: '+25% szybciej',
              status: 'on_track',
            },
          },
        },
        {
          type: 'risk_register',
          label: 'Rejestr Ryzyk',
          icon: '🛡️',
          category: 'project',
          reason: 'Przewiduj bariery i zaplanuj mitygację',
          description: 'Tabela prawdopodobieństwa i wpływu',
          defaultBlock: {
            type: 'risk_register',
            content: 'Identyfikacja ryzyk projektowych',
            riskRegisterData: [
              { risk: 'Opóźnienia integracji zewnętrznego API', likelihood: 'Średnia', impact: 'Wysoki', mitigation: 'Mocki kontraktowe i lokalny fallback' },
              { risk: 'Nieoczekiwany błąd pamięci przeglądarki', likelihood: 'Niska', impact: 'Krytyczny', mitigation: 'Wirtualizacja listy bloków' },
            ],
          },
        },
      ];
    }

    if (currentType === 'milestone_roadmap') {
      return [
        {
          type: 'kanban_board',
          label: 'Tablica Zadań Sprintu',
          icon: '📋',
          category: 'project',
          reason: 'Przełóż roadmapę na zadania wykonawcze',
          description: 'Interaktywny mini-kanban',
          defaultBlock: {
            type: 'kanban_board',
            content: 'Bieżący Sprint',
            kanbanColumns: [
              { id: 'c1', title: 'Do zrobienia', color: '#64748b', items: [{ id: 'k1', title: 'Audyt wydajności' }] },
              { id: 'c2', title: 'W toku', color: '#3b82f6', items: [{ id: 'k2', title: 'Integracja Puter AI' }] },
              { id: 'c3', title: 'Zrobione', color: '#10b981', items: [{ id: 'k3', title: 'Rozbudowa bloków' }] },
            ],
          },
        },
        {
          type: 'countdown',
          label: 'Odliczanie do Premiery',
          icon: '⏳',
          category: 'action',
          reason: 'Wyznacz widoczny deadline dla zespołu',
          description: 'Licznik dni, godzin i minut',
          defaultBlock: {
            type: 'countdown',
            content: 'Termin premiery wersji produkcyjnej',
            countdownTitle: 'Wdrożenie v2.0',
            targetDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
          },
        },
      ];
    }
  }

  // 3. Rekomendacje dla strony BADANIA / RESEARCH
  if (pageType === 'Research') {
    if (currentType === 'h1' || blockIndex === 0) {
      return [
        {
          type: 'lead',
          label: 'Hipoteza Badawcza',
          icon: '🔬',
          category: 'text',
          reason: 'Sformułuj założenie badawcze',
          description: 'Główna teza i metodologia',
          defaultBlock: {
            type: 'lead',
            content: 'Hipoteza: Zastosowanie wieloźródłowej weryfikacji i lokalnego silnika redakcyjnego podnosi wiarygodność dokumentacji o 90%.',
          },
        },
        {
          type: 'citation_source',
          label: 'Karta Cytowania / Źródło',
          icon: '📚',
          category: 'data',
          reason: 'Dodaj źródło naukowe z DOI i autorem',
          description: 'Zarządzanie bibliografią',
          defaultBlock: {
            type: 'citation_source',
            content: 'Publikacja referencyjna',
            citationData: {
              title: 'Modern Document Architectures in Collaborative Systems',
              authors: 'Kowalski J., Nowak A.',
              journalOrSource: 'Journal of Systems & Software',
              year: '2026',
              doi: '10.1016/j.jss.2026.04.12',
            },
          },
        },
        {
          type: 'swot_analysis',
          label: 'Analiza SWOT',
          icon: '🧭',
          category: 'data',
          reason: 'Zestaw mocne i słabe strony zagadnienia',
          description: '4-ćwiartkowa matryca analizy',
          defaultBlock: {
            type: 'swot_analysis',
            content: 'Analiza SWOT badania',
            swotData: {
              strengths: ['Wysoka wydajność silnika', 'Zero opóźnień offline'],
              weaknesses: ['Wymaga pamięci podręcznej przeglądarki'],
              opportunities: ['Integracja z bazami OpenAlex i PubMed'],
              threats: ['Zmieniające się API serwisów zewnętrznych'],
            },
          },
        },
        {
          type: 'table',
          label: 'Tabela Porównawcza Wariantów',
          icon: '📊',
          category: 'data',
          reason: 'Zestaw dane empiryczne',
          description: 'Edytowalna tabela danych',
          defaultBlock: {
            type: 'table',
            content: 'Wyniki pomiarów',
            tableData: [
              ['Parametr', 'Próba A', 'Próba B', 'Różnica'],
              ['Czas odpowiedzi (ms)', '45 ms', '110 ms', '-59%'],
              ['Dokładność (%)', '99.2%', '96.5%', '+2.7%'],
            ],
          },
        },
      ];
    }
  }

  // 4. Rekomendacje dla nagłówków (H1, H2, H3, H4) ogólne
  if (currentType === 'h1') {
    return [
      {
        type: 'lead',
        label: 'Akapit Wprowadzający (Lead)',
        icon: '✨',
        category: 'text',
        reason: 'Wprowadź czytelnika w temat',
        description: 'Powiększony, czytelny akapit wstępu',
        defaultBlock: { type: 'lead', content: 'Ten dokument opisuje kluczowe założenia, architekturę oraz plan działania.' },
      },
      {
        type: 'summary_box',
        label: 'Podsumowanie TL;DR',
        icon: '💡',
        category: 'popular',
        reason: 'Podaj najważniejsze wnioski na początku',
        description: 'Ramka z kluczowymi punktami',
        defaultBlock: {
          type: 'summary_box',
          content: 'Najważniejsze ustalenia w skrócie:\n• Kompletna implementacja 80+ bloków\n• Zaawansowane modele AI (Claude 3.5 Sonnet / GPT-4o)\n• Spójny minimalistyczny design system',
        },
      },
      {
        type: 'table',
        label: 'Tabela Podsumowująca',
        icon: '📊',
        category: 'data',
        reason: 'Uporządkuj wstępne dane w tabeli',
        description: 'Edytowalne kolumny i wiersze',
        defaultBlock: {
          type: 'table',
          content: 'Zestawienie',
          tableData: [
            ['Obszar', 'Odpowiedzialny', 'Status'],
            ['Frontend & UI', 'Dev Team', 'W toku'],
            ['Backend & AI', 'AI Lead', 'Zrobione'],
          ],
        },
      },
      {
        type: 'callout_info',
        label: 'Ważna Informacja',
        icon: 'ℹ️',
        category: 'popular',
        reason: 'Wyróżnij istotny kontekst',
        description: 'Niebieski baner informacyjny',
        defaultBlock: { type: 'callout_info', content: 'Wskazówka: Zmiany zapisują się automatycznie w czasie rzeczywistym.', calloutType: 'info' },
      },
    ];
  }

  if (currentType === 'h2' || currentType === 'h3') {
    return [
      {
        type: 'p',
        label: 'Akapit Tekstu',
        icon: '¶',
        category: 'text',
        reason: 'Rozwiń treść sekcji',
        description: 'Standardowy tekst z formatowaniem',
        defaultBlock: { type: 'p', content: '' },
      },
      {
        type: 'bullet',
        label: 'Lista Punktowana',
        icon: '•',
        category: 'text',
        reason: 'Wymień kluczowe punkty sekcji',
        description: 'Punktory z zagnieżdżaniem',
        defaultBlock: { type: 'bullet', content: 'Kluczowy element do uwzględnienia...' },
      },
      {
        type: 'todo',
        label: 'Zadanie do Wykonania',
        icon: '☑️',
        category: 'action',
        reason: 'Wyznacz zadanie w ramach tej sekcji',
        description: 'Checklista z checkboxem',
        defaultBlock: { type: 'todo', content: 'Wdrożyć i przetestować funkcjonalność...', checked: false },
      },
      {
        type: 'callout_tip',
        label: 'Wskazówka / Tip',
        icon: '💡',
        category: 'popular',
        reason: 'Dodaj dobrą praktykę lub ostrzeżenie',
        description: 'Wyróżniony blok porady',
        defaultBlock: { type: 'callout_tip', content: 'Dobra praktyka: Zawsze weryfikuj stan przed publikacją.', calloutType: 'tip' },
      },
    ];
  }

  // 5. Rekomendacje po TABELI / DANYCH
  if (currentType === 'table' || currentType === 'spec_table' || currentType === 'stat_grid') {
    return [
      {
        type: 'key_takeaway',
        label: 'Kluczowy Wniosek z Danych',
        icon: '🏆',
        category: 'data',
        reason: 'Podsumuj to, co wynika z powyższej tabeli',
        description: 'Wyróżniona ramka analityczna',
        defaultBlock: {
          type: 'key_takeaway',
          content: 'Kluczowy wniosek: Prezentowane dane potwierdzają 3-krotny wzrost efektywności po wdrożeniu nowego systemu.',
        },
      },
      {
        type: 'decision_matrix',
        label: 'Macierz Decyzyjna',
        icon: '⚖️',
        category: 'data',
        reason: 'Przekształć dane w decyzję biznesową',
        description: 'Ważenie opcji i punktacja',
        defaultBlock: {
          type: 'decision_matrix',
          content: 'Rekomendacja końcowa na podstawie tabeli',
          decisionMatrixData: {
            criteria: ['Wpływ na klienta', 'Wysiłek'],
            options: [{ name: 'Opcja A', scores: [9, 3], totalScore: 12 }],
          },
        },
      },
      {
        type: 'p',
        label: 'Komentarz do Danych',
        icon: '¶',
        category: 'text',
        reason: 'Dodaj opis do liczb w tabeli',
        description: 'Akapit analityczny',
        defaultBlock: { type: 'p', content: 'Powyższe zestawienie jednoznacznie wskazuje na...' },
      },
      {
        type: 'h2',
        label: 'Kolejny Rozdział',
        icon: 'H2',
        category: 'text',
        reason: 'Przejdź do kolejnego zagadnienia',
        description: 'Nagłówek sekcji',
        defaultBlock: { type: 'h2', content: 'Następne kroki i wnioski' },
      },
    ];
  }

  // 6. Rekomendacje po TODO / ZADANIU
  if (currentType === 'todo' || currentType === 'meeting_action_item') {
    return [
      {
        type: 'todo',
        label: 'Kolejne Zadanie',
        icon: '☑️',
        category: 'action',
        reason: 'Kontynuuj listę zadań',
        description: 'Nowy punkt checklisty',
        defaultBlock: { type: 'todo', content: '', checked: false },
      },
      {
        type: 'user_mention',
        label: 'Przypisz Osobę (@Osoba)',
        icon: '👤',
        category: 'action',
        reason: 'Wskaż wykonawcę zadania',
        description: 'Wizytówka członka zespołu',
        defaultBlock: {
          type: 'user_mention',
          content: 'Odpowiedzialny za realizację',
          mentionUser: { name: 'Tomasz Nowak', role: 'Frontend Engineer', status: 'Online' },
        },
      },
      {
        type: 'countdown',
        label: 'Deadline Zadania',
        icon: '⏳',
        category: 'action',
        reason: 'Ustaw termin wykonania',
        description: 'Licznik czasu do terminu',
        defaultBlock: {
          type: 'countdown',
          content: 'Termin oddania zadania',
          countdownTitle: 'Deadline',
          targetDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16),
        },
      },
      {
        type: 'h2',
        label: 'Zamknij Sekcję Zadań',
        icon: 'H2',
        category: 'text',
        reason: 'Zacznij nową część dokumentu',
        description: 'Nagłówek kolejnego bloku',
        defaultBlock: { type: 'h2', content: 'Podsumowanie' },
      },
    ];
  }

  // 7. Rekomendacje po KODZIE lub SANDBOXIE
  if (currentType === 'code' || currentType === 'code_sandbox') {
    return [
      {
        type: 'terminal',
        label: 'Konsola / Wynik (Terminal)',
        icon: '💻',
        category: 'popular',
        reason: 'Pokaż rezultat wykonania kodu',
        description: 'Czarna konsola z logami',
        defaultBlock: {
          type: 'terminal',
          content: '$ npm run test:editor\nPASS test/editorAi.test.ts (100%)\nAll 8 suites completed in 320ms.',
        },
      },
      {
        type: 'callout_tip',
        label: 'Wyjaśnienie Działania Kodu',
        icon: '💡',
        category: 'text',
        reason: 'Opisz kluczowe linijki kodu',
        description: 'Wskazówka implementacyjna',
        defaultBlock: {
          type: 'callout_tip',
          content: 'Ważne: Funkcja korzysta z nieblokującego asynchronicznego worker-a dla maksymalnej płynności 60fps.',
          calloutType: 'tip',
        },
      },
      {
        type: 'api_endpoint',
        label: 'Endpoint API',
        icon: '⚡',
        category: 'data',
        reason: 'Udokumentuj powiązany endpoint REST',
        description: 'Karta metody GET/POST/JSON',
        defaultBlock: {
          type: 'api_endpoint',
          content: 'Pobieranie dokumentów użytkownika',
          apiEndpointData: {
            method: 'GET',
            path: '/api/v1/workspace/pages',
            status: 200,
            responseJson: '{\n  "status": "ok",\n  "count": 12\n}',
          },
        },
      },
      {
        type: 'p',
        label: 'Akapit z Omówieniem',
        icon: '¶',
        category: 'text',
        reason: 'Opis w tekście ciągłym',
        description: 'Tekst pod blokiem kodu',
        defaultBlock: { type: 'p', content: 'Zalecanym sposobem wywołania powyższej funkcji jest...' },
      },
    ];
  }

  // 8. Domyślne / uniwersalne rekomendacje (po tekście `p`, cytacie itp.)
  return [
    {
      type: 'h2',
      label: 'Nowa Sekcja (Nagłówek H2)',
      icon: 'H2',
      category: 'text',
      reason: 'Podziel dokument na logiczne rozdziały',
      description: 'Główny nagłówek sekcji',
      defaultBlock: { type: 'h2', content: '' },
    },
    {
      type: 'callout_info',
      label: 'Wyróżnienie (Callout)',
      icon: '💡',
      category: 'popular',
      reason: 'Przyciągnij wzrok do kluczowej informacji',
      description: 'Kolorowy boks z ikoną',
      defaultBlock: { type: 'callout_info', content: 'Ważna informacja...', calloutType: 'info' },
    },
    {
      type: 'table',
      label: 'Tabela Danych',
      icon: '📊',
      category: 'data',
      reason: 'Zaprezentuj dane w uporządkowanej formie',
      description: 'Wiersze i kolumny z autosavem',
      defaultBlock: {
        type: 'table',
        content: 'Tabela',
        tableData: [
          ['Kategoria', 'Wartość', 'Komentarz'],
          ['Opcja 1', '100%', 'Gotowe'],
        ],
      },
    },
    {
      type: 'todo',
      label: 'Lista Zadań (Checklista)',
      icon: '☑️',
      category: 'action',
      reason: 'Dodaj interaktywne punkty do zrobienia',
      description: 'Zadania z odznaczaniem',
      defaultBlock: { type: 'todo', content: 'Kolejny krok...', checked: false },
    },
  ];
}
