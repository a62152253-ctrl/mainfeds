import { DocBlock } from '../../types/workspace';

export interface AdvancedTemplate {
  id: string;
  name: string;
  shortTitle: string;
  category: 'Product & SaaS' | 'Sales & B2B' | 'HR & Operations';
  badge: string;
  icon: string;
  coverGradient: string;
  description: string;
  estimatedReadingTime: string;
  blocksCount: number;
  blocks: DocBlock[];
}

function uid(prefix: string = 'blk'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export const ADVANCED_TEMPLATES: Record<string, AdvancedTemplate> = {
  saas_prd_2026: {
    id: 'saas_prd_2026',
    name: 'Kompletny Launch Produktu SaaS: PRD, Architektura & Go-To-Market 2026',
    shortTitle: 'SaaS Launch & PRD 2026',
    category: 'Product & SaaS',
    badge: 'Produkcyjny PRD',
    icon: '🚀',
    coverGradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #06b6d4 100%)',
    description:
      'Kompleksowy Product Requirements Document: cele strategiczne, targety KPI, persony, architektura mikroserwisów, specyfikacja API TypeScript, timeline wdrożenia oraz checklisty sprintowe.',
    estimatedReadingTime: '6 min',
    blocksCount: 26,
    blocks: [
      {
        id: uid(),
        type: 'h1',
        content: '🚀 Launch Produktu SaaS: PRD, Architektura & Go-To-Market 2026',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'info',
        content:
          '📌 **STATUS PROJEKTU: WERSJA PRD v2.4 (ZATWIERDZONA DO IMPLEMENTACJI)**\n• Cel: Wersja Beta Q2 2026 | Globalny Launch Q3 2026\n• Zespół kluczowy: Tomasz Wiśniewski (Lead PM), Anna Kowalczyk (Staff Architect), Michał Dąbrowski (Lead UX).',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Target Rocznego Przychodu (ARR)',
        statValue: '1 250 000 PLN',
        statTrend: '+140% prognoza',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Maksymalny Koszt Pozyskania Klienta (CAC)',
        statValue: '175 PLN',
        statTrend: '-25% optymalizacja',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Wskaźnik Retencji Netto (NDR Target)',
        statValue: '112%',
        statTrend: 'Top Tier B2B',
      },
      {
        id: uid(),
        type: 'progress',
        content: 'Gotowość Specyfikacji Technicznej & Modułów MVP',
        progressPercent: 78,
      },
      {
        id: uid(),
        type: 'h2',
        content: '1. Problem Rynkowy i Rozwiązanie (Value Proposition)',
      },
      {
        id: uid(),
        type: 'p',
        content:
          'Współczesne rozproszone zespoły technologiczne tracą średnio ponad 38% tygodniowego czasu pracy na nieefektywne przełączanie się między rozproszonymi narzędziami: tradycyjne wiki do notatek, osobne trackery do zadań, dyski sieciowe i komunikatory. Nasza platforma integruje edytor blokowy nowej generacji, tablicę kanban, inteligentnego asystenta AI oraz przestrzeń zespołową w jeden spójny, błyskawiczny ekosystem cyfrowy.',
      },
      {
        id: uid(),
        type: 'quote',
        content:
          '„Największą przewagą konkurencyjną nowoczesnych software house’ów nie jest tempo pisania czystego kodu, lecz natychmiastowa likwidacja silosów informacyjnych i automatyzacja zadań prosto z dokumentów.” — Product Leadership Index 2026',
      },
      {
        id: uid(),
        type: 'h2',
        content: '2. Persony Użytkowników i Wymagania Krytyczne',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Tech Lead / CTO:** Wymaga stuprocentowej transparentności architektury, wsparcia dla bloków kodu w 15 językach, bezpiecznego szyfrowania danych i granularnych ról uprawnień (Owner / Admin / Member).',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Product Manager / Scrum Master:** Skupiony na błyskawicznej konwersji notatek ze spotkań w zadania na tablicy Kanban, estymacji story points i automatycznych podsumowaniach postępów.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Senior Developer & Designer:** Ceni brak rozpraszaczy (tryb Zen), ergonomiczne skróty klawiszowe ukośnika (/), wsparcie Markdown oraz natychmiastowe wyszukiwanie pełnotekstowe.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '3. Architektura Systemowa i Kontrakt API (TypeScript)',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'tip',
        content:
          '💡 **Standard Inżynierski:** Wszystkie zdarzenia telemetryczne oraz mutacje danych w workspace podlegają walidacji schematem JSON-Schema i asynchronicznemu kolejkowaniu z gwarancją dostarczenia.',
      },
      {
        id: uid(),
        type: 'code',
        language: 'typescript',
        content: `// Kontrakt telemetryczny i rejestracja akcji produktu SaaS
export interface SaasTelemetryEvent {
  eventId: string;
  tenantId: string;
  eventType: 'workspace.created' | 'document.published' | 'ai.action_executed' | 'block.mutated';
  timestamp: number;
  payload: {
    userId: string;
    clientIpHash: string;
    rateLimitTier: 'starter' | 'pro' | 'enterprise';
    executionDurationMs?: number;
  };
}

export async function dispatchTelemetry(event: SaasTelemetryEvent): Promise<boolean> {
  const endpoint = 'https://searchpoint.pl/api/v1/telemetry';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': 'Bearer_Token' },
    body: JSON.stringify(event),
  });
  return res.ok;
}`,
      },
      {
        id: uid(),
        type: 'h2',
        content: '4. Harmonogram Wdrożenia i Kamienie Milowe (Roadmap)',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Sprint 1: Marzec 2026',
        content:
          'Ukończenie nowego rdzenia edytora blokowego, menu ukośnika (/), zaawansowanego filtrowania treści oraz silnika polskiego Copilota AI.',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Sprint 2: Kwiecień 2026',
        content:
          'Moduł przestrzeni zespołowych Multi-Tenancy (tworzenie zespołów, zaproszenia e-mail, role uprawnień) oraz repozytorium publicznych stron.',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Sprint 3: Maj 2026',
        content:
          'Zamknięte testy Beta z udziałem 40 wyselekcjonowanych software house’ów. Optymalizacja Core Web Vitals (LCP < 1.1s, zero layout shift).',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Sprint 4: Czerwiec 2026',
        content:
          'Publiczny Global Launch na Product Hunt, uruchomienie planów subskrypcyjnych Pro & Enterprise oraz API dla zewnętrznych integracji.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '5. Matryca Zadań Przygotowawczych (Sprint Checklist)',
      },
      {
        id: uid(),
        type: 'todo',
        checked: true,
        content: 'Przeprowadzić audyt bezpieczeństwa OWASP Top 10 i zweryfikować reguły bazodanowe',
      },
      {
        id: uid(),
        type: 'todo',
        checked: true,
        content: 'Zaimplementować blokady domen niepożądanych (18+) w całym edytorze i widokach publicznych',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Skonfigurować pipeline CI/CD z automatycznym testowaniem i bezprzerwowym deploymentem',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Opracować interaktywny przewodnik onboardingowy dla nowych zespołów i wideo-prezentację',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'warning',
        content:
          '⚠️ **Mitygacja Ryzyka:** Przy awarii zewnętrznych usług AI system natychmiast przełącza się na lokalny silnik deterministyczny, zapewniając 100% ciągłości pracy bez opóźnień.',
      },
      {
        id: uid(),
        type: 'button',
        content: 'Otwórz Repozytorium Projektu na GitHubie',
        buttonUrl: 'https://searchpoint.pl',
        buttonColor: '#2563eb',
      },
    ],
  },

  b2b_agency_offer: {
    id: 'b2b_agency_offer',
    name: 'Kompleksowa Oferta Handlowa & Scope of Work: Dedykowany System Cyfrowy B2B',
    shortTitle: 'Oferta Handlowa & Wycena B2B',
    category: 'Sales & B2B',
    badge: 'Biznesowa Oferta',
    icon: '💼',
    coverGradient: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #10b981 100%)',
    description:
      'Gotowa do wysłania oferta biznesowa dla klienta korporacyjnego: diagnoza wyzwań, wskaźniki ROI, 4 filary wdrożenia, transparentna tabela pakietów cenowych, warunki SLA i przycisk akceptacji.',
    estimatedReadingTime: '5 min',
    blocksCount: 25,
    blocks: [
      {
        id: uid(),
        type: 'h1',
        content: '💼 Kompleksowa Oferta Handlowa: Transformacja Cyfrowa Procesów B2B',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'tip',
        content:
          '🤝 **DLA ZAMAWIAJĄCEGO:** Dedykowana propozycja wdrożenia bezpiecznego ekosystemu cyfrowego. Oferta zachowuje gwarancję stałej ceny przez okres 30 dni roboczych od daty sporządzenia.\nOpiekun Handlowy: Dyrektor ds. Klientów Kluczowych.',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Prognozowany Zwrot z Inwestycji (ROI)',
        statValue: '280%',
        statTrend: 'w 12 miesięcy',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Redukcja Czasu Zadań Administracyjnych',
        statValue: '-45%',
        statTrend: 'automatyzacja AI',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Gwarantowany Czas Wdrożenia Produkcyjnego',
        statValue: '6 tygodni',
        statTrend: 'gwarancja SLA',
      },
      {
        id: uid(),
        type: 'progress',
        content: 'Zdefiniowanie Zakresu Prac i Gotowość do Startu',
        progressPercent: 100,
      },
      {
        id: uid(),
        type: 'h2',
        content: '1. Diagnoza Wyzwań i Założenia Transformacji',
      },
      {
        id: uid(),
        type: 'p',
        content:
          'Na podstawie warsztatów discovery zidentyfikowaliśmy 3 kluczowe obszary generujące straty operacyjne: rozproszone arkusze kalkulacyjne bez kontroli wersji, wydłużony obieg akceptacji dokumentów oraz brak jednolitej bazy wiedzy. Celem wdrożenia jest likwidacja silosów i udostępnienie zespołom jednego bezpiecznego środowiska roboczego.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '2. Szczegółowy Zakres Prac w 4 Filarach Wdrożenia',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Filar I — Warsztat Architektoniczny i UX/UI:** Dedykowany audyt procesów, stworzenie kompletnego Design Systemu w Figma, prototypy makiet i testy z użytkownikami.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Filar II — Rozwój Systemu i Frontend PWA:** Wdrożenie nowoczesnego interfejsu w React 19 / TypeScript z pełną responsywnością (desktop, tablet, mobile) i obsługą offline.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Filar III — Bezpieczeństwo i Uprawnienia Korporacyjne:** Izolacja danych na poziomie organizacji, granularne role uprawnień (RBAC), szyfrowanie end-to-end oraz dziennik audytu.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Filar IV — Moduł Sztucznej Inteligencji Copilot:** Wdrożenie automatycznego streszczania raportów, ekstrakcji zadań, korekty językowej oraz tłumaczeń w 5 językach.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '3. Transparentne Pakiety Wdrożeniowe (Fixed Price)',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'info',
        content:
          '📊 **Model Fixed Price:** Podane kwoty netto zawierają pełne przeniesienie autorskich praw majątkowych, kody źródłowe oraz bezpłatny 12-miesięczny pakiet gwarancyjny.',
      },
      {
        id: uid(),
        type: 'table',
        content: 'Zestawienie Pakietów Wdrożeniowych',
        tableData: [
          ['Pakiet Wdrożenia', 'Zakres Funkcjonalny', 'Czas Realizacji', 'Cena Netto'],
          ['Pakiet MVP Standard', 'Edytor blokowy, Tablica Kanban, 10 kont użytkowników, Eksport MD', '3 tygodnie', '14 900 PLN'],
          ['Pakiet Biznes Pro (Rekomendowany)', 'Wszystko z MVP + Copilot AI, Szablony, Eksport PDF, 35 kont, Role', '5-6 tygodni', '28 500 PLN'],
          ['Pakiet Enterprise Custom', 'Dedykowana chmura, SLA 99.9%, SSO Google/Azure, Nielimitowane konta', '8 tygodni', '48 000 PLN'],
        ],
      },
      {
        id: uid(),
        type: 'h2',
        content: '4. Harmonogram Płatności i Etapy Realizacji',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Etap I (30% zaliczki)',
        content: 'Podpisanie umowy, warsztaty discovery i formalne zatwierdzenie specyfikacji UX/UI.',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Etap II (40% transza)',
        content: 'Uruchomienie wersji stagingowej, odbiór funkcjonalności edytora, bazy danych oraz modułu zadań.',
      },
      {
        id: uid(),
        type: 'timeline',
        timelineDate: 'Etap III (30% końcowe)',
        content: 'Testy akceptacyjne UAT, szkolenie pracowników, migracja danych i formalne uruchomienie produkcyjne.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '5. Gwarancja Jakości, Wsparcie SLA i Kontakt',
      },
      {
        id: uid(),
        type: 'p',
        content:
          'Zapewniamy 12 miesięcy bezpłatnego wsparcia serwisowego z gwarantowanym czasem reakcji na zgłoszenia o priorytecie krytycznym do 2 godzin roboczych. Po wdrożeniu zespół otrzymuje dedykowanego opiekuna technicznego.',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'tip',
        content:
          '🎁 **Bonus Decyzyjny:** W przypadku akceptacji oferty w ciągu 14 dni roboczych, Zamawiający otrzymuje w prezencie pakiet 40 godzin konsultacji architektonicznych o wartości 10 000 PLN gratis.',
      },
      {
        id: uid(),
        type: 'button',
        content: 'Akceptuję Warunki Oferty — Podpisz Umowę Online',
        buttonUrl: 'https://searchpoint.pl',
        buttonColor: '#059669',
      },
    ],
  },

  company_onboarding_wiki: {
    id: 'company_onboarding_wiki',
    name: 'Kompendium Firmowe & Plan Wdrożenia Nowego Pracownika (Onboarding 30-60-90)',
    shortTitle: 'Baza Wiedzy & Onboarding 30-60-90',
    category: 'HR & Operations',
    badge: 'Podręcznik Zespołu',
    icon: '🏢',
    coverGradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)',
    description:
      'Kompletny podręcznik nowego pracownika: kultura organizacji, katalog narzędzi firmowych, konfiguracja stacji roboczej, plan działań na 30, 60 i 90 dni oraz kluczowe kontakty wewnętrzne.',
    estimatedReadingTime: '5 min',
    blocksCount: 26,
    blocks: [
      {
        id: uid(),
        type: 'h1',
        content: '🏢 Kompendium Firmowe & Plan Wdrożenia Nowego Pracownika (Onboarding 30-60-90)',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'info',
        content:
          '👋 **Cześć! Witamy w Zespole!**\nNiezmiernie cieszymy się, że do nas dołączasz. Niniejszy podręcznik poprowadzi Cię krok po kroku przez pierwsze tygodnie pracy, dostęp do narzędzi oraz firmowe standardy.\nTwój dedykowany Opiekun Wdrożenia (Buddy): Janusz Nowak (#buddy-channel na Slacku).',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Liczba Ekspertów w Naszym Zespole',
        statValue: '48 osób',
        statTrend: '+12 w tym roku',
      },
      {
        id: uid(),
        type: 'stat',
        content: 'Wskaźnik Satysfakcji Pracowników (eNPS)',
        statValue: '9.4 / 10',
        statTrend: 'Doskonała atmosfera',
      },
      {
        id: uid(),
        type: 'progress',
        content: 'Twój Postęp Wdrożenia (Tydzień 1)',
        progressPercent: 20,
      },
      {
        id: uid(),
        type: 'h2',
        content: '1. Misja, Wizja i Nasze Kluczowe Wartości',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Autonomia z Odpowiedzialnością:** Nie mikrozarządzamy. Otrzymujesz jasne cele i pełną swobodę w doborze metod ich realizacji. Liczy się jakość i dotrzymywanie słowa.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Kultura Otwartego Feedbacku:** Dzielimy się konstruktywną opinią na bieżąco. Błędy traktujemy jako naturalny element nauki i doskonalenia procesów.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Transparentność Informacji:** Wszystkie kluczowe metryki firmy, roadmapa produktowa oraz decyzje zarządu są publicznie omawiane na comiesięcznych spotkaniach All-Hands.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '2. Niezbędnik Narzędziowy i Dostęp do Systemów',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Komunikacja zespołowa:** Slack — główne kanały: `#ogolny`, `#projekty-tech`, `#random-kawa`, `#kudos-pochwaly`.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Zarządzanie zadaniami i wiedzą:** Nowoczesne Studio Workspace — tu prowadzimy specyfikacje, tablice Kanban i notatki ze spotkań.',
      },
      {
        id: uid(),
        type: 'bullet',
        content:
          '**Menedżer haseł i bezpieczeństwo:** 1Password Enterprise — bezwzględny zakaz przesyłania haseł i tokenów w komunikatorach.',
      },
      {
        id: uid(),
        type: 'h2',
        content: '3. Konfiguracja Środowiska Pracy i Pierwszy Run',
      },
      {
        id: uid(),
        type: 'callout',
        calloutType: 'tip',
        content:
          '💻 **Szybki Start:** Wykonaj poniższe polecenia w terminalu, aby sklonować oficjalne repozytorium firmowe i uruchomić lokalny serwer developerski.',
      },
      {
        id: uid(),
        type: 'code',
        language: 'bash',
        content: `# Klonowanie i uruchomienie projektu firmowego
git config --global user.name "Twoje Imie i Nazwisko"
git config --global user.email "twoj.email@firma.pl"
git clone https://github.com/firma/nowoczesne-studio.git
cd nowoczesne-studio
npm install
npm run dev # Otwiera aplikacje pod adresem http://localhost:5173`,
      },
      {
        id: uid(),
        type: 'h2',
        content: '4. Plan Działań: Pierwsze 30 Dni (Adaptacja & Integracja)',
      },
      {
        id: uid(),
        type: 'todo',
        checked: true,
        content: 'Spotkanie powitalne 1-on-1 z Liderem Zespołu i Buddym',
      },
      {
        id: uid(),
        type: 'todo',
        checked: true,
        content: 'Skonfigurowanie konta firmowego, Slacka i uwierzytelniania dwuskładnikowego 2FA',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Zapoznanie się ze strukturą repozytoriów, wytycznymi czystego kodu i procedurą Code Review',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Dowiezienie pierwszego małego zadania (Good First Issue) w pierwszym wspólnym sprincie',
      },
      {
        id: uid(),
        type: 'h2',
        content: '5. Plan Działań: Dni 31-60 (Samodzielność i Projekty)',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Aktywny udział w spotkaniach planistycznych i estymacjach zadań sprintu',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Prowadzenie przeglądów kodu (Code Review) dla pozostałych członków zespołu',
      },
      {
        id: uid(),
        type: 'h2',
        content: '6. Plan Działań: Dni 61-90 (Pełna Autonomia i Rozwój)',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Wdrożenie samodzielnej inicjatywy usprawniającej proces lub bibliotekę komponentów',
      },
      {
        id: uid(),
        type: 'todo',
        checked: false,
        content: 'Podsumowujące spotkanie kwartalne (Q1 Review) i wyznaczenie indywidualnych celów OKR',
      },
      {
        id: uid(),
        type: 'button',
        content: 'Dołącz do Oficjalnego Kanału Powitalnego na Slacku',
        buttonUrl: 'https://searchpoint.pl',
        buttonColor: '#6d28d9',
      },
    ],
  },
};
