/**
 * Lekka analiza tekstu dla języka polskiego (bez zewnętrznego modelu).
 *
 * Moduł dostarcza prawdziwe operacje analityczne używane przez planistę, kompozytor
 * i audytora dokumentów: dzielenie na zdania, słowa kluczowe (TF z częściowym
 * stemmingiem), ocena ważności zdań, wyciąganie definicji, dat, liczb, cytatów
 * i wykrywanie struktur (listy, dane tabelaryczne, „ściany tekstu").
 */

export const STOPWORDS_PL = new Set([
  'i', 'w', 'we', 'z', 'ze', 'na', 'do', 'o', 'od', 'po', 'za', 'dla', 'przez', 'przy', 'pod', 'nad', 'bez',
  'oraz', 'albo', 'lub', 'ale', 'a', 'że', 'ze', 'czy', 'jak', 'jako', 'to', 'ten', 'ta', 'te', 'ci', 'tym',
  'tego', 'tej', 'tych', 'tą', 'są', 'być', 'jest', 'był', 'była', 'było', 'byli', 'będzie', 'są', 'się',
  'sie', 'nie', 'tak', 'też', 'także', 'tylko', 'już', 'jeszcze', 'bardzo', 'który', 'która', 'które',
  'których', 'którego', 'której', 'którym', 'którzy', 'gdy', 'gdzie', 'kiedy', 'jego', 'jej', 'ich', 'jej',
  'mu', 'go', 'ją', 'im', 'nim', 'nią', 'nich', 'może', 'można', 'mają', 'ma', 'mieć', 'przed', 'między',
  'wśród', 'podczas', 'wobec', 'około', 'oraz', 'aby', 'żeby', 'bo', 'więc', 'zatem', 'np', 'tzw', 'm.in',
  'ok', 'in', 'of', 'the', 'and', 'for', 'to', 'is', 'are', 'was', 'by', 'on', 'at', 'as', 'an', 'be',
  'inne', 'inny', 'inna', 'innych', 'innymi', 'wiele', 'kilka', 'każdy', 'każda', 'każde', 'wszystkie',
  'wszystkich', 'wszystko', 'swoje', 'swój', 'swoich', 'ponieważ', 'jednak', 'lecz', 'czyli', 'zaś', 'oto',
]);

// ---------------------------------------------------------------------------
// Normalizacja i czyszczenie
// ---------------------------------------------------------------------------

/** Usuwa znaczniki typowe dla wyciągów z Wikipedii i nadmiarowe białe znaki. */
export function cleanSourceText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/\[(\d+|edytuj|potrzebne źródło|ang\.|cytuj)[^\]]*\]/gi, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Usuwa polskie znaki diakrytyczne (do porównań bez uwzględniania ogonków). */
export function stripDiacritics(text: string): string {
  const map: Record<string, string> = {
    ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
    Ą: 'A', Ć: 'C', Ę: 'E', Ł: 'L', Ń: 'N', Ó: 'O', Ś: 'S', Ź: 'Z', Ż: 'Z',
  };
  return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => map[c] || c);
}

export function normalizeForMatch(text: string): string {
  return stripDiacritics(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Prymitywny stemmer: obcina najczęstsze polskie końcówki fleksyjne.
 * Wystarcza do grupowania form słów („sieci", „sieć", „sieciami").
 */
export function stemPl(word: string): string {
  let w = normalizeForMatch(word);
  if (w.length <= 4) return w;
  const suffixes = [
    'owanie', 'owania', 'ującym', 'ującej', 'ujacy', 'ujaca', 'ujace',
    'ościach', 'osciach', 'ościami', 'osciami', 'ością', 'oscia',
    'ykach', 'ikach', 'ikami', 'ykami', 'ostka', 'ostki',
    'owych', 'owymi', 'owego', 'owemu', 'owym', 'owej', 'owa', 'owe', 'owy',
    'ami', 'ach', 'ego', 'emu', 'ymi', 'imi', 'ych', 'ich', 'owi', 'iem', 'ie',
    'ej', 'om', 'ow', 'ie', 'ia', 'ii', 'iu', 'ym', 'im', 'em', 'ą', 'ę', 'a', 'e', 'i', 'o', 'u', 'y',
  ];
  const stripped = stripDiacritics(suffixes.join(','));
  const list = Array.from(new Set(stripped.split(','))).sort((a, b) => b.length - a.length);
  for (const s of list) {
    if (w.length - s.length >= 4 && w.endsWith(s)) {
      w = w.slice(0, -s.length);
      break;
    }
  }
  return w;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-ząćęłńóśźż0-9]+(?:-[a-ząćęłńóśźż0-9]+)*/gi) || []).filter(Boolean);
}

