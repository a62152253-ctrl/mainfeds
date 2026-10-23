/**
 * Router intencji (Intent Router) – rozróżnia, CO użytkownik chce zrobić z dokumentem.
 *
 * Wcześniej jeden regex łączył „ulepsz notatkę", „ulepsz design" i „audyt", a polecenia
 * „rozwiń", „skróć", „zrób to lepiej" lub „wyszukaj i podmień" nie miały osobnej obsługi.
 * Router działa na tekście znormalizowanym (bez ogonków, odporny na literówki w
 * kluczowych czasownikach) i uwzględnia kontekst: otwartą stronę oraz ostatnią akcję.
 */

import type {
  EngineContext,
  EngineIntent,
  EngineIntentKind,
  IntentModifiers,
  NoteLength,
} from './types';
import { detectStyleHint } from './designPersonality';
import { normalizeForMatch, toTitle } from './textAnalysis';

// ---------------------------------------------------------------------------
// Narzędzia dopasowania
// ---------------------------------------------------------------------------

export function levenshtein(a: string, b: string, maxDistance = 3): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
}

/** Czy któryś token tekstu jest (z tolerancją literówek) formą jednego ze słów kluczowych. */
function hasFuzzyWord(tokens: string[], words: string[]): boolean {
  return tokens.some((tok) =>
    words.some((w) => {
      if (tok === w) return true;
      if (w.length >= 5 && tok.startsWith(w.slice(0, Math.max(5, w.length - 2)))) return true;
      if (w.length >= 6) return levenshtein(tok, w, 1) <= 1;
      return false;
    })
  );
}

interface Pattern {
  re: RegExp;
  weight: number;
  note: string;
}

const P = (re: RegExp, weight: number, note: string): Pattern => ({ re, weight, note });

