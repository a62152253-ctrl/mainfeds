/**
 * Serwis Zgłaszania Błędów w Faktach i Twardego Limitu 4 Zgłoszeń na 24h
 * KROK 5 Architecture:
 * - Twardy limit: 4 zgłoszenia na 24 godziny na konto (userId)
 * - Automatyczny proces weryfikacji przez AI
 * - Izolacja kolekcji globalnej (zgłoszenie nie niszczy bazy, lecz oznacza status jako Disputed)
 */

import { BugReportItem, BugReportReason } from './types';
import { puterAi } from '../ai/puterService';
import { reuseFirstEngine } from './reuseFirstEngine';
import { globalKnowledgeService } from './knowledgeCollectionsService';

const MAX_REPORTS_PER_24H = 4;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BUG_REPORTS_STORAGE_KEY = 'searchpoint_bug_reports_v1';

export class BugReportService {
  private reports: BugReportItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(BUG_REPORTS_STORAGE_KEY);
        if (stored) {
          this.reports = JSON.parse(stored);
        }
      }
    } catch {
      this.reports = [];
    }
  }

  private save() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(BUG_REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
      }
    } catch (e) {
      console.warn('Failed to save bug reports', e);
    }
  }

  /**
   * Zwraca liczbę pozostałych zgłoszeń dla danego konta w oknie 24h
   */
  public getRemainingQuota(userId: string): {
    remaining: number;
    max: number;
    resetInHours: number;
  } {
    const now = Date.now();
    const userReports = this.reports.filter(
      (r) => r.userId === userId && now - r.createdAt < ONE_DAY_MS
    );

    const count = userReports.length;
    const remaining = Math.max(0, MAX_REPORTS_PER_24H - count);

    let resetInHours = 0;
    if (userReports.length > 0) {
      const oldestInWindow = Math.min(...userReports.map((r) => r.createdAt));
      const resetTime = oldestInWindow + ONE_DAY_MS;
      resetInHours = Math.max(1, Math.round((resetTime - now) / (1000 * 3600)));
    }

    return {
      remaining,
      max: MAX_REPORTS_PER_24H,
      resetInHours,
    };
  }

  /**
   * Zgłasza błąd w fakcie i uruchamia automatyczną weryfikację AI
   */
  public async submitBugReport(params: {
    userId: string;
    userEmail?: string;
    searchId?: string;
    collectionId?: string;
    claimId?: string;
    claimText: string;
    reason?: BugReportReason;
    counterSourceUrl?: string;
    userComment: string;
  }): Promise<{ success: boolean; error?: string; report?: BugReportItem }> {
    const quota = this.getRemainingQuota(params.userId);
    if (quota.remaining <= 0) {
      return {
        success: false,
        error: `Osiągnięto limit zgłoszeń (${MAX_REPORTS_PER_24H} na 24h). Nowe zgłoszenia będą dostępne za ~${quota.resetInHours}h.`,
      };
    }

    const reportId = `bug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newReport: BugReportItem = {
      id: reportId,
      userId: params.userId,
      userEmail: params.userEmail,
      searchId: params.searchId,
      collectionId: params.collectionId,
      claimId: params.claimId,
      claimText: params.claimText,
      reason: params.reason || 'factual_error',
      counterSourceUrl: params.counterSourceUrl,
      userComment: params.userComment,
      status: 'pending',
      createdAt: Date.now(),
    };

    // Oznacz twierdzenie jako Disputed w wyszukiwaniach
    reuseFirstEngine.markClaimDisputed(params.claimText, params.userComment);

    // Oznacz w kolekcji globalnej, jeśli istnieje
    if (params.collectionId) {
      const col = globalKnowledgeService.getCollectionById(params.collectionId);
      if (col) {
        for (const claim of col.verifiedClaims) {
          if (claim.claim.trim() === params.claimText.trim() || params.claimText.includes(claim.claim)) {
            claim.status = 'Disputed';
            claim.disputeReason = `Zgłoszono wątpliwość: ${params.userComment.slice(0, 80)}`;
          }
        }
        globalKnowledgeService.upsertCollection(col);
      }
    }

    // Automatyczna weryfikacja przez AI w tle
    try {
      const prompt = `Jesteś audytorem weryfikacji faktów w SearchPoint.
Użytkownik zgłosił błąd merytoryczny w stwierdzeniu.

Oryginalne twierdzenie: "${params.claimText}"
Kategoria zgłoszenia: ${params.reason || 'Błąd merytoryczny'}
${params.counterSourceUrl ? `Źródło korygujące podane przez użytkownika: ${params.counterSourceUrl}` : ''}
Komentarz / zarzut użytkownika: "${params.userComment}"

Oceń krytycznie to zgłoszenie. Wybierz jeden ze statusów:
- VERIFIED_BUG (jeśli użytkownik ma rację i informacja była błędna lub nieaktualna)
- PARTIALLY_CONFIRMED (jeśli jest tu niejednoznaczność lub kwestia interpretacji)
- REJECTED (jeśli oryginalne twierdzenie jest w 100% potwierdzonym faktem naukowym/historycznym)

Napisz krótkie (2-3 zdania) uzasadnienie po polsku.`;

      const aiVerdict = await puterAi.chat(prompt, [], {
        pages: [],
        tasks: [],
        pagesCount: 0,
        tasksCount: 0,
        activeTasksCount: 0,
        doneTasksCount: 0,
      });

      const verdictText = aiVerdict?.text || '';
      let status: BugReportItem['status'] = 'partially_confirmed';

      if (verdictText.includes('VERIFIED_BUG')) {
        status = 'verified_bug';
      } else if (verdictText.includes('REJECTED')) {
        status = 'rejected';
      }

      newReport.status = status;
      newReport.aiVerdict = verdictText;
      newReport.reviewedAt = Date.now();
    } catch {
      newReport.status = 'partially_confirmed';
      newReport.aiVerdict = 'Zgłoszenie zarejestrowane. Oczekuje na weryfikację zespołu.';
    }

    this.reports.unshift(newReport);
    this.save();

    return {
      success: true,
      report: newReport,
    };
  }

  public getAllReports(userId?: string): BugReportItem[] {
    if (userId) {
      return this.reports.filter((r) => r.userId === userId);
    }
    return [...this.reports];
  }
}

export const bugReportService = new BugReportService();
