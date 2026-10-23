/**
 * Centralny Serwis Subskrypcji, Planów (Free vs Pro) oraz Mock Płatności
 * SearchPoint Engine · Standard Notion 1:1
 *
 * Założenia i wymagania:
 * - Free: 0 zł / miesiąc
 *   - Chat AI bez limitu (pytania, odpowiedzi tekstowe, porady)
 *   - Max 3 notatki utworzone przez AI na dzień (licznik resetowany o północy)
 *   - Templates Library zablokowana dla Free
 *   - Zaawansowane narzędzia Deep Research zarezerwowane dla Pro
 * - Pro: 8 zł / miesiąc
 *   - Nielimitowane tworzenie notatek AI
 *   - Pełny Deep Research z weryfikacją w 4+ źródłach
 *   - Dostęp do Templates Library
 *   - Rozbudowane formatowanie, multimedia, 80 bloków i eksporty
 * - Mock Payments:
 *   - W fazie wdrażania system działa w trybie MOCK_PRO_TRIAL_ENABLED = true
 *   - Każdy użytkownik ma tymczasowo pełny dostęp do Pro ("Tymczasowy darmowy dostęp Pro na czas wdrażania płatności")
 *   - Przycisk "Zapłać — 8 zł" otwiera dedykowany modal z wyjaśnieniem, że środki nie są pobierane
 *   - Przy wyłączonym MOCK (lub w testach backendowych) limity Free są w 100% rygorystycznie egzekwowane
 */

export type SubscriptionPlanId = 'free' | 'pro';

export interface SubscriptionState {
  planId: SubscriptionPlanId;
  planName: string;
  pricePln: number;
  mockTrialActive: boolean;
  notesCreatedToday: number;
  dailyNotesLimit: number;
  resetTimestamp: number;
}

export interface PlanGateCheckResult {
  allowed: boolean;
  reason?: string;
  requiresPro?: boolean;
  notesRemainingToday?: number;
}

const STORAGE_KEY_SUBSCRIPTION = 'searchpoint_subscription_state_v1';
const STORAGE_KEY_DAILY_USAGE = 'searchpoint_daily_ai_notes_v1';

// Globalna flaga Mock Payments na czas wdrażania (zgodnie z KROK 11)
let MOCK_PAYMENTS_TRIAL_DEFAULT = true;

/**
 * Zwraca dzisiejszy klucz daty w formacie YYYY-MM-DD
 */
export function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export class SubscriptionService {
  private static instance: SubscriptionService;
  private mockTrialOverride: boolean | null = null;
  private planOverride: SubscriptionPlanId | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Zwraca czy aktywny jest globalny tryb mock payments dający darmowy Pro trial
   */
  public isMockTrialActive(): boolean {
    if (this.mockTrialOverride !== null) return this.mockTrialOverride;
    try {
      const stored = localStorage.getItem('searchpoint_mock_trial_enabled');
      if (stored !== null) return stored === 'true';
    } catch {}
    return MOCK_PAYMENTS_TRIAL_DEFAULT;
  }

  public setMockTrialActive(active: boolean): void {
    this.mockTrialOverride = active;
    try {
      localStorage.setItem('searchpoint_mock_trial_enabled', String(active));
    } catch {}
  }

  /**
   * Pobiera aktualny plan użytkownika ('free' | 'pro')
   */
  public getUserPlan(): SubscriptionPlanId {
    if (this.planOverride) return this.planOverride;
    try {
      const saved = localStorage.getItem('searchpoint_user_plan');
      if (saved === 'pro' || saved === 'free') return saved;
    } catch {}
    return 'free';
  }

  public setUserPlan(plan: SubscriptionPlanId): void {
    this.planOverride = plan;
    try {
      localStorage.setItem('searchpoint_user_plan', plan);
    } catch {}
  }

  /**
   * Zwraca liczbę notatek wygenerowanych przez AI w bieżącym dniu
   */
  public getNotesCreatedToday(): number {
    try {
      const today = getTodayDateKey();
      const raw = localStorage.getItem(STORAGE_KEY_DAILY_USAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today && typeof parsed.count === 'number') {
          return parsed.count;
        }
      }
    } catch {}
    return 0;
  }

  /**
   * Rejestruje wygenerowanie 1 nowej notatki AI
   */
  public recordAiNoteCreation(): void {
    try {
      const today = getTodayDateKey();
      const current = this.getNotesCreatedToday();
      localStorage.setItem(
        STORAGE_KEY_DAILY_USAGE,
        JSON.stringify({ date: today, count: current + 1 })
      );
    } catch {}
  }

  /**
   * Resetuje licznik dzienny (dla testów i nowego dnia)
   */
  public resetDailyLimit(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_DAILY_USAGE);
    } catch {}
  }

  /**
   * Sprawdza uprawnienie do wygenerowania nowej notatki przez AI (KROK 10, 11, 12)
   */
  public canCreateAiNote(): PlanGateCheckResult {
    // 1. Jeśli trwa okres próbny mock payments — każdy ma pełen dostęp do Pro
    if (this.isMockTrialActive()) {
      return {
        allowed: true,
        notesRemainingToday: 9999,
      };
    }

    // 2. Jeśli użytkownik ma wykupiony plan Pro
    if (this.getUserPlan() === 'pro') {
      return {
        allowed: true,
        notesRemainingToday: Infinity,
      };
    }

    // 3. Plan Free: limit 3 notatek na dzień
    const todayCount = this.getNotesCreatedToday();
    const limit = 3;
    const remaining = Math.max(0, limit - todayCount);

    if (todayCount >= limit) {
      return {
        allowed: false,
        requiresPro: true,
        notesRemainingToday: 0,
        reason:
          'Wykorzystano dzienny limit 3 notatek AI dla bezpłatnego planu Free. ' +
          'Limit odnawia się o północy. Przejdź na Pro (8 zł/mc), aby tworzyć nielimitowane notatki.',
      };
    }

    return {
      allowed: true,
      notesRemainingToday: remaining,
    };
  }

  /**
   * Sprawdza uprawnienie do funkcji Pro (np. Templates Library, Zaawansowane narzędzia)
   */
  public canAccessProFeature(featureName: string): PlanGateCheckResult {
    if (this.isMockTrialActive()) {
      return { allowed: true };
    }
    if (this.getUserPlan() === 'pro') {
      return { allowed: true };
    }
    return {
      allowed: false,
      requiresPro: true,
      reason: `Funkcja "${featureName}" jest dostępna w planie Pro (8 zł/mc).`,
    };
  }

  /**
   * Pełny stan subskrypcji do wyświetlenia w UI / profilu
   */
  public getSubscriptionSnapshot(): SubscriptionState {
    const isMock = this.isMockTrialActive();
    const plan = isMock ? 'pro' : this.getUserPlan();
    const todayCount = this.getNotesCreatedToday();
    const limit = plan === 'pro' || isMock ? Infinity : 3;

    // Reset timestamp: koniec dzisiejszego dnia 23:59:59.999
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return {
      planId: plan,
      planName: isMock ? 'Pro (Tymczasowy Trial)' : plan === 'pro' ? 'Pro' : 'Free',
      pricePln: plan === 'pro' ? 8 : 0,
      mockTrialActive: isMock,
      notesCreatedToday: todayCount,
      dailyNotesLimit: limit === Infinity ? 9999 : limit,
      resetTimestamp: endOfDay.getTime(),
    };
  }
}

export const subscriptionService = SubscriptionService.getInstance();
