import { VOCABULARY_DATABASE } from './vocabulary';
import { polishWordbank } from './wordbankLoader';
import { queryKnowledgeBase, KnowledgeEntry } from './knowledgeBase';
import { conversationMemory } from './conversationMemory';
import { extractEmailFromText } from './commandsRegistry';

export type UserIntent =
  | 'DEEP_ANALYTICAL_STUDY'     // Wielopunktowe analizy architektoniczne, SaaS, kalkulacje, studia wykonalności
  | 'APP_ONBOARDING_AND_GUIDE' // "jestem nowy", "szukam alternatywy dla notion", "ile macie bloków", "jakie bloki", "co potrafi ta appka"
  | 'CAPABILITY_SHOWCASE'      // "umiesz w 4 źródłach", "jakie masz źródła", "co potrafisz badać"
  | 'QUESTION_OPENING'         // "mam pytanie", "ey mam pytanie skrome", "mogę o coś zapytać?", "pytanko"
  | 'GREETING_SMALLTALK'       // "hej", "siema", "jak sie masz?", "co tam?"
  | 'FEELINGS_CHECK'           // "jak się czujesz?", "żyjesz?", "wszystko gra?", "co u cb?"
  | 'SWITCH_WORKSPACE'         // "@swith_workspace", "pokaż pulpit", "zwiń czat"
  | 'SWITCH_AI'                // "@swith_Ai", "pokaż ai na 80%", "maksymalizuj"
  | 'SUMMARIZE_NOTE'           // "Streszcz mi notatkę Kot domowy", "@streszcz", "@summarize"
  | 'DEEP_RESEARCH'            // "@deepresearch", "@research", "zbadaj wieloźródłowo"
  | 'EXTRACT_ACTION_ITEMS'     // "@actionitems", "@zadania_z_notatki", "wyciągnij zadania"
  | 'CREATE_MEETING_NOTES'     // "@meeting", "@spotkanie", "protokół spotkania"
  | 'AUDIT_NOTE'               // "@audit", "@improve", "audytuj notatkę"
  | 'LIST_USER_NOTES'          // "pokaż moje notatki", "@notes", "co mam zapisane"
  | 'LIST_USER_TASKS'          // "pokaż moje zadania", "@tasks", "co mam do zrobienia"
  | 'ORGANIZE_FOLDERS'         // "uporządkuj notatki", "podziel na foldery", "@organize"
  | 'SEARCH_WEB'               // "@searchweb_koty", "@searchweb koty", "szukaj w sieci"
  | 'NOTE_WEB'                 // "@noteweb_koty", "@noteweb koty", "badanie z sieci"
  | 'TEAM_INVITE_ACTION'       // "@add kasue@easkp.pl", "@invite kasue@easkp.pl"
  | 'SHOW_TEAMS_VIEW'          // "@team", "@teams", "pokoje zespołów"
  | 'SHOW_WORKLOAD'            // "@burnout", "@workload", "obciążenie zespołu"
  | 'CREATE_NOTE_LIVE'         // "@note sztuczna inteligencja", "stwórz notatkę o..."
  | 'CREATE_CALENDAR_EVENT'    // "@calendar spotkanie jutro", "dodaj do kalendarza"
  | 'CREATE_TASK_LIVE'         // "@task wdrożyć system", "@todo zrobić testy"
  | 'SHOW_DATABASE'            // "@database", "@db", "baza danych"
  | 'TASKS_AND_SPRINT'         // "zaplanuj zadania", "co mam zrobić", "sprint"
  | 'NOTES_AND_DOCUMENTATION'  // "napisz notatkę", "stwórz dokument", "konspekt"
  | 'KNOWLEDGE_QUERY'          // "czym jest closure", "jak działa event loop", "relativity"
  | 'QUESTION_HOW_TO'          // "jak zrobić X", "jak zacząć", "jak wdrożyć"
  | 'QUESTION_WHY'             // "dlaczego niebo jest niebieskie", "czemu X"
  | 'QUESTION_WHAT_IS'         // "co to jest X", "czym jest Y", "definicja"
  | 'QUESTION_COMPARISON'      // "czym się różni X od Y", "co lepsze"
  | 'FOLLOW_UP_CONTEXT'        // "a podasz przykład?", "rozwiń to", "napisz do tego kod"
  | 'CODE_AND_TECH'            // "napisz kod", "jak działa react", "typescript"
  | 'HUMOR_AND_JOKES'          // "opowiedz żart", "kawał", "coś śmiesznego"
  | 'TIRED_OR_FRUSTRATED'      // "jestem zmęczony", "masakra", "nie ogarniam"
  | 'PRAISE_AND_THANKS'        // "dzięki", "super", "jesteś kocur"
  | 'ADVICE_AND_HOWTO'         // "doradź mi", "co myślisz", "strategia"
  | 'GENERAL_CONVERSATION';

export interface ReasoningResult {
  originalPrompt: string;
  normalizedPrompt: string;
  intent: UserIntent;
  subIntent?: string;
  detectedKeywords: string[];
  corpusMatchedCount: number;
  extractedTopic?: string;
  extractedEmail?: string;
  extractedDate?: string;
  knowledgeMatch?: KnowledgeEntry | null;
  sentiment: 'positive' | 'friendly' | 'curious' | 'neutral' | 'tired' | 'stressed';
  topic: 'smalltalk' | 'workspace_control' | 'team' | 'tasks' | 'calendar' | 'database' | 'notes' | 'code' | 'science' | 'productivity' | 'advice' | 'web' | 'general';
  confidence: number;
  actionTrigger?:
    | 'switch_workspace'
    | 'expand_ai'
    | 'summarize_note'
    | 'deep_research'
    | 'extract_action_items'
    | 'create_meeting'
    | 'audit_note'
    | 'team_invite'
    | 'switch_teams'
    | 'show_workload'
    | 'create_note_live'
    | 'create_calendar'
    | 'create_task'
    | 'switch_database'
    | 'search_web'
    | 'note_web'
    | 'list_notes'
    | 'list_tasks'
    | 'organize_folders';
  thoughtProcess: string[]; // Kroki rozumowania ("kminienie usera")
  explanation: string;      // Krótka synteza: jak bot zrozumiał usera
}

/**
 * Normalizuje tekst: usuwa interpunkcję i wielokrotne spacje
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Usuwa polskie ogonki, aby obsłużyć "jak sie masz" i "jak się masz" zamiennie
 */
function stripPolishDiacritics(text: string): string {
  const map: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z'
  };
  return text.replace(/[ąćęłńóśźż]/g, (match) => map[match] || match);
}

/**
 * Sprawdza czy dany wyraz występuje jako odrębne słowo
 */
function hasExactWord(text: string, word: string): boolean {
  const regex = new RegExp(`(^|\\s)${word}(\\s|$)`, 'i');
  return regex.test(text);
}

/**
 * Wyodrębnia główny temat zapytania (usuwa polskie stop-words)
 */
function extractMainTopic(prompt: string): string {
  const stopwords = new Set([
    'w', 'z', 'na', 'do', 'o', 'jak', 'co', 'to', 'jest', 'czy', 'dlaczego', 'czemu', 'po', 'co',
    'sie', 'się', 'mi', 'ci', 'ze', 'że', 'i', 'a', 'ale', 'oraz', 'jaki', 'jaka', 'jakie', 'dla',
    'od', 'przez', 'pod', 'nad', 'przy', 'napisz', 'wytlumacz', 'wytłumacz', 'wyjasnij', 'wyjaśnij',
    'powiedz', 'opowiedz', 'prosze', 'proszę', 'hej', 'siema', 'czesc', 'cześć', 'stwórz', 'stworz',
    'notatkę', 'notatke', 'dokument', 'artykuł', 'artykul'
  ]);

  const words = prompt
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopwords.has(w));

  return words.slice(0, 4).join(' ') || prompt;
}

