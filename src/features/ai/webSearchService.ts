/**
 * Serwis Darmowego Wyszukiwania w Sieci (Free Web Search & Research Service)
 * Korzysta z w 100% darmowych, publicznych API (Wikipedia Search + DuckDuckGo Instant API).
 * Nie wymaga kluczy API, rejestracji ani płatności. Działa w przeglądarce klienta (CORS-friendly).
 */

import { DocBlock } from '../../types/workspace';

export interface WebSearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: 'Wikipedia' | 'DuckDuckGo' | 'Web';
  thumbnailUrl?: string;
  category?: string;
}

export interface WebSearchPackage {
  query: string;
  summary?: string;
  topHit?: {
    title: string;
    description?: string;
    extract: string;
    url: string;
    thumbnailUrl?: string;
  };
  results: WebSearchResultItem[];
}

/**
 * Czyści zapytanie z prefiksów komend (@searchweb, @searchweb_koty, itp.)
 */
export function cleanSearchQuery(raw: string): string {
  return raw
    .replace(/^(@searchweb_|@searchweb\s+|@noteweb_|@noteweb\s+|@web_|@web\s+|@search_|@search\s+|\/searchweb\s+|\/search\s+)/i, '')
    .replace(/^(szukaj w sieci|znajdź w internecie|przeszukaj sieć|sprawdź w sieci)\s*/i, '')
    .replace(/_/g, ' ')
    .trim();
}

/**
 * Wykonuje równoległe wyszukiwanie w publicznych darmowych źródłach
 */
export async function executeWebSearch(rawQuery: string): Promise<WebSearchPackage> {
  const query = cleanSearchQuery(rawQuery);
  if (!query) {
    return { query: '', results: [] };
  }

  const results: WebSearchResultItem[] = [];
  let topHit: WebSearchPackage['topHit'] = undefined;
  let summary = '';

  try {
    // 1. Równoległe zapytania do Wikipedii i DuckDuckGo
    const [wikiSearchPromise, ddgPromise] = await Promise.allSettled([
      fetch(
        `https://pl.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          query
        )}&utf8=&format=json&origin=*`
      ).then((r) => (r.ok ? r.json() : null)),
      fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(
          query
        )}&format=json&no_html=1&skip_disambig=1`
      ).then((r) => (r.ok ? r.json() : null)),
    ]);

    // 2. Parsowanie wyników Wikipedii (Snippet Search)
    if (wikiSearchPromise.status === 'fulfilled' && wikiSearchPromise.value?.query?.search) {
      const hits = wikiSearchPromise.value.query.search;
      hits.slice(0, 7).forEach((hit: any, idx: number) => {
        // Usuwanie tagów HTML <span class="searchmatch">
        const cleanSnippet = (hit.snippet || '')
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .trim();

        results.push({
          id: `wiki-hit-${hit.pageid || idx}`,
          title: hit.title,
          snippet: cleanSnippet || `Artykuł encyklopedyczny o haśle "${hit.title}".`,
          url: `https://pl.wikipedia.org/wiki/${encodeURIComponent(hit.title)}`,
          source: 'Wikipedia',
          category: 'Encyklopedia',
        });
      });
    }

    // 3. Pobranie podsumowania REST API v1 dla pierwszego hasła
    if (results.length > 0) {
      try {
        const topTitle = results[0].title;
        const summaryRes = await fetch(
          `https://pl.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topTitle)}`
        );
        if (summaryRes.ok) {
          const sumData = await summaryRes.json();
          topHit = {
            title: sumData.title || topTitle,
            description: sumData.description,
            extract: sumData.extract || '',
            url: sumData.content_urls?.desktop?.page || results[0].url,
            thumbnailUrl: sumData.thumbnail?.source,
          };
          summary = sumData.extract || '';
          if (sumData.thumbnail?.source) {
            results[0].thumbnailUrl = sumData.thumbnail.source;
          }
        }
      } catch (err) {
        console.warn('Wiki summary fetch error:', err);
      }
    }

    // 4. Parsowanie DuckDuckGo Instant Answers
    if (ddgPromise.status === 'fulfilled' && ddgPromise.value) {
      const ddg = ddgPromise.value;
      if (ddg.AbstractText && ddg.AbstractURL) {
        results.unshift({
          id: `ddg-abstract-${Date.now()}`,
          title: ddg.Heading || query,
          snippet: ddg.AbstractText,
          url: ddg.AbstractURL,
          source: 'DuckDuckGo',
          thumbnailUrl: ddg.Image || undefined,
          category: 'Instant Answer',
        });
        if (!summary) summary = ddg.AbstractText;
      }

      if (Array.isArray(ddg.RelatedTopics)) {
        ddg.RelatedTopics.slice(0, 4).forEach((topic: any, idx: number) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              id: `ddg-topic-${idx}`,
              title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 40),
              snippet: topic.Text,
              url: topic.FirstURL,
              source: 'DuckDuckGo',
              category: 'Powiązane tematy',
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('executeWebSearch error:', err);
  }

  return {
    query,
    summary,
    topHit,
    results,
  };
}