export function contentTokens(text: string): string[] {
  return tokenize(text).filter((t) => t.length > 2 && !STOPWORDS_PL.has(t) && !/^\d+$/.test(t));
}

export function countWords(text: string): number {
  return tokenize(text).length;
}

// ---------------------------------------------------------------------------
// Zdania i akapity
// ---------------------------------------------------------------------------

const ABBREVIATIONS = [
  'm.in', 'np', 'tzw', 'tj', 'itd', 'itp', 'ang', 'łac', 'gr', 'ok', 'por', 'zob', 'prof', 'dr', 'inż', 'mgr',
  'ul', 'al', 'pl', 'św', 'r', 'w', 'wyd', 'red', 'nr', 'tel', 'godz', 'min', 'max', 'tys', 'mln', 'mld', 'ur', 'zm',
];

/** Dzieli tekst na zdania z uwzględnieniem polskich skrótów i liczb dziesiętnych. */
export function splitSentences(text: string): string[] {
  const clean = cleanSourceText(text).replace(/\n+/g, ' ');
  if (!clean) return [];
  const protectedText = clean
    .replace(/(\d)\.(\d)/g, '$1<DOT>$2')
    .replace(new RegExp(`\\b(${ABBREVIATIONS.map((a) => a.replace('.', '\\.')).join('|')})\\.`, 'gi'), '$1<DOT>')
    .replace(/\b([A-ZĄĆĘŁŃÓŚŹŻ])\.(?=\s?[A-ZĄĆĘŁŃÓŚŹŻ])/g, '$1<DOT>');
  const raw = protectedText.split(/(?<=[.!?…])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ„"(\d])/);
  return raw
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter((s) => s.length > 0);
}

export function splitParagraphs(text: string): string[] {
  return cleanSourceText(text)
    .split(/\n{2,}|\n(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9„"])/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/** Dzieli długi akapit na krótsze (po ~maxChars znaków) na granicy zdań. */
export function chunkParagraph(paragraph: string, maxChars = 420): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const sentences = splitSentences(paragraph);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current && (current + ' ' + s).length > maxChars) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ---------------------------------------------------------------------------
// Słowa kluczowe i ważność zdań
// ---------------------------------------------------------------------------

export interface KeywordScore {
  term: string;
  stem: string;
  score: number;
  count: number;
}

/** TF z grupowaniem po rdzeniu i premią za słowa występujące w tytule. */
export function extractKeywords(text: string, limit = 10, titleHint = ''): KeywordScore[] {
  const tokens = contentTokens(text);
  if (tokens.length === 0) return [];
  const byStem = new Map<string, { forms: Map<string, number>; count: number }>();
  for (const t of tokens) {
    const stem = stemPl(t);
    if (stem.length < 3) continue;
    const entry = byStem.get(stem) || { forms: new Map<string, number>(), count: 0 };
    entry.count += 1;
    entry.forms.set(t, (entry.forms.get(t) || 0) + 1);
    byStem.set(stem, entry);
  }
  const titleStems = new Set(contentTokens(titleHint).map(stemPl));
  const total = tokens.length;
  const scores: KeywordScore[] = [];
  byStem.forEach((entry, stem) => {
    const bestForm = Array.from(entry.forms.entries()).sort((a, b) => b[1] - a[1])[0][0];
    let score = (entry.count / total) * Math.log(1 + entry.count) * (1 + Math.min(bestForm.length, 12) / 12);
    if (titleStems.has(stem)) score *= 1.4;
    if (entry.count === 1) score *= 0.4;
    scores.push({ term: bestForm, stem, score, count: entry.count });
  });
  return scores.sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface ScoredSentence {
  text: string;
  index: number;
  score: number;
}

const SIGNAL_PHRASES = [
  'najważniejsz', 'kluczow', 'podstawow', 'głównie', 'przede wszystkim', 'definiuje', 'oznacza', 'nazywamy',
  'polega na', 'składa się', 'wyróżnia się', 'dzieli się', 'jest to', 'zwany', 'zwana', 'określa się',
  'w celu', 'dzięki', 'wynika', 'prowadzi do', 'umożliwia', 'pozwala', 'ważny', 'istotn',
];

/**
 * Ocena zdań do streszczeń i cytatów: pokrycie słów kluczowych, pozycja w tekście,
 * długość zbliżona do optymalnej oraz frazy sygnalizujące definicje/wnioski.
 */
export function scoreSentences(text: string, titleHint = ''): ScoredSentence[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];
  const keywords = extractKeywords(text, 14, titleHint);
  const keyStems = new Map(keywords.map((k, i) => [k.stem, keywords.length - i]));
  return sentences.map((s, index) => {
    const stems = contentTokens(s).map(stemPl);
    let coverage = 0;
    const seen = new Set<string>();
    stems.forEach((st) => {
      const w = keyStems.get(st);
      if (w && !seen.has(st)) {
        coverage += w;
        seen.add(st);
      }
    });
    const len = s.length;
    const lengthScore = len < 40 ? 0.3 : len > 320 ? 0.55 : 1 - Math.abs(len - 150) / 400;
    const positionScore = index === 0 ? 1.4 : index < 3 ? 1.15 : 1;
    const lower = s.toLowerCase();
    const signal = SIGNAL_PHRASES.some((p) => lower.includes(p)) ? 1.25 : 1;
    const hasNumber = /\d/.test(s) ? 1.08 : 1;
    const score = (coverage / Math.max(8, stems.length)) * lengthScore * positionScore * signal * hasNumber;
    return { text: s, index, score };
  });
}

/** Wybiera N najlepszych zdań, zachowując ich oryginalną kolejność. */
export function pickKeySentences(text: string, count: number, titleHint = ''): string[] {
  const scored = scoreSentences(text, titleHint);
  if (scored.length <= count) return scored.map((s) => s.text);
  return scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.text);
}

/** Streszcza tekst do ok. `ratio` długości, nie schodząc poniżej `minSentences`. */
export function extractiveSummary(text: string, ratio = 0.35, minSentences = 2, maxSentences = 12, titleHint = ''): string {
  const sentences = splitSentences(text);
  if (sentences.length <= minSentences) return sentences.join(' ');
  const target = Math.max(minSentences, Math.min(maxSentences, Math.round(sentences.length * ratio)));
  return pickKeySentences(text, target, titleHint).join(' ');
}

// ---------------------------------------------------------------------------
// Definicje, daty, liczby, cytaty
// ---------------------------------------------------------------------------

export interface ExtractedDefinition {
  term: string;
  definition: string;
  sentence: string;
}

const DEFINITION_PATTERNS: RegExp[] = [
  /^(?<term>[^,.;:()]{2,60}?)\s+(?:–|—|-)\s+(?<def>[^.]{15,}\.)/u,
  /^(?<term>[^,.;:()]{2,60}?)\s+(?:to|jest to|oznacza|nazywamy|określa się jako|definiuje się jako)\s+(?<def>[^.]{15,}\.)/iu,
  /(?<term>„[^”]{2,50}”|"[^"]{2,50}")\s+(?:to|oznacza|jest|określa)\s+(?<def>[^.]{15,}\.)/iu,
  /^(?<term>[^,.;:()]{2,50}?)\s+\((?:ang|łac|niem|fr)\.[^)]*\)\s+(?:–|—|-|to)\s+(?<def>[^.]{15,}\.)/iu,
];

export function extractDefinitions(text: string, limit = 6): ExtractedDefinition[] {
  const result: ExtractedDefinition[] = [];
  const seen = new Set<string>();
  for (const sentence of splitSentences(text)) {
    for (const pattern of DEFINITION_PATTERNS) {
      const match = sentence.match(pattern);
      const groups = match?.groups;
      if (!groups) continue;
      const term = groups.term.replace(/^[„"]|[”"]$/g, '').trim();
      const definition = groups.def.trim();
      const key = normalizeForMatch(term);
      if (!key || seen.has(key) || term.split(/\s+/).length > 7) continue;
      seen.add(key);
      result.push({ term, definition, sentence });
      break;
    }
    if (result.length >= limit) break;
  }
  return result;
}

export interface ExtractedDate {
  label: string;
  year?: number;
  sentence: string;
  sortKey: number;
}

const MONTHS_PL: Record<string, number> = {
  stycznia: 1, lutego: 2, marca: 3, kwietnia: 4, maja: 5, czerwca: 6,
  lipca: 7, sierpnia: 8, września: 9, października: 10, listopada: 11, grudnia: 12,
};

/** Wyszukuje lata i pełne daty wraz ze zdaniem źródłowym – baza do osi czasu. */
export function extractDates(text: string, limit = 12): ExtractedDate[] {
  const out: ExtractedDate[] = [];
  const seen = new Set<string>();
  for (const sentence of splitSentences(text)) {
    const full = sentence.match(/\b(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+(\d{3,4})\b/i);
    const yearOnly = sentence.match(/\b(1[0-9]{3}|20[0-4][0-9])\b/);
    const century = sentence.match(/\b(X{0,2}I?[VX]?I{0,3})\s+(?:w\.|wieku|wiek)\b/);
    let label = '';
    let year: number | undefined;
    let sortKey = 0;
    if (full) {
      label = `${full[1]} ${full[2].toLowerCase()} ${full[3]}`;
      year = parseInt(full[3], 10);
      sortKey = year * 400 + (MONTHS_PL[full[2].toLowerCase()] || 1) * 32 + parseInt(full[1], 10);
    } else if (yearOnly) {
      label = yearOnly[1];
      year = parseInt(yearOnly[1], 10);
      sortKey = year * 400;
    } else if (century && century[1]) {
      label = `${century[1]} w.`;
      sortKey = romanToInt(century[1]) * 100 * 400;
    } else {
      continue;
    }
    const key = `${label}|${sentence.slice(0, 40)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, year, sentence, sortKey });
  }
  return out.sort((a, b) => a.sortKey - b.sortKey).slice(0, limit);
}

export function romanToInt(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]] || 0;
    const next = map[roman[i + 1]] || 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

export interface ExtractedFigure {
  value: string;
  unit?: string;
  context: string;
  sentence: string;
}

/** Wyciąga liczby z jednostkami (procenty, kwoty, ilości) jako kandydatów na karty KPI. */
export function extractFigures(text: string, limit = 6): ExtractedFigure[] {
  const out: ExtractedFigure[] = [];
  const re = /(\d{1,3}(?:[ \u00a0]\d{3})*(?:[.,]\d+)?)\s?(%|proc\.|procent(?:ów|y)?|mln|mld|tys\.|tysięcy|milionów|miliardów|km|m|kg|zł|PLN|USD|EUR|lat|lata|osób|ludzi|razy|ms|s|sek|min|h|dni)\b/gi;
  for (const sentence of splitSentences(text)) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(sentence)) !== null) {
      const value = m[1].replace(/\u00a0/g, ' ');
      const unit = m[2];
      const before = sentence.slice(Math.max(0, m.index - 70), m.index).trim();
      const context = before.split(/\s+/).slice(-6).join(' ');
      out.push({ value, unit, context, sentence });
      if (out.length >= limit * 3) break;
    }
  }
  const seen = new Set<string>();
  return out
    .filter((f) => {
      const k = `${f.value}${f.unit}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit);
}

/** Alias do wyciągania liczb / statystyk */
export function extractNumbers(text: string, limit = 6): Array<{ raw: string; value: number }> {
  return extractFigures(text, limit).map((f) => ({
    raw: `${f.value} ${f.unit}`.trim(),
    value: parseFloat(f.value.replace(/\s/g, '').replace(/,/g, '.')) || 0,
  }));
}

/** Wybiera zdanie nadające się na cytat wyróżniony (pull quote). */
export function pickPullQuote(text: string, titleHint = ''): string | null {
  const scored = scoreSentences(text, titleHint).filter((s) => s.text.length >= 70 && s.text.length <= 240);
  if (scored.length === 0) return null;
  return scored.sort((a, b) => b.score - a.score)[0].text;
}

// ---------------------------------------------------------------------------
// Wykrywanie struktur
// ---------------------------------------------------------------------------

export interface ListCandidate {
  items: string[];
  ordered: boolean;
  intro?: string;
}

/**
 * Rozpoznaje w akapicie wyliczenia: „X, Y i Z", „po pierwsze… po drugie…", „1) … 2) …",
 * a także linie zaczynające się od myślnika/gwiazdki/cyfry.
 */
export function detectListCandidate(paragraph: string): ListCandidate | null {
  const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
  const bulletLines = lines.filter((l) => /^([-*•–]|\d+[.)])\s+/.test(l));
  if (lines.length >= 2 && bulletLines.length >= Math.ceil(lines.length * 0.6) && bulletLines.length >= 2) {
    const ordered = bulletLines.every((l) => /^\d+[.)]\s+/.test(l));
    const intro = lines.find((l) => !/^([-*•–]|\d+[.)])\s+/.test(l));
    return { items: bulletLines.map((l) => l.replace(/^([-*•–]|\d+[.)])\s+/, '')), ordered, intro };
  }
  const inline = paragraph.match(/^(?<intro>[^:]{8,160}):\s*(?<list>[^.]{10,}?)(?:\.|$)/);
  if (inline?.groups) {
    const parts = inline.groups.list.split(/;\s*|,\s+(?=[a-ząćęłńóśźż])| oraz | i (?=[a-ząćęłńóśźż])/i).map((s) => s.trim()).filter((s) => s.length > 1);
    if (parts.length >= 3 && parts.every((p) => p.split(/\s+/).length <= 9)) {
      return { items: parts, ordered: false, intro: inline.groups.intro };
    }
  }
  const sequence = paragraph.match(/(?:po pierwsze|najpierw|w pierwszym kroku)[^.]*\./i);
  if (sequence) {
    const parts = paragraph.split(/(?<=\.)\s+(?=(?:po (?:pierwsze|drugie|trzecie|czwarte)|następnie|potem|na koniec|wreszcie))/i).map((s) => s.trim());
    if (parts.length >= 3) {
      return { items: parts.map((p) => p.replace(/^(po (?:pierwsze|drugie|trzecie|czwarte),?|następnie,?|potem,?|na koniec,?|wreszcie,?)\s*/i, '')), ordered: true };
    }
  }
  return null;
}

