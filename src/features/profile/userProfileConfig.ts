/**
 * Konfiguracja Profili Użytkowników (User Profile Engine)
 * Onboarding i personalizacja widoków: Student, Developer, Founder, Team / Company, Personal, Other.
 * Zgodnie ze specyfikacją V1: profil dostosowuje domyślne szablony, sugestie AI i układ widoków,
 * lecz NIE przyznaje uprawnień (uprawnienia są w 100% niezależne od profilu).
 */

import { UserProfileType, DocBlock, PageType } from '../../types/workspace';

export interface ProfileDefinition {
  id: UserProfileType;
  title: string;
  tagline: string;
  icon: string;
  badge: string;
  description: string;
  suggestedAiPills: string[];
  recommendedViews: string[];
  starterPageTemplates: {
    title: string;
    icon: string;
    pageType: PageType;
    blocks: DocBlock[];
  }[];
}

export const USER_PROFILES: Record<UserProfileType, ProfileDefinition> = {
  Student: {
    id: 'Student',
    title: 'Student & Edukacja',
    tagline: 'Nauka, notatki z wykładów, materiały i powtórki',
    icon: '🎓',
    badge: 'Nauka & Egzaminy',
    description: 'Skupiony na organizacji przedmiotów, planach powtórek, bazach pojęć i researchu materiałów naukowych.',
    suggestedAiPills: [
      'Stwórz plan nauki do egzaminu',
      'Streszcz materiały i wyciągnij pojęcia',
      'Przygotuj quiz z notatki',
      'Zbadaj metody uczenia maszynowego w 4 źródłach',
    ],
    recommendedViews: ['notes', 'calendar', 'tasks', 'searches'],
    starterPageTemplates: [
      {
        title: 'Plan Nauki i Egzaminów',
        icon: '📚',
        pageType: 'TaskList',
        blocks: [
          {
            id: 'st-b1',
            type: 'h1',
            content: 'Harmonogram Nauki i Przygotowań do Sesji',
          },
          {
            id: 'st-b2',
            type: 'key_takeaway',
            content: '🏆 **Kluczowa Zasada:** Regularne powtórki interwałowe (Spaced Repetition) i praca z pojęciami kluczowymi.',
          },
          {
            id: 'st-b3',
            type: 'stat_grid',
            content: 'Liczba Przedmiotów | Cel Sesji',
            statValue: '4 Przedmioty | Średnia 4.5+',
            statTrend: 'Semestr Zimowy | Aktywny plan powtórek',
          },
          {
            id: 'st-b4',
            type: 'table',
            content: 'Zestawienie Przedmiotów i Terminów',
            tableData: [
              ['Przedmiot', 'Data Zaliczenia', 'Forma', 'Status'],
              ['Matematyka Dyskretna', '15 Lutego', 'Egzamin Pisemny', 'W trakcie'],
              ['Algorytmy i Struktury', '20 Lutego', 'Projekt + Test', 'Gotowe do powtórki'],
              ['Bazy Danych SQL', '24 Lutego', 'Kolokwium', 'Rozpoczęte'],
            ],
          },
          {
            id: 'st-b5',
            type: 'todo',
            content: 'Przejrzeć notatki z pierwszych 5 wykładów i stworzyć fiszki',
            checked: false,
          },
          {
            id: 'st-b6',
            type: 'ai_prompt',
            content: 'Wygeneruj 5 pytań kontrolnych sprawdzających wiedzę z wybranego tematu...',
          },
        ],
      },
      {
        title: 'Baza Pojęć i Definicji',
        icon: '📖',
        pageType: 'Database',
        blocks: [
          {
            id: 'bp-b1',
            type: 'h1',
            content: 'Glosariusz Pojęć Kluczowych',
          },
          {
            id: 'bp-b2',
            type: 'callout_info',
            content: '💡 **Wskazówka:** Używaj tego dokumentu jako wspólnej bazy definicji, formuł i cytowań naukowych.',
          },
          {
            id: 'bp-b3',
            type: 'table',
            content: 'Słownik Pojęć',
            tableData: [
              ['Pojęcie', 'Dziedzina', 'Kluczowa Definicja', 'Źródło'],
              ['Złożoność O(n log n)', 'Algorytmy', 'Optymalny czas sortowania przez porównania', 'Cormen s. 120'],
              ['Normalizacja 3NF', 'Bazy Danych', 'Brak zależności przechodnich od klucza', 'Wykład 4'],
            ],
          },
        ],
      },
    ],
  },

  Developer: {
    id: 'Developer',
    title: 'Developer & Inżynier',
    tagline: 'Architektura, dokumentacja techniczna, API i kod',
    icon: '💻',
    badge: 'Code & Tech',
    description: 'Narzędzia dostosowane do specyfikacji technicznych, schematów baz danych, checklist wdrożeniowych i sprintów.',
    suggestedAiPills: [
      'Wygeneruj dokumentację API',
      'Rozpisz schemat bazy SQL',
      'Checklista security przed wdrożeniem',
      'Zbadaj wzorce projektowe w TypeScript w 4 źródłach',
    ],
    recommendedViews: ['notes', 'database', 'tasks', 'searches'],
    starterPageTemplates: [
      {
        title: 'Specyfikacja Architektury Systemu (System Design)',
        icon: '⚙️',
        pageType: 'Document',
        blocks: [
          {
            id: 'dev-b1',
            type: 'h1',
            content: 'Specyfikacja Techniczna i Architektura Modułowa',
          },
          {
            id: 'dev-b2',
            type: 'key_takeaway',
            content: '🏆 **Architektura:** Event-Driven, modularny monolit z podziałem na warstwy API, Logic i Storage.',
          },
          {
            id: 'dev-b3',
            type: 'stat_grid',
            content: 'Docelowy Czas Odpowiedzi | SLA',
            statValue: '< 80ms p95 | 99.95% Dostępności',
            statTrend: 'Vite + React + Firestore | Cloudflare Edge',
          },
          {
            id: 'dev-b4',
            type: 'terminal',
            content: '# Uruchomienie lokalnego środowiska deweloperskiego\nnpm install\nnpx tsc --noEmit\nnpm run dev',
            language: 'bash',
          },
          {
            id: 'dev-b5',
            type: 'h2',
            content: 'Endpoints API & Kontrakty Danych',
          },
          {
            id: 'dev-b6',
            type: 'table',
            content: 'Specyfikacja Endpointów',
            tableData: [
              ['Metoda', 'Ścieżka', 'Auth', 'Opis'],
              ['GET', '/api/pages', 'Bearer JWT', 'Pobranie listy stron użytkownika'],
              ['POST', '/api/research', 'Session Cookie', 'Uruchomienie wieloźródłowej syntezy'],
            ],
          },
          {
            id: 'dev-b7',
            type: 'todo',
            content: 'Wdrożyć walidację Zod dla wszystkich wejść API',
            checked: false,
          },
          {
            id: 'dev-b8',
            type: 'ai_prompt',
            content: 'Napisz testy jednostkowe i schemat walidacji TypeScript dla powyższej specyfikacji...',
          },
        ],
      },
    ],
  },

  Founder: {
    id: 'Founder',
    title: 'Founder & Przedsiębiorca',
    tagline: 'Wizja produktowa, OKR-y, roadmapa i fundraising',
    icon: '🚀',
    badge: 'Biznes & Produkt',
    description: 'Zarządzanie strategią, dokumentami inwestorskimi, priorytetami produktowymi i badaniem rynku.',
    suggestedAiPills: [
      'Przygotuj Product Requirement Doc (PRD)',
      'Analiza rynkowa i konkurencja',
      'Rozpisz kwartalne cele OKR',
      'Zbadaj najnowsze trendy AI Workspace w 4 źródłach',
    ],
    recommendedViews: ['notes', 'tasks', 'calendar', 'workspace'],
    starterPageTemplates: [
      {
        title: 'Product Strategy & Cele OKR',
        icon: '🎯',
        pageType: 'Project',
        blocks: [
          {
            id: 'fnd-b1',
            type: 'h1',
            content: 'Strategia Rozwoju Produktu — Q1/Q2',
          },
          {
            id: 'fnd-b2',
            type: 'key_takeaway',
            content: '🏆 **Kluczowy Cel:** Zbudować najlepszy w Europie Intelligent Workspace łączący notatki, edytor i wieloźródłową wiedzę.',
          },
          {
            id: 'fnd-b3',
            type: 'pros_cons',
            content: '+ Wysokie tempo iteracji i zerowe koszty stałe modeli dzięki zoptymalizowanej architekturze\n+ Wieloźródłowy silnik wiedzy Reuse-first jako unikalny przewaga rynkowa',
            toggleDetails: '- Konieczność ciągłego utrzymywania najwyższej ergonomii interfejsu\n- Edukacja użytkowników o możliwościach AI wewnątrz edytora',
          },
          {
            id: 'fnd-b4',
            type: 'table',
            content: 'Cele OKR i Wskaźniki Sukcesu',
            tableData: [
              ['Obszar', 'Cel (Objective)', 'Kluczowy Wynik (Key Result)', 'Właściciel'],
              ['Produkt', 'Uruchomienie wersji V1 Workspace', '100% zrealizowanej specyfikacji 7 kroków', 'Founder'],
              ['Użytkownicy', 'Utrzymanie retencji', '> 65% aktywnych użytkowników powracających po 7 dniach', 'Product Lead'],
            ],
          },
          {
            id: 'fnd-b5',
            type: 'todo',
            content: 'Przeprowadzić 5 wywiadów z użytkownikami testującymi profil Developer i Student',
            checked: false,
          },
        ],
      },
    ],
  },

  'Team / Company': {
    id: 'Team / Company',
    title: 'Zespół & Firma',
    tagline: 'Współpraca, pokoje zespołów, procedury i sync',
    icon: '🏢',
    badge: 'Multi-User & Teams',
    description: 'Współdzielone notatki, protokoły spotkań, przypisywanie zadań, transparentność ustaleń.',
    suggestedAiPills: [
      'Wygeneruj protokół spotkania ze statusem',
      'Wyciągnij zadania do tablicy Kanban',
      'Przygotuj procedurę wdrożenia (SOP)',
      '@team Pokoje Zespołów',
    ],
    recommendedViews: ['workspace', 'notes', 'tasks', 'calendar'],
    starterPageTemplates: [
      {
        title: 'Baza Wiedzy Zespołu & Zasady Współpracy',
        icon: '🏢',
        pageType: 'Document',
        blocks: [
          {
            id: 'tm-b1',
            type: 'h1',
            content: 'Wspólna Przestrzeń Zespołowa (Team Hub)',
          },
          {
            id: 'tm-b2',
            type: 'callout_info',
            content: '👥 **Witaj w przestrzeni roboczej zespołu!** Wszystkie dokumenty w tym pokoju są automatycznie synchronizowane z uprawnionymi członkami.',
          },
          {
            id: 'tm-b3',
            type: 'table',
            content: 'Kluczowe Zasoby i Odnośniki',
            tableData: [
              ['Zasób', 'Opis', 'Opiekun Tematu'],
              ['Roadmapa Projektu', 'Bieżący sprint i priorytety', 'Product Manager'],
              ['Standardy Kodu', 'Wytyczne architektoniczne i linting', 'Tech Lead'],
              ['Protokóły Spotkań', 'Notatki ze cotygodniowych synców', 'Zespół'],
            ],
          },
          {
            id: 'tm-b4',
            type: 'todo',
            content: 'Zaprosić kluczowych członków zespołu poleceniem @add',
            checked: false,
          },
        ],
      },
    ],
  },

  Personal: {
    id: 'Personal',
    title: 'Osobisty & Prywatny',
    tagline: 'Prywatne notatki, cele, organizacja życia i pomysły',
    icon: '✨',
    badge: 'Personal Life',
    description: 'Prosta, wolna od rozproszeń przestrzeń na codzienne notatki, checklisty, hobby i pomysły.',
    suggestedAiPills: [
      'Stwórz tygodniowy plan celów',
      'Podsumuj przeczytane artykuły',
      'Ułóż checklistę zadań na weekend',
      'Zbadaj zdrowe nawyki i zarządzanie czasem w 4 źródłach',
    ],
    recommendedViews: ['notes', 'tasks', 'calendar', 'searches'],
    starterPageTemplates: [
      {
        title: 'Moje Cele i Osobista Baza Pomysłów',
        icon: '💡',
        pageType: 'Note',
        blocks: [
          {
            id: 'ps-b1',
            type: 'h1',
            content: 'Dziennik Osobisty i Plany',
          },
          {
            id: 'ps-b2',
            type: 'key_takeaway',
            content: '🏆 **Motto:** Małe, konsekwentne kroki każdego dnia przynoszą największe rezultaty.',
          },
          {
            id: 'ps-b3',
            type: 'todo',
            content: 'Zdefiniować 3 najważniejsze priorytety na ten tydzień',
            checked: false,
          },
          {
            id: 'ps-b4',
            type: 'todo',
            content: 'Uporządkować notatki w tematycznych folderach',
            checked: false,
          },
        ],
      },
    ],
  },

  Other: {
    id: 'Other',
    title: 'Uniwersalny / Inny',
    tagline: 'Elastyczny workspace dostosowany do Twoich potrzeb',
    icon: '⚡',
    badge: 'Uniwersalny',
    description: 'Kompletny zestaw narzędzi edytora, baz danych i wyszukiwania dla każdego scenariusza.',
    suggestedAiPills: [
      'Stwórz nową notatkę',
      'Zaplanuj zadania projektowe',
      'Zbadaj temat w sieci',
      'Zbuduj bazę danych',
    ],
    recommendedViews: ['notes', 'tasks', 'calendar', 'database', 'searches'],
    starterPageTemplates: [
      {
        title: 'Moja Przestrzeń Robocza',
        icon: '📝',
        pageType: 'Document',
        blocks: [
          {
            id: 'oth-b1',
            type: 'h1',
            content: 'Witaj w SearchPoint Workspace',
          },
          {
            id: 'oth-b2',
            type: 'callout_tip',
            content: '💡 **Wskazówka:** Użyj menu `/`, aby wstawić dowolny z 52 bloków, lub wpisz `@`, aby przywołać asystenta AI.',
          },
          {
            id: 'oth-b3',
            type: 'todo',
            content: 'Rozpocząć tworzenie pierwszego dokumentu',
            checked: false,
          },
        ],
      },
    ],
  },
};