// Wszystkie wzorce dopasowywane do tekstu znormalizowanego (bez ogonków, małe litery).
const RULES: Record<Exclude<EngineIntentKind, 'none'>, Pattern[]> = {
  improve_design: [
    P(/\b(ulepsz|popraw|polep|dopracuj|zmien|odswiez|przebuduj|przeprojektuj|upiekszy\w*|upiekrz\w*|odpicuj|podkrec|ogarnij)\w*\s+(\w+\s+){0,2}(design|desing|wyglad|estetyk|uklad|layout|formatowan|strukture|stylistyk|stylizacj|bloki)\w*/, 9, 'czasownik + design/wygląd'),
    P(/\b(design|desing|wyglad|estetyk|layout)\w*\s+(\w+\s+){0,2}(ulepsz|popraw|polep|dopracuj|odpicuj|ogarnij)\w*/, 8, 'design + czasownik'),
    P(/\b(zrob|niech\s+bedzie|wez\s+zrob)\s+(\w+\s+){0,3}(ladniej|ladniejsz\w+|czytelniej|czytelniejsz\w+|estetyczniej|przejrzyscie\w*|nowoczesniej)/, 8, 'ładniej/czytelniej'),
    P(/\b(ulepsz|popraw|odpicuj)\s+design\b/, 10, 'ulepsz design'),
    P(/\b(sciana\s+tekstu|scianka\s+tekstu|nieczytelna|brzydka|brzydko|chaotyczna)\b/, 5, 'opis problemu z wyglądem'),
    P(/\bnapraw\s+(\w+\s+)?(wyglad|uklad|formatowanie)\b/, 8, 'napraw wygląd'),
  ],
  improve_content: [
    P(/\b(ulepsz|popraw|dopracuj|uzupelnij|zredaguj|wygladz|zweryfikuj|sprawdz\s+i\s+popraw|ogarnij|podrasuj)\w*\s+(\w+\s+){0,2}(notatk|notke|notki|dokument|tresc|tekst|strone|opracowanie)\w*/, 9, 'ulepsz notatkę'),
    P(/\b(ulepsz|popraw|ogarnij|podrasuj)\s+(to|ta|te|ja|ją)\b/, 6, 'ulepsz to'),
    P(/\bulepsz\b/, 4, 'ulepsz'),
    P(/\b(popraw|dopracuj)\s+(blad\w*|literowk\w*|styl\w*|jezyk\w*|gramatyk\w*)/, 7, 'popraw błędy/styl'),
  ],
  expand: [
    P(/\b(rozwin|rozbuduj|poglebi|dopisz|doloz|rozszerz|rozpisz)\w*/, 9, 'rozwiń/rozbuduj'),
    P(/\b(dodaj|chce|daj|dorzuc|wiecej\s+daj)\s+(\w+\s+){0,2}(wiecej|dluzsza|obszerniejsz\w+|szczegolow\w+|przyklad\w*|informacji|tresci|mies\w*)/, 7, 'dodaj więcej'),
    P(/\b(za\s+krotk\w+|zbyt\s+krotk\w+|bardziej\s+szczegolowo|dokladniej|malo\s+tekstu|biednie)\b/, 7, 'za krótkie'),
    P(/\b(uzupelnij)\s+(o|brakujace|braki|temat)/, 7, 'uzupełnij o'),
  ],
  shorten: [
    P(/\b(skroc|skrocic|skracaj|skrot|skondensuj|przytnij|zwiez\w*|zmniejsz\s+(\w+\s+)?(tekst|dlugosc|notatk\w+|notke))/, 10, 'skróć'),
    P(/\b(krotsza|krotszej|krotsze|krotszy|krocej|zwiezlej|mniej\s+tekstu|mniej\s+tresci|odchudz\w*|za\s+dlug\w+|zbyt\s+dlug\w+)\b/, 8, 'krócej / za długie'),
    P(/\bw\s+skrocie\s+(te|ta|ten|tego|moja|ta)\b/, 6, 'w skrócie ta notatka'),
  ],
  redo_better: [
    P(/\bzrob\s+(to|ja|go)\s+(\w+\s+)?lepiej\b/, 10, 'zrób to lepiej'),
    P(/\b(przerob|przepisz|zrob\s+jeszcze\s+raz|jeszcze\s+raz|od\s+nowa|popraw\s+to|wez\s+przerob)\b/, 7, 'przerób'),
    P(/\b(nie\s+podoba\s+mi\s+sie|slabe|slabo|kiepskie|kiepsko|beznadziejne|to\s+nie\s+to|nie\s+tak|lipa)\b/, 6, 'niezadowolenie'),
    P(/\blepiej\b/, 3, 'lepiej'),
    P(/\b(ulepsz|poprawa)\s+(to|ja|ją)\b/, 5, 'ulepsz to'),
  ],
  research_replace: [
    P(/\b(wyszukaj|znajdz|poszukaj|sprawdz|zbadaj|przeszukaj)\w*\s+(\w+\s+){0,6}(i\s+)?(podmien|zastap|nadpisz|zaktualizuj|wymien)\w*/, 12, 'wyszukaj i podmień'),
    P(/\b(podmien|zastap|nadpisz|wymien)\w*\s+(\w+\s+){0,3}(notatk|notke|tresc|dokument|strone)\w*\s+(\w+\s+){0,4}(wyszuk|internet|siec|zrodl|zrudl|aktualn)/, 11, 'podmień notatkę wynikami'),
    P(/\b(zaktualizuj|odswiez)\s+(\w+\s+){0,2}(notatk|notke|dokument|strone)\w*\s+(\w+\s+){0,3}(z\s+internetu|z\s+sieci|aktualn\w+|nowymi)/, 10, 'zaktualizuj z internetu'),
    P(/\b(wyszukaj|znajdz)\s+(\w+\s+){0,4}(podmien|zastap)\w*/, 12, 'szukaj + podmień'),
  ],
  research_note: [
    P(/\b(znajdz|wyszukaj|poszukaj|przeszukaj|sprawdz|zbadaj|zrob\s+research|przeprowadz\s+(badanie|research))\w*\s+(\w+\s+){0,8}(i\s+)?(przygotuj|zrob|napisz|stworz|stwurz|utworz|sporzadz|zbuduj|opracuj|daj)\w*/, 12, 'znajdź i przygotuj'),
    P(/\b(zbadaj|przebadaj|przeanalizuj|przeszukaj\s+\d*\s*(zrodel|zrudel|stron)|research)\s+\w+/, 9, 'zbadaj / przeszukaj źródła'),
    P(/\b(z\s+internetu|w\s+internecie|ze\s+zrodel|ze\s+zrudel|z\s+9\s+zrodel|z\s+9\s+zrudel|z\s+wikipedii|z\s+sieci)\b.*\b(notatk|notke|opracowan|dokument)\w*/, 9, 'notatka z internetu'),
    P(/\b(notatk|notke|opracowan|dokument)\w*\s+(\w+\s+){0,5}(ze\s+zrodlami|z\s+zrodlami|ze\s+zrudlami|z\s+zrudlami|z\s+bibliografi\w+|z\s+weryfikacj\w+)/, 9, 'notatka ze źródłami'),
  ],
  create_knowledge_base: [
    P(/\b(kompletn|kompleksow|pelne\s+opracowanie|pelna\s+notatk|pelna\s+notke|calosciow|wyczerpuj|szczegolow\w+\s+opracowanie|kompendium|baza\s+wiedzy|struktur\w+\s+wiedzy|encyklopedi)\w*/, 12, 'kompletne opracowanie'),
    P(/\b(kompletn\w+|kompleksow\w+|pelna|pelne)\s+(notatk|notk)\w*/, 10, 'kompletna notatka'),
    P(/\b(z|ze|i)\s+pod\s*stron\w*|\bpodstron\w*/, 8, 'podstrony'),
    P(/\b(folder|katalog)\w*\s+(z|ze|na|o)\b/, 6, 'folder z notatkami'),
    P(/\b(wszystko\s+o|wszystko\s+na\s+temat|calosc\s+wiedzy|od\s+podstaw\s+do)\b/, 8, 'wszystko o'),
    P(/\b(\d{1,2})\s*(pod\s*stron\w*|stron\w*|notatek|notek|rozdzial\w*|czesci)\b/, 9, 'liczba stron'),
    P(/\b(wiele|kilka|cala\s+seria|seria)\s+(pod\s*stron|notatek|notek|stron|rozdzial)\w*/, 8, 'wiele stron'),
    P(/\b(kurs|podrecznik|skrypt)\s+(o|z|na)\b/, 7, 'kurs/podręcznik'),
  ],
  create_note: [
    P(/\b(daj|dej|wez|stworz|stwurz|stworzyc|zrob|zrub|zrup|napisz|przygotuj|utworz|utwurz|wygeneruj|sporzadz|zalozm|zaloz|dodaj|ogarnij|klepnij| machnij|walnij)\w*\s+(\w+\s+){0,3}(notatk|notatke|notatki|notke|notki|dokument|strone|opracowanie|materialy?|konspekt|streszczenie|sciage|wypracowanie|artykul)\w*/, 10, 'czasownik + notatka/notka'),
    P(/^\s*(notatk\w+|notk\w+|dokument)\s+(o|na\s+temat|z|dotyczac\w+)\s+\w+/, 9, 'notatka o X'),
    P(/\b(notatk\w*|notk\w*|sciage|konspekt)\s+(o|na\s+temat|z|dotyczac\w+|nt)\s+\w+/, 7, 'notatka o'),
    P(/^(?:@)?(note|notatka|notka)\b/, 12, '@note'),
    P(/\bpotrzebuje\s+(\w+\s+){0,2}(notatk|notk|opracowani|konspekt)\w*/, 8, 'potrzebuję notatki'),
    P(/\b(wez\s+)?(opisz|rozpisz)\s+(\w+\s+){0,2}(w\s+notatce|jako\s+notatk\w+|jako\s+notk\w+)/, 9, 'opisz w notatce'),
  ],
  add_subpage: [
    P(/\b(dodaj|utworz|stworz|stwurz|zrob|zrub|dorzuc)\w*\s+(\w+\s+){0,2}(pod\s*strone|podstrone|podstrony|podstronie|podstronke)\b/, 11, 'dodaj podstronę'),
    P(/\b(nowa\s+)?pod\s*strona\s+(o|na\s+temat|z)\b/, 8, 'podstrona o'),
    P(/\b(dodaj|dopisz)\s+(\w+\s+){0,3}(rozdzial|sekcje\s+jako\s+strone)\b/, 7, 'dodaj rozdział jako stronę'),
  ],
  delete_page: [
    P(/\b(usun|skasuj|wywal|wyrzuc|wyjeb|kasuj|zlikwiduj)\w*\s+(\w+\s+){0,3}(notatk|notke|dokument|strone|podstron|folder)\w*/, 11, 'usuń notatkę'),
    P(/\b(usun|skasuj|wywal|wyjeb)\w*\s+(te|ta|ten|ja|ją|to)\b/, 8, 'usuń tę'),
  ],
  move_page: [
    P(/\b(przenies|przesun|przerzuc|przemiesc|wstaw)\w*\s+(\w+\s+){0,5}(do|pod)\s+(\w+\s+){0,2}(folder\w*|katalog\w*|strone|notatk\w+|notke)/, 11, 'przenieś do folderu'),
    P(/\b(przenies|przesun|przemiesc)\w*\b/, 5, 'przenieś'),
  ],
  organize: [
    P(/\b(uporzadkuj|posegreguj|zorganizuj|poukladaj|segreguj|ogarnij)\w*\s+(\w+\s+){0,3}(notatk|notki|dokument|strony|wiedze|workspace)/, 10, 'uporządkuj notatki'),
    P(/\b(podziel|pogrupuj)\s+(\w+\s+){0,3}(na\s+foldery|tematycznie|na\s+kategorie)/, 9, 'podziel na foldery'),
  ],
  summarize: [
    P(/\b(streszcz|podsumuj|zrob\s+streszczenie|daj\s+streszczenie|skrotowo\s+opisz)\w*/, 9, 'streszczenie'),
    P(/\b(tl;?dr|w\s+dwoch\s+zdaniach|w\s+kilku\s+zdaniach|w\s+pigu[lł]ce)\b/, 7, 'tldr'),
  ],
};

