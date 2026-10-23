/**
 * Silnik Pobierania & Indeksowania Bazy Słów (Wordbank Loader)
 * Źródło: GitHub (raw.githubusercontent.com / HermitDave Polish Frequency Words)
 * Baza: 50,000 polskich słów wraz z częstotliwością występowania
 */

export interface WordbankStats {
  totalWords: number;
  source: string;
  sourceUrl: string;
  isReady: boolean;
  isLoading: boolean;
  lastUpdated: number | null;
  error?: string;
}

const GITHUB_WORDBANK_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/pl/pl_50k.txt';
const LOCAL_FALLBACK_URL = '/pl_50k.txt';

class PolishWordbankService {
  private wordSet: Set<string> = new Set();
  private strippedSet: Set<string> = new Set();
  private frequencyMap: Map<string, number> = new Map();
  private stats: WordbankStats = {
    totalWords: 0,
    source: 'GitHub / HermitDave Polish Corpus',
    sourceUrl: GITHUB_WORDBANK_URL,
    isReady: false,
    isLoading: false,
    lastUpdated: null,
  };

  private listeners: Array<(stats: WordbankStats) => void> = [];

  constructor() {
    // Automatyczna inicjalizacja w tle
    this.init();
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.stats }));
  }

  public subscribe(callback: (stats: WordbankStats) => void): () => void {
    this.listeners.push(callback);
    callback({ ...this.stats });
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getStats(): WordbankStats {
    return { ...this.stats };
  }

  private stripDiacritics(text: string): string {
    const map: Record<string, string> = {
      ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z'
    };
    return text.toLowerCase().replace(/[ąćęłńóśźż]/g, (m) => map[m] || m);
  }

  /**
   * Parsuje surową treść pliku tekstowego z GitHuba
   */
  public parseWordlist(text: string): number {
    const lines = text.split('\n');
    let addedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const spaceIdx = line.indexOf(' ');
      let word = '';
      let freq = 0;

      if (spaceIdx > 0) {
        word = line.substring(0, spaceIdx).toLowerCase();
        freq = parseInt(line.substring(spaceIdx + 1), 10) || 1;
      } else {
        word = line.toLowerCase();
        freq = 1;
      }

      if (word && word.length > 1) {
        this.wordSet.add(word);
        this.strippedSet.add(this.stripDiacritics(word));
        this.frequencyMap.set(word, freq);
        addedCount++;
      }
    }

    this.stats.totalWords = this.wordSet.size;
    this.stats.isReady = true;
    this.stats.isLoading = false;
    this.stats.lastUpdated = Date.now();
    this.notify();

    return addedCount;
  }

  /**
   * Pobiera bazę 50k słów z GitHuba (z fallbackiem na lokalny plik /pl_50k.txt)
   */
  public async loadFromGitHub(force = false): Promise<boolean> {
    if (this.stats.isReady && !force) {
      return true;
    }

    this.stats.isLoading = true;
    this.notify();

    // 1. Próba bezpośredniego pobrania z GitHub Raw
    try {
      const res = await fetch(GITHUB_WORDBANK_URL, { cache: 'force-cache' });
      if (res.ok) {
        const text = await res.text();
        const count = this.parseWordlist(text);
        this.stats.source = 'GitHub (raw.githubusercontent.com - live)';
        this.notify();
        return true;
      }
    } catch (err) {
      console.warn('Nie udało się pobrać z GitHub raw, sprawdzam lokalny plik /pl_50k.txt...', err);
    }

    // 2. Fallback na lokalny plik /pl_50k.txt
    try {
      const resLocal = await fetch(LOCAL_FALLBACK_URL);
      if (resLocal.ok) {
        const textLocal = await resLocal.text();
        this.parseWordlist(textLocal);
        this.stats.source = 'Zbuforowana baza GitHub (/pl_50k.txt)';
        this.notify();
        return true;
      }
    } catch (err) {
      console.error('Błąd wczytywania bazy słów:', err);
      this.stats.error = 'Nie udało się pobrać bazy słów z GitHuba.';
      this.stats.isLoading = false;
      this.notify();
      return false;
    }

    return false;
  }

  private async init() {
    // Sprawdź czy mamy w pamięci podręcznej przeglądarki
    await this.loadFromGitHub(false);
  }

  /**
   * Sprawdza czy podane słowo istnieje w 50,000 bazie słów z GitHuba
   */
  public isKnownWord(word: string): boolean {
    const w = word.toLowerCase().trim();
    return this.wordSet.has(w) || this.strippedSet.has(this.stripDiacritics(w));
  }

  /**
   * Zwraca częstość danego słowa w języku polskim
   */
  public getWordFrequency(word: string): number {
    return this.frequencyMap.get(word.toLowerCase().trim()) || 0;
  }

  /**
   * Analizuje zdanie i zwraca statystyki rozpoznanych słów z bazy 50k
   */
  public analyzeSentenceTokens(sentence: string): {
    tokens: string[];
    knownCount: number;
    ratio: number;
    topMatches: string[];
  } {
    const rawTokens = sentence
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const knownTokens: string[] = [];
    for (const t of rawTokens) {
      if (this.isKnownWord(t)) {
        knownTokens.push(t);
      }
    }

    return {
      tokens: rawTokens,
      knownCount: knownTokens.length,
      ratio: rawTokens.length > 0 ? knownTokens.length / rawTokens.length : 0,
      topMatches: knownTokens.slice(0, 10),
    };
  }
}

export const polishWordbank = new PolishWordbankService();
