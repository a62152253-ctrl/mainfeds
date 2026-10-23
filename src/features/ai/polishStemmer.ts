/**
 * Zaawansowany Lemmatyzator i Stemmer Języka Polskiego dla Studio AI Copilot
 * Usuwa końcówki fleksyjne (deklinacja, koniugacja), normalizuje znaki diakrytyczne
 * oraz mapuje formy odmienione słów na ich rdzenie pojęciowe.
 */

// Mapa usuwania polskich znaków diakrytycznych dla porównań fonetycznych
const DIACRITICS_MAP: Record<string, string> = {
  ą: 'a',
  ć: 'c',
  ę: 'e',
  ł: 'l',
  ń: 'n',
  ó: 'o',
  ś: 's',
  ź: 'z',
  ż: 'z',
};

export function removePolishDiacritics(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (char) => DIACRITICS_MAP[char] || char);
}

// Typowe polskie końcówki fleksyjne posortowane od najdłuższych do najkrótszych
const POLISH_SUFFIXES = [
  'iście', 'yście', 'iśmy', 'yśmy',
  'ałem', 'ałam', 'ałeś', 'ałaś',
  'ował', 'ować', 'ują', 'ujcie',
  'iami', 'ami', 'ach', 'owi', 'iem',
  'ych', 'ymi', 'ego', 'emu', 'ach',
  'iem', 'om', 'ów', 'ow', 'ej', 'ym',
  'cie', 'imy', 'ymy', 'sz', 'uj',
  'ie', 'ce', 'em', 'am', 'eś', 'aś',
  'ną', 'nąć', 'być', 'my', 'ą', 'ę',
  'a', 'e', 'y', 'u', 'i', 'o'
];

/**
 * Zwraca zredukowany rdzeń słowa (stem)
 */
export function stemPolishWord(rawWord: string): string {
  let word = removePolishDiacritics(rawWord.toLowerCase().trim());
  if (word.length <= 3) return word;

  // Sprawdzanie i usuwanie najdłuższej pasującej końcówki fleksyjnej
  for (const suffix of POLISH_SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      word = word.slice(0, -suffix.length);
      break;
    }
  }

  // Wymiany fonetyczne w rdzeniach (np. g -> dz, k -> c, rz -> r)
  return word
    .replace(/rz/g, 'r')
    .replace(/ch/g, 'h')
    .replace(/dz/g, 'z');
}

/**
 * Sprawdza, czy zapytanie użytkownika zawiera dane pojęcie w dowolnej formie fleksyjnej
 */
export function matchesConcept(queryText: string, conceptKeywords: string[]): boolean {
  const normalizedQuery = removePolishDiacritics(queryText.toLowerCase());
  const queryTokens = normalizedQuery.split(/[\s,?.!;:—"'-]+/).filter(Boolean);
  const queryStems = queryTokens.map((t) => stemPolishWord(t));

  for (const keyword of conceptKeywords) {
    const normalizedKeyword = removePolishDiacritics(keyword.toLowerCase().trim());

    // 1. Sprawdzenie wystąpienia pełnej frazy wielowyrazowej
    if (normalizedKeyword.includes(' ')) {
      if (normalizedQuery.includes(normalizedKeyword)) {
        return true;
      }
      const kwTokens = normalizedKeyword.split(/\s+/).filter(Boolean);
      const allFound = kwTokens.every((k) =>
        queryTokens.some((q) => q === k || (q.length >= 3 && stemPolishWord(q) === stemPolishWord(k)))
      );
      if (allFound) {
        return true;
      }
      continue;
    }

    // 2. Sprawdzenie pojedynczego tokenu (dokładne i rdzeniowe)
    if (queryTokens.includes(normalizedKeyword)) {
      return true;
    }

    const keywordStem = stemPolishWord(normalizedKeyword);
    for (const qStem of queryStems) {
      if (qStem === keywordStem) {
        return true;
      }
    }
  }

  return false;
}