/** Preferencja przy remisie punktowym: bardziej szczegółowe intencje wygrywają. */
const PRIORITY: EngineIntentKind[] = [
  'research_replace',
  'improve_design',
  'redo_better',
  'delete_page',
  'move_page',
  'add_subpage',
  'shorten',
  'expand',
  'research_note',
  'create_knowledge_base',
  'improve_content',
  'create_note',
  'organize',
  'summarize',
];

const COMMAND_WORDS = new Set([
  'daj', 'dej', 'wez', 'mi', 'mnie', 'nam', 'prosze', 'proszę', 'bardzo', 'stworz', 'stwurz', 'zrob', 'zrub', 'zrup', 'napisz', 'przygotuj',
  'utworz', 'utwurz', 'wygeneruj', 'sporzadz', 'zaloz', 'dodaj', 'ogarnij', 'klepnij', 'machnij', 'walnij', 'chce', 'chcialbym', 'chcialabym', 'potrzebuje', 'moglbys', 'mozesz',
  'czy', 'nowa', 'nowy', 'nowe', 'jedna', 'jakas', 'jakis', 'swoja', 'swoje', 'moja', 'moje', 'kompletna', 'kompletny', 'kompletne',
  'pelna', 'pelne', 'pelny', 'szczegolowa', 'szczegolowe', 'szczegolowy', 'krotka', 'krotkie', 'krotki', 'dluga', 'rozbudowana',
  'rozbudowane', 'ladna', 'ladne', 'dobra', 'dobre', 'notatke', 'notatka', 'notatki', 'notke', 'notki', 'dokument', 'dokumentu', 'strone', 'strona',
  'opracowanie', 'opracowania', 'konspekt', 'material', 'materialy', 'sciage', 'artykul', 'kompendium', 'podstrone', 'podstrony',
  'z', 'ze', 'i', 'oraz', 'wraz', 'wszystkimi', 'podstronami', 'folderem', 'folderze', 'sekcjami', 'rozdzialami',
  'zbadaj', 'wyszukaj', 'znajdz', 'poszukaj', 'przeszukaj', 'przeanalizuj', 'research', 'informacje', 'informacji', 'dane', 'internecie', 'internetu',
  'rozwin', 'rozszerz', 'rozbuduj', 'skroc',
  'ktora', 'ktory', 'ktore', 'bedzie', 'ma', 'byc', 'tym', 'to', 'sie',
]);

