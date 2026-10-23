/**
 * Reuse-First Search Engine & Multi-Source Verification
 * KROK 4 & KROK 5 Architecture
 */

import { UserSearchItem, VerifiedClaim } from './types';
import { classifySearchQuery } from './classifierService';
import { globalKnowledgeService } from './knowledgeCollectionsService';
import { verifyTopicAcross5Sources } from './multiSourceVerifier';

const USER_SEARCHES_STORAGE_KEY = 'searchpoint_my_searches_v1';

export class ReuseFirstSearchEngine {
  private userSearches: UserSearchItem[] = [];

  constructor() {
    this.loadUserSearches();
  }

  private loadUserSearches() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(USER_SEARCHES_STORAGE_KEY);
        if (stored) {
          this.userSearches = JSON.parse(stored);
        }
      }
    } catch {
      this.userSearches = [];
    }
  }

  private saveUserSearches() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_SEARCHES_STORAGE_KEY, JSON.stringify(this.userSearches));
      }
    } catch (e) {
      console.warn('Failed to save user searches to localStorage', e);
    }
  }

  public getMySearches(): UserSearchItem[] {
    return [...this.userSearches];
  }

  public removeSearch(id: string): void {
    this.userSearches = this.userSearches.filter((s) => s.id !== id);
    this.saveUserSearches();
  }

  public clearAll(): void {
    this.userSearches = [];
    this.saveUserSearches();
  }

  /**
   * Główna metoda wyszukiwania: Reuse-First Engine
   * 1. Klasyfikacja zapytania (Public vs My Searches)
   * 2. Sprawdzenie istniejących zbiorów globalnych (Reuse-First)
   * 3. Weryfikacja w 5 niezależnych źródłach tylko w razie braku / dezaktualizacji / wymuszenia
   */
  public async executeSearch(
    rawQuery: string,
    requestedMode?: 'public' | 'my_searches',
    forceRefresh = false
  ): Promise<UserSearchItem> {
    const classification = classifySearchQuery(rawQuery, requestedMode);
    const existingCol = globalKnowledgeService.findMatchingCollection(classification.canonicalTopic);

    const ONE_WEEK_MS = 7 * 24 * 3600 * 1000;
    const isFresh = existingCol && Date.now() - existingCol.lastUpdatedAt < ONE_WEEK_MS;

    // A. REUSE-FIRST HIT: Istniejący, świeży zbiór globalny (i brak wymuszenia odświeżenia)
    if (existingCol && isFresh && !forceRefresh) {
      globalKnowledgeService.incrementSearchCount(existingCol.id);

      const userRecord: UserSearchItem = {
        id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        query: rawQuery,
        mode: classification.recommendedMode,
        topic: existingCol.topic,
        collectionId: existingCol.id,
        summary: existingCol.summary,
        keyTakeaways: existingCol.keyTakeaways,
        claims: existingCol.verifiedClaims,
        sourcesCount: existingCol.verifiedClaims.reduce(
          (acc, c) => Math.max(acc, c.sources.length),
          5
        ),
        createdAt: Date.now(),
        reusedFromCollection: true,
      };

      this.userSearches.unshift(userRecord);
      this.saveUserSearches();
      return userRecord;
    }

    // B. EXTERNAL 5-SOURCE FACT VERIFICATION
    const verifiedData = await verifyTopicAcross5Sources(rawQuery, classification.canonicalTopic);

    // Jeśli zapytanie kwalifikuje się do bazy publicznej i wybrano tryb public, utwórz/zaktualizuj globalną kolekcję
    let linkedCollectionId: string | undefined = undefined;
    if (classification.isPublicEligible && classification.recommendedMode === 'public') {
      const newCollectionId = existingCol?.id || `col-${classification.canonicalSlug}`;
      globalKnowledgeService.upsertCollection({
        id: newCollectionId,
        topic: classification.canonicalTopic,
        canonicalSlug: classification.canonicalSlug,
        aliases: [
          rawQuery.toLowerCase(),
          classification.canonicalTopic.toLowerCase(),
          ...(existingCol?.aliases || []),
        ],
        category: classification.category,
        summary: verifiedData.summary,
        keyTakeaways: verifiedData.keyTakeaways,
        verifiedClaims: verifiedData.claims,
        searchCount: (existingCol?.searchCount || 0) + 1,
        lastUpdatedAt: Date.now(),
        isPublic: true,
        qualityScore: verifiedData.overallConsensusScore,
      });
      linkedCollectionId = newCollectionId;
    }

    // Zapisz w My Searches (zawsze bezpieczne i prywatne dla użytkownika)
    const userRecord: UserSearchItem = {
      id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      query: rawQuery,
      mode: classification.recommendedMode,
      topic: classification.canonicalTopic,
      collectionId: linkedCollectionId,
      summary: verifiedData.summary,
      keyTakeaways: verifiedData.keyTakeaways,
      claims: verifiedData.claims,
      sourcesCount: verifiedData.sourcesCount,
      createdAt: Date.now(),
      reusedFromCollection: false,
    };

    this.userSearches.unshift(userRecord);
    this.saveUserSearches();
    return userRecord;
  }

  /**
   * Oznacza twierdzenie jako sporne w wyszukiwaniu użytkownika (np. po zgłoszeniu błędu)
   */
  public markClaimDisputed(claimText: string, reason?: string): void {
    let changed = false;
    for (const search of this.userSearches) {
      for (const claim of search.claims) {
        if (claim.claim.trim() === claimText.trim() || claimText.includes(claim.claim)) {
          claim.status = 'Disputed';
          claim.disputeReason = reason || 'Zgłoszono wątpliwość merytoryczną';
          changed = true;
        }
      }
    }
    if (changed) {
      this.saveUserSearches();
    }
  }
}

export const reuseFirstEngine = new ReuseFirstSearchEngine();
