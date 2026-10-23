/**
 * Rejestr Komend Asystenta Notatek (@ and / Commands Registry)
 * Notion-Grade Command Palette: skoncentrowany na notatkach, badaniach sieciowych, zadaniach i zespole.
 */

export interface AiCommandDef {
  id: string;
  command: string;
  aliases: string[];
  label: string;
  description: string;
  icon: string;
  category: 'notes' | 'web' | 'tasks' | 'team' | 'calendar' | 'navigation';
  exampleUsage: string;
}

export const AI_COMMANDS: AiCommandDef[] = [
  {
    id: 'cmd-note-summarize',
    command: '@streszcz',
    aliases: ['@summarize', '@summary', 'streszcz mi notatkę', 'podsumuj notatkę', '/streszcz', '/summarize'],
    label: '@streszcz <nazwa> / Streszcz mi notatkę...',
    description: 'Generuje zwięzłe podsumowanie wybranej notatki z kluczowymi wnioskami i statystykami',
    icon: '💡',
    category: 'notes',
    exampleUsage: '@streszcz Kot domowy',
  },
  {
    id: 'cmd-deep-research',
    command: '@deepresearch',
    aliases: ['@research', '@zbadaj', 'zbadaj w sieci', '/deepresearch', '/research', 'zbadaj rynek'],
    label: 'Deep Research (Wieloźródłowe badanie min. 4 domen)',
    description: 'Wieloźródłowe badanie min. 4 niezależnych domen z weryfikacją faktów i cytowaniami',
    icon: '🔬',
    category: 'web',
    exampleUsage: 'Zbadaj rynek i porównaj konkurencję',
  },
  {
    id: 'cmd-action-items',
    command: '@actionitems',
    aliases: ['@zadania_z_notatki', '@akcje', '/actionitems', '/akcje'],
    label: '@actionitems <notatka>',
    description: 'Automatycznie wyciąga zadania (Action Items) z notatki i tworzy karty na tablicy Kanban',
    icon: '🎯',
    category: 'tasks',
    exampleUsage: '@actionitems Kot domowy',
  },
  {
    id: 'cmd-meeting-notes',
    command: '@meeting',
    aliases: ['@spotkanie', '@protokol', '/meeting', '/spotkanie'],
    label: '@meeting <temat spotkania>',
    description: 'Tworzy ustrukturyzowany protokół spotkania z agendą, uczestnikami, tabelą ustaleń i TODO',
    icon: '🤝',
    category: 'notes',
    exampleUsage: '@meeting Planowanie sprintu',
  },
  {
    id: 'cmd-note-audit',
    command: '@audit',
    aliases: ['@improve', '@audyt', '@ulepsz', '/audit', '/improve'],
    label: '@audit <notatka>',
    description: 'Audytuje jakość i czytelność notatki, wylicza score i sugeruje 3 konkretne ulepszenia',
    icon: '🛡️',
    category: 'notes',
    exampleUsage: '@audit Kot domowy',
  },
  {
    id: 'cmd-notes-list',
    command: '@notes',
    aliases: ['@notatki', '@moje_notatki', 'pokaż moje notatki', 'pokaż notatki', '/notes', '/notatki'],
    label: '@notes / pokaż moje notatki',
    description: 'Wyświetla wszystkie Twoje notatki z opcjami otwierania, streszczenia i edycji',
    icon: '📚',
    category: 'notes',
    exampleUsage: '@notes',
  },
  {
    id: 'cmd-note-create',
    command: '@note',
    aliases: ['@doc', '@wiki', 'stwórz notatkę', '/note', '/doc', 'dodaj notatkę'],
    label: 'Nowa Strona / Stwórz notatkę',
    description: 'Tworzy ustrukturyzowany dokument ze zweryfikowaną treścią bezpośrednio w edytorze Studio',
    icon: '📝',
    category: 'notes',
    exampleUsage: 'Stwórz notatkę o architekturze oprogramowania',
  },
  {
    id: 'cmd-web-search',
    command: '@searchweb',
    aliases: ['@searchweb_', '@search', '@web', '@szukaj', '/searchweb', '/search', '/web'],
    label: '@searchweb <hasło> / @searchweb_koty',
    description: 'Otwiera po prawej Mini Przeglądarkę Web z wynikami wyszukiwania w sieci i czytnikiem',
    icon: '🌐',
    category: 'web',
    exampleUsage: '@searchweb_koty',
  },
  {
    id: 'cmd-web-note',
    command: '@noteweb',
    aliases: ['@noteweb_', '@webnote', '@notatka_web', '/noteweb', '/webnote', 'zbadaj w sieci'],
    label: 'Badanie Sieciowe / Zweryfikowana strona',
    description: 'Przeszukuje niezależne źródła internetowe i tworzy kompletną stronę z bibliografią',
    icon: '📑',
    category: 'web',
    exampleUsage: 'Zbadaj historię Polski',
  },
  {
    id: 'cmd-tasks-list',
    command: '@tasks',
    aliases: ['@zadania', 'pokaż moje zadania', 'pokaż zadania', '/tasks', '/zadania'],
    label: '@tasks / pokaż moje zadania',
    description: 'Wyświetla listę zadań ze statusem i możliwością szybkiego przełączenia',
    icon: '📋',
    category: 'tasks',
    exampleUsage: '@tasks',
  },
  {
    id: 'cmd-task-create',
    command: '@task',
    aliases: ['@todo', '@kanban_add', '/task', '/todo'],
    label: '@task <tytuł>',
    description: 'Dodaje nowe zadanie do tablicy Kanban z priorytetem',
    icon: '✅',
    category: 'tasks',
    exampleUsage: '@task Przygotować dokumentację API',
  },
  {
    id: 'cmd-team-add',
    command: '@add',
    aliases: ['@invite', '@team_add', '/add', '/invite'],
    label: '@add <email>',
    description: 'Wysyła zaproszenie do zespołu (np. @add kamil@searchpoint.pl) i otwiera podgląd',
    icon: '👥',
    category: 'team',
    exampleUsage: '@add kamil@searchpoint.pl',
  },
  {
    id: 'cmd-team-view',
    command: '@team',
    aliases: ['@teams', '@pokoje', '/team'],
    label: '@team',
    description: 'Przełącza do Pokojów Zespołów, listy współpracowników i zaproszeń',
    icon: '🏢',
    category: 'team',
    exampleUsage: '@team',
  },
  {
    id: 'cmd-calendar-event',
    command: '@calendar',
    aliases: ['@event', '@spotkanie', '/calendar', '/event'],
    label: '@calendar <nazwa> [data]',
    description: 'Planuje wydarzenie w kalendarzu i otwiera podgląd harmonogramu',
    icon: '📅',
    category: 'calendar',
    exampleUsage: '@calendar Przegląd sprintu jutro o 10:00',
  },
  {
    id: 'cmd-workspace-switch',
    command: '@workspace',
    aliases: ['@swith_workspace', '@pulpit', '@home', '/workspace'],
    label: '@workspace / @swith_workspace',
    description: 'Przełącza do głównego pulpitu, a AI dokuje w oknie bocznym',
    icon: '🔄',
    category: 'navigation',
    exampleUsage: '@swith_workspace',
  },
  {
    id: 'cmd-ai-fullscreen',
    command: '@ai',
    aliases: ['@swith_Ai', '@fullscreen', '@80%', '/ai'],
    label: '@ai / @swith_Ai',
    description: 'Maksymalizuje asystenta AI na 80% szerokości ekranu',
    icon: '✨',
    category: 'navigation',
    exampleUsage: '@swith_Ai',
  },
  {
    id: 'cmd-live-preview',
    command: '@priev',
    aliases: ['@preview', '@podglad', '@priew', '/preview', '/priev'],
    label: '@priev / @preview',
    description: 'Zmniejsza okno AI i natychmiast wyświetla Live Preview dokumentu',
    icon: '👁️',
    category: 'navigation',
    exampleUsage: '@priev',
  },
  {
    id: 'cmd-create-table',
    command: '@table',
    aliases: ['@tabela', '@stworz_tabele', '/table', '/tabela'],
    label: '@table <opis danych>',
    description: 'Generuje interaktywną tabelę / mini arkusz danych z kolumnami i wierszami',
    icon: '📊',
    category: 'notes',
    exampleUsage: '@table Porównanie frameworków React, Vue i Angular',
  },
  {
    id: 'cmd-create-database',
    command: '@database',
    aliases: ['@baza', '@db', '/database', '/baza'],
    label: '@database <nazwa>',
    description: 'Tworzy nową bazę danych z widokami Table, Kanban, Calendar i Gallery',
    icon: '🗄️',
    category: 'notes',
    exampleUsage: '@database Baza CRM Klientów',
  },
  {
    id: 'cmd-verify-claims',
    command: '@verifyclaims',
    aliases: ['@weryfikuj', '@fakty', '/verifyclaims', '/weryfikuj'],
    label: '@verifyclaims <stwierdzenie>',
    description: 'Weryfikuje fakt w 4-5 niezależnych źródłach ze statusem wiarygodności',
    icon: '🛡️',
    category: 'web',
    exampleUsage: '@verifyclaims Czy koty śpią 16 godzin dziennie?',
  },
  {
    id: 'cmd-read-source',
    command: '@readsource',
    aliases: ['@zrodlo', '@cytuj', '/readsource', '/zrodlo'],
    label: '@readsource <url lub nazwa>',
    description: 'Odczytuje i analizuje wybrane źródło pod kątem kluczowych faktów i cytatów',
    icon: '📖',
    category: 'web',
    exampleUsage: '@readsource Wikipedia: Sztuczna inteligencja',
  },
  {
    id: 'cmd-mindmap',
    command: '@mindmap',
    aliases: ['@mapamysli', '@diagram', '/mindmap', '/mapa'],
    label: '@mindmap <temat lub dokument>',
    description: 'Generuje 2D wizualną mapę pojęć i drzewo zagadnień z blokami Markdown i relacjami',
    icon: '🧠',
    category: 'notes',
    exampleUsage: '@mindmap Architektura nowoczesnej aplikacji',
  },
  {
    id: 'cmd-translate',
    command: '@translate',
    aliases: ['@tlumacz', '@przetlumacz', '/translate', '/tlumacz'],
    label: '@translate <język> [tekst/notatka]',
    description: 'Tłumaczy bloki dokumentu na wybrany język (EN, DE, ES, FR, PL) z zachowaniem stylów',
    icon: '🌐',
    category: 'notes',
    exampleUsage: '@translate EN ten dokument',
  },
  {
    id: 'cmd-polish-style',
    command: '@polishstyle',
    aliases: ['@korekta', '@styl', '@popraw', '/polishstyle', '/korekta'],
    label: '@polishstyle [b2b/naukowy/executive]',
    description: 'Redaguje ton notatki, poprawia błędy gramatyczne, interpunkcję i klarowność wywodu',
    icon: '✨',
    category: 'notes',
    exampleUsage: '@polishstyle b2b',
  },
  {
    id: 'cmd-critique',
    command: '@critique',
    aliases: ['@adwokatdiabla', '@krytyka', '@kontrargumenty', '/critique', '/adwokatdiabla'],
    label: '@critique / @adwokatdiabla',
    description: 'Analizuje luki logiczne, słabe punkty argumentacji, błędy poznawcze i generuje kontrargumenty',
    icon: '⚖️',
    category: 'notes',
    exampleUsage: '@critique ten plan',
  },
  {
    id: 'cmd-expand-block',
    command: '@expandblock',
    aliases: ['@rozwin', '@rozszerz', '/expandblock', '/rozwin'],
    label: '@expandblock <koncepcja lub blok>',
    description: 'Rozwija zwięzły akapit w szczegółowe kroki wdrożeniowe, przykłady i tabelę',
    icon: '🔍',
    category: 'notes',
    exampleUsage: '@expandblock Wdrożenie SQLite',
  },
];

/**
 * Szuka pasujących komend do wpisanego tekstu użytkownika
 */
export function matchAiCommands(query: string): AiCommandDef[] {
  const clean = query.trim().toLowerCase();
  if (!clean || (!clean.startsWith('@') && !clean.startsWith('/'))) {
    return [];
  }

  const basePrefix = clean.split(/[_\s]/)[0];

  return AI_COMMANDS.filter((cmd) => {
    if (cmd.command.toLowerCase().startsWith(clean) || cmd.command.toLowerCase().startsWith(basePrefix)) return true;
    return cmd.aliases.some(
      (a) => a.toLowerCase().startsWith(clean) || a.toLowerCase().startsWith(basePrefix)
    );
  });
}

/**
 * Ekstrahuje email z tekstu (np. @add kamil@searchpoint.pl)
 */
export function extractEmailFromText(text: string): string | null {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const match = text.match(emailRegex);
  return match ? match[1] : null;
}