const TOPIC_MARKERS = ['o', 'na temat', 'nt', 'dotyczaca', 'dotyczacy', 'dotyczace', 'dotyczacego', 'odnosnie', 'wokol', 'na', 'ze'];

const SELF_REFERENCES = /\b(te|ta|ten|tej|tego|tym|ja|ją|to|aktualn\w+|obecn\w+|otwart\w+|biezac\w+|ta\s+strone|tutaj|tu)\b/;

// ---------------------------------------------------------------------------
// Wyciąganie modyfikatorów
// ---------------------------------------------------------------------------

function detectLength(norm: string): NoteLength | undefined {
  if (/\b(krotk\w+|w\s+skrocie|skrotow\w+|zwiezl\w+|minimalistyczn\w+\s+notatk|pare\s+zdan|kilka\s+zdan|szybk\w+\s+notatk)\b/.test(norm)) return 'short';
  if (/\b(dlugi\w*|obszern\w+|rozbudowan\w+|wyczerpuj\w+|pelne\s+opracowanie|kompletn\w+|szczegolow\w+|dokladn\w+|gleboki\w*|kompendium)\b/.test(norm)) return 'long';
  return undefined;
}

function detectSubpagePreference(norm: string): { wants?: boolean; count?: number } {
  const count = norm.match(/\b(\d{1,2})\s*(?:pod\s*stron\w*|stron\w*|notatek|rozdzial\w*|czesci|sekcji)\b/);
  if (count) return { wants: true, count: Math.min(25, Math.max(2, parseInt(count[1], 10))) };
  const words: Record<string, number> = { dwie: 2, dwa: 2, trzy: 3, cztery: 4, piec: 5, szesc: 6, siedem: 7, osiem: 8, dziewiec: 9, dziesiec: 10 };
  const wordCount = norm.match(/\b(dwie|dwa|trzy|cztery|piec|szesc|siedem|osiem|dziewiec|dziesiec)\s+(?:pod\s*stron\w*|stron\w*|notatk\w+|rozdzial\w*)/);
  if (wordCount) return { wants: true, count: words[wordCount[1]] };
  if (/\b(bez\s+pod\s*stron|jedna\s+strona|na\s+jednej\s+stronie|w\s+jednym\s+dokumencie|jedna\s+notatka|w\s+jednej\s+notatce|nie\s+dziel)\b/.test(norm)) return { wants: false };
  if (/\b(kompletn\w+|kompendium|baza\s+wiedzy|struktur\w+\s+wiedzy|z\s+pod\s*stron\w*|pod\s*stron\w*|podziel\s+na\s+(strony|rozdzialy|czesci)|osobne\s+strony|osobnych\s+stron|w\s+folderze|folder\w*|wiele\s+stron|wiele\s+notatek)\b/.test(norm)) return { wants: true };
  return {};
}