/**
 * Główny silnik rozumowania (Reasoning Engine)
 * Obsługuje rozbudowane komendy (@add, @note, @calendar, @task, @team, @burnout itp.),
 * ekstrakcję emaila, analizę leksykalną oraz sterowanie Live Preview.
 */
export function reasonAboutUserInput(rawPrompt: string): ReasoningResult {
  const normalized = normalizeText(rawPrompt);
  const stripped = stripPolishDiacritics(normalized);
  const rawLower = rawPrompt.toLowerCase().trim();

  const thoughtProcess: string[] = [];
  const detectedKeywords: string[] = [];

  // 1. Sprawdzenie w 50,000 korpusie słów z GitHuba
  const corpusAnalysis = polishWordbank.analyzeSentenceTokens(rawPrompt);
  thoughtProcess.push(
    `[1. Leksyka GitHub 50k]: Rozpoznano ${corpusAnalysis.knownCount}/${corpusAnalysis.tokens.length} tokenów w korpusie.`
  );

  // =========================================================================
  // 1.5. DETEKCJA ROZBUDOWANYCH ZAPYTAŃ ANALITYCZNYCH & ARCHITEKTONICZNYCH
  // Gdy użytkownik zadaje wielopunktowe pytanie inżynieryjne / SaaS / studium wykonalności,
  // nie ucinamy go prostym pojedynczym regexem, lecz kierujemy do pełnej analizy wieloetapowej.
  // =========================================================================
  const isDeepAnalyticalPrompt =
    rawPrompt.length > 250 ||
    /\b(?:1\.|2\.|3\.|4\.)/.test(rawPrompt) ||
    (rawPrompt.includes('?') && rawPrompt.split('\n').length >= 4);

  if (isDeepAnalyticalPrompt) {
    thoughtProcess.push('[1. Rozbudowane Studium Analityczne]: Prompt zawiera wielopunktową analizę inżynieryjną, kalkulacje skali lub specyfikację architektury.');
    thoughtProcess.push('[2. Pełny Silnik Generatywny]: Zamiast prostego szablonu, uruchamiam rygorystyczną syntezę z podziałem na etapy, koszty i architekturę.');
    detectedKeywords.push('studium-architektury', 'saas', 'infrastruktura');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'DEEP_ANALYTICAL_STUDY',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: 'Studium Architektury SaaS i Skalowania',
      sentiment: 'curious',
      topic: 'science',
      confidence: 1.0,
      thoughtProcess,
      explanation: 'Wielopunktowe studium architektoniczne i biznesowe: przeprowadzam pełną analizę inżynieryjną, obliczenia skali, warianty wdrożenia i tworzę dokument w bazie wiedzy.',
    };
  }

  // =========================================================================
  // 1.8. DETEKCJA ONBOARDINGU, NOWEGO UŻYTKOWNIKA I PRZEWODNIKA PO SEARCHPOINT STUDIO
  // ("jestem nowy", "szukam alternatywy dla notion", "ile jest bloków", "jakie bloki", "co potrafi ta appka")
  // =========================================================================
  const isOnboardingOrGuide =
    stripped.includes('jestem nowy') ||
    stripped.includes('jestem nowa') ||
    stripped.includes('nowy uzytkownik') ||
    stripped.includes('nowy u was') ||
    stripped.includes('szukam tanszej alternatywy') ||
    stripped.includes('szukam tansza alternatywe') ||
    stripped.includes('szukam tansza alternatyw') ||
    stripped.includes('szukam alternatyw') ||
    stripped.includes('alternatyw dla notion') ||
    stripped.includes('alternatywa dla notion') ||
    stripped.includes('alternatywe dla notion') ||
    stripped.includes('zamiennik notion') ||
    stripped.includes('tansza alternatywa') ||
    stripped.includes('tanszy notion') ||
    stripped.includes('tansza od notion') ||
    stripped.includes('jak dziala appka') ||
    stripped.includes('jak dziala ta appka') ||
    stripped.includes('jak dziala aplikacja') ||
    stripped.includes('jak dziala to studio') ||
    stripped.includes('co potrafi ta appka') ||
    stripped.includes('co potrafi ta aplikacja') ||
    stripped.includes('co potrafi searchpoint') ||
    stripped.includes('ile jest blokow') ||
    stripped.includes('ile macie blokow') ||
    stripped.includes('jakie sa typy blokow') ||
    stripped.includes('jakie sa bloki') ||
    stripped.includes('jakie macie bloki') ||
    stripped.includes('lista blokow') ||
    stripped.includes('typy blokow');

  if (isOnboardingOrGuide) {
    thoughtProcess.push('[1. Onboarding & Przewodnik]: Użytkownik jest nowy, szuka alternatywy lub pyta o architekturę i bloki SearchPoint Studio.');
    thoughtProcess.push('[2. Szczegółowe wyjaśnienie]: Prezentuję specyfikację 50+ typów bloków, bazę SQLite, pokoje zespołów Mini-Asana oraz unikalne atuty.');
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'APP_ONBOARDING_AND_GUIDE',
      detectedKeywords: ['onboarding', 'bloki', 'searchpoint-studio', 'alternatywa'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'friendly',
      topic: 'workspace_control',
      confidence: 1.0,
      thoughtProcess,
      explanation: 'Użytkownik pyta o możliwości aplikacji SearchPoint Studio, typy bloków lub szuka darmowej alternatywy. Generuję wyczerpujący przewodnik.',
    };
  }

  // =========================================================================
  // 1.9. DETEKCJA ZAPYTAŃ O MOŻLIWOŚCI BADAWCZE / 9+ ŹRÓDEŁ (Capability Showcase)
  // ("umiesz w 9 źródłach", "w 4 źródłach", "jakie masz źródła", "co potrafisz badać")
  // =========================================================================
  const isCapabilityQuery =
    stripped.includes('umiesz w 4') ||
    stripped.includes('umiesz w 9') ||
    stripped.includes('potrafisz w 4') ||
    stripped.includes('potrafisz w 9') ||
    stripped.includes('w 4 zrodlach') ||
    stripped.includes('w 4 źródłach') ||
    stripped.includes('w 9 zrodlach') ||
    stripped.includes('w 9 zrudlach') ||
    stripped.includes('9 zrodel') ||
    stripped.includes('9 zrudel') ||
    stripped.includes('jakie masz zrodla') ||
    stripped.includes('jakie masz zrudla') ||
    stripped.includes('jakie masz źródła') ||
    stripped.includes('z jakich zrodel') ||
    stripped.includes('z jakich zrudel') ||
    stripped.includes('z jakich źródeł') ||
    stripped.includes('co potrafisz badac') ||
    stripped.includes('co potrafisz zbadać') ||
    stripped.includes('jak dziala deep research') ||
    stripped.includes('jak dziala badanie');

  if (isCapabilityQuery) {
    thoughtProcess.push('[1. Prezentacja Możliwości Badawczych]: Użytkownik pyta o weryfikację w 9+ niezależnych źródłach.');
    thoughtProcess.push('[2. Wyjaśnienie silnika]: Prezentuję 11 darmowych baz: ISAP/Sejm Gov, StackOverflow, NPM, Europe PMC, OpenAlex, Crossref, Semantic Scholar, Wikipedia PL/EN, Wikidata, OpenLibrary i Web.');
    detectedKeywords.push('deep-research-9-zrodel', 'weryfikacja', 'sejm-gov', 'stackoverflow', 'openalex', 'wikidata', 'crossref');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'CAPABILITY_SHOWCASE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: 'Wieloźródłowy Silnik Weryfikacji (9+ Niezależnych Domen)',
      sentiment: 'friendly',
      topic: 'science',
      confidence: 1.0,
      thoughtProcess,
      explanation: 'Wyjaśniam architekturę badania wieloźródłowego w 9+ niezależnych bazach (ISAP/Sejm Gov, StackOverflow, NPM, Europe PMC, OpenAlex, Crossref, Wikidata, Wikipedia PL/EN, OpenLibrary) i proponuję natychmiastowe uruchomienie testu.',
    };
  }

  // =========================================================================
  // 2. DETEKCJA KOMEND SYSTEMOWYCH & INTELIGENTNYCH AKCJI (@searchweb, @noteweb, @add, @note...)
  // =========================================================================

  // A1. Komenda @streszcz / @summarize / "Streszcz mi notatkę..."
  if (
    rawLower.startsWith('@streszcz') ||
    rawLower.startsWith('@summarize') ||
    rawLower.startsWith('@summary') ||
    rawLower.startsWith('/streszcz') ||
    rawLower.startsWith('/summarize') ||
    stripped.includes('streszcz mi notatke') ||
    stripped.includes('streszcz mi notatkę') ||
    stripped.includes('streszcz notatke') ||
    stripped.includes('streszcz notatkę') ||
    stripped.includes('streszcz mi dokument') ||
    stripped.includes('streszcz dokument') ||
    stripped.includes('podsumuj mi notatke') ||
    stripped.includes('podsumuj mi notatkę') ||
    stripped.includes('podsumuj notatke') ||
    stripped.includes('podsumuj notatkę') ||
    stripped.includes('podsumuj dokument') ||
    stripped.startsWith('streszcz') ||
    stripped.startsWith('podsumuj')
  ) {
    let cleanTarget = rawPrompt
      .replace(/^(@streszcz_|@streszcz\s*|@summarize_|@summarize\s*|@summary\s*|\/streszcz\s*|\/summarize\s*)/i, '')
      .replace(/^(streszcz mi notatkę|streszcz mi notatke|streszcz notatkę|streszcz notatke|streszcz mi dokument|streszcz dokument|podsumuj mi notatkę|podsumuj mi notatke|podsumuj notatkę|podsumuj notatke|podsumuj dokument|streszcz mi|streszcz|podsumuj mi|podsumuj)\s*(o|z|dla|notatkę|notatke|dokument)?\s*/i, '')
      .replace(/["'„”«»]/g, '')
      .trim();

    thoughtProcess.push(`[2. Komenda @streszcz]: Żądanie streszczenia notatki użytkownika: "${cleanTarget || 'ostatnia notatka'}".`);
    thoughtProcess.push(`[3. Akcja]: Odnalezienie strony w przestrzeni roboczej, analiza treści i wygenerowanie Executive Summary z kluczowymi punktami.`);
    detectedKeywords.push('@streszcz', cleanTarget);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SUMMARIZE_NOTE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanTarget,
      sentiment: 'curious',
      topic: 'notes',
      confidence: 1.0,
      actionTrigger: 'summarize_note',
      thoughtProcess,
      explanation: `Zlecono streszczenie notatki: **"${cleanTarget || 'z bazy wiedzy'}"**. Pobieram treść z bazy wiedzy i przygotowuję kluczowe wnioski.`,
    };
  }

  // A2. Deep Research / Analiza Rynku / Wieloźródłowe Badanie (Natural Language + komendy analyze / zbadaj)
  if (
    rawLower.startsWith('@deepresearch') ||
    rawLower.startsWith('@research') ||
    rawLower.startsWith('@analyze') ||
    rawLower.startsWith('@analizuj') ||
    rawLower.startsWith('@zbadaj') ||
    rawLower.startsWith('/deepresearch') ||
    rawLower.startsWith('/research') ||
    rawLower.startsWith('/analyze') ||
    rawLower.startsWith('/zbadaj') ||
    rawLower.startsWith('analyze ') ||
    rawLower === 'analyze' ||
    stripped.startsWith('analyze') ||
    stripped.startsWith('analizuj') ||
    stripped.startsWith('zanalizuj') ||
    stripped.includes('przeanalizuj ten temat') ||
    stripped.includes('przeanalizuj temat') ||
    stripped.includes('przeanalizuj') ||
    stripped.includes('szczegolowe opracowanie') ||
    stripped.includes('szczegółowe opracowanie') ||
    stripped.includes('zbadaj rynek') ||
    stripped.includes('porownaj konkurencje') ||
    stripped.includes('porównaj konkurencję') ||
    stripped.includes('zbadaj wielozrodlowo') ||
    stripped.includes('zbadaj wieloźródłowo') ||
    stripped.includes('zbadaj w sieci') ||
    stripped.includes('zbadaj temat') ||
    stripped.startsWith('zbadaj')
  ) {
    let cleanTopic = rawPrompt
      .replace(/^(@deepresearch_|@deepresearch\s*|@research_|@research\s*|@analyze_|@analyze\s*|@analizuj\s*|@zbadaj_|@zbadaj\s*|\/deepresearch\s*|\/research\s*|\/analyze\s*|\/zbadaj\s*)/i, '')
      .replace(/^(przeanalizuj ten temat i przygotuj szczegółowe opracowanie|przeanalizuj ten temat i przygotuj szczegolowe opracowanie|przeanalizuj temat|przeanalizuj|zanalizuj|analizuj|analyze|zbadaj rynek i porównaj konkurencję|zbadaj rynek i porownaj konkurencje|zbadaj wielozrodlowo|zbadaj wieloźródłowo|zbadaj w sieci i stworz notatke o|zbadaj w sieci i stwórz notatkę o|zbadaj w sieci|zbadaj temat|zbadaj)\s*(?:o|i|dla|dotyczącą|dotyczaca|ze|z|na temat|:|-)?\s*/i, '')
      .replace(/_/g, ' ')
      .replace(/["'„”«»]/g, '')
      .trim();

    cleanTopic = cleanTopic.replace(/^(?:o|i|dotyczącą|dotyczaca|dla|na temat)\s+/i, '').trim();
    if (!cleanTopic) cleanTopic = 'Analiza rynku i konkurencji';

    thoughtProcess.push(`[Deep Research]: Żądanie wieloźródłowego badania tematu: "${cleanTopic}" (min. 4 niezależne domeny + weryfikacja krzyżowa).`);
    thoughtProcess.push(`[Akcja]: Pobranie źródeł, weryfikacja faktów i zapisanie strony w Workspace.`);
    detectedKeywords.push('badanie', cleanTopic);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'DEEP_RESEARCH',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanTopic,
      sentiment: 'curious',
      topic: 'web',
      confidence: 1.0,
      actionTrigger: 'deep_research',
      thoughtProcess,
      explanation: `Uruchamiam wieloźródłowe badanie z weryfikacją w 4+ niezależnych domenach dla: **"${cleanTopic}"**.`,
    };
  }

  // A3. Komenda @actionitems / @zadania_z_notatki
  if (
    rawLower.startsWith('@actionitems') ||
    rawLower.startsWith('@zadania_z_notatki') ||
    rawLower.startsWith('@akcje') ||
    rawLower.startsWith('/actionitems') ||
    stripped.includes('zadania z notatki') ||
    stripped.includes('wyciagnij zadania') ||
    stripped.includes('wyciągnij zadania')
  ) {
    let cleanTarget = rawPrompt
      .replace(/^(@actionitems_|@actionitems\s*|@zadania_z_notatki_|@zadania_z_notatki\s*|@akcje\s*|\/actionitems\s*)/i, '')
      .replace(/^(zadania z notatki|wyciągnij zadania z notatki|wyciagnij zadania z notatki|wyciągnij zadania|wyciagnij zadania)\s*(o|z|dla|notatki)?\s*/i, '')
      .replace(/["'„”«»]/g, '')
      .trim();

    thoughtProcess.push(`[2. Komenda @actionitems]: Żądanie wyodrębnienia zadań z notatki: "${cleanTarget}".`);
    thoughtProcess.push(`[3. Akcja]: Przeskanowanie bloków notatki, wykrycie punktów działania i konwersja na karty Kanban.`);
    detectedKeywords.push('@actionitems', cleanTarget);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'EXTRACT_ACTION_ITEMS',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanTarget,
      sentiment: 'positive',
      topic: 'tasks',
      confidence: 1.0,
      actionTrigger: 'extract_action_items',
      thoughtProcess,
      explanation: `Analizuję notatkę **"${cleanTarget || 'ostatnia notatka'}"** w poszukiwaniu zadań do wdrożenia na tablicy Kanban.`,
    };
  }

  // A4. Komenda @meeting / @spotkanie (Szablon Notatki ze Spotkania)
  if (
    rawLower.startsWith('@meeting') ||
    rawLower.startsWith('@spotkanie') ||
    rawLower.startsWith('@protokol') ||
    rawLower.startsWith('/meeting') ||
    rawLower.startsWith('/spotkanie') ||
    stripped.includes('notatka ze spotkania') ||
    stripped.includes('protokol ze spotkania') ||
    stripped.includes('protokół ze spotkania')
  ) {
    let cleanTopic = rawPrompt
      .replace(/^(@meeting_|@meeting\s*|@spotkanie_|@spotkanie\s*|@protokol\s*|\/meeting\s*|\/spotkanie\s*)/i, '')
      .replace(/^(notatka ze spotkania o|notatka ze spotkania|protokół ze spotkania o|protokol ze spotkania|szablon spotkania)\s*/i, '')
      .replace(/["'„”«»]/g, '')
      .trim();

    if (!cleanTopic) cleanTopic = 'Planowanie Zespołowe';

    thoughtProcess.push(`[2. Komenda @meeting]: Żądanie utworzenia protokołu ze spotkania: "${cleanTopic}".`);
    thoughtProcess.push(`[3. Akcja]: Wygenerowanie ustrukturyzowanej notatki z agendą, tabelą ustaleń i listą TODO.`);
    detectedKeywords.push('@meeting', cleanTopic);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'CREATE_MEETING_NOTES',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanTopic,
      sentiment: 'positive',
      topic: 'notes',
      confidence: 1.0,
      actionTrigger: 'create_meeting',
      thoughtProcess,
      explanation: `Tworzę profesjonalny protokół spotkania dla: **"${cleanTopic}"** z agendą, tabelą decyzji i zadaniami.`,
    };
  }

  // A5. Komenda @audit / @improve / Audyt Jakości Notatki
  if (
    rawLower.startsWith('@audit') ||
    rawLower.startsWith('@improve') ||
    rawLower.startsWith('@audyt') ||
    rawLower.startsWith('@ulepsz') ||
    rawLower.startsWith('/audit') ||
    rawLower.startsWith('/improve') ||
    stripped.includes('audytuj notatke') ||
    stripped.includes('audytuj notatkę') ||
    stripped.includes('audyt notatki') ||
    stripped.includes('ulepsz notatke') ||
    stripped.includes('ulepsz notatkę') ||
    stripped.includes('jak ulepszyc notatke')
  ) {
    let cleanTarget = rawPrompt
      .replace(/^(@audit_|@audit\s*|@improve_|@improve\s*|@audyt\s*|@ulepsz\s*|\/audit\s*|\/improve\s*)/i, '')
      .replace(/^(audytuj notatkę|audytuj notatke|audyt notatki|ulepsz notatkę|ulepsz notatke|jak ulepszyć notatkę|jak ulepszyc notatke)\s*(o|z|dla|notatkę|notatke)?\s*/i, '')
      .replace(/["'„”«»]/g, '')
      .trim();

    thoughtProcess.push(`[2. Komenda @audit]: Żądanie audytu jakości notatki: "${cleanTarget}".`);
    thoughtProcess.push(`[3. Akcja]: Analiza struktury bloków, ocena czytelności i wygenerowanie 3 konkretnych ulepszeń.`);
    detectedKeywords.push('@audit', cleanTarget);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'AUDIT_NOTE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanTarget,
      sentiment: 'curious',
      topic: 'notes',
      confidence: 1.0,
      actionTrigger: 'audit_note',
      thoughtProcess,
      explanation: `Przeprowadzam audyt jakości i czytelności notatki: **"${cleanTarget || 'wybrana strona'}"**.`,
    };
  }

  // 1. Komenda @searchweb_<zapytanie> lub @searchweb <zapytanie> (Mini Przeglądarka Webowa)
  if (
    rawLower.startsWith('@searchweb') ||
    rawLower.startsWith('@search_') ||
    rawLower.startsWith('@web_') ||
    rawLower.startsWith('@search ') ||
    rawLower.startsWith('@web ') ||
    rawLower.startsWith('/searchweb') ||
    rawLower.startsWith('/search') ||
    rawLower.startsWith('/web') ||
    stripped.startsWith('szukaj w sieci') ||
    stripped.startsWith('przeszukaj siec') ||
    stripped.startsWith('przeszukaj sieć') ||
    stripped.startsWith('znajdz w internecie') ||
    stripped.startsWith('znajdź w internecie')
  ) {
    let cleanQuery = rawPrompt
      .replace(/^(@searchweb_|@searchweb\s+|@search_|@search\s+|@web_|@web\s+|\/searchweb\s+|\/search\s+|\/web\s+)/i, '')
      .replace(/^(szukaj w sieci|przeszukaj siec|przeszukaj sieć|znajdz w internecie|znajdź w internecie)\s*/i, '')
      .replace(/_/g, ' ')
      .trim();

    if (!cleanQuery) cleanQuery = 'Nowe technologie';

    thoughtProcess.push(`[2. Komenda @searchweb]: Żądanie przeszukania sieci internetowej dla: "${cleanQuery}".`);
    thoughtProcess.push(`[3. Akcja]: Otwarcie po prawej Mini Przeglądarki Internetowej (Web Inspector) i agregacja darmowych źródeł.`);
    detectedKeywords.push('@searchweb', cleanQuery);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SEARCH_WEB',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanQuery,
      sentiment: 'curious',
      topic: 'web',
      confidence: 1.0,
      actionTrigger: 'search_web',
      thoughtProcess,
      explanation: `Zlecono wyszukiwanie w sieci hasła: **"${cleanQuery}"**. Otwieram po prawej Mini Przeglądarkę Internetową z podglądem wyników i opcją kopiowania do notatki.`,
    };
  }

  // 2. Komenda @noteweb_<temat> lub @noteweb <temat> (Automatyczna Notatka ze Źródłami Webowymi)
  if (
    rawLower.startsWith('@noteweb') ||
    rawLower.startsWith('@webnote') ||
    rawLower.startsWith('/noteweb') ||
    rawLower.startsWith('/webnote') ||
    stripped.startsWith('notatka z sieci') ||
    stripped.startsWith('zbadaj w sieci')
  ) {
    let cleanQuery = rawPrompt
      .replace(/^(@noteweb_|@noteweb\s+|@webnote_|@webnote\s+|\/noteweb\s+|\/webnote\s+)/i, '')
      .replace(/^(notatka z sieci o|zbadaj w sieci o|badanie sieci)\s*/i, '')
      .replace(/_/g, ' ')
      .trim();

    if (!cleanQuery) cleanQuery = 'Koty';

    thoughtProcess.push(`[2. Komenda @noteweb]: Automatyczne badanie internetowe i utworzenie notatki o: "${cleanQuery}".`);
    thoughtProcess.push(`[3. Akcja]: Przeszukanie sieci i strumieniowanie bloków do Mini Edytora.`);
    detectedKeywords.push('@noteweb', cleanQuery);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'NOTE_WEB',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: cleanQuery,
      sentiment: 'curious',
      topic: 'web',
      confidence: 1.0,
      actionTrigger: 'note_web',
      thoughtProcess,
      explanation: `Zlecono badanie internetowe i wygenerowanie notatki o: **"${cleanQuery}"**. Pobieram fakty z sieci i otwieram Mini Edytor po prawej.`,
    };
  }

  // 3. Wyświetlenie listy notatek użytkownika ("hej pokaż moje notatki")
  if (
    rawLower.startsWith('@notes') ||
    rawLower.startsWith('@notatki') ||
    rawLower === 'notatki' ||
    rawLower === 'notki' ||
    stripped.includes('pokaz moje notatki') ||
    stripped.includes('pokaż moje notatki') ||
    stripped.includes('pokaz notatki') ||
    stripped.includes('pokaż notatki') ||
    stripped.includes('poka notatki') ||
    stripped.includes('poka notki') ||
    stripped.includes('pokaz notki') ||
    stripped.includes('moje notatki') ||
    stripped.includes('moje notki') ||
    stripped.includes('jakie mam notatki') ||
    stripped.includes('co mam w notatkach') ||
    stripped.includes('lista notatek') ||
    stripped.includes('wyswietl notatki') ||
    stripped.includes('wyświetl notatki')
  ) {
    thoughtProcess.push(`[2. Żądanie notatek]: Użytkownik prosi o wyświetlenie jego dokumentów i notatek.`);
    thoughtProcess.push(`[3. Akcja]: Pobieram listę aktywnych stron z workspace i prezentuję interaktywny rejestr z akcjami.`);
    detectedKeywords.push('@notes', 'notatki');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'LIST_USER_NOTES',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'friendly',
      topic: 'notes',
      confidence: 1.0,
      actionTrigger: 'list_notes',
      thoughtProcess,
      explanation: `Użytkownik zażądał wglądu w swoje notatki. Wyświetlam listę dokumentów z opcjami otwarcia, streszczenia i edycji.`,
    };
  }

  // 4. Wyświetlenie listy zadań użytkownika ("pokaż moje zadania")
  if (
    rawLower.startsWith('@tasks') ||
    rawLower.startsWith('@zadania') ||
    rawLower === 'zadania' ||
    rawLower === 'taski' ||
    stripped.includes('pokaz moje zadania') ||
    stripped.includes('pokaż moje zadania') ||
    stripped.includes('pokaz zadania') ||
    stripped.includes('pokaż zadania') ||
    stripped.includes('poka zadania') ||
    stripped.includes('poka taski') ||
    stripped.includes('pokaz taski') ||
    stripped.includes('jakie mam zadania') ||
    stripped.includes('co mam do zrobienia') ||
    stripped.includes('lista zadan') ||
    stripped.includes('lista zadań')
  ) {
    thoughtProcess.push(`[2. Żądanie zadań]: Użytkownik prosi o listę jego zadań.`);
    thoughtProcess.push(`[3. Akcja]: Pobieram zadania z tablicy i wyświetlam interaktywny podgląd.`);
    detectedKeywords.push('@tasks', 'zadania');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'LIST_USER_TASKS',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'tasks',
      confidence: 1.0,
      actionTrigger: 'list_tasks',
      thoughtProcess,
      explanation: `Wyświetlam aktualną listę zadań projektowych z podziałem na statusy i priorytety.`,
    };
  }

  // 5. Uporządkowanie notatek w foldery tematyczne ("uporządkuj notatki", "podziel na foldery", "@organize")
  if (
    rawLower.includes('@organize') ||
    stripped.includes('uporzadkuj notatki') ||
    stripped.includes('uporządkuj notatki') ||
    stripped.includes('podziel na foldery') ||
    stripped.includes('posegreguj notatki') ||
    stripped.includes('podzial na foldery') ||
    stripped.includes('podział na foldery') ||
    stripped.includes('zrob porzadek w notatkach') ||
    stripped.includes('zrób porządek w notatkach') ||
    stripped.includes('odciaz sidebar') ||
    stripped.includes('odciąż sidebar')
  ) {
    thoughtProcess.push(`[2. Żądanie kategoryzacji]: Użytkownik żąda uporządkowania notatek w foldery tematyczne.`);
    thoughtProcess.push(`[3. Akcja]: Wywołuję silnik automatycznej kategoryzacji notatek w foldery i odciążam sidebar.`);
    detectedKeywords.push('@organize', 'foldery');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'ORGANIZE_FOLDERS',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'notes',
      confidence: 1.0,
      actionTrigger: 'organize_folders',
      thoughtProcess,
      explanation: `Zlecono uporządkowanie notatek w foldery tematyczne. Dzielę dokumenty na kategorie (Baza Wiedzy, Projekty, Zespół, Plany), aby odciążyć sidebar.`,
    };
  }

  // A. Komenda @add <email> / @invite <email> (Zaproszenie do Teams)
  const detectedEmail = extractEmailFromText(rawPrompt);
  if (
    detectedEmail &&
    (rawLower.includes('@add') ||
      rawLower.includes('@invite') ||
      rawLower.includes('/add') ||
      rawLower.includes('/invite') ||
      stripped.includes('dodaj') ||
      stripped.includes('zapros') ||
      stripped.includes('zaproś') ||
      stripped.includes('team'))
  ) {
    thoughtProcess.push(`[2. Komenda @add / @invite]: Wykryto adres email współpracownika: "${detectedEmail}".`);
    thoughtProcess.push(`[3. Zrozumienie]: Użytkownik chce zaprosić nową osobę do Pokoju Zespołowego (@team).`);
    thoughtProcess.push(`[4. Akcja]: Generuję zaproszenie do zespołu i otwieram po prawej Mini Podgląd Zespołu (Team Inspector).`);
    detectedKeywords.push('@add', detectedEmail);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'TEAM_INVITE_ACTION',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedEmail: detectedEmail,
      sentiment: 'positive',
      topic: 'team',
      confidence: 1.0,
      actionTrigger: 'team_invite',
      thoughtProcess,
      explanation: `Wykryto polecenie zaproszenia użytkownika **${detectedEmail}** do pokoju zespołowego. Otwieram Mini Podgląd Zespołu i wysyłam zaproszenie.`,
    };
  }

  // B. Natural Language Note Creation & Intent Router ("Dodaj notatkę o...", "Stwórz notatkę o...", "Weź zrób notkę o...")
  if (
    rawLower.startsWith('@note') ||
    rawLower.startsWith('@doc') ||
    rawLower.startsWith('@wiki') ||
    rawLower.startsWith('/note') ||
    rawLower.startsWith('/doc') ||
    stripped.includes('dodaj notatke') ||
    stripped.includes('dodaj notatkę') ||
    stripped.includes('dodaj notke') ||
    stripped.includes('stworz notatke') ||
    stripped.includes('stwórz notatkę') ||
    stripped.includes('stwurz notatke') ||
    stripped.includes('stwurz notatkę') ||
    stripped.includes('stwórz notatke') ||
    stripped.includes('stworz notke') ||
    stripped.includes('stwurz notke') ||
    stripped.includes('zrup notatke') ||
    stripped.includes('zrup notatkę') ||
    stripped.includes('zrup notke') ||
    stripped.includes('zrub notatke') ||
    stripped.includes('zrub notke') ||
    stripped.includes('zrob notke') ||
    stripped.includes('zrób notkę') ||
    stripped.includes('wez zrob notatke') ||
    stripped.includes('wez zrob notke') ||
    stripped.includes('ogarnij notatke') ||
    stripped.includes('ogarnij notke') ||
    stripped.includes('stworz mi notatke') ||
    stripped.includes('stwórz mi notatkę') ||
    stripped.includes('stwurz mi notatke') ||
    stripped.includes('stworz dokument') ||
    stripped.includes('stwórz dokument') ||
    stripped.includes('napisz notatke') ||
    stripped.includes('napisz notatkę') ||
    stripped.includes('napisz notke') ||
    stripped.includes('zrob notatke') ||
    stripped.includes('zrób notatkę') ||
    stripped.includes('utworz notatke') ||
    stripped.includes('utwórz notatkę') ||
    stripped.includes('nowa notatka') ||
    stripped.includes('nowa notka') ||
    stripped.startsWith('notatka:') ||
    stripped.startsWith('notatka o ') ||
    stripped.startsWith('notka o ') ||
    stripped.endsWith('- notatka') ||
    stripped.endsWith(' notatka') ||
    stripped.includes('nowy dokument o') ||
    stripped.includes('stworz strone') ||
    stripped.includes('stwórz stronę') ||
    stripped.includes('dodaj strone') ||
    stripped.includes('dodaj stronę') ||
    stripped.includes('opisz w notatce') ||
    stripped.startsWith('napisz o') ||
    stripped.startsWith('opisz ')
  ) {
    const rawClean = rawPrompt
      .replace(/^(@note[_:\s]*|@doc[_:\s]*|@wiki[_:\s]*|\/note[_:\s]*|\/doc[_:\s]*)/gi, '')
      .replace(/^(?:weź|wez|proszę o|prosze o|chcę|chce|stwórz mi|stworz mi|stwurz mi|zrup mi|zrub mi|przygotuj mi|zrób mi|zrob mi|dodaj mi|ogarnij mi)\s+/i, '')
      .replace(/^(?:dodaj notatkę|dodaj notatke|dodaj notke|stwórz notatkę|stworz notatke|stwurz notatke|stwurz notatkę|stwórz notatke|stworz notke|stwurz notke|zrup notatke|zrup notatkę|zrup notke|zrub notatke|zrub notke|zrob notke|zrób notkę|ogarnij notatkę|ogarnij notatke|ogarnij notke|stwórz mi notatkę|stworz mi notatke|zrób notatkę|zrob notatke|utwórz notatkę|utworz notatke|napisz notatkę|napisz notatke|napisz notke|napisz o|nowa notatka o|nowa notatka|nowa notka|notatka:|notatka o|notka o|notatka|notka|stwórz stronę|stworz strone|dodaj stronę|dodaj strone|opisz w notatce|opisz)\s*(?:o|i|dla|dotyczącą|dotyczaca|ze|z|na temat|:|-)?\s*/gi, '')
      .replace(/\s*-\s*notatka$/i, '')
      .replace(/\s+notatka$/i, '')
      .replace(/_/g, ' ')
      .trim();

    const topic = extractMainTopic(rawClean);
    thoughtProcess.push(`[Intent Router: Note Creation]: Zlecenie utworzenia strony o temacie: "${topic}".`);
    thoughtProcess.push(`[Automatyczne wykonanie]: Wybór narzędzi w tle, wieloźródłowe pobranie i utworzenie bloków.`);
    detectedKeywords.push('notatka', topic);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'CREATE_NOTE_LIVE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: topic || 'Nowa strona',
      sentiment: 'curious',
      topic: 'notes',
      confidence: 0.99,
      actionTrigger: 'create_note_live',
      thoughtProcess,
      explanation: `Automatycznie tworzę stronę o temacie: "${topic}".`,
    };
  }

  // C. Komenda @calendar <wydarzenie> / "dodaj do kalendarza"
  if (
    rawLower.startsWith('@calendar') ||
    rawLower.startsWith('@event') ||
    rawLower.startsWith('/calendar') ||
    stripped.includes('dodaj do kalendarza') ||
    stripped.includes('zaplanuj w kalendarzu') ||
    stripped.includes('zaplanuj spotkanie')
  ) {
    const eventTitle = rawPrompt.replace(/(@calendar|@event|\/calendar|dodaj do kalendarza|zaplanuj w kalendarzu|zaplanuj spotkanie)/gi, '').trim() || 'Spotkanie projektowe';
    thoughtProcess.push(`[2. Komenda @calendar]: Zlecenie dodania wydarzenia: "${eventTitle}".`);
    thoughtProcess.push(`[3. Akcja]: Otwarcie po prawej Mini Kalendarza (Calendar Inspector) z podświetlonym terminem.`);
    detectedKeywords.push('@calendar', eventTitle);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'CREATE_CALENDAR_EVENT',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: eventTitle,
      sentiment: 'positive',
      topic: 'calendar',
      confidence: 0.98,
      actionTrigger: 'create_calendar',
      thoughtProcess,
      explanation: `Wykryto polecenie zaplanowania wydarzenia w kalendarzu: "${eventTitle}". Otwieram Mini Kalendarz po prawej.`,
    };
  }

  // D. Komenda @task <tytuł> / @todo <zadanie>
  if (
    rawLower.startsWith('@task') ||
    rawLower.startsWith('@todo') ||
    rawLower.startsWith('/task') ||
    rawLower.startsWith('/todo') ||
    stripped.startsWith('dodaj zadanie') ||
    stripped.startsWith('nowe zadanie')
  ) {
    const taskTitle = rawPrompt.replace(/(@task|@todo|\/task|\/todo|dodaj zadanie|nowe zadanie)/gi, '').trim() || 'Nowe zadanie projektowe';
    thoughtProcess.push(`[2. Komenda @task]: Dodanie nowego zadania: "${taskTitle}".`);
    thoughtProcess.push(`[3. Akcja]: Otwarcie po prawej Mini Tablicy Kanban z nową kartą.`);
    detectedKeywords.push('@task', taskTitle);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'CREATE_TASK_LIVE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: taskTitle,
      sentiment: 'positive',
      topic: 'tasks',
      confidence: 0.98,
      actionTrigger: 'create_task',
      thoughtProcess,
      explanation: `Wykryto polecenie utworzenia zadania w tablicy Kanban: "${taskTitle}". Otwieram Mini Tablicę po prawej.`,
    };
  }

  // E. Komenda @burnout / @workload (Analiza obciążenia zespołu)
  if (
    rawLower.includes('@burnout') ||
    rawLower.includes('@workload') ||
    rawLower.includes('/burnout') ||
    rawLower.includes('/workload') ||
    stripped.includes('obciazenie zespolu') ||
    stripped.includes('obciążenie zespołu') ||
    stripped.includes('kto jest przepracowany')
  ) {
    thoughtProcess.push(`[2. Komenda @burnout / @workload]: Użytkownik żąda analizy obciążenia zespołu.`);
    thoughtProcess.push(`[3. Akcja]: Otwarcie po prawej Kalkulatora Przepracowania i Ryzyka Wypalenia.`);
    detectedKeywords.push('@workload');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SHOW_WORKLOAD',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'curious',
      topic: 'team',
      confidence: 1.0,
      actionTrigger: 'show_workload',
      thoughtProcess,
      explanation: `Otwieram Kalkulator Obciążenia i Ryzyka Wypalenia Zespołu z wykresami mozaiki godzinowej.`,
    };
  }

  // F. Komenda @team / @teams (Pokoje zespołów)
  if (
    rawLower === '@team' ||
    rawLower === '@teams' ||
    rawLower === '/team' ||
    rawLower === '/teams' ||
    stripped === 'pokoje zespolow' ||
    stripped === 'pokoj zespolu'
  ) {
    thoughtProcess.push(`[2. Komenda @team]: Przełączenie do widoku Pokojów Zespołów.`);
    detectedKeywords.push('@team');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SHOW_TEAMS_VIEW',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'team',
      confidence: 1.0,
      actionTrigger: 'switch_teams',
      thoughtProcess,
      explanation: `Przełączam na widok Pokojów Zespołów i przestrzeni współdzielonej (@team).`,
    };
  }

  // G. Komenda @database / @db
  if (
    rawLower.includes('@database') ||
    rawLower.includes('@db') ||
    rawLower.includes('/db') ||
    stripped.includes('baza danych') ||
    stripped.includes('otworz baze danych')
  ) {
    thoughtProcess.push(`[2. Komenda @database]: Otwarcie modułu bazy danych i tabel.`);
    detectedKeywords.push('@database');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SHOW_DATABASE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'database',
      confidence: 1.0,
      actionTrigger: 'switch_database',
      thoughtProcess,
      explanation: `Otwieram widok Bazy Danych i tabelę relacyjną w workspace.`,
    };
  }

  // H. Komenda @workspace / @swith_workspace
  if (
    rawLower.includes('@swith_workspace') ||
    rawLower.includes('@switch_workspace') ||
    rawLower.includes('@workspace') ||
    rawLower.includes('/workspace') ||
    stripped.includes('pokaz pulpit') ||
    stripped.includes('otworz pulpit') ||
    stripped.includes('zwin czat')
  ) {
    thoughtProcess.push('[2. Detekcja intencji]: Wykryto polecenie @swith_workspace (przełączenie na pulpit).');
    detectedKeywords.push('@swith_workspace');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SWITCH_WORKSPACE',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'neutral',
      topic: 'workspace_control',
      confidence: 1.0,
      actionTrigger: 'switch_workspace',
      thoughtProcess,
      explanation: 'Użytkownik żąda natychmiastowego otwarcia pulpitu workspace i minimalizacji asystenta.',
    };
  }

  // I. Komenda @ai / @swith_Ai
  if (
    rawLower.includes('@swith_ai') ||
    rawLower.includes('@switch_ai') ||
    rawLower.includes('@ai') ||
    rawLower.includes('/ai') ||
    rawLower.includes('@ai_fullscreen') ||
    rawLower.includes('80%') ||
    rawLower.includes('80 procent') ||
    stripped.includes('powieksz ai') ||
    stripped.includes('pelny ekran ai')
  ) {
    thoughtProcess.push('[2. Detekcja intencji]: Wykryto polecenie @swith_Ai lub żądanie widoku 80% ekranu.');
    detectedKeywords.push('@swith_Ai');

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'SWITCH_AI',
      detectedKeywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'workspace_control',
      confidence: 1.0,
      actionTrigger: 'expand_ai',
      thoughtProcess,
      explanation: 'Użytkownik chce zmaksymalizować widok bota AI na 80% szerokości ekranu.',
    };
  }

  // =========================================================================
  // 3. DIALOG, ENCYKLOPEDIA, PYTANIA & ROZUMIENIE JĘZYKA
  // =========================================================================

  // A. Pytania kontynuacyjne (Pamięć wieloturowa)
  const isFollowUp =
    stripped.includes('rozwin to') ||
    stripped.includes('rozwiń to') ||
    stripped.includes('podasz przyklad') ||
    stripped.includes('podaj przyklad') ||
    stripped.includes('daj przyklad') ||
    stripped.includes('pokaz przyklad') ||
    stripped.includes('napisz do tego kod') ||
    stripped.includes('a jak to zrobic') ||
    stripped.includes('wyjasnij bardziej') ||
    stripped.includes('a co z tym');

  if (isFollowUp) {
    const lastTopic = conversationMemory.getLastTopic() || 'poprzedni temat';
    thoughtProcess.push(`[2. Pamięć wieloturowa]: Wykryto pytanie kontynuacyjne odnoszące się do: "${lastTopic}".`);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'FOLLOW_UP_CONTEXT',
      detectedKeywords: ['kontynuacja', 'pamięć_kontekstu'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: lastTopic,
      sentiment: 'curious',
      topic: 'general',
      confidence: 0.95,
      thoughtProcess,
      explanation: `Użytkownik prosi o pogłębienie poprzedniego wątku ("${lastTopic}").`,
    };
  }

  // B. Przeszukanie encyklopedycznej Bazy Wiedzy (Knowledge Base)
  const knowledgeMatch = queryKnowledgeBase(rawPrompt);
  if (knowledgeMatch) {
    thoughtProcess.push(`[2. Baza wiedzy]: Zidentyfikowano artykuł wiedzy: "${knowledgeMatch.title}".`);

    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'KNOWLEDGE_QUERY',
      detectedKeywords: knowledgeMatch.keywords,
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: knowledgeMatch.title,
      knowledgeMatch,
      sentiment: 'curious',
      topic: knowledgeMatch.category === 'programming' ? 'code' : knowledgeMatch.category === 'science' ? 'science' : 'advice',
      confidence: 0.96,
      thoughtProcess,
      explanation: `Użytkownik pyta o ${knowledgeMatch.title}. Przygotowuję wyczerpujące wyjaśnienie ze szczegółami i przykładami.`,
    };
  }

  // C. Humor & Żarty
  if (
    stripped.includes('zart') ||
    stripped.includes('żart') ||
    stripped.includes('kawal') ||
    stripped.includes('kawał') ||
    stripped.includes('dowcip') ||
    stripped.includes('smieszne')
  ) {
    const humorEntry = queryKnowledgeBase('zart');
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'HUMOR_AND_JOKES',
      detectedKeywords: ['humor', 'żart'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      knowledgeMatch: humorEntry,
      sentiment: 'friendly',
      topic: 'smalltalk',
      confidence: 0.98,
      thoughtProcess,
      explanation: 'Użytkownik ma ochotę na chwilę rozrywki i żart programistyczny.',
    };
  }

  // D. Detekcja pytań o samopoczucie ("hej jak sie masz", "co słychać", "jak leci w robocie")
  const isAskingHowAreYou =
    stripped.includes('jak sie masz') ||
    stripped.includes('jak tam') ||
    stripped.includes('co tam') ||
    stripped.includes('co slychac') ||
    stripped.includes('co u ciebie') ||
    stripped.includes('co u cb') ||
    stripped.includes('jak leci') ||
    stripped.includes('jak sie czujesz') ||
    stripped.includes('jak samopoczucie') ||
    stripped.includes('zyjesz') ||
    stripped.includes('wszystko gra') ||
    stripped.includes('jak leci w robocie');

  const isQuestionOpening =
    stripped.includes('mam pytanie') ||
    stripped.includes('mam pytanko') ||
    stripped.includes('pytanie skromne') ||
    stripped.includes('pytanie skrome') ||
    stripped.includes('pytanko') ||
    stripped.includes('chcialbym zapytac') ||
    stripped.includes('chcialabym zapytac') ||
    stripped.includes('chce zapytac') ||
    stripped.includes('moge o cos spytac') ||
    stripped.includes('moge zapytac') ||
    stripped.includes('mam do ciebie pytanie') ||
    stripped.includes('jedna sprawa') ||
    stripped.includes('pytanie mam') ||
    /^(ey|ej|hej|yo|siema)?\s*mam\s+(jedno\s+)?(male\s+|skromne\s+|skrome\s+|szybkie\s+)?pytani(e|ko)/i.test(stripped);

  const isGreeting =
    stripped.includes('hej') ||
    stripped.includes('siema') ||
    stripped.includes('siemanko') ||
    stripped.includes('siemka') ||
    stripped.includes('elo') ||
    stripped.includes('eluwina') ||
    stripped.includes('witaj') ||
    stripped.includes('witam') ||
    stripped.includes('dzien dobry') ||
    stripped.includes('dobry wieczor') ||
    stripped.includes('yo') ||
    stripped.includes('czesc') ||
    stripped.includes('uszanowanko') ||
    stripped === 'ey' ||
    stripped === 'ej' ||
    stripped.startsWith('ey ') ||
    stripped.startsWith('ej ');

  if (isAskingHowAreYou) {
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'FEELINGS_CHECK',
      subIntent: 'INQUIRY_HOW_ARE_YOU',
      detectedKeywords: ['jak się masz'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'friendly',
      topic: 'smalltalk',
      confidence: 0.98,
      thoughtProcess,
      explanation: 'Użytkownik nawiązuje luźną rozmowę ("jak sie masz?"), sprawdzając responsywność i ton asystenta.',
    };
  }

  if (isQuestionOpening) {
    thoughtProcess.push('[1. Otwarcie pytania]: Użytkownik inicjuje pytanie lub zagajenie ("mam pytanie").');
    thoughtProcess.push('[2. Gotowość do pomocy]: Zgłaszam natychmiastową gotowość z propozycją tematów.');
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'QUESTION_OPENING',
      detectedKeywords: ['pytanie', 'otwarcie rozmowy'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'friendly',
      topic: 'advice',
      confidence: 0.99,
      thoughtProcess,
      explanation: 'Użytkownik przygotowuje się do zadania pytania. Odpowiadam z otwartością, gotowością i zachętą do przedstawienia tematu.',
    };
  }

  if (isGreeting) {
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'GREETING_SMALLTALK',
      detectedKeywords: ['powitanie'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'friendly',
      topic: 'smalltalk',
      confidence: 0.95,
      thoughtProcess,
      explanation: 'Użytkownik wita się z asystentem i rozpoczyna interakcję.',
    };
  }

  // E. Rozpoznawanie zmęczenia, przeciążenia lub wypalenia
  if (
    stripped.includes('zmeczony') ||
    stripped.includes('zmeczona') ||
    stripped.includes('masakra') ||
    stripped.includes('nie mam sily') ||
    stripped.includes('mam dosc') ||
    stripped.includes('wypalony') ||
    stripped.includes('wypalona') ||
    stripped.includes('burnout') ||
    stripped.includes('przebodzcowany') ||
    stripped.includes('nie ogarniam') ||
    stripped.includes('za duzo zadan')
  ) {
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'TIRED_OR_FRUSTRATED',
      detectedKeywords: ['zmęczenie', 'stres'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'tired',
      topic: 'advice',
      confidence: 0.94,
      thoughtProcess,
      explanation: 'Użytkownik czuje się przeciążony pracą. Potrzebuje empatycznej odpowiedzi i pomocy w odciążeniu.',
    };
  }

  // F. Pytania "Dlaczego" (Causal Questions)
  if (stripped.startsWith('dlaczego') || stripped.startsWith('czemu') || stripped.includes('z jakiego powodu')) {
    const topic = extractMainTopic(rawPrompt);
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'QUESTION_WHY',
      detectedKeywords: ['dlaczego', 'przyczyna'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: topic,
      sentiment: 'curious',
      topic: 'science',
      confidence: 0.9,
      thoughtProcess,
      explanation: `Użytkownik szuka wyjaśnienia przyczynowego i mechanizmu stojącego za zjawiskiem: "${topic}".`,
    };
  }

  // G. Pytania "Co to jest" / Definicje (Definitional Questions)
  if (stripped.startsWith('co to') || stripped.startsWith('czym jest') || stripped.includes('definicja') || stripped.includes('co oznacza')) {
    const topic = extractMainTopic(rawPrompt);
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'QUESTION_WHAT_IS',
      detectedKeywords: ['co to jest', 'definicja'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: topic,
      sentiment: 'curious',
      topic: 'general',
      confidence: 0.9,
      thoughtProcess,
      explanation: `Użytkownik prosi o precyzyjną definicję i opis pojęcia: "${topic}".`,
    };
  }

  // H. Pytania "Jak zrobić" (How-to Questions)
  if (stripped.startsWith('jak ') || stripped.includes('w jaki sposob') || stripped.includes('jak moge')) {
    const topic = extractMainTopic(rawPrompt);
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'QUESTION_HOW_TO',
      detectedKeywords: ['jak zrobić', 'instrukcja'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      extractedTopic: topic,
      sentiment: 'curious',
      topic: 'advice',
      confidence: 0.9,
      thoughtProcess,
      explanation: `Użytkownik potrzebuje praktycznego poradnika krok po kroku w temacie: "${topic}".`,
    };
  }

  // I. Pochwały
  if (
    stripped.includes('dzieki') ||
    stripped.includes('super') ||
    stripped.includes('kocur') ||
    stripped.includes('kozak') ||
    stripped.includes('dobra robota') ||
    stripped.includes('sztos') ||
    stripped.includes('mistrz')
  ) {
    return {
      originalPrompt: rawPrompt,
      normalizedPrompt: normalized,
      intent: 'PRAISE_AND_THANKS',
      detectedKeywords: ['pochwała'],
      corpusMatchedCount: corpusAnalysis.knownCount,
      sentiment: 'positive',
      topic: 'smalltalk',
      confidence: 0.96,
      thoughtProcess,
      explanation: 'Użytkownik dziękuje lub docenia pomoc asystenta.',
    };
  }

  // J. Ogólna konwersacja analityczna
  const topic = extractMainTopic(rawPrompt);
  thoughtProcess.push(`[2. Konwersacja analityczna]: Zapytanie otwarte w temacie: "${topic}".`);

  return {
    originalPrompt: rawPrompt,
    normalizedPrompt: normalized,
    intent: 'GENERAL_CONVERSATION',
    detectedKeywords: [topic],
    corpusMatchedCount: corpusAnalysis.knownCount,
    extractedTopic: topic,
    sentiment: 'neutral',
    topic: 'general',
    confidence: 0.85,
    thoughtProcess,
    explanation: `Kompleksowe zapytanie o "${topic}". Przygotowuję analityczną, ustrukturyzowaną odpowiedź w stylu GPT.`,
  };
}
