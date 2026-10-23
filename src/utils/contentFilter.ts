// Enterprise-grade profanity and toxicity content filter
// Handles inflections, prefixes, suffixes, ambiguous leetspeak ('!' -> 'b'/'i', '1' -> 'i'/'l'/none),
// character squashing ('k0orwa' -> 'kurwa'/'korwa'), separator evasion ('k.u.r.w.a', 'hu_1_j'),
// and spaced evasion ('k u r w a')

const PROFANE_ROOTS: string[] = [
  // Polish roots
  'kurw',
  'korw',
  'chuj',
  'huj',
  'jeb',
  'jebal',
  'jebat',
  'jebac',
  'jebie',
  'jebani',
  'jeban',
  'pierdol',
  'pierdziel',
  'pizd',
  'srac',
  'sracz',
  'srak',
  'gown',
  'cip',
  'dup',
  'sukinsyn',
  'suko',
  'suki',
  'kutas',
  'pedal',
  'cwel',
  'wkurw',
  'zajeb',
  'odpierd',
  'wypierd',
  'przejeb',
  'dojeb',
  'zjeb',
  'rozjeb',
  'ujeb',
  'podjeb',
  'spierdol',
  'opierdol',
  'napierdol',
  'jebaka',
  'matkojeb',

  // English & explicit terms
  'sex',
  'seks',
  'fuck',
  'fuk',
  'fck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'pussy',
  'cunt',
  'whore',
  'slut',
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'porn',
];

/**
 * Checks if a single word or compact sequence matches any profane pattern
 * using multi-variant normalization (leetspeak, deduplication, symbol replacements)
 */
function isTokenProfane(rawWord: string): boolean {
  if (!rawWord || rawWord.includes('###')) return false;

  const base = rawWord
    .toLowerCase()
    .replace(/[ą]/g, 'a')
    .replace(/[ć]/g, 'c')
    .replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l')
    .replace(/[ń]/g, 'n')
    .replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's')
    .replace(/[źż]/g, 'z');

  const variants = new Set<string>();

  // 1. Direct latin letters only
  variants.add(base.replace(/[^a-z]/g, ''));

  // 2. Ambiguity resolution:
  // '!' is frequently used for 'b' (e.g. je!ac -> jebac) or 'i' (sh!t -> shit)
  // '1' is used for 'i', 'l', or numeric obfuscation (hu1j -> huj)
  // '0' is 'o' or 'u' (k0orwa -> korwa)
  // 'v' is 'u' (kvrwa -> kurwa)
  const leetVariations = [
    // Variation A: ! -> b, 1 -> dropped
    base.replace(/!/g, 'b').replace(/1/g, '').replace(/0/g, 'o').replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/v/g, 'u').replace(/[$5]/g, 's').replace(/[+7]/g, 't'),
    // Variation B: ! -> i, 1 -> i
    base.replace(/!/g, 'i').replace(/1/g, 'i').replace(/0/g, 'o').replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/v/g, 'u').replace(/[$5]/g, 's').replace(/[+7]/g, 't'),
    // Variation C: ! -> b, 1 -> i
    base.replace(/!/g, 'b').replace(/1/g, 'i').replace(/0/g, 'o').replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/v/g, 'u').replace(/[$5]/g, 's').replace(/[+7]/g, 't'),
    // Variation D: numeric drop
    base.replace(/[0-9]/g, '').replace(/[^a-z]/g, ''),
  ];

  for (const lv of leetVariations) {
    const clean = lv.replace(/[^a-z]/g, '');
    variants.add(clean);
    // Also add deduplicated repeats (e.g. "koooorwa" -> "korwa", "fuuuuck" -> "fuck")
    variants.add(clean.replace(/(.)\1+/g, '$1'));
    // Normalize 'o' to 'u' for Polish sounds (e.g. "korwa" -> "kurwa")
    variants.add(clean.replace(/o/g, 'u'));
    variants.add(clean.replace(/(.)\1+/g, '$1').replace(/o/g, 'u'));
  }

  for (const variant of variants) {
    if (!variant || variant.length < 3) continue;
    for (const root of PROFANE_ROOTS) {
      if (variant.includes(root)) {
        return true;
      }
    }
  }

  return false;
}