function extractTargetPageQuery(raw: string, norm: string, kind: EngineIntentKind): string | undefined {
  if (!['delete_page', 'move_page', 'improve_content', 'improve_design', 'expand', 'shorten', 'redo_better', 'research_replace'].includes(kind)) return undefined;
  const m = raw.match(/(?:notatk\w*|dokument\w*|stron\w*|podstron\w*)\s+(?:o|pt\.?|zatytu[lł]owan\w*|zwan\w*|nazwan\w*)?\s*[„"']?([^"”'„.,;!?\n]{2,60}?)[”"']?(?:\s+(?:do|na|w|z|aby|zeby)\b|$|[.,;!?])/i);
  if (m && !SELF_REFERENCES.test(normalizeForMatch(m[1]))) return m[1].trim();
  const quoted = raw.match(/[„"']([^"”']{2,60})[”"']/);
  if (quoted) return quoted[1].trim();
  void norm;
  return undefined;
}

function extractFolderQuery(raw: string): string | undefined {
  const m = raw.match(/\b(?:do|w)\s+(?:folderu|katalogu|kategorii)\s+[„"']?([^"”'„.,;!?\n]{1,50})[”"']?/i);
  return m ? m[1].trim() : undefined;
}

/**
 * Wyciąga temat z polecenia: odcina czasowniki i słowa „komendy", a następnie bierze tekst po
 * znaczniku tematu („o", „na temat"). Zachowuje oryginalną pisownię użytkownika.
 */