export interface WallOfTextInfo {
  isWall: boolean;
  words: number;
  sentences: number;
  longestParagraphWords: number;
}

export function analyzeWall(text: string, thresholdWords = 110): WallOfTextInfo {
  const words = countWords(text);
  return {
    isWall: words > thresholdWords,
    words,
    sentences: splitSentences(text).length,
    longestParagraphWords: words,
  };
}

/** Prosty wskaźnik czytelności: średnia długość zdania i słowa (im niżej, tym łatwiej). */
export function readabilityScore(text: string): { avgSentenceWords: number; avgWordLength: number; level: 'easy' | 'medium' | 'hard' } {
  const sentences = splitSentences(text);
  const words = tokenize(text);
  if (sentences.length === 0 || words.length === 0) return { avgSentenceWords: 0, avgWordLength: 0, level: 'easy' };
  const avgSentenceWords = words.length / sentences.length;
  const avgWordLength = words.reduce((s, w) => s + w.length, 0) / words.length;
  const index = avgSentenceWords * 0.6 + avgWordLength * 3;
  return { avgSentenceWords, avgWordLength, level: index < 17 ? 'easy' : index < 24 ? 'medium' : 'hard' };
}

/** Zawiera elementy tabelaryczne: kilka linii z tym samym separatorem (|, tab, ;). */
export function detectTabularText(paragraph: string): string[][] | null {
  const lines = paragraph.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  for (const sep of ['|', '\t', ';']) {
    const rows = lines.map((l) => l.split(sep).map((c) => c.trim()).filter((c, i, arr) => !(c === '' && (i === 0 || i === arr.length - 1))));
    const width = rows[0].length;
    if (width >= 2 && rows.every((r) => r.length === width)) {
      return rows.filter((r) => !r.every((c) => /^[-:\s]+$/.test(c)));
    }
  }
  return null;
}