// Comprehensive list of adult/NSFW domains, keywords and malicious schemes to block across the editor
const BLOCKED_URL_KEYWORDS = [
  'pornhub',
  'xvideos',
  'xnxx',
  'redtube',
  'youporn',
  'brazzers',
  'xhamster',
  'onlyfans',
  'chaturbate',
  'stripchat',
  'livejasmin',
  'beeg',
  'eporner',
  'tube8',
  'spankbang',
  'nhentai',
  'rule34',
  'bangbros',
  'faphouse',
  'cam4',
  'camsoda',
  'bongacams',
  'fansly',
  'heavy-r',
  'bestgore',
  'motherless',
  'tnaflix',
  'keezmovies',
  'redgifs',
  'erome',
  'hqporner',
  'daftsex',
  'thumbzilla',
  'nuvid',
  'txxx',
  'adultfriendfinder',
  'fetlife',
  'spankwire',
  'drfap',
  'eporn',
  'tube9',
  'porntube',
  'pornbox',
  'camwhores',
  'fapster',
];

/**
 * Słowa kluczowe i wzorce rozpoznające obrazy i multimedia o charakterze NSFW, 18+, pornograficznym,
 * erotycznym, nagości, bodypaintingu oraz aktów (np. niepożądane pliki z Wikimedia Commons).
 */
export const NSFW_IMAGE_KEYWORDS: readonly string[] = [
  'nude',
  'nudity',
  'naked',
  'erotic',
  'erotica',
  'erotique',
  'erotismo',
  'bodypaint',
  'bodypainting',
  'body_painting',
  'topless',
  'breast',
  'breasts',
  'boob',
  'boobs',
  'nipple',
  'nipples',
  'penis',
  'vagina',
  'genital',
  'genitalia',
  'porn',
  'porno',
  'pornography',
  'xxx',
  'nsfw',
  'hentai',
  'striptease',
  'stripper',
  'playboy',
  'penthouse',
  'lingerie',
  'fetish',
  'bdsm',
  'intercourse',
  'sexual',
  'dildo',
  'masturbation',
  'desnudo',
  'desnuda',
  'nue',
  'akt_kobiecy',
  'akt_męski',
  'akt_meski',
  'nagość',
  'nagosc',
  'cycki',
  'kutas',
  'cipka',
  'pochwa',
  'glamour_nude',
  'mature_nude',
  'topless_model',
  'uncensored',
  'adult_content',
  'hardcore',
  'softcore',
  'ecchi',
  'lewd',
  'bukkake',
  'blowjob',
  'cunnilingus',
  'fellatio',
  'orgasm',
  'erotic_art',
  'nude_model',
  'naked_woman',
  'naked_man',
];

const BLOCKED_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application',
];

/**
 * Checks if a given URL or domain belongs to a blocked adult, NSFW or malicious website
 */
export function isBlockedUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const clean = rawUrl.trim().toLowerCase();
  if (!clean) return false;

  // 1. Dangerous protocols
  for (const scheme of BLOCKED_SCHEMES) {
    if (clean.startsWith(scheme)) return true;
  }

  // 2. Direct keyword in URL string (e.g. "https://pornhub.pl", "https://pornhub", "pornhub.com", "onlyfans.com")
  for (const keyword of BLOCKED_URL_KEYWORDS) {
    if (clean.includes(keyword)) {
      return true;
    }
  }

  // 3. Regex checks for generic pornographic patterns in hostname/path
  if (/(\b|\.|\/|@|_|-)(porn|porno|xxx|erotyk|erotyka|hentai)(\b|\.|\/|_|-|$)/i.test(clean)) {
    return true;
  }

  // 4. Hostname extraction if protocol present or structure matches domain
  try {
    const candidate = clean.startsWith('http://') || clean.startsWith('https://')
      ? clean
      : `https://${clean}`;
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    for (const keyword of BLOCKED_URL_KEYWORDS) {
      if (host.includes(keyword)) {
        return true;
      }
    }
    if (/(\b|\.|\/)(porn|porno|xxx|hentai)(\b|\.|\/|$)/i.test(host)) {
      return true;
    }
  } catch {
    // ignore parse error for incomplete inputs
  }

  return false;
}

/**
 * Replaces any blocked adult URLs found inside a body of text with [ZABLOKOWANY LINK 18+]
 */
export function filterBlockedUrlsInText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/gi, (match) => {
    if (isBlockedUrl(match)) {
      return '[ZABLOKOWANY LINK 18+]';
    }
    return match;
  });
}

/**
 * Filter text and replace every detected profanity or compound vulgar expression with ###
 * and blocked 18+ URLs with [ZABLOKOWANY LINK 18+]
 */