export function extractTopic(raw: string): string {
  const original = raw.replace(/^@\w+[_:\s]*/, '').trim();
  const words = original.split(/\s+/).filter(Boolean);
  const norms = words.map((w) => normalizeForMatch(w));

  // 1) Znacznik tematu po wystąpieniu słowa-komendy.
  let markerIdx = -1;
  for (let i = 0; i < words.length; i++) {
    const n = norms[i];
    const two = `${n} ${norms[i + 1] || ''}`.trim();
    if (TOPIC_MARKERS.includes(two) && (norms[i] === 'na' || norms[i] === 'nt')) {
      markerIdx = i + 2;
      break;
    }
    if (['o', 'nt', 'dotyczaca', 'dotyczacy', 'dotyczace', 'odnosnie', 'wokol'].includes(n) && i > 0) {
      const before = norms.slice(0, i);
      if (before.some((b) => COMMAND_WORDS.has(b) || /^(notat|stron|dokument|opracow|kompend|konspekt|podstron)/.test(b))) {
        markerIdx = i + 1;
        break;
      }
    }
  }
  let topicWords: string[];
  if (markerIdx >= 0 && markerIdx < words.length) {
    topicWords = words.slice(markerIdx);
  } else {
    let start = 0;
    while (start < words.length && COMMAND_WORDS.has(norms[start])) start += 1;
    topicWords = words.slice(start);
  }

  // 2) Odetnij końcówki z instrukcjami wykonawczymi („… i zrób podstrony", „… z obrazkami").
  const tailRe = /^(i|oraz|z|ze|wraz|ktora|ktory|ktore|zeby|aby|bez|w|jako|na)$/;
  const instructionRe = /^(zrob|stworz|dodaj|przygotuj|uzyj|uwzglednij|wstaw|wyszukaj|znajdz|podziel|z\b|ze\b|wraz|krotko|szczegolowo|dokladnie|prosze|pls|plz|dzieki|\d+|podstron\w*|obrazk\w*|zrodl\w*)/;
  const cut: string[] = [];
  for (let i = 0; i < topicWords.length; i++) {
    const n = normalizeForMatch(topicWords[i]);
    const next = normalizeForMatch(topicWords[i + 1] || '');
    if (cut.length >= 1 && tailRe.test(n) && (instructionRe.test(next) || /^\d+$/.test(next))) break;
    if (cut.length >= 1 && /^(zrob|stworz|dodaj|uzyj|uwzglednij|wstaw|podziel)$/.test(n)) break;
    if (cut.length >= 1 && /^(prosze|pls|plz|dzieki|dziekuje)$/.test(n)) break;
    cut.push(topicWords[i]);
  }
  const topic = cut.join(' ').replace(/[?!.,;:]+$/g, '').replace(/^[„"']|[”"']$/g, '').trim();
  return topic;
}

/** Rozpoznaje pytania/rozmowę, które nie są poleceniem dotyczącym dokumentu. */
function looksLikeChat(norm: string): boolean {
  if (/^(czym|co|jak|dlaczego|czemu|kiedy|gdzie|kto|ile|jaki|jaka|jakie|czy)\b/.test(norm) && !/\bnotatk|dokument|stron/.test(norm)) return true;
  if (/^(hej|czesc|siema|witaj|dzien\s+dobry|dzieki|dziekuje|ok|okej|super)\b/.test(norm)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Klasyfikacja
// ---------------------------------------------------------------------------

export interface ClassifiedScore {
  kind: EngineIntentKind;
  score: number;
  reasons: string[];
}

export function scoreIntents(raw: string): ClassifiedScore[] {
  const norm = normalizeForMatch(raw);
  const tokens = norm.split(' ').filter(Boolean);
  const scores: ClassifiedScore[] = [];

  (Object.keys(RULES) as Array<Exclude<EngineIntentKind, 'none'>>).forEach((kind) => {
    let score = 0;
    const reasons: string[] = [];
    for (const rule of RULES[kind]) {
      if (rule.re.test(norm)) {
        score += rule.weight;
        reasons.push(rule.note);
      }
    }
    // Tolerancja literówek dla kluczowych czasowników, gdy nic nie zadziałało.
    if (score === 0) {
      const fuzzy: Partial<Record<EngineIntentKind, string[]>> = {
        expand: ['rozwin', 'rozbuduj', 'poglebi'],
        shorten: ['skroc', 'skrocic'],
        improve_design: ['design'],
        create_note: ['notatke', 'notatka'],
        delete_page: ['usun', 'skasuj'],
      };
      const words = fuzzy[kind];
      if (words && hasFuzzyWord(tokens, words)) {
        score += 4;
        reasons.push('dopasowanie z tolerancją literówek');
      }
    }
    if (score > 0) scores.push({ kind, score, reasons });
  });
  return scores.sort((a, b) => b.score - a.score || PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
}

/** Krótki, jednowyrazowy lub niejasny input typu „lepiej", „więcej". */
function classifyShortFollowUp(norm: string, ctx: EngineContext): EngineIntentKind | null {
  if (!ctx.activePage && !ctx.lastAction) return null;
  if (/^(lepiej|jeszcze\s+lepiej|zrob\s+lepiej|popraw|popraw\s+to|przerob|przerob\s+to)$/.test(norm)) return 'redo_better';
  if (/^(wiecej|dluzej|dodaj\s+wiecej|rozwin|rozwin\s+to|dalej)$/.test(norm)) return 'expand';
  if (/^(krocej|krotsze|skroc|skroc\s+to|mniej)$/.test(norm)) return 'shorten';
  if (/^(ladniej|ladniejsze|czytelniej|estetyczniej)$/.test(norm)) return 'improve_design';
  return null;
}

function isCreationVerbPresent(norm: string): boolean {
  return /\b(daj|dej|stworz|stwurz|zrob|zrub|napisz|przygotuj|utworz|wygeneruj|sporzadz|zaloz)\w*\b/.test(norm);
}

/**
 * Główna funkcja: klasyfikuje polecenie i zwraca intencję z modyfikatorami.
 * `none` oznacza zwykłą rozmowę – obsługuje ją dotychczasowy silnik czatu.
 */
export function classifyIntent(raw: string, ctx: EngineContext = { pages: [] }): EngineIntent {
  const text = (raw || '').trim();
  const norm = normalizeForMatch(text);
  const reasons: string[] = [];
  if (!norm) {
    return { kind: 'none', topic: '', confidence: 0, modifiers: {}, reasons: ['pusty tekst'], needsDocument: false };
  }

  // Komendy ze starego systemu (@) nie są obsługiwane przez silnik – oprócz @note.
  if (text.startsWith('@') && !/^@(note|notatka)\b/i.test(text)) {
    return { kind: 'none', topic: '', confidence: 0.2, modifiers: {}, reasons: ['komenda legacy'], needsDocument: false };
  }

  let kind: EngineIntentKind = 'none';
  let confidence = 0;

  const shortFollow = classifyShortFollowUp(norm, ctx);
  if (shortFollow) {
    kind = shortFollow;
    confidence = 0.8;
    reasons.push('krótkie polecenie w kontekście');
  } else {
    const scores = scoreIntents(text);
    if (scores.length > 0) {
      const best = scores[0];
      const second = scores[1];
      kind = best.kind;
      reasons.push(...best.reasons);
      const margin = best.score - (second?.score || 0);
      confidence = Math.min(0.98, 0.5 + best.score / 24 + Math.min(0.15, margin / 40));

      // Rozstrzyganie typowych konfliktów.
      if (kind === 'create_note' && second?.kind === 'create_knowledge_base' && second.score >= best.score - 4) {
        kind = 'create_knowledge_base';
        reasons.push('rozstrzygnięto: kompletna struktura zamiast pojedynczej notatki');
      }
      if (kind === 'create_knowledge_base' && /\b(krotk\w+|w\s+skrocie|jedna\s+strona|bez\s+pod\s*stron)\b/.test(norm)) {
        kind = 'create_note';
        reasons.push('rozstrzygnięto: użytkownik chce krótką notatkę');
      }
      if (kind === 'improve_content' && scores.some((s) => s.kind === 'improve_design' && s.score >= 8)) {
        kind = 'improve_design';
        reasons.push('rozstrzygnięto: ulepszenie dotyczy designu');
      }
      if (kind === 'create_note' && scores.some((s) => s.kind === 'research_note' && s.score >= 8)) {
        kind = 'research_note';
        reasons.push('rozstrzygnięto: polecenie wymaga researchu');
      }
      if (kind === 'redo_better' && scores.some((s) => (s.kind === 'improve_design' || s.kind === 'expand' || s.kind === 'shorten') && s.score >= 8)) {
        const alt = scores.find((s) => s.kind === 'improve_design' || s.kind === 'expand' || s.kind === 'shorten')!;
        kind = alt.kind;
        reasons.push(`rozstrzygnięto: precyzyjna intencja ${alt.kind}`);
      }
    }
  }

  // Rozmowa: pytania ogólne bez słów wskazujących na dokument.
  if ((kind === 'create_note' || kind === 'none') && looksLikeChat(norm) && !isCreationVerbPresent(norm)) {
    return { kind: 'none', topic: '', confidence: 0.3, modifiers: {}, reasons: [...reasons, 'pytanie/rozmowa bez polecenia dokumentowego'], needsDocument: false };
  }

  // Samodzielne „X – notatka" bez czasownika: ostrożnie, tylko gdy użytkownik wprost podał słowo notatka.
  if (kind === 'none') {
    return { kind, topic: '', confidence: 0, modifiers: {}, reasons: ['brak rozpoznanej intencji'], needsDocument: false };
  }

  const modifiers: IntentModifiers = {};
  const length = detectLength(norm);
  if (length) modifiers.length = length;
  const sub = detectSubpagePreference(norm);
  if (sub.wants !== undefined) modifiers.wantsSubpages = sub.wants;
  if (sub.count) modifiers.pageCountHint = sub.count;
  if (/\b(zrodl\w+|bibliografi\w+|linki|odnosnik\w+|z\s+weryfikacj\w+)\b/.test(norm)) modifiers.wantsSources = true;
  if (/\b(obrazk\w+|zdjec\w+|grafik\w+|ilustracj\w+|wideo|film\w*|youtube|multimedi\w+|png|jpg)\b/.test(norm)) modifiers.includeMedia = true;
  if (/\b(bez\s+obrazk\w+|bez\s+zdjec|bez\s+grafik|bez\s+multimedi\w+)\b/.test(norm)) modifiers.includeMedia = false;
  const style = detectStyleHint(text);
  if (style) modifiers.styleHint = style;
  if (kind === 'research_replace' || /\b(podmien|zastap|nadpisz)\b/.test(norm)) modifiers.replaceExisting = true;

  // Fokus „zrób to lepiej".
  if (kind === 'redo_better') {
    if (/\b(wyglad|design|ladniej|czytelnie|uklad|estetyk)\w*/.test(norm)) modifiers.improveFocus = 'design';
    else if (/\b(tresc|informacj|fakt|zrodl|merytor|wiecej|dokladn)\w*/.test(norm)) modifiers.improveFocus = 'content';
    else modifiers.improveFocus = 'both';
  }

  // Strona docelowa i temat.
  const target = extractTargetPageQuery(text, norm, kind);
  if (target) modifiers.targetPageQuery = target;
  const folder = extractFolderQuery(text);
  if (folder) modifiers.folderQuery = folder;

  let topic = extractTopic(text);
  const needsDocument = ['improve_content', 'improve_design', 'expand', 'shorten', 'redo_better', 'add_subpage', 'delete_page', 'move_page'].includes(kind);

  const refersToSelf = SELF_REFERENCES.test(norm) || norm.split(' ').length <= 3;
  if (needsDocument && !modifiers.targetPageQuery && ctx.activePage && (refersToSelf || !topic)) {
    modifiers.targetPageQuery = undefined;
  }

  // Dla operacji na istniejącym dokumencie temat to tytuł otwartej strony, jeśli nic nie podano.
  if (['improve_content', 'improve_design', 'shorten', 'redo_better'].includes(kind)) {
    const stripped = normalizeForMatch(topic);
    const isMeta = !stripped || /^(design|desing|wyglad|uklad|strukture|formatowanie|ladniej|czytelniej|lepiej|jeszcze|raz|to|ta|te|tego|ja|ja)$/.test(stripped) || /^(ulepsz|popraw|skroc|przerob)/.test(stripped);
    if (isMeta) topic = ctx.activePage?.title || ctx.lastTopic || '';
  }
  if (kind === 'expand') {
    const stripped = normalizeForMatch(topic);
    if (!stripped || /^(rozwin\s+)?(temat|to|ta|te|tego|notatke|notatka|dalej|wiecej)$/.test(stripped)) topic = ctx.activePage?.title || ctx.lastTopic || '';
  }
  if (kind === 'redo_better' && !topic) topic = ctx.lastAction?.topic || ctx.activePage?.title || '';
  if (kind === 'research_replace' && !topic) topic = ctx.activePage?.title || ctx.lastTopic || '';

  // Gdy nie ma tematu dla tworzenia, spróbuj kontekstu rozmowy.
  if ((kind === 'create_note' || kind === 'create_knowledge_base' || kind === 'research_note') && !topic && ctx.lastTopic) {
    topic = ctx.lastTopic;
    reasons.push('temat z kontekstu rozmowy');
  }

  if (topic) topic = topic.replace(/\s+/g, ' ').trim();
  if (!topic && ['create_note', 'create_knowledge_base', 'research_note', 'add_subpage'].includes(kind)) {
    confidence = Math.min(confidence, 0.45);
    reasons.push('brak tematu');
  }

  // Domyślne długości wynikające z rodzaju intencji.
  if (kind === 'create_knowledge_base' && modifiers.wantsSubpages === undefined) modifiers.wantsSubpages = true;
  if (kind === 'create_note' && modifiers.wantsSubpages === undefined && modifiers.length === 'short') modifiers.wantsSubpages = false;

  return {
    kind,
    topic: toTitleSafe(topic),
    confidence: Math.round(confidence * 100) / 100,
    modifiers,
    reasons,
    needsDocument,
  };
}

function toTitleSafe(topic: string): string {
  if (!topic) return '';
  return topic.length > 120 ? toTitle(topic, 120) : topic;
}

/** Zwraca true, gdy silnik powinien wykonać intencję (a nie delegować do czatu). */
export function isEngineExecutable(kind: EngineIntentKind): boolean {
  return !['none', 'organize', 'summarize'].includes(kind);
}

/** Do wykonania wymagany jest temat (create/research) lub dokument docelowy (edycje). */
export function intentIsActionable(intent: EngineIntent, ctx: EngineContext): { ok: boolean; reason?: string } {
  if (!isEngineExecutable(intent.kind)) return { ok: false, reason: 'intencja obsługiwana przez czat' };
  if (['create_note', 'create_knowledge_base', 'research_note', 'add_subpage'].includes(intent.kind) && !intent.topic) {
    return { ok: false, reason: 'Podaj temat, o którym ma być dokument.' };
  }
  if (intent.needsDocument && !ctx.activePage && !intent.modifiers.targetPageQuery) {
    return { ok: false, reason: 'Otwórz notatkę, którą mam zmienić, albo podaj jej tytuł.' };
  }
  return { ok: true };
}

/**
 * Kompatybilny wrapper klasyfikatora intencji dla komponentów UI
 */
export function classifyDocumentIntent(raw: string, ctx?: EngineContext) {
  const result = classifyIntent(raw, ctx);
  return {
    ...result,
    intent: result.kind,
    entities: {
      topic: result.topic,
      ...result.modifiers,
    },
  };
}

