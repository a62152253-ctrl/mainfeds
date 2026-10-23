/**
 * Content Classifier & Moderation Engine for Global Searches
 * KROK 4: Dwa tryby (Public vs My Searches), deduplikacja i ochrona prywatności
 */

import { SearchPrivacyMode } from './types';

// Polish and common profanities check
const VULGAR_PATTERNS = [
  /kurw/i,
  /chuj/i,
  /jeba/i,
  /pierd/i,
  /cip/i,
  /pizd/i,
  /huj/i,
  /suka/i,
  /fuck/i,
  /shit/i,
  /bitch/i,
];

// Sensitive private patterns (emails, tokens, passwords, private notes)
const SENSITIVE_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // email
  /\b(?:hasło|hasła|hasla|password|token|api_key|secret)\b/i,
  /\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/, // phone number
  /\b\d{11}\b/, // PESEL
  /moje\s+(notatki|pliki|hasła|hasla|dane|rachunki|bazy|hasło)/i,
  /prywatn[yea]/i,
];

export interface ClassificationResult {
  recommendedMode: SearchPrivacyMode;
  isPublicEligible: boolean;
  rejectReason?: string;
  canonicalTopic: string;
  canonicalSlug: string;
  category: 'Nauka' | 'Technologia' | 'Biznes' | 'Kultura' | 'Natura' | 'Ogólne';
}

/**
 * Normalizuje tekst do slug (np. "Koty Domowe!" -> "koty-domowe")
 */
export function slugifyTopic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (match) => {
      const map: Record<string, string> = {
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
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Klasyfikuje zapytanie do odpowiedniego trybu i wyciąga kanoniczny temat
 */
export function classifySearchQuery(rawQuery: string, requestedMode?: SearchPrivacyMode): ClassificationResult {
  const query = rawQuery.trim();

  // 1. Sprawdź obecność danych poufnych (Strict Zero Leak)
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(query)) {
      return {
        recommendedMode: 'my_searches',
        isPublicEligible: false,
        rejectReason: 'Zapytanie zawiera dane prywatne, identyfikatory lub wrażliwe frazy.',
        canonicalTopic: 'Zapytanie prywatne',
        canonicalSlug: `private-${Date.now()}`,
        category: 'Ogólne',
      };
    }
  }

  // 2. Sprawdź obecność wulgaryzmów / slangu
  const containsVulgarity = VULGAR_PATTERNS.some((pattern) => pattern.test(query));
  if (containsVulgarity) {
    return {
      recommendedMode: 'my_searches',
      isPublicEligible: false,
      rejectReason: 'Zawiera język potoczny lub wulgaryzmy (dozwolone w My Searches, zablokowane w Public).',
      canonicalTopic: query.slice(0, 40),
      canonicalSlug: slugifyTopic(query) || `query-${Date.now()}`,
      category: 'Ogólne',
    };
  }

  // 3. Wykryj kategorię tematyczną
  let category: ClassificationResult['category'] = 'Ogólne';
  const lower = query.toLowerCase();

  if (/(kod|programow|react|javascript|python|ai|sztuczna inteligencja|api|sql|baza danych|komputer)/i.test(lower)) {
    category = 'Technologia';
  } else if (/(fizyk|biolog|chemic|kosmos|matematyk|medycyn|nauka|atom|kwant)/i.test(lower)) {
    category = 'Nauka';
  } else if (/(biznes|startup|marketing|przychód|inwestycj|finans|rynek|firma|sprzedaż)/i.test(lower)) {
    category = 'Biznes';
  } else if (/(histori|film|muzyk|sztuka|literatur|książk|język|kultur)/i.test(lower)) {
    category = 'Kultura';
  } else if (/(kot|pies|zwierz|las|ptak|roślin|przyrod|ocean|klimat)/i.test(lower)) {
    category = 'Natura';
  }

  // 4. Standaryzacja kanonicznego tematu
  let canonicalTopic = query;
  // Usuń zbędne pytania typu "co to jest", "jak działa"
  canonicalTopic = canonicalTopic
    .replace(/^(co to jest|czym jest|jak działa|wyjaśnij|powiedz mi o|informacje o|wyszukaj|zbadaj)\s+/i, '')
    .trim();

  if (canonicalTopic.length > 0) {
    canonicalTopic = canonicalTopic.charAt(0).toUpperCase() + canonicalTopic.slice(1);
  } else {
    canonicalTopic = query;
  }

  const canonicalSlug = slugifyTopic(canonicalTopic);

  // Jeśli użytkownik prosił o my_searches, szanujemy jego wybór prywatności
  const finalMode = requestedMode === 'my_searches' ? 'my_searches' : 'public';

  return {
    recommendedMode: finalMode,
    isPublicEligible: true,
    canonicalTopic,
    canonicalSlug,
    category,
  };
}