export function filterSwearWords(input: string): string {
  if (!input || typeof input !== 'string') return input;

  // First filter any adult URLs
  let text = filterBlockedUrlsInText(input);

  // 1. If an existing token already contains part of ### like '###ac', fix it to '###'
  text = text.replace(/#{3,}[a-ząćęłńóśźż0-9]*/gi, '###');

  // 2. Tokenize by whitespace and punctuation boundaries
  const tokens = text.split(/(\s+)/);
  const filteredTokens = tokens.map((token) => {
    if (!token.trim() || token.trim() === '###' || token.trim() === '[ZABLOKOWANY LINK 18+]') return token;

    if (isTokenProfane(token)) {
      return '###';
    }

    return token;
  });

  let sanitized = filteredTokens.join('');

  // 3. Spaced letters pass: e.g. "k u r w a" or "c h u j" or "s e x"
  sanitized = sanitized.replace(/\b([a-ząćęłńóśźż0-9!@$])\s+([a-ząćęłńóśźż0-9!@$])\s+([a-ząćęłńóśźż0-9!@$])(\s+([a-ząćęłńóśźż0-9!@$]))*\b/gi, (match) => {
    const compact = match.replace(/\s+/g, '');
    if (isTokenProfane(compact)) {
      return '###';
    }
    return match;
  });

  return sanitized;
}

/**
 * Helper to check if a string contains any profanities
 */
export function hasProfanity(input: string): boolean {
  if (!input) return false;
  return filterSwearWords(input) !== input;
}

export interface ImageSafetyMeta {
  url?: string;
  title?: string;
  caption?: string;
  description?: string;
  categories?: string[];
}

/**
 * Sprawdza, czy nazwa pliku, podpis, URL lub metadane obrazu wskazują na treść NSFW,
 * 18+, nagość, pornografię lub bodypainting (np. niepożądane grafiki z Wikimedia Commons).
 */
export function isNsfwImage(meta: ImageSafetyMeta | string | undefined | null): boolean {
  if (!meta) return false;

  const url = typeof meta === 'string' ? meta : meta.url || '';
  const title = typeof meta === 'string' ? '' : meta.title || '';
  const caption = typeof meta === 'string' ? '' : meta.caption || '';
  const description = typeof meta === 'string' ? '' : meta.description || '';
  const categories = (typeof meta === 'object' && meta && Array.isArray(meta.categories)) ? meta.categories.join(' ') : '';

  // 1. Sprawdź, czy sam URL nie jest na liście zablokowanych domen 18+
  if (url && isBlockedUrl(url)) {
    return true;
  }

  // 2. Połącz wszystkie teksty i znormalizuj do porównania
  let combined = `${url} ${title} ${caption} ${description} ${categories}`.toLowerCase();

  // Zdekoduj ewentualne URL encodings (%20 -> spacja, %2f itp.)
  try {
    combined = decodeURIComponent(combined);
  } catch {
    // jeśli zniekształcony URI, sprawdzamy wersję surową
  }

  // Znormalizuj znaki specjalne na spacje/podkreślenia
  const normalized = combined
    .replace(/[ą]/g, 'a')
    .replace(/[ć]/g, 'c')
    .replace(/[ę]/g, 'e')
    .replace(/[ł]/g, 'l')
    .replace(/[ń]/g, 'n')
    .replace(/[ó]/g, 'o')
    .replace(/[ś]/g, 's')
    .replace(/[źż]/g, 'z')
    .replace(/[-_./\\+:]/g, ' ');

  // 3. Sprawdź słowa kluczowe
  for (const keyword of NSFW_IMAGE_KEYWORDS) {
    const cleanKeyword = keyword.replace(/[-_]/g, ' ');
    // Sprawdzenie jako całe słowo lub część nazwy pliku
    const wordPattern = new RegExp(`(^|\\s|[^a-z0-9])${cleanKeyword}($|\\s|[^a-z0-9])`, 'i');
    if (wordPattern.test(normalized) || normalized.includes(cleanKeyword)) {
      return true;
    }
  }

  // 4. Specjalne reguły dla Wikimedia Commons:
  // Pliki z "bodypaint", "topless", "naked", "nude art"
  if (/(bodypaint|body_paint|topless|naked|nude|erotic|sensual)/i.test(combined)) {
    return true;
  }

  return false;
}

/**
 * Sprawdza, czy obraz jest w pełni bezpieczny (Safe For Work):
 * Posiada poprawny protokół HTTP/HTTPS oraz nie zawiera żadnych znamion treści NSFW/18+.
 */
export function isSafeImage(
  url?: string | null,
  title?: string | null,
  caption?: string | null,
  description?: string | null
): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://') && !cleanUrl.startsWith('data:image/')) {
    return false;
  }
  return !isNsfwImage({
    url: cleanUrl,
    title: title || undefined,
    caption: caption || undefined,
    description: description || undefined,
  });
}

