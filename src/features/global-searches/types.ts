/**
 * Global Searches & Knowledge Collections Types
 * KROK 4 & 5 Architecture
 */

export type SearchPrivacyMode = 'public' | 'my_searches';

export type ClaimVerificationStatus =
  | 'Confirmed'     // Potwierdzone (>= 4-5 niezależnych źródeł, consensus >= 90%)
  | 'Likely'        // Prawdopodobne (3-4 źródła, drobne rozbieżności)
  | 'Disputed'      // Sporne (sprzeczne źródła lub aktywne zgłoszenie błędu)
  | 'Unverified'    // Niezweryfikowane (1-2 źródła)
  | 'Outdated';     // Przestarzałe (zdezaktualizowane fakty)

export type SourceType =
  | 'encyclopedia'
  | 'academic'
  | 'web_index'
  | 'documentation'
  | 'official_data'
  | 'ai_consensus';

export interface ClaimSourceItem {
  id?: string;
  name: string;
  url?: string;
  sourceType?: SourceType;
  snippet?: string;
  reliabilityScore?: number; // 0 - 100%
  publishedDate?: string;
}

export interface VerifiedClaim {
  id: string;
  claim: string;
  status: ClaimVerificationStatus;
  sources: ClaimSourceItem[];
  verifiedAt: number;
  confidenceScore: number; // 0 - 100%
  consensusPercentage?: number; // 0 - 100% stopień zbieżności
  fallbacksUsed?: boolean; // true jeśli użyto zapasowych źródeł
  notes?: string;
  disputeReason?: string;
}

export interface GlobalKnowledgeCollection {
  id: string;
  topic: string;
  canonicalSlug: string;
  aliases: string[];
  category: 'Nauka' | 'Technologia' | 'Biznes' | 'Kultura' | 'Natura' | 'Ogólne';
  summary: string;
  keyTakeaways: string[];
  verifiedClaims: VerifiedClaim[];
  searchCount: number; // np. 500 zapytań o ten sam temat zasilających 1 kolekcję
  lastUpdatedAt: number;
  isPublic: boolean;
  qualityScore: number; // 0 - 100
}

export interface UserSearchItem {
  id: string;
  userId?: string;
  query: string;
  mode: SearchPrivacyMode;
  topic: string;
  collectionId?: string; // relacja do globalnego zbioru
  summary: string;
  keyTakeaways?: string[];
  claims: VerifiedClaim[];
  sourcesCount: number;
  createdAt: number;
  reusedFromCollection: boolean; // czy wynik pochodził z reuse-first
}

export type BugReportReason =
  | 'outdated'
  | 'factual_error'
  | 'missing_source'
  | 'bias'
  | 'other';

export interface BugReportItem {
  id: string;
  userId: string;
  userEmail?: string;
  searchId?: string;
  collectionId?: string;
  claimId?: string;
  claimText: string;
  reason?: BugReportReason;
  counterSourceUrl?: string;
  userComment: string;
  status: 'pending' | 'verified_bug' | 'partially_confirmed' | 'rejected';
  aiVerdict?: string;
  aiVerificationSources?: { name: string; url?: string; snippet?: string }[];
  createdAt: number;
  reviewedAt?: number;
}
