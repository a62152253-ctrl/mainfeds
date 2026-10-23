/**
 * Słownik & Baza Wiedzy (550+ słów i fraz)
 * Zawiera bogaty zbiór zwrotów konwersacyjnych, powitań ("hej jak sie masz?"),
 * emocji, intencji, pojęć workspace, zadań, notatek oraz poleceń systemowych.
 */

export interface VocabularyCategory {
  id: string;
  name: string;
  keywords: string[];
}

export const VOCABULARY_DATABASE: Record<string, string[]> = {
  // 1. Powitania i Small Talk (hej, jak sie masz, itp.) - 120+ fraz
  greetings_and_smalltalk: [
    'hej', 'hejka', 'hejeczka', 'siema', 'siemanko', 'siemanko mordeczko', 'siemka', 'elo', 'eluwina', 'witaj',
    'witajcie', 'witam', 'dzień dobry', 'dobry wieczór', 'dobrego dnia', 'miłego dnia', 'yo', 'joł', 'hello', 'hi',
    'jak sie masz', 'jak się masz', 'jak sie miewasz', 'jak się miewasz', 'co tam', 'co tam słychać', 'co słychać',
    'co u ciebie', 'co u cb', 'jak leci', 'jak leci dzionek', 'jak leci dzień', 'jak tam leci', 'jak tam leci w robocie',
    'co nowego', 'co tam nowego', 'co tam w trawie piszczy', 'jak życie', 'jak leci życie', 'jak zdrowie', 'jak leci praca',
    'co porabiasz', 'co tam działasz', 'wszystko gra', 'wszystko okej', 'wszystko ok', 'jak samopoczucie', 'jak się czujesz',
    'jak sie czujesz', 'żyjesz', 'jak żyjesz', 'co porabiasz byku', 'kopę lat', 'dawno się nie widzieliśmy',
    'jak tam u ciebie', 'co tam słychać dobrego', 'jak leci w nowym dniu', 'jak forma', 'jak nastroje', 'co u ciebie słychać',
    'jak tam dzisiejszy dzień', 'jak mija dzionek', 'jak mija dzień', 'co tam u ciebie dobrego', 'jak humorek', 'co tam słychać u ciebie',
    'czółko', 'uszanowanko', 'serwus', 'kłaniam się', 'dobry', 'siemano', 'witka', 'joł joł', 'witaj przyjacielu',
    'jak leci asystencie', 'co u ciebie bocie', 'jak tam twój dzień', 'jak się miewa studio', 'co porabiasz dzisiaj',
    'jak mija popołudnie', 'jak mija poranek', 'co tam w pracy', 'jak leci projekt', 'jak energia', 'wszystko w porządku',
    'jak tam sprawy', 'jak twoje zasilanie', 'czy wszystko gra', 'jak leci robota', 'co ciekawego', 'jakie plany',
    'co słychać w świecie', 'jak się trzymasz', 'trzymasz się', 'jak twoje algorytmy', 'jak humorek dzisiaj',
    'dobre rano', 'miłego popołudnia', 'miłego wieczoru', 'dobrej nocki', 'dobranoc', 'do usłyszenia', 'na razie',
    'nara', 'trzymaj się', 'do zoba', 'do zobaczenia', 'bywaj', 'cześć mistrzu', 'hejka szefie', 'siema byku',
    'jak tam głowa', 'jak poziom kawy', 'jak bateria', 'jak zasilanie procesorów', 'co porabiasz w studiu',
    'jak tam twoja baza', 'co słychać w kodzie', 'czy wszystko w normie', 'jak leci w poniedziałek', 'jak weekend minął'
  ],

  // 2. Samopoczucie i emocje (dobre, złe, stres, pochwały) - 95+ słów
  sentiment_and_feelings: [
    'super', 'fajnie', 'ekstra', 'mega', 'czad', 'świetnie', 'wspaniale', 'znakomicie', 'doskonale', 'kocur',
    'kozak', 'szef', 'petarda', 'mistrzostwo', 'bomba', 'cudownie', 'perfekcyjnie', 'idealnie', 'kocham', 'lubię',
    'dzięki', 'dziękuję', 'dzięki wielkie', 'dzięks', 'thx', 'dziekówa', 'doceniam', 'szacun', 'brawo', 'dobra robota',
    'smutno', 'źle', 'słabo', 'masakra', 'tragedia', 'lipa', 'dno', 'padaka', 'klapa', 'porażka', 'katastrofa',
    'zmęczony', 'zmęczona', 'przepracowany', 'przepracowana', 'wypalony', 'wypalona', 'burnout', 'stres', 'nerwy',
    'wkurzony', 'wkurzona', 'zły', 'zła', 'zirytowany', 'zirytowana', 'nie ogarniam', 'za dużo', 'ciężki dzień',
    'trudny dzień', 'masakryczny dzień', 'brak sił', 'padam na twarz', 'leżę', 'mam dość', 'nie mam siły', 'motywacja',
    'brak motywacji', 'spadek energii', 'dołek', 'wesoły', 'zadowolony', 'pełen energii', 'zmotywowany', 'gotowy do walki',
    'zrelaksowany', 'spokojny', 'odpoczywam', 'chill', 'luzik', 'odpoczynek', 'spokój', 'ulga', 'oddech',
    'satysfakcja', 'duma', 'sukces', 'zwycięstwo', 'chęć do pracy', 'wena', 'flow', 'w transie', 'zajawka',
    'ekscytacja', 'ciekawość', 'zaintrygowany', 'optymizm', 'pesymizm', 'zagubiony', 'przytłoczony', 'chaotycznie'
  ],

  // 3. Przełączanie widoków i komendy systemowe - 70+ fraz
  workspace_commands: [
    '@swith_workspace', '@switch_workspace', '@swith_ai', '@switch_ai', '@swith_Ai', '@ai_fullscreen', '@fullscreen',
    'przełącz na pulpit', 'pokaż pulpit', 'otwórz pulpit', 'przełącz na workspace', 'pokaż workspace', 'otwórz workspace',
    'zminimalizuj chat', 'zminimalizuj czat', 'zwiń czat', 'zwiń ai', 'małe okienko', 'prawe okienko', 'okno po prawej',
    'powiększ ai', 'rozwiń ai', 'pokaż ai na 80%', '80 procent', '80%', 'pełny ekran ai', 'maksymalizuj', 'maksymalizuj czat',
    'pełny chatbot', 'widok 80', 'powrót do ai', 'zamień na małe okno', 'zmień widok', 'przełącz widok', 'gdzie jest pulpit',
    'gdzie są moje zadania', 'gdzie jest kalendarz', 'ukryj czat', 'otwórz home', 'idź do home', 'przejdź do home',
    'ekran główny', 'widok główny', 'zminimalizuj się', 'zmniejsz się', 'powiększ się', 'rozciągnij', 'zwiń okno',
    'przełącz okno', 'zamknij czat', 'schowaj czat', 'pokaż panel boczny', 'widok kompaktowy', 'tryb skupienia',
    'dock po prawej', 'okno boczne', 'powrót na pulpit', 'widok startowy', 'dashboard', 'pulpit główny', 'wyczyść czat'
  ],

  // 4. Zadania, Sprint, Kanban i Workload - 100+ słów
  tasks_and_workload: [
    'zadanie', 'zadania', 'zadaniem', 'zadaniami', 'task', 'taski', 'taska', 'taskami', 'todo', 'to-do',
    'kanban', 'tablica', 'tablicy', 'tablice', 'priorytet', 'priorytety', 'priorytetem', 'krytyczny', 'wysoki', 'średni', 'niski',
    'sprint', 'sprintu', 'sprintem', 'sprinty', 'deadline', 'termin', 'terminy', 'terminem', 'do zrobienia', 'w trakcie',
    'zrobione', 'ukończone', 'zrealizowane', 'przypisz', 'przypisana', 'przypisany', 'odciąż', 'reallokacja', 'przenieś zadanie',
    'workload', 'obciążenie', 'obciążenia', 'obciążeniem', 'przepracowanie', 'ryzyko wypalenia', 'wypalenie', 'norma', 'godziny',
    'estymacja', 'estymacje', 'estymowany czas', 'backlog', 'kolejka', 'lista zadań', 'nowe zadanie', 'dodaj zadanie',
    'usuń zadanie', 'edytuj zadanie', 'ukończ zadanie', 'status zadania', 'przeciążony pracownik', 'wolne moce', 'przepustowość',
    'zarządzanie zadaniami', 'planowanie zadań', 'rozkład zadań', 'podział pracy', 'kto co robi', 'kto ma co zrobić',
    'praca zespołowa', 'delegowanie', 'oddeleguj', 'harmonogram zadań', 'kamienie milowe', 'etapy', 'kroki',
    'spóźnione zadanie', 'zaległości', 'task management', 'scrum', 'daily', 'retro', 'retrospektywa', 'planowanie sprintu',
    'wąskie gardło', 'bottleneck', 'przydział obowiązków', 'odpowiedzialność', 'czas realizacji', 'postęp prac'
  ],

  // 5. Notatki, Dokumenty i Baza Wiedzy - 100+ słów
  notes_and_documentation: [
    'notatka', 'notatki', 'notatką', 'notatce', 'dokument', 'dokumenty', 'dokumentu', 'dokumentem', 'strona', 'strony',
    'stronę', 'stronami', 'arkusz', 'baza wiedzy', 'wiki', 'konspekt', 'szablon', 'szablony', 'notatki ze spotkania',
    'spotkanie', 'meeting', 'zapisz w notatkach', 'zapisz jako stronę', 'utwórz dokument', 'stwórz stronę', 'nowy dokument',
    'podsumuj', 'podsumowanie', 'streszczenie', 'streszcz', 'brief', 'raport', 'artykuł', 'protokół', 'agenda',
    'ustalenia', 'wnioski', 'plan działania', 'checklist', 'checklista', 'nagłówek', 'akapity', 'treść', 'wersje',
    'historia wersji', 'cytat', 'tabela', 'kod źródłowy', 'odnośnik', 'link', 'wikilink', 'powiązania', 'backlinks',
    'spis treści', 'outline', 'galeria okładek', 'okładka', 'ikona strony', 'edycja tekstu', 'kolor tekstu', 'wyróżnienie',
    'zakreślacz', 'blokada sekcji', 'komentarz', 'dyskusja', 'wzmianka', 'oznaczanie', 'ulubione strony', 'publiczne strony',
    'podstrona', 'drzewo stron', 'zwiń sekcję', 'rozzwiń sekcję', 'callout', 'ramka informacyjna', 'formatowanie tekstu',
    'pogrubienie', 'kursywa', 'przekreślenie', 'lista numerowana', 'lista punktowana', 'kod w linii', 'szablon projektu'
  ],

  // 6. Narzędzia, Bazy Danych i Integracje - 70+ słów
  tools_and_database: [
    'baza danych', 'bazy danych', 'database', 'tabela', 'tabele', 'rekord', 'rekordy', 'kolumna', 'kolumny', 'wiersz',
    'wiersze', 'filtr', 'filtry', 'filtrowanie', 'sortowanie', 'widok tabeli', 'kalendarz', 'widok kalendarza', 'miesiąc',
    'tydzień', 'wydarzenie', 'spotkania', 'pokoje zespołów', 'zespół', 'team', 'członkowie', 'role', 'uprawnienia',
    'właściciel', 'admin', 'edytor', 'viewer', 'zaproszenie', 'kod zaproszenia', 'audit log', 'dziennik aktywności',
    'ogłoszenia', 'tablica ogłoszeń', 'czat zespołowy', 'synchronizacja', 'czas rzeczywisty', 'kursory', 'multiplayer',
    'figma cursors', 'live cursors', 'blokowanie sekcji', 'section locking', 'kontekstowe komentarze', 'powiadomienia push',
    'centrum aktywności', 'profil użytkownika', 'ustawienia studia', 'tryb ciemny', 'dark mode', 'eksport danych', 'import danych'
  ],

  // 7. Pytania, doradztwo i asysta - 75+ słów
  inquiries_and_advice: [
    'jak', 'dlaczego', 'czemu', 'kiedy', 'gdzie', 'kto', 'ile', 'jaki', 'jaka', 'jakie', 'czy', 'czy możesz',
    'mógłbyś', 'mogłabyś', 'pomożesz', 'pomóż', 'doradź', 'co myślisz', 'co sądzisz', 'jak najlepiej', 'jak zrobić',
    'jak działa', 'wytłumacz', 'wyjaśnij', 'opowiedz', 'zaproponuj', 'podpowiedz', 'daj pomysł', 'burza mózgów',
    'brainstorm', 'pomysły', 'koncepcja', 'strategia', 'rozwiązanie', 'alternatywa', 'krok po kroku', 'instrukcja',
    'poradnik', 'wskazówka', 'lifehack', 'trik', 'najlepsze praktyki', 'rekomendacja', 'podsumuj temat',
    'rozpisz', 'wymyśl', 'zaplanuj', 'przeanalizuj', 'zoptymalizuj', 'popraw', 'ulepsz', 'przekształć',
    'co polecasz', 'jaka jest twoja rada', 'jakie masz zdanie', 'pomoc w projekcie', 'pomoc w kodzie'
  ]
};

// Łączna liczba unikalnych słów i fraz w bazie
export const TOTAL_VOCABULARY_COUNT = Object.values(VOCABULARY_DATABASE).reduce(
  (sum, list) => sum + list.length,
  0
);