/** Podobieństwo Jaccarda między dwoma tekstami (do wykrywania powtórzeń). */
export function jaccardSimilarity(a: string, b: string): number {
  const sa = new Set(contentTokens(a).map(stemPl));
  const sb = new Set(contentTokens(b).map(stemPl));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  sa.forEach((x) => {
    if (sb.has(x)) inter += 1;
  });
  return inter / (sa.size + sb.size - inter);
}

/** Skraca tekst do limitu znaków na granicy zdania lub słowa. */
export function truncateAtBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sentences = splitSentences(text);
  let acc = '';
  for (const s of sentences) {
    if ((acc + ' ' + s).trim().length > maxChars) break;
    acc = (acc + ' ' + s).trim();
  }
  if (acc.length >= maxChars * 0.5) return acc;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxChars).trim()}…`;
}

/** Zamienia tekst na bezpieczny tytuł (usuwa znaki specjalne, ogranicza długość). */
export function toTitle(text: string, max = 80): string {
  const clean = text.replace(/[#*_`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Bez tytułu';
  const first = clean.charAt(0).toUpperCase() + clean.slice(1);
  return first.length > max ? `${first.slice(0, max - 1).trim()}…` : first;
}

/** Wyodrębnia pierwszy numer „X.Y" z prefiksu nagłówka – do sortowania sekcji. */
export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[\[(.+?)\]\]/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1');
}

export interface SourceAnalysis {
  wordCount: number;
  readingTimeMinutes: number;
  keywords: string[];
  numbers: Array<{ raw: string; value: number }>;
  dates: Array<{ year: string; context?: string }>;
  definitions: Array<{ term: string; definition: string }>;
  wallOfText: WallOfTextInfo;
  readability: { avgSentenceWords: number; avgWordLength: number; level: 'easy' | 'medium' | 'hard' };
}

/**
 * Kompleksowa analiza tekstu źródłowego pod kątem planowania i kompozycji dokumentu
 */
export function analyzeSourceText(raw: string): SourceAnalysis {
  const text = raw || '';
  const words = countWords(text);
  const readingTimeMinutes = Math.max(1, Math.round(words / 180));
  const keywords = extractKeywords(text, 12).map((k) => k.form);
  const numbers = extractNumbers(text);
  const dates = extractDates(text);
  const definitions = extractDefinitions(text);
  const wallOfText = analyzeWall(text);
  const readability = readabilityScore(text);

  return {
    wordCount: words,
    readingTimeMinutes,
    keywords,
    numbers,
    dates,
    definitions,
    wallOfText,
    readability,
  };
}

