/**
 * Global Knowledge Collections Service
 * Współdzielone zbiory wiedzy wielokrotnego użytku (Reuse-First Knowledge Base)
 */

import { GlobalKnowledgeCollection, VerifiedClaim } from './types';
import { slugifyTopic } from './classifierService';

const STORAGE_KEY = 'searchpoint_global_collections_v1';

// Przykładowe początkowe globalne kolekcje wiedzy
const SEED_COLLECTIONS: GlobalKnowledgeCollection[] = [
  {
    id: 'col-koty',
    topic: 'Koty domowe',
    canonicalSlug: 'koty-domowe',
    aliases: ['koty', 'kot domowy', 'kot', 'felis catus', 'rasy kotów'],
    category: 'Natura',
    summary: 'Kot domowy (Felis catus) – udomowiony gatunek ssaka z rzędu drapieżnych z rodziny kotowatych. Został udomowiony około 9500 lat temu na Bliskim Wschodzie.',
    keyTakeaways: [
      'Udomowiony około 9500 lat temu (Cypr/Bliski Wschód)',
      'Posiada zmysł słuchu rejestrujący dźwięki do 64 kHz',
      'Sen zajmuje kotu średnio 12-16 godzin na dobę',
    ],
    verifiedClaims: [
      {
        id: 'claim-kot-1',
        claim: 'Koty zostały udomowione około 9500 lat temu na Bliskim Wschodzie.',
        status: 'Confirmed',
        sources: [
          { name: 'Wikipedia PL', url: 'https://pl.wikipedia.org/wiki/Kot_domowy' },
          { name: 'Science Magazine Archive', url: 'https://science.org' },
          { name: 'National Geographic', url: 'https://nationalgeographic.com' },
          { name: 'Nature Genetics', url: 'https://nature.com' },
        ],
        verifiedAt: Date.now() - 3600 * 1000 * 24,
        confidenceScore: 98,
      },
      {
        id: 'claim-kot-2',
        claim: 'Przeciętna długość życia kota domowego trzymanego w domu wynosi 12-15 lat.',
        status: 'Confirmed',
        sources: [
          { name: 'American Veterinary Medical Association', url: 'https://avma.org' },
          { name: 'Royal Canin Veterinary Guide', url: 'https://royalcanin.com' },
          { name: 'Cornell Feline Health Center', url: 'https://vet.cornell.edu' },
          { name: 'Wikipedia', url: 'https://pl.wikipedia.org' },
        ],
        verifiedAt: Date.now() - 3600 * 1000 * 24,
        confidenceScore: 95,
      },
      {
        id: 'claim-kot-3',
        claim: 'Koty nie odczuwają słodkiego smaku z powodu mutacji w genie receptora Tas1r2.',
        status: 'Confirmed',
        sources: [
          { name: 'Monell Chemical Senses Center', url: 'https://monell.org' },
          { name: 'PLOS Genetics', url: 'https://journals.plos.org' },
          { name: 'Scientific American', url: 'https://scientificamerican.com' },
          { name: 'NCBI PubMed', url: 'https://ncbi.nlm.nih.gov' },
        ],
        verifiedAt: Date.now() - 3600 * 1000 * 24,
        confidenceScore: 99,
      },
    ],
    searchCount: 512, // 500+ zapytań zasilających 1 zbiór
    lastUpdatedAt: Date.now() - 1000 * 3600 * 4,
    isPublic: true,
    qualityScore: 96,
  },
  {
    id: 'col-ai',
    topic: 'Sztuczna Inteligencja (AI)',
    canonicalSlug: 'sztuczna-inteligencja',
    aliases: ['ai', 'artificial intelligence', 'uczenie maszynowe', 'llm', 'deep learning'],
    category: 'Technologia',
    summary: 'Sztuczna inteligencja (AI) to dziedzina informatyki zajmująca się tworzeniem systemów i algorytmów zdolnych do wykonywania zadań wymagających ludzkiej inteligencji.',
    keyTakeaways: [
      'Termin ukuty w 1956 roku podczas konferencji Dartmouth',
      'Współczesny przełom opiera się na architekturze Transformer (2017)',
      'Główne filary: Uczenie Maszynowe, Przetwarzanie Języka (NLP), Computer Vision',
    ],
    verifiedClaims: [
      {
        id: 'claim-ai-1',
        claim: 'Architektura Transformer została wprowadzona przez badaczy Google w publikacji "Attention Is All You Need" w 2017 r.',
        status: 'Confirmed',
        sources: [
          { name: 'NeurIPS Proceedings', url: 'https://arxiv.org/abs/1706.03762' },
          { name: 'Google Research Blog', url: 'https://research.google' },
          { name: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)' },
          { name: 'ACM Digital Library', url: 'https://dl.acm.org' },
        ],
        verifiedAt: Date.now() - 3600 * 1000 * 12,
        confidenceScore: 100,
      },
    ],
    searchCount: 843,
    lastUpdatedAt: Date.now() - 1000 * 3600 * 2,
    isPublic: true,
    qualityScore: 98,
  },
  {
    id: 'col-react19',
    topic: 'React 19 & Next.js',
    canonicalSlug: 'react-19',
    aliases: ['react 19', 'react', 'react js', 'server components', 'rsc'],
    category: 'Technologia',
    summary: 'React 19 wprowadza natywną obsługę React Server Components, Actions, hooki useActionState i useFormStatus oraz automatyczną kompilację React Compiler.',
    keyTakeaways: [
      'Eliminacja potrzeby ręcznego useMemo i useCallback dzięki React Compiler',
      'Wbudowane Actions ułatwiające mutację danych w formularzach',
      'Server Components jako standardowy model renderowania',
    ],
    verifiedClaims: [
      {
        id: 'claim-react-1',
        claim: 'React 19 oficjalnie stabilizuje Server Actions oraz nowy hook useActionState.',
        status: 'Confirmed',
        sources: [
          { name: 'React Official Blog', url: 'https://react.dev/blog/2024/04/25/react-19' },
          { name: 'GitHub React Releases', url: 'https://github.com/facebook/react/releases' },
          { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
          { name: 'Vercel Engineering', url: 'https://vercel.com/blog' },
        ],
        verifiedAt: Date.now() - 3600 * 1000 * 6,
        confidenceScore: 97,
      },
    ],
    searchCount: 421,
    lastUpdatedAt: Date.now() - 1000 * 3600 * 3,
    isPublic: true,
    qualityScore: 94,
  },
];

export class KnowledgeCollectionsService {
  private collections: GlobalKnowledgeCollection[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.collections = JSON.parse(stored);
          return;
        }
      }
      this.collections = SEED_COLLECTIONS;
      this.save();
    } catch {
      this.collections = SEED_COLLECTIONS;
    }
  }

  private save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.collections));
      }
    } catch (e) {
      console.warn('Failed to save global collections to localStorage', e);
    }
  }

  /**
   * Zwraca wszystkie zbiory wiedzy
   */
  public getAllCollections(): GlobalKnowledgeCollection[] {
    return [...this.collections];
  }

  /**
   * Zwraca zbiór po ID
   */
  public getCollectionById(collectionId: string): GlobalKnowledgeCollection | undefined {
    return this.collections.find((c) => c.id === collectionId);
  }

  /**
   * Wyszukuje pasujący zbiór po temacie, slugu lub aliasach (Deduplication)
   */
  public findMatchingCollection(query: string): GlobalKnowledgeCollection | null {
    const qClean = query.toLowerCase().trim();
    const qSlug = slugifyTopic(qClean);

    for (const col of this.collections) {
      if (col.canonicalSlug === qSlug) return col;
      if (col.topic.toLowerCase() === qClean) return col;
      if (col.aliases.some((a) => a.toLowerCase() === qClean || qClean.includes(a.toLowerCase()))) {
        return col;
      }
      if (qClean.includes(col.topic.toLowerCase()) || col.topic.toLowerCase().includes(qClean)) {
        return col;
      }
    }
    return null;
  }

  /**
   * Zwiększa licznik zapytań dla danego zbioru (np. 500 zapytań o koty)
   */
  public incrementSearchCount(collectionId: string): void {
    const col = this.collections.find((c) => c.id === collectionId);
    if (col) {
      col.searchCount++;
      this.save();
    }
  }

  /**
   * Aktualizuje lub dodaje nowy zbiór wiedzy
   */
  public upsertCollection(collection: GlobalKnowledgeCollection): void {
    const idx = this.collections.findIndex((c) => c.id === collection.id);
    if (idx >= 0) {
      this.collections[idx] = collection;
    } else {
      this.collections.unshift(collection);
    }
    this.save();
  }
}

export const globalKnowledgeService = new KnowledgeCollectionsService();
