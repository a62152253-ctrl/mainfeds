/**
 * Serwis integracji z polską Wikipedią.
 * Pobiera artykuł, streszczenie i powiązane obrazy, a następnie tworzy bloki DocBlock.
 * Korzysta z publicznego API Wikipedii; nie wymaga klucza API.
 * Zachowuje dotychczasowe eksporty i kształt wyniku, żeby nie psuć integracji.
 * Gdy część endpointów zawiedzie, wykorzystuje dostępne dane zamiast przerywać całą operację.
 * Jeśli nie ma ani treści, ani ilustracji, zwraca null zamiast generować pustą notatkę.
 */

import { DocBlock } from '../../types/workspace';
import { isSafeImage, isNsfwImage } from '../../utils/contentFilter';

export interface WikipediaImageItem {
  title: string;
  url: string;
  mime?: string;
  caption?: string;
}

export interface WikipediaArticleResult {
  ok?: boolean;
  title: string;
  description?: string;
  extract: string;
  url: string;
  thumbnailUrl?: string;
  images?: WikipediaImageItem[];
  blocks: DocBlock[];
  suggestedBlocks?: DocBlock[];
  sections?: { title: string; content: string }[];
}

type WikiPage = {
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
  imageinfo?: { url?: string; mime?: string }[];
};

const WIKIPEDIA_API = 'https://pl.wikipedia.org/w/api.php';
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_IMAGES = 10;

// Limit obrazu i timeout są stałe, żeby żądania nie wisiały bez końca.
// Nie wymuszamy minimalnej liczby wyników ani sekcji — używamy tylko danych ze źródła.

/**
 * Normalizuje polecenia w rodzaju „@wiki Warszawa” do samego zapytania.
 * Ograniczenie długości chroni przed przypadkowym wklejeniem całych dokumentów.
 */