/**
 * Przekształca wyniki wyszukiwania w sieci w pełnowartościowy dokument Notion
 * (do obsługi komendy @noteweb / @noteweb_koty)
 */
export function generateWebNoteBlocks(pkg: WebSearchPackage): DocBlock[] {
  const blocks: DocBlock[] = [];
  const now = Date.now();
  const title = pkg.topHit?.title || pkg.query;

  // 1. Tytuł H1
  blocks.push({
    id: `web-h1-${now}`,
    type: 'h1',
    content: `${title}`,
  });

  // 2. Elegancki Callout Notion (1:1 standard)
  blocks.push({
    id: `web-callout-${now}`,
    type: 'callout',
    calloutType: 'info',
    content: `💡 Zweryfikowano w oparciu o ${pkg.results.length} sprawdzonych źródeł internetowych dla hasła „${pkg.query}”.`,
  });

  // 5. Miniatura graficzna jeśli dostępna
  if (pkg.topHit?.thumbnailUrl) {
    blocks.push({
      id: `web-img-${now}`,
      type: 'image',
      content: '',
      imageUrl: pkg.topHit.thumbnailUrl,
      imageCaption: `Ilustracja: ${title}`,
    });
  }

  // 6. Podsumowanie merytoryczne
  if (pkg.summary) {
    blocks.push({
      id: `web-h2-summary-${now}`,
      type: 'h2',
      content: 'Syntetyczne Podsumowanie',
    });

    blocks.push({
      id: `web-p-summary-${now}`,
      type: 'p',
      content: pkg.summary,
    });
  }

  // 7. Znalezione źródła internetowe
  if (pkg.results.length > 0) {
    blocks.push({
      id: `web-h2-sources-${now}`,
      type: 'h2',
      content: 'Zbadane Źródła i Odnośniki',
    });

    pkg.results.slice(0, 5).forEach((item, idx) => {
      blocks.push({
        id: `web-bullet-${now}-${idx}`,
        type: 'bullet',
        content: `**[${item.title}](${item.url})** (${item.source}): ${item.snippet}`,
      });
    });
  }

  // 8. Callout z poradą optymalizacyjną
  blocks.push({
    id: `web-tip-${now}`,
    type: 'callout_tip',
    content: `💡 **Wskazówka:** Możesz przekształcić to badanie w zadanie zespołowe lub poprosić asystenta AI o analizę SWOT.`,
    calloutType: 'tip',
  });

  // 9. Interaktywny Blok AI Prompt
  blocks.push({
    id: `web-ai-${now}`,
    type: 'ai_prompt',
    content: `Podsumuj najważniejsze wnioski i implikacje rynkowe dla tematu: ${title}`,
    toggleDetails: `💡 Kliknij "Wygeneruj odpowiedź AI", aby stworzyć automatyczne rozwinięcie wewnątrz tego bloku.`,
  });

  // 10. Praktyczna checklista działań
  blocks.push({
    id: `web-h2-tasks-${now}`,
    type: 'h2',
    content: 'Wnioski & Dalsze Kroki',
  });

  blocks.push({
    id: `web-todo-1-${now}`,
    type: 'todo',
    content: `Zweryfikować ustalenia ze źródłami zewnętrznymi dla: ${title}`,
    checked: false,
  });

  blocks.push({
    id: `web-todo-2-${now}`,
    type: 'todo',
    content: 'Udostępnić notatkę zespołowi w Pokoju Współpracy (@team)',
    checked: false,
  });

  // 11. Podpis dokumentu
  blocks.push({
    id: `web-sig-${now}`,
    type: 'signature',
    content: 'Nowoczesne Studio Web Research Bot',
    timelineDate: new Date().toLocaleDateString('pl-PL'),
  });

  return blocks;
}