function normalizeWikipediaQuery(query: string): string {
  if (typeof query !== 'string') return '';
  return query
    .replace(/^(@wiki|@note|stwórz notatkę o|napisz notatkę o|artykuł o|notatka o)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

/** Obsługuje typowy obiekt `query.pages` oraz tablicę, gdyby format odpowiedzi się zmienił. */
function getWikiPages(data: any): WikiPage[] {
  const pages = data?.query?.pages;
  if (Array.isArray(pages)) return pages as WikiPage[];
  if (pages && typeof pages === 'object') return Object.values(pages) as WikiPage[];
  return [];
}

/** Rozdziela tekst MediaWiki na wprowadzenie i sekcje, nie tworząc pustych sekcji. */
function parseWikipediaSections(sourceText: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  if (!sourceText.trim()) return sections;

  let currentTitle = 'Wprowadzenie';
  let currentLines: string[] = [];
  const flushSection = () => {
    const content = currentLines.join('\n').trim();
    if (content) sections.push({ title: currentTitle, content });
  };

  for (const line of sourceText.split('\n')) {
    const heading = line.match(/^={2,}\s*(.*?)\s*={2,}\s*$/);
    if (heading) {
      flushSection();
      currentTitle = heading[1].trim();
      currentLines = [];
    } else if (line.trim()) {
      currentLines.push(line.trim());
    }
  }
  flushSection();
  return sections;
}

/** Odfiltrowuje formaty, które nie są obsługiwane przez obecny widok obrazów. */
function isSupportedImageMime(mime?: string): boolean {
  return mime === 'image/jpeg' || mime === 'image/png' || mime === 'image/webp';
}

/** Nie dodawaj małych elementów interfejsu jako ilustracji do notatki. */
function isDecorativeImageTitle(title: string): boolean {
  const normalizedTitle = title.toLocaleLowerCase('pl-PL');
  const decorativeTerms = ['logo', 'disambig', 'commons-logo', 'crystal', 'icon'];
  return decorativeTerms.some((term) => normalizedTitle.includes(term));
}

/** Czyści nazwę pliku do czytelnego podpisu grafiki. */
function getImageCaption(fileTitle: string): string {
  return fileTitle
    .replace(/^(plik|file):/i, '')
    .replace(/\.[^.]+$/, '')
    .replace(/_/g, ' ')
    .trim();
}

/** Wspólny, ograniczony czasowo odczyt JSON — awaria jednego endpointu nie blokuje notatki. */
async function fetchJson(url: string): Promise<any | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function apiUrl(params: Record<string, string>): string {
  const query = new URLSearchParams({ ...params, format: 'json', origin: '*' });
  return `${WIKIPEDIA_API}?${query.toString()}`;
}

/**
 * Szuka artykułu w polskiej Wikipedii i przygotowuje z niego notatkę.
 * Zwraca null, gdy zapytanie jest puste albo nie uda się pobrać żadnej treści.
 */
export async function fetchWikipediaArticle(query: string): Promise<WikipediaArticleResult | null> {
  const cleanQuery = normalizeWikipediaQuery(query);

  if (!cleanQuery) return null;

  try {
    // 1. Znajdź najbardziej pasujący tytuł. Przy braku wyników sprawdź podany tytuł bezpośrednio.
    const searchData = await fetchJson(apiUrl({
      action: 'query',
      list: 'search',
      srsearch: cleanQuery,
      srlimit: '1',
    }));
    const topHit = searchData?.query?.search?.[0];
    const resolvedTitle = typeof topHit?.title === 'string' ? topHit.title : cleanQuery;
    const encodedTitle = encodeURIComponent(resolvedTitle);

    // 2. Pobierz streszczenie, pełny tekst z nagłówkami oraz obrazy niezależnie.
    const summaryUrl = `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;
    const fullUrl = apiUrl({
      action: 'query',
      prop: 'extracts|pageimages',
      explaintext: '1',
      exsectionformat: 'wiki',
      titles: resolvedTitle,
      pithumbsize: '1000',
    });
    const imagesUrl = apiUrl({
      action: 'query',
      generator: 'images',
      titles: resolvedTitle,
      gimlimit: String(MAX_IMAGES),
      prop: 'imageinfo',
      iiprop: 'url|mime',
    });

    const [summaryData, fullData, imagesData] = await Promise.all([
      fetchJson(summaryUrl),
      fetchJson(fullUrl),
      fetchJson(imagesUrl),
    ]);

    const title = String(summaryData?.title || resolvedTitle);
    const description = String(summaryData?.description || 'Artykuł z polskiej Wikipedii');
    const shortExtract = typeof summaryData?.extract === 'string' ? summaryData.extract : '';
    const pageUrl = String(
      summaryData?.content_urls?.desktop?.page ||
      `https://pl.wikipedia.org/wiki/${encodedTitle}`
    );

    const articlePages = getWikiPages(fullData);
    const articlePage = articlePages.find((page) =>
      page.title === title || page.title === resolvedTitle
    ) || articlePages[0];
    const fullExtract = typeof articlePage?.extract === 'string' ? articlePage.extract : '';
    const thumbnailUrl = summaryData?.thumbnail?.source || articlePage?.thumbnail?.source;
    const extract = fullExtract.trim() || shortExtract.trim();

    // Jeśli żaden endpoint nie oddał treści, nie twórz pustej lub pozornej notatki.
    if (!extract && !thumbnailUrl) return null;

    // 3. Parsuj sekcje tekstu zwracanego przez MediaWiki w formacie wiki.
    const sections = parseWikipediaSections(fullExtract);

    // 4. Zbierz prawdziwe adresy grafik z rygorystycznym filtrem NSFW / 18+
    const images: WikipediaImageItem[] = [];
    const addImage = (image: WikipediaImageItem) => {
      if (!image.url || images.some((existing) => existing.url === image.url)) return;
      // Bezpieczeństwo: bezwzględne odrzucenie grafik NSFW, nagości, bodypaintingu itp.
      if (!isSafeImage(image.url, image.title, image.caption)) return;
      images.push(image);
    };

    if (thumbnailUrl && isSafeImage(thumbnailUrl, title, `Ilustracja główna: ${title}`)) {
      addImage({
        title,
        url: thumbnailUrl,
        caption: `Ilustracja główna: ${title}`,
      });
    }

    const candidatePages = getWikiPages(imagesData);

    for (const page of candidatePages) {
      const info = page.imageinfo?.[0];
      const fileTitle = page.title || '';
      if (!info?.url || !isSupportedImageMime(info.mime) || isDecorativeImageTitle(fileTitle)) continue;
      const caption = getImageCaption(fileTitle);
      // Sprawdź czy nazwa pliku lub caption nie zawiera treści NSFW
      if (isNsfwImage({ url: info.url, title: fileTitle, caption })) continue;
      addImage({ title: caption, url: info.url, caption, mime: info.mime });
      if (images.length >= MAX_IMAGES) break;
    }

    // 5. Stwórz bloki na podstawie pobranej treści, nie samego streszczenia, gdy mamy pełny tekst.
    const intro = sections.find((section) => section.title === 'Wprowadzenie')?.content || shortExtract || extract;
    const blocks = convertToNotionBlocks(title, description, intro, thumbnailUrl, pageUrl, sections, images);

    return {
      ok: true,
      title,
      description,
      extract,
      url: pageUrl,
      thumbnailUrl,
      images,
      sections,
      blocks,
      suggestedBlocks: blocks,
    };
  } catch (err) {
    console.warn('Wikipedia API fetch error:', err);
    return null;
  }
}

/** Alias dla zachowania wstecznej kompatybilności z wcześniejszymi modułami. */
export const searchWikipedia = fetchWikipediaArticle;

/** Przekształca pobrany tekst Wikipedii w bloki dokumentu. */
function convertToNotionBlocks(
  title: string,
  description: string,
  extract: string,
  thumbnailUrl?: string,
  sourceUrl?: string,
  sections?: { title: string; content: string }[],
  images?: WikipediaImageItem[]
): DocBlock[] {
  const blocks: DocBlock[] = [];
  const idPrefix = `wiki-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let blockIndex = 0;
  const nextId = (label: string) => `${idPrefix}-${label}-${blockIndex++}`;

  blocks.push({ id: nextId('h1'), type: 'h1', content: title });

  if (description) {
    blocks.push({
      id: nextId('callout'),
      type: 'callout',
      calloutType: 'info',
      content: `💡 ${description}`,
    });
  }

  const mainImg = thumbnailUrl || images?.[0]?.url;
  if (mainImg) {
    blocks.push({
      id: nextId('img'),
      type: 'image',
      content: '',
      imageUrl: mainImg,
      imageCaption: `Ilustracja do hasła „${title}”`,
    });
  }

  // Zachowuj akapity ze źródła i nie dodawaj pustych bloków.
  const paragraphs = extract.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  for (const paragraph of paragraphs.slice(0, 3)) {
    blocks.push({ id: nextId('p'), type: 'p', content: paragraph });
  }

  // Wprowadzenie jest już dodane wyżej — resztę sekcji umieść pod własnymi nagłówkami.
  const contentSections = (sections || []).filter(
    (section) => section.title !== 'Wprowadzenie' && section.content.trim()
  );
  contentSections.slice(0, 4).forEach((section, sectionIndex) => {
    blocks.push({ id: nextId('h2'), type: 'h2', content: section.title });
    const sectionParagraphs = section.content
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    sectionParagraphs.slice(0, 2).forEach((paragraph) => {
      blocks.push({ id: nextId('section-p'), type: 'p', content: paragraph });
    });

    const extraImage = images?.[sectionIndex + 1];
    if (extraImage && extraImage.url !== mainImg) {
      blocks.push({
        id: nextId('section-img'),
        type: 'image',
        content: '',
        imageUrl: extraImage.url,
        imageCaption: extraImage.caption || section.title,
      });
    }
  });

  blocks.push({ id: nextId('divider'), type: 'divider', content: '' });
  blocks.push({ id: nextId('key-heading'), type: 'h2', content: '📌 Kluczowe informacje' });
  blocks.push({
    id: nextId('topic'),
    type: 'bullet',
    content: `**Temat**: ${description}`,
  });
  if (sourceUrl) {
    blocks.push({
      id: nextId('source'),
      type: 'bullet',
      content: `**Źródło**: [Otwórz artykuł w Wikipedii](${sourceUrl})`,
    });
  }
  blocks.push({
    id: nextId('tip'),
    type: 'callout_tip',
    content: `Możesz rozwinąć notatkę o własne wnioski dotyczące tematu „${title}”.`,
  });

  return blocks;
}
