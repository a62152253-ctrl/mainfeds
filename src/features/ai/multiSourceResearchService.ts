/**
 * Serwis Wieloźródłowego Badania i Weryfikacji AI (9+ Real Sources + Block Tag Engine)
 * Silnik wieloźródłowego researchu · dynamiczne notatki oparte na rzeczywiście pobranych danych
 *
 * Przeszukuje równolegle do 11 prawdziwych, darmowych, publicznych źródeł (0 PLN kosztu nawet przy 50 000+ użytkownikach):
 * 1. Wikipedia PL REST/Action API (pl.wikipedia.org) — polski kontekst encyklopedyczny
 * 2. Wikipedia EN Action API (en.wikipedia.org) — globalna baza wiedzy
 * 3. ISAP / Sejm RP ELI API (api.sejm.gov.pl / isap.sejm.gov.pl) — polskie prawo, ustawy i rozporządzenia (Gov)
 * 4. Stack Exchange / StackOverflow API (api.stackexchange.com) — programowanie, inżynieria i rozwiązania IT
 * 5. NPM Registry API (registry.npmjs.org) — pakiety, biblioteki i dokumentacja JavaScript/TypeScript
 * 6. Europe PMC Biomedical API (ebi.ac.uk / europepmc.org) — medycyna, biologia, zdrowie i nauki przyrodnicze
 * 7. OpenAlex Academic Works API (openalex.org) — publikacje naukowe, recenzowane badania, DOI, cytowania
 * 8. Crossref Registry (crossref.org / doi.org) — oficjalny rejestr publikacji i metadanych
 * 9. Semantic Scholar Graph API (semanticscholar.org) — literatura naukowa i komputerowa
 * 10. Wikidata Knowledge Graph (wikidata.org) — rekordy encji i identyfikatory semantyczne
 * 11. DuckDuckGo Instant Answers & OpenLibrary (duckduckgo.com / openlibrary.org) — otwarty web i literatura
 */

import { DocBlock } from '../../types/workspace';
import { fetchWikipediaArticle, WikipediaArticleResult } from './wikipediaService';
import { isSafeImage } from '../../utils/contentFilter';
import {
  composeDynamicBlockTagStream,
  parseAiBlockTagsToBlocks,
  buildAiBlockTagSystemPrompt,
  hasAiBlockTags,
} from './blockTagParser';

export type ResearchDepth = 'quick_note' | 'fact_check' | 'deep_research';

export type NoteStyleOption =
  | 'comprehensive'
  | 'practical'
  | 'visual_study'
  | 'executive'
  | 'school_student'
  | 'scientific_paper'
  | 'comparison_matrix'
  | 'historical_timeline'
  | 'personal_minimal';

export type NoteFocusOption =
  | 'highlights'
  | 'diagrams_tables'
  | 'swot_risks'
  | 'action_plan'
  | 'definitions_formulas'
  | 'dates_events'
  | 'pros_cons';

export interface ResearchOptions {
  depth?: ResearchDepth;
  style?: NoteStyleOption;
  focus?: NoteFocusOption;
  detailLevel?: 'concise' | 'standard' | 'exhaustive';
  includeMedia?: boolean;
  includeQuestions?: boolean;
}

export interface VerifiedSource {
  id: string;
  name: string;
  domain: string;
  url: string;
  authorOrPublisher?: string;
  publishDate?: string;
  snippet: string;
  confidence: number;
}

export interface CrossCheckFinding {
  claim: string;
  status: 'verified_consensus' | 'partial_evidence' | 'contradiction_detected';
  confirmedByDomains: string[];
  notes: string;
}

export interface MultiSourceResearchResult {
  query: string;
  resolvedTitle: string;
  summary: string;
  keyTakeaway: string;
  sourcesCount: number;
  uniqueDomainsCount: number;
  sources: VerifiedSource[];
  findings: CrossCheckFinding[];
  thumbnailUrl?: string;
  blocks: DocBlock[];
  depthUsed: ResearchDepth;
}

/**
 * Bezpieczny fetch z limitem czasu (AbortController)
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6500): Promise<Response> {
  const controller = new AbortController();
  const timeout = Math.max(250, Math.min(timeoutMs, 15000));
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, application/ld+json, text/plain, */*',
        ...(options.headers || {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Wyciąga czystą domenę (host) z dowolnego adresu URL
 */
export function extractDomain(urlStr?: string): string {
  if (!urlStr || typeof urlStr !== 'string') return '';
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Czyści zapytanie użytkownika z prefiksów i zwrotów konwersacyjnych w języku polskim
 */
export function cleanResearchQuery(raw: string): string {
  let cleaned = raw
    .replace(
      /^(@deepresearch\s*|@deepresearch_|@research\s*|@research_|@analyze\s*|@analyze_|@zbadaj\s*|@zbadaj_|@noteweb\s*|@noteweb_|@note\s*|@wiki\s*|@doc\s*|\/deepresearch\s*|\/research\s*|\/analyze\s*|\/noteweb\s*|\/note\s*)/i,
      ''
    )
    .replace(
      /^(?:proszę o|prosze o|chcę|chce|stwórz mi|stworz mi|przygotuj mi|zrób mi|zrob mi|dodaj mi)\s+/i,
      ''
    )
    .replace(
      /^(?:zbadaj w sieci i stwórz notatkę|zbadaj w sieci|zbadaj wieloźródłowo|zbadaj temat|zbadaj|przeanalizuj ten temat i przygotuj szczegółowe opracowanie|przeanalizuj temat|przeanalizuj|zanalizuj|analizuj|analyze|zbadaj rynek i porównaj konkurencję|przygotuj opracowanie|stwórz nową notatkę|stworz nowa notatke|stwórz notatkę|stworz notatke|stwurz notatke|zrup notatke|utwórz notatkę|utworz notatke|napisz notatkę|napisz notatke|zrób notatkę|zrob notatke|dodaj notatkę|dodaj notatke|nowa notatka|notatka|badanie|opracuj)\s*(?:o|i|dla|dotyczącą|dotyczaca|ze|z|na temat|:|-)?\s*/i,
      ''
    )
    .replace(/_/g, ' ')
    .replace(/["'„”«»]/g, '')
    .trim();

  cleaned = cleaned.replace(/^(?:o|i|dotyczącą|dotyczaca|dla|na temat)\s+/i, '').trim();

  const lower = cleaned.toLowerCase();
  const polishMappings: Record<string, string> = {
    'psach': 'Pies',
    'pies': 'Pies',
    'psy': 'Psy',
    'kotach': 'Kot domowy',
    'kot': 'Kot domowy',
    'koty': 'Koty',
    'koniach': 'Koń',
    'koniu': 'Koń',
    'ptakach': 'Ptaki',
    'rybach': 'Ryby',
    'dinozaurach': 'Dinozaury',
    'samochodach': 'Samochody elektryczne i motoryzacja',
    'polsce': 'Polska',
    'historii polski': 'Historia Polski',
    'warszawie': 'Warszawa',
    'krakowie': 'Kraków',
    'sztucznej inteligencji': 'Sztuczna inteligencja',
    'uczeniu maszynowym': 'Uczenie maszynowe',
  };

  if (polishMappings[lower]) {
    return polishMappings[lower];
  }

  if (lower.endsWith('ach') && lower.length > 5) {
    const stem = cleaned.slice(0, -3);
    return stem.charAt(0).toUpperCase() + stem.slice(1) + 'y';
  }

  if (cleaned.length > 0) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * 1. Źródło Akademickie: OpenAlex Works API (openalex.org)
 */
async function fetchOpenAlexSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=3`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const data = await res.json();
    if (Array.isArray(data.results)) {
      data.results.forEach((work: any, idx: number) => {
        const title = work.title || work.display_name;
        if (!title) return;
        const doiUrl = isSafeHttpUrl(work.doi) ? work.doi : `https://openalex.org/${String(work.id || '').split('/').pop() || ''}`;
        const authors = (work.authorships || [])
          .slice(0, 3)
          .map((a: any) => a.author?.display_name)
          .filter(Boolean)
          .join(', ');
        const year = work.publication_year ? String(work.publication_year) : '';
        const snippet =
          (work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : null) ||
          `Badanie naukowe z bazy OpenAlex: ${title}. Cytowania: ${work.cited_by_count || 0}.`;

        sources.push({
          id: `openalex-${idx}`,
          name: title,
          domain: extractDomain(doiUrl) || 'openalex.org',
          url: doiUrl,
          authorOrPublisher: authors || 'OpenAlex Research Index',
          publishDate: year,
          snippet,
          confidence: 0.72,
        });
      });
    }
  } catch (err) {
    // Optional provider failure; continue with other available sources.
  }
  return sources;
}

/**
 * 2. Źródło Encyklopedii Wiedzy Semantycznej: Wikidata (wikidata.org)
 */
async function fetchWikidataSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        query
      )}&language=pl&format=json&origin=*`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const data = await res.json();
    if (Array.isArray(data.search)) {
      data.search.slice(0, 2).forEach((item: any, idx: number) => {
        if (!item.label) return;
        const url = item.url
          ? item.url.startsWith('http')
            ? item.url
            : `https:${item.url}`
          : `https://www.wikidata.org/wiki/${item.id}`;
        sources.push({
          id: `wikidata-${idx}`,
          name: `Wikidata: ${item.label} (${item.id})`,
          domain: 'wikidata.org',
          url,
          authorOrPublisher: 'Wikidata Knowledge Graph',
          snippet: item.description || `Ustrukturyzowana encja wiedzy Wikidata dla pojęcia ${item.label}.`,
          confidence: 0.68,
        });
      });
    }
  } catch (err) {
    // Silent fallback
  }
  return sources;
}

/**
 * 3. Źródło Sieciowe: DuckDuckGo Instant Answers & Topics (duckduckgo.com + domeny zewnętrzne)
 */
async function fetchDuckDuckGoSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const ddg = await res.json();

    if (ddg.AbstractText && ddg.AbstractURL) {
      const domain = extractDomain(ddg.AbstractURL) || 'duckduckgo.com';
      sources.push({
        id: `ddg-abstract-${Date.now()}`,
        name: ddg.Heading || query,
        domain,
        url: ddg.AbstractURL,
        authorOrPublisher: ddg.AbstractSource || 'DuckDuckGo Instant Answers',
        snippet: ddg.AbstractText,
        confidence: 0.65,
      });
    }

    if (Array.isArray(ddg.RelatedTopics)) {
      ddg.RelatedTopics.slice(0, 4).forEach((topic: any, idx: number) => {
        if (topic.Text && topic.FirstURL) {
          const domain = extractDomain(topic.FirstURL) || 'duckduckgo.com';
          sources.push({
            id: `ddg-topic-${idx}`,
            name: topic.Text.split(' - ')[0] || topic.Text.slice(0, 45),
            domain,
            url: topic.FirstURL,
            authorOrPublisher: domain,
            snippet: topic.Text,
            confidence: 0.58,
          });
        }
      });
    }
  } catch (err) {
    // Silent fallback
  }
  return sources;
}

/**
 * 4. Źródło Oficjalnego Rejestru Badań: Crossref (crossref.org / doi.org)
 */
async function fetchCrossrefSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=2`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const data = await res.json();
    if (Array.isArray(data?.message?.items)) {
      data.message.items.forEach((item: any, idx: number) => {
        const title = Array.isArray(item.title) ? item.title[0] : item.title;
        if (!title) return;
        const doiUrl = item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : 'https://crossref.org');
        const publisher = item.publisher || 'Crossref Scientific Index';
        const year = item.created?.['date-parts']?.[0]?.[0] ? String(item.created['date-parts'][0][0]) : '';

        sources.push({
          id: `crossref-${idx}`,
          name: title,
          domain: extractDomain(doiUrl) || 'crossref.org',
          url: doiUrl,
          authorOrPublisher: publisher,
          publishDate: year,
          snippet: `Publikacja naukowa zarejestrowana w Crossref: "${title}". Wydawca: ${publisher}.`,
          confidence: 0.70,
        });
      });
    }
  } catch (err) {
    // Silent fallback
  }
  return sources;
}

/**
 * Semantic Scholar Graph API: dodatkowy indeks literatury.
 * Jest best-effort i może ograniczać ruch; brak wyników nie jest traktowany jako błąd całego researchu.
 */
async function fetchSemanticScholarSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=5&fields=title,year,authors,abstract,url,externalIds,publicationDate`;
    const response = await fetchWithTimeout(url, {}, 6000);
    if (!response.ok) return sources;
    const data = await response.json();
    if (!Array.isArray(data?.data)) return sources;
    data.data.forEach((paper: any, index: number) => {
      const title = safeText(paper?.title);
      const url = safeHttpUrl(paper?.url) || (paper?.externalIds?.DOI ? safeHttpUrl(`https://doi.org/${paper.externalIds.DOI}`) : undefined);
      if (!title || !url) return;
      const authors = Array.isArray(paper.authors)
        ? paper.authors.slice(0, 4).map((author: any) => safeText(author?.name)).filter(Boolean).join(', ')
        : '';
      sources.push({
        id: `semantic-scholar-${stableHash(`${title}|${url}|${index}`)}`,
        name: title,
        domain: extractDomain(url),
        url,
        authorOrPublisher: authors || 'Semantic Scholar index',
        publishDate: safeText(paper?.year || paper?.publicationDate),
        snippet: safeText(paper?.abstract).slice(0, RESEARCH_LIMITS.maxSnippetLength) || `Rekord publikacji w Semantic Scholar: ${title}. Abstrakt nie był dostępny w odpowiedzi API.`,
        confidence: paper?.abstract ? 0.74 : 0.55,
      });
    });
  } catch {
    // Optional provider; other sources remain usable.
  }
  return sources;
}

/**
 * 6. Polskie Prawo i Akty Prawne: ISAP / Sejm RP ELI API (api.sejm.gov.pl / isap.sejm.gov.pl)
 * 100% darmowe oficjalne API Rzeczypospolitej Polskiej.
 */
async function fetchSejmGovLawSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://api.sejm.gov.pl/eli/acts/search?title=${encodeURIComponent(query)}&limit=3`,
      {},
      3800
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    items.slice(0, 3).forEach((act: any, idx: number) => {
      const title = safeText(act?.title);
      if (!title) return;
      const eli = safeText(act?.ELI);
      const address = safeText(act?.displayAddress || act?.pos);
      const url = eli
        ? `https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=W${eli.replace(/\//g, '')}`
        : `https://api.sejm.gov.pl/eli/acts/search?title=${encodeURIComponent(query)}`;
      const status = safeText(act?.status) || 'akt prawny';
      const pubDate = safeText(act?.promulgation || act?.announcementDate || act?.year);
      sources.push({
        id: `sejm-eli-${idx}`,
        name: `${address ? `[${address}] ` : ''}${title}`,
        domain: 'isap.sejm.gov.pl',
        url: safeHttpUrl(url) || 'https://isap.sejm.gov.pl',
        authorOrPublisher: 'Sejm RP — Internetowy System Aktów Prawnych (ISAP)',
        publishDate: pubDate,
        snippet: `Oficjalny akt prawny RP (${address || eli || 'ISAP'}). Status: ${status}. Tytuł: ${title}.`,
        confidence: 0.85,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * 7. Globalna Encyklopedia Angielska: English Wikipedia Action API (en.wikipedia.org)
 */
async function fetchEnglishWikipediaSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=2&format=json&origin=*`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const searchItems = Array.isArray(data?.query?.search) ? data.query.search : [];
    searchItems.slice(0, 2).forEach((item: any, idx: number) => {
      const title = safeText(item?.title);
      if (!title) return;
      const snippet = stripHtmlMetadata(item?.snippet || '');
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
      sources.push({
        id: `enwiki-${idx}`,
        name: `Wikipedia (EN): ${title}`,
        domain: 'en.wikipedia.org',
        url,
        authorOrPublisher: 'English Wikipedia Contributors',
        snippet: snippet || `English Wikipedia article covering ${title}.`,
        confidence: 0.66,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * 8. Programowanie i Inżynieria IT: Stack Exchange / StackOverflow API (api.stackexchange.com)
 */
async function fetchStackExchangeSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=3`,
      {},
      3800
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    items.slice(0, 3).forEach((item: any, idx: number) => {
      const title = stripHtmlMetadata(item?.title || '');
      const url = safeHttpUrl(item?.link);
      if (!title || !url) return;
      const tags = Array.isArray(item?.tags) ? item.tags.slice(0, 4).join(', ') : '';
      const score = typeof item?.score === 'number' ? item.score : 0;
      const answers = typeof item?.answer_count === 'number' ? item.answer_count : 0;
      sources.push({
        id: `stackoverflow-${idx}`,
        name: `StackOverflow: ${title}`,
        domain: 'stackoverflow.com',
        url,
        authorOrPublisher: item?.owner?.display_name || 'StackOverflow Community',
        snippet: `Wątek inżynierski (${answers} odpowiedzi, ocena: ${score}${tags ? `, tagi: ${tags}` : ''}): ${title}.`,
        confidence: item?.is_answered ? 0.76 : 0.62,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * 9. Rejestr Pakietów i Bibliotek: NPM Registry API (registry.npmjs.org)
 */
async function fetchNpmRegistrySources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=2`,
      {},
      3500
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const objects = Array.isArray(data?.objects) ? data.objects : [];
    objects.slice(0, 2).forEach((entry: any, idx: number) => {
      const pkg = entry?.package;
      const name = safeText(pkg?.name);
      const desc = safeText(pkg?.description);
      if (!name || !desc) return;
      const url = safeHttpUrl(pkg?.links?.npm || pkg?.links?.homepage) || `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
      const version = safeText(pkg?.version);
      sources.push({
        id: `npmjs-${idx}`,
        name: `NPM Package: ${name}${version ? ` (v${version})` : ''}`,
        domain: 'npmjs.com',
        url,
        authorOrPublisher: safeText(pkg?.publisher?.username) || 'NPM Registry',
        publishDate: safeText(pkg?.date).slice(0, 10),
        snippet: `Pakiet oprogramowania ${name}: ${desc}`,
        confidence: 0.68,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * 10. Medycyna, Biologia i Nauki o Życiu: Europe PMC REST API (ebi.ac.uk / europepmc.org)
 */
async function fetchEuropePmcSources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=3`,
      {},
      3800
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const results = Array.isArray(data?.resultList?.result) ? data.resultList.result : [];
    results.slice(0, 3).forEach((item: any, idx: number) => {
      const title = safeText(item?.title);
      if (!title) return;
      const doiUrl = item?.doi ? safeHttpUrl(`https://doi.org/${item.doi}`) : undefined;
      const pmcUrl = item?.id && item?.source
        ? `https://europepmc.org/article/${encodeURIComponent(item.source)}/${encodeURIComponent(item.id)}`
        : 'https://europepmc.org';
      const url = doiUrl || pmcUrl;
      const journal = safeText(item?.journalTitle) || 'Europe PMC Biomedical Index';
      const authors = safeText(item?.authorString);
      const year = safeText(item?.pubYear);
      sources.push({
        id: `europepmc-${idx}`,
        name: title,
        domain: 'europepmc.org',
        url,
        authorOrPublisher: [authors, journal].filter(Boolean).join(' · '),
        publishDate: year,
        snippet: `Publikacja biomedyczna/naukowa (Europe PMC, ${journal}${year ? `, ${year}` : ''}): ${title} (Cytowania: ${item?.citedByCount || 0}).`,
        confidence: 0.77,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * 11. Książki, Monografie i Literatura: OpenLibrary Search API (openlibrary.org)
 */
async function fetchOpenLibrarySources(query: string): Promise<VerifiedSource[]> {
  const sources: VerifiedSource[] = [];
  try {
    const res = await fetchWithTimeout(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=2`,
      {},
      3800
    );
    if (!res.ok) return sources;
    const data = await res.json();
    const docs = Array.isArray(data?.docs) ? data.docs : [];
    docs.slice(0, 2).forEach((doc: any, idx: number) => {
      const title = safeText(doc?.title);
      const key = safeText(doc?.key);
      if (!title || !key) return;
      const url = `https://openlibrary.org${key.startsWith('/') ? key : `/${key}`}`;
      const authors = Array.isArray(doc?.author_name) ? doc.author_name.slice(0, 3).join(', ') : 'OpenLibrary Catalog';
      const year = doc?.first_publish_year ? String(doc.first_publish_year) : '';
      const subjects = Array.isArray(doc?.subject) ? doc.subject.slice(0, 4).join(', ') : '';
      sources.push({
        id: `openlibrary-${idx}`,
        name: `Książka / Monografia: ${title}`,
        domain: 'openlibrary.org',
        url,
        authorOrPublisher: authors,
        publishDate: year,
        snippet: `Pozycja biblioteczna „${title}” (${authors}${year ? `, ${year}` : ''})${subjects ? `. Tematyka: ${subjects}.` : '.'}`,
        confidence: 0.64,
      });
    });
  } catch {
    // Silent fallback
  }
  return sources;
}

/**
 * Określa dziedzinę tematyczną zapytania w celu wygenerowania unikalnej architektury bloków
 */
type TopicCategory = 'zoology_nature' | 'tech_software' | 'business_strategy' | 'science_history' | 'general';

function detectTopicCategory(topic: string, extractText: string): TopicCategory {
  const combined = (topic + ' ' + extractText).toLowerCase();

  // 1. Zoologia i zwierzęta
  if (
    /kot|koty|pies|psy|wilk|koń|konie|ptak|ptaki|ryb|dinozaur|zwierz|faun|ssak|gad|płaz|gatunk|ras|anatom|behawior/.test(
      combined
    )
  ) {
    return 'zoology_nature';
  }

  // 2. Technologie, IT, Software
  if (
    /program|kod|software|typescript|javascript|python|react|docker|kubernetes|api|chmur|saas|architektur|baza danych|sql|algorytm|komputer|aplikacj|system/.test(
      combined
    )
  ) {
    return 'tech_software';
  }

  // 3. Biznes, zarządzanie, marketing
  if (
    /biznes|zarzadz|zarządz|marketing|startup|strategi|finans|inwestycj|koszt|przychód|kpi|roi|rynek|klient|sprzedaż/.test(
      combined
    )
  ) {
    return 'business_strategy';
  }

  // 4. Historia, nauki społeczne, geografia
  if (
    /histori|wiek|wojn|bitw|państwo|polsk|rzym|starożyt|geografi|społeczeństw|rewolucj|wiek xix|wiek xx/.test(
      combined
    )
  ) {
    return 'science_history';
  }

  return 'general';
}

/**
 * Zwraca prawdziwe wyszukiwanie materiałów wideo zamiast przypisywać tematowi
 * losowy, z góry wybrany film. Bez YouTube Data API nie deklarujemy, że wynik
 * został sprawdzony ani że konkretny film jest właściwy.
 */
function getTopicCuratedVideo(topic: string): { title: string; url: string; desc: string } {
  const safeTopic = (topic || '').trim() || 'temat badania';
  return {
    title: `Wyszukaj materiały wideo: ${safeTopic}`,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic)}`,
    desc: 'To link do wyników wyszukiwania YouTube. Konkretne filmy nie zostały automatycznie zweryfikowane.',
  };
}

/**
 * Research helpers: walidacja, normalizacja, ranking i odporna obsługa API.
 * Te funkcje są celowo małe i niezależne, aby można je było testować osobno.
 */

interface ResearchImageResult {
  url: string;
  title: string;
  caption?: string;
  sourceUrl?: string;
  license?: string;
}

interface ProviderFailure {
  provider: string;
  message: string;
  retryable: boolean;
}

const RESEARCH_LIMITS = {
  maxQueryLength: 500,
  maxSourceCount: 30,
  maxSnippetLength: 5000,
  maxImageCount: 8,
  maxWikiSections: 24,
} as const;

function safeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}

function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;
    if (!parsed.hostname || parsed.username || parsed.password) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isSafeHttpUrl(value: unknown): value is string {
  return Boolean(safeHttpUrl(value));
}

function clampNumber(value: unknown, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function normalizeDomainForCounting(value: string): string {
  const domain = extractDomain(value);
  if (!domain) return '';
  // Wszystkie subdomeny usługi bibliograficznej pozostają w jej domenie bazowej,
  // ale niezależne wydawnictwa zachowują własne hosty.
  return domain.replace(/^api\./, '').replace(/^www\./, '');
}

function normalizeSource(source: Partial<VerifiedSource>, index: number): VerifiedSource | null {
  const name = safeText(source.name);
  const url = safeHttpUrl(source.url);
  if (!name || !url) return null;
  const domain = extractDomain(url) || safeText(source.domain);
  if (!domain) return null;
  return {
    id: safeText(source.id) || `source-${index}-${stableHash(`${name}|${url}`)}`,
    name: name.slice(0, 500),
    domain,
    url,
    authorOrPublisher: safeText(source.authorOrPublisher).slice(0, 300) || undefined,
    publishDate: safeText(source.publishDate).slice(0, 80) || undefined,
    snippet: safeText(source.snippet).slice(0, RESEARCH_LIMITS.maxSnippetLength),
    confidence: clampNumber(source.confidence, 0, 1),
  };
}

function normalizeSources(value: unknown): VerifiedSource[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((source, index) => normalizeSource(source && typeof source === 'object' ? source : {}, index))
    .filter((source): source is VerifiedSource => Boolean(source))
    .slice(0, RESEARCH_LIMITS.maxSourceCount);
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function normalizeForComparison(value: string): string {
  return safeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sourceDeduplicationKey(source: VerifiedSource): string {
  const doi = source.url.match(/(?:doi\.org\/|doi:)(10\.\d{4,9}\/[^\s?#]+)/i)?.[1];
  if (doi) return `doi:${doi.toLowerCase().replace(/[.,;]+$/, '')}`;
  const normalizedUrl = normalizeUrlForDeduplication(source.url);
  return normalizedUrl || normalizeForComparison(source.name);
}

function normalizeUrlForDeduplication(value: string): string {
  const safe = safeHttpUrl(value);
  if (!safe) return '';
  try {
    const url = new URL(safe);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((key) => url.searchParams.delete(key));
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function deduplicateSources(sources: VerifiedSource[]): VerifiedSource[] {
  const unique = new Map<string, VerifiedSource>();
  sources.forEach((candidate) => {
    const normalized = normalizeSource(candidate, unique.size);
    if (!normalized) return;
    const key = sourceDeduplicationKey(normalized);
    const current = unique.get(key);
    if (!current || sourceQualityScore(normalized) > sourceQualityScore(current)) unique.set(key, normalized);
  });
  return Array.from(unique.values()).slice(0, RESEARCH_LIMITS.maxSourceCount);
}

function mergeSources(left: VerifiedSource[], right: VerifiedSource[]): VerifiedSource[] {
  return deduplicateSources([...left, ...right]);
}

function sourceQualityScore(source: VerifiedSource, query = ''): number {
  const name = normalizeForComparison(source.name);
  const snippet = normalizeForComparison(source.snippet);
  const terms = normalizeForComparison(query).split(' ').filter((term) => term.length > 2);
  const coverage = terms.length ? terms.filter((term) => name.includes(term) || snippet.includes(term)).length / terms.length : 0;
  const hasSnippet = snippet.length > 80 ? 0.12 : snippet.length > 20 ? 0.06 : 0;
  const hasPublisher = source.authorOrPublisher ? 0.04 : 0;
  const hasDate = source.publishDate ? 0.02 : 0;
  const safeDomain = source.domain && !/duckduckgo\.com$/i.test(source.domain) ? 0.03 : 0;
  return clampNumber(source.confidence, 0, 1) * 0.55 + coverage * 0.34 + hasSnippet + hasPublisher + hasDate + safeDomain;
}

function buildResearchQueryVariants(query: string, depth: ResearchDepth): string[] {
  const normalized = safeText(query).slice(0, RESEARCH_LIMITS.maxQueryLength);
  const variants = [normalized];
  if (depth === 'deep_research') {
    variants.push(`${normalized} research evidence review`);
    variants.push(`${normalized} overview definition`);
  } else if (depth === 'fact_check') {
    variants.push(`${normalized} evidence source`);
  }
  return Array.from(new Set(variants.map((item) => item.trim()).filter(Boolean))).slice(0, 3);
}

async function withDeadline<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Research timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function safeProvider<T>(provider: string, run: () => Promise<T>): Promise<{ provider: string; value: T; error?: never } | { provider: string; value?: never; error: ProviderFailure }> {
  try {
    return { provider, value: await run() };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown provider error';
    return { provider, error: { provider, message: message.slice(0, 300), retryable: /timeout|network|fetch|429|5\d\d/i.test(message) } };
  }
}

function reconstructAbstract(index: Record<string, number[]>): string {
  const words: Array<{ word: string; position: number }> = [];
  Object.entries(index || {}).forEach(([word, positions]) => {
    if (!Array.isArray(positions)) return;
    positions.forEach((position) => {
      if (Number.isInteger(position) && position >= 0 && position < 20000) words.push({ word, position });
    });
  });
  return words.sort((a, b) => a.position - b.position).slice(0, 1200).map((entry) => entry.word).join(' ');
}

function normalizeWikipediaResult(value: unknown): WikipediaArticleResult | null {
  if (!value || typeof value !== 'object') return null;
  const result = value as Partial<WikipediaArticleResult>;
  const title = safeText(result.title);
  const url = safeHttpUrl(result.url);
  if (!title || !url) return null;
  return {
    ...(result as WikipediaArticleResult),
    title,
    url,
    extract: safeText(result.extract).slice(0, 20000),
    description: safeText(result.description).slice(0, 1000),
    sections: Array.isArray(result.sections) ? result.sections.slice(0, RESEARCH_LIMITS.maxWikiSections) : [],
    images: Array.isArray(result.images) ? result.images.slice(0, RESEARCH_LIMITS.maxImageCount) : [],
    thumbnailUrl: safeHttpUrl(result.thumbnailUrl),
  } as WikipediaArticleResult;
}

function sourcesFromWikipedia(wiki: WikipediaArticleResult | null): VerifiedSource[] {
  if (!wiki?.url) return [];
  const snippet = safeText(wiki.extract || wiki.description);
  if (!snippet) return [];
  return [{
    id: `wikipedia-${stableHash(wiki.url)}`,
    name: `Wikipedia: ${safeText(wiki.title)}`,
    domain: extractDomain(wiki.url),
    url: wiki.url,
    authorOrPublisher: 'Wikipedia contributors',
    snippet,
    confidence: 0.58,
  }];
}

function bestSourceExtract(sources: VerifiedSource[]): string {
  return [...sources]
    .filter((source) => safeText(source.snippet).length > 50)
    .sort((a, b) => sourceQualityScore(b) - sourceQualityScore(a))[0]?.snippet || '';
}

function buildEvidenceFindings(title: string, sources: VerifiedSource[], wikiExtract: string): CrossCheckFinding[] {
  if (!sources.length) return [];
  const findings: CrossCheckFinding[] = [];
  const substantive = sources.filter((source) => safeText(source.snippet).length >= 80);
  if (wikiExtract && substantive.length) {
    findings.push({
      claim: `Dostępność materiałów opisujących temat „${title}”`,
      status: 'partial_evidence',
      confirmedByDomains: uniqueStrings(substantive.map((source) => source.domain)).slice(0, 8),
      notes: 'Zebrano opis encyklopedyczny i/lub fragmenty źródeł. To nie jest automatyczny dowód zgodności wszystkich twierdzeń; poszczególne fakty wymagają oceny w kontekście źródeł.',
    });
  }
  const academic = sources.filter((source) => /doi\.org|openalex\.org|crossref\.org|semanticscholar\.org|arxiv\.org|pubmed\.ncbi\.nlm\.nih\.gov/i.test(source.url));
  if (academic.length) {
    findings.push({
      claim: `Odnaleziono rekordy bibliograficzne powiązane z tematem „${title}”`,
      status: 'partial_evidence',
      confirmedByDomains: uniqueStrings(academic.map((source) => source.domain)).slice(0, 8),
      notes: 'Rekord bibliograficzny potwierdza istnienie wpisu w indeksie, ale sam w sobie nie potwierdza poprawności ani jakości wniosków publikacji.',
    });
  }
  return findings;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => safeText(value)).filter(Boolean)));
}

function normalizeImageResults(value: unknown): ResearchImageResult[] {
  if (!Array.isArray(value)) return [];
  const output: ResearchImageResult[] = [];
  value.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return;
    const item = raw as Partial<ResearchImageResult>;
    const url = safeHttpUrl(item.url);
    if (!url) return;
    const title = safeText(item.title).slice(0, 300) || 'Ilustracja';
    const caption = safeText(item.caption).slice(0, 500) || undefined;
    // Rygorystyczny filtr NSFW / 18+ / bodypainting / nagość
    if (!isSafeImage(url, title, caption)) return;
    output.push({
      url,
      title,
      caption,
      sourceUrl: safeHttpUrl(item.sourceUrl),
      license: safeText(item.license).slice(0, 200) || undefined,
    });
  });
  return deduplicateImages(output).slice(0, RESEARCH_LIMITS.maxImageCount);
}

function deduplicateImages(images: ResearchImageResult[]): ResearchImageResult[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    const key = normalizeUrlForDeduplication(image.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeImageResults(first: ResearchImageResult[], second: ResearchImageResult[]): ResearchImageResult[] {
  return deduplicateImages([...first, ...second]).slice(0, RESEARCH_LIMITS.maxImageCount);
}

function ensureUniqueBlockIds(blocks: DocBlock[]): DocBlock[] {
  const used = new Set<string>();
  return blocks.map((block, index) => {
    const candidate = safeText((block as any).id) || `research-block-${index}`;
    let id = candidate;
    let suffix = 1;
    while (used.has(id)) {
      id = `${candidate}-${suffix}`;
      suffix += 1;
    }
    used.add(id);
    return { ...block, id } as DocBlock;
  });
}

/**
 * Wikimedia Commons API: zwraca faktyczne miniatury z metadanymi licencji i stroną pliku.
 * Nie wszystkie wyniki mają łatwą do odczytania licencję, więc nie deklarujemy jej bez danych.
 */
async function fetchWikimediaImages(query: string): Promise<ResearchImageResult[]> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=1000&format=json&origin=*`;
  const response = await fetchWithTimeout(url, {}, 6000);
  if (!response.ok) return [];
  const data = await response.json();
  const pages = data?.query?.pages;
  if (!pages || typeof pages !== 'object') return [];
  return Object.values(pages).map((raw: any) => {
    const info = raw?.imageinfo?.[0];
    const metadata = info?.extmetadata || {};
    const fileUrl = safeHttpUrl(info?.thumburl || info?.url);
    const pageUrl = safeHttpUrl(raw?.title ? `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(raw.title).replace(/ /g, '_'))}` : '');
    return {
      url: fileUrl || '',
      title: safeText(raw?.title).replace(/^File:/, ''),
      caption: stripHtmlMetadata(metadata?.ImageDescription?.value || metadata?.ObjectName?.value || ''),
      sourceUrl: pageUrl,
      license: stripHtmlMetadata(metadata?.LicenseShortName?.value || ''),
    };
  }).filter((image: ResearchImageResult) => Boolean(image.url) && isSafeImage(image.url, image.title, image.caption)).slice(0, RESEARCH_LIMITS.maxImageCount);
}

function stripHtmlMetadata(value: unknown): string {
  return safeText(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Buduje dokument od zera z materiału, który rzeczywiście zwróciły źródła.
 * Nie dopisuje fikcyjnych danych, benchmarków, konsensusu ani checklist niezwiązanych z tematem.
 */
function buildDynamicTopicBlocks(
  category: TopicCategory,
  resolvedTitle: string,
  mainExtract: string,
  wikiSections: any[],
  sources: VerifiedSource[],
  findings: CrossCheckFinding[],
  images: ResearchImageResult[] = [],
  options?: ResearchOptions
): DocBlock[] {
  const blocks: DocBlock[] = [];
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const style = options?.style || 'comprehensive';
  const detail = options?.detailLevel || (options?.depth === 'deep_research' ? 'exhaustive' : 'standard');
  const add = (type: string, content: string, extra: Record<string, unknown> = {}) => {
    blocks.push({ id: `research-${stamp}-${blocks.length}`, type, content, ...extra } as DocBlock);
  };
  const clean = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
  const safeSections = Array.isArray(wikiSections)
    ? wikiSections.filter((section) => clean(section?.title) && clean(section?.content))
    : [];
  const safeImages = Array.isArray(images)
    ? images.filter((item) => isSafeHttpUrl(item?.url))
    : [];
  const describeImage = (image: ResearchImageResult, fallback: string): string => {
    const parts = [clean(image.caption) || clean(image.title) || fallback];
    if (image.sourceUrl) parts.push(`Źródło: ${image.sourceUrl}`);
    if (image.license) parts.push(`Licencja: ${image.license}`);
    return parts.join(' · ');
  };
  const styleNames: Record<NoteStyleOption, string> = {
    comprehensive: 'Kompendium', practical: 'Przewodnik praktyczny', visual_study: 'Opracowanie wizualne',
    executive: 'Raport wykonawczy', school_student: 'Notatka edukacyjna', scientific_paper: 'Opracowanie naukowe',
    comparison_matrix: 'Zestawienie porównawcze', historical_timeline: 'Oś czasu i kontekst', personal_minimal: 'Minimalistyczna notatka',
  };
  const categoryNames: Record<TopicCategory, string> = {
    zoology_nature: 'Przyroda i biologia', tech_software: 'Technologia i informatyka',
    business_strategy: 'Biznes i strategia', science_history: 'Historia i nauki społeczne', general: 'Opracowanie ogólne',
  };

  add('h1', clean(resolvedTitle) || 'Notatka badawcza');
  add('subtext', `${styleNames[style] || styleNames.comprehensive} · ${categoryNames[category] || categoryNames.general}`);

  if (mainExtract.trim()) {
    add('callout_info', mainExtract.trim(), { calloutType: 'info' });
  } else {
    add('callout_warning', 'Nie udało się pobrać wystarczającej treści źródłowej. Poniżej znajdują się dostępne wyniki i odnośniki; nie uzupełniono braków wymyślonymi faktami.', { calloutType: 'warning' });
  }

  if (safeImages.length) {
    add('h2', 'Materiały wizualne');
    const first = safeImages[0];
    add('image', '', { imageUrl: first.url, imageCaption: describeImage(first, `Materiał wizualny związany z: ${resolvedTitle}`) });
    if (detail === 'exhaustive' || style === 'visual_study') {
      safeImages.slice(1, 6).forEach((image, index) => {
        add('image', '', { imageUrl: image.url, imageCaption: describeImage(image, `Ilustracja ${index + 2}`) });
      });
    }
  }

  if (safeSections.length) {
    add('h2', style === 'historical_timeline' ? 'Kontekst i rozwinięcie tematu' : 'Opracowanie');
    const maxSections = detail === 'concise' ? 3 : detail === 'standard' ? 7 : 16;
    safeSections.slice(0, maxSections).forEach((section) => {
      add('h3', clean(section.title));
      add('p', clean(section.content));
      if (section.url && isSafeHttpUrl(section.url)) {
        add('bookmark', clean(section.title), { bookmarkTitle: clean(section.title), bookmarkUrl: section.url, bookmarkDesc: 'Otwórz materiał źródłowy.' });
      }
    });
  }

  if (sources.length) {
    add('h2', 'Źródła i materiały do dalszego czytania');
    add('subtext', `Zebrano ${sources.length} pozycji. Liczba ta nie oznacza automatycznie niezależnej weryfikacji ani konsensusu naukowego.`);
    sources.forEach((source, index) => {
      const details = [source.authorOrPublisher, source.publishDate, source.domain].filter(Boolean).join(' · ');
      add('bookmark', `[${index + 1}] ${source.name}`, {
        bookmarkTitle: source.name,
        bookmarkUrl: source.url,
        bookmarkDesc: [details, source.snippet, `Ocena heurystyczna trafności: ${Math.round(clampNumber(source.confidence, 0, 1) * 100)}%`].filter(Boolean).join('\n'),
      });
    });
  }

  if (findings.length) {
    add('h2', 'Ocena dostępnych dowodów');
    findings.forEach((finding) => {
      const statusLabel = finding.status === 'verified_consensus' ? 'Potwierdzenie' : finding.status === 'contradiction_detected' ? 'Sprzeczność' : 'Dowody częściowe';
      add(finding.status === 'contradiction_detected' ? 'callout_warning' : 'callout_info', `${statusLabel}: ${finding.claim}
${finding.notes}${finding.confirmedByDomains.length ? `
Źródła: ${finding.confirmedByDomains.join(', ')}` : ''}`, { calloutType: finding.status === 'contradiction_detected' ? 'warning' : 'info' });
    });
  }

  const video = getTopicCuratedVideo(resolvedTitle);
  if (options?.includeMedia !== false) {
    add('h2', 'Materiały wideo');
    add('bookmark', video.title, { bookmarkTitle: video.title, bookmarkUrl: video.url, bookmarkDesc: video.desc });
  }

  if (options?.includeQuestions || style === 'school_student') {
    add('h2', 'Pytania do samodzielnej powtórki');
    const questions = safeSections.slice(0, 5).map((section) => ({
      question: `Jakie najważniejsze informacje przedstawiono w sekcji „${clean(section.title)}”?`,
      answer: clean(section.content).slice(0, 1200),
      isOpen: false,
    }));
    if (questions.length) add('faq', 'Pytania do powtórki', { faqItems: questions });
    else add('p', 'Nie ma wystarczającego materiału źródłowego, aby przygotować pytania z odpowiedziami bez zgadywania.');
  }

  if (!sources.length && !safeSections.length && !mainExtract.trim()) {
    add('callout_warning', 'Research nie zwrócił wystarczających danych. Sprawdź połączenie, spróbuj dokładniejszego zapytania lub uruchom ponownie badanie.', { calloutType: 'warning' });
  }

  return ensureUniqueBlockIds(blocks);
}

/**
 * Wieloźródłowe badanie 9+ prawdziwych, darmowych źródeł naraz (0 PLN dla 50k+ użytkowników)
 * oraz dynamiczne układanie bloków za pomocą silnika `#TAG#...#TAG#`.
 */
export async function performMultiSourceResearch(
  rawQuery: string,
  preferredDepthOrOptions: ResearchDepth | ResearchOptions = 'deep_research'
): Promise<MultiSourceResearchResult> {
  const validation = validateResearchQuery(rawQuery);
  if (!validation.valid) throw new Error(validation.error || 'Podaj temat badania.');
  const query = validation.query;
  const options: ResearchOptions = typeof preferredDepthOrOptions === 'string'
    ? { depth: preferredDepthOrOptions }
    : (preferredDepthOrOptions || {});
  const preferredDepth = options.depth || 'deep_research';
  const timeoutMs = preferredDepth === 'quick_note' ? 4500 : preferredDepth === 'fact_check' ? 6500 : 8500;
  const queryVariants = buildResearchQueryVariants(query, preferredDepth);

  // Równoległe odpytanie 11 darmowych dostawców wiedzy (Wikipedia PL, Wikipedia EN, ISAP/Sejm Gov,
  // StackExchange/StackOverflow, NPM Registry, Europe PMC, OpenAlex, Wikidata, DuckDuckGo, Crossref,
  // Semantic Scholar, OpenLibrary + Wikimedia Commons)
  const providerNames = [
    'wikipedia',
    'en-wikipedia',
    'sejm-gov',
    'stackexchange',
    'npm-registry',
    'europe-pmc',
    'openalex',
    'wikidata',
    'duckduckgo',
    'crossref',
    'semantic-scholar',
    'openlibrary',
    'wikimedia',
  ] as const;

  const primaryTasks: Array<Promise<any>> = [
    safeProvider('wikipedia', () => fetchWikipediaArticle(query)),
    safeProvider('en-wikipedia', () => fetchEnglishWikipediaSources(query)),
    safeProvider('sejm-gov', () => fetchSejmGovLawSources(query)),
    safeProvider('stackexchange', () => fetchStackExchangeSources(query)),
    safeProvider('npm-registry', () => fetchNpmRegistrySources(query)),
    safeProvider('europe-pmc', () => fetchEuropePmcSources(query)),
    safeProvider('openalex', () => fetchOpenAlexSources(query)),
    safeProvider('wikidata', () => fetchWikidataSources(query)),
    safeProvider('duckduckgo', () => fetchDuckDuckGoSources(query)),
    safeProvider('crossref', () => fetchCrossrefSources(query)),
    safeProvider('semantic-scholar', () => fetchSemanticScholarSources(query)),
    safeProvider('openlibrary', () => fetchOpenLibrarySources(query)),
    safeProvider('wikimedia', () => fetchWikimediaImages(query)),
  ];
  const settled = await Promise.allSettled(primaryTasks.map((task) => withDeadline(task, timeoutMs)));
  const byProvider = new Map<string, any>();
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value && !('error' in result.value)) {
      byProvider.set(providerNames[index], result.value.value);
    }
  });

  // Gdy pierwszy zestaw zwraca zbyt mało wyników, wykonaj dodatkowe warianty zapytania
  let openAlexSources: VerifiedSource[] = normalizeSources(byProvider.get('openalex'));
  let crossrefSources: VerifiedSource[] = normalizeSources(byProvider.get('crossref'));
  if (preferredDepth === 'deep_research' && openAlexSources.length + crossrefSources.length < 3) {
    const expanded = await Promise.allSettled(queryVariants.slice(1, 3).flatMap((variant) => [
      withDeadline(fetchOpenAlexSources(variant), timeoutMs),
      withDeadline(fetchCrossrefSources(variant), timeoutMs),
    ]));
    expanded.forEach((result, index) => {
      if (result.status !== 'fulfilled') return;
      if (index % 2 === 0) openAlexSources = mergeSources(openAlexSources, normalizeSources(result.value));
      else crossrefSources = mergeSources(crossrefSources, normalizeSources(result.value));
    });
  }

  const wiki = normalizeWikipediaResult(byProvider.get('wikipedia'));
  const enWikiSources = normalizeSources(byProvider.get('en-wikipedia'));
  const sejmGovSources = normalizeSources(byProvider.get('sejm-gov'));
  const stackExchangeSources = normalizeSources(byProvider.get('stackexchange'));
  const npmSources = normalizeSources(byProvider.get('npm-registry'));
  const europePmcSources = normalizeSources(byProvider.get('europe-pmc'));
  const wikidataSources = normalizeSources(byProvider.get('wikidata'));
  const ddgSources = normalizeSources(byProvider.get('duckduckgo'));
  const crossSources = normalizeSources(crossrefSources);
  const semanticScholarSources = normalizeSources(byProvider.get('semantic-scholar'));
  const openLibrarySources = normalizeSources(byProvider.get('openlibrary'));
  const imageResults = normalizeImageResults(byProvider.get('wikimedia'));
  const resolvedTitle = safeText(wiki?.title) || query;

  const allSources = deduplicateSources([
    ...sejmGovSources,
    ...stackExchangeSources,
    ...npmSources,
    ...europePmcSources,
    ...normalizeSources(openAlexSources),
    ...crossSources,
    ...semanticScholarSources,
    ...enWikiSources,
    ...wikidataSources,
    ...ddgSources,
    ...openLibrarySources,
    ...sourcesFromWikipedia(wiki),
  ]).sort((a, b) => sourceQualityScore(b, query) - sourceQualityScore(a, query));

  const wikiExtract = safeText(wiki?.extract || wiki?.description);
  const sourceExtracts = allSources.map((source) => safeText(source.snippet)).filter(Boolean);
  const mainExtract = wikiExtract || bestSourceExtract(allSources) || '';
  const category = detectTopicCategory(resolvedTitle, [mainExtract, ...sourceExtracts].join(' '));
  const findings = buildEvidenceFindings(resolvedTitle, allSources, wikiExtract);
  const uniqueDomainsCount = new Set(allSources.map((source) => normalizeDomainForCounting(source.url || source.domain)).filter(Boolean)).size;
  const keyTakeaway = mainExtract
    ? `Najlepsze dostępne podsumowanie tematu „${resolvedTitle}” pochodzi z pobranych materiałów. Przeszukano równolegle 9+ rejestrów i zebrano ${allSources.length} pozycji z ${uniqueDomainsCount} odrębnych domen.`
    : `Nie udało się pobrać wystarczającej treści, aby rzetelnie podsumować „${resolvedTitle}”. Dostępne odnośniki można sprawdzić ręcznie.`;

  const combinedImages = mergeImageResults(normalizeImageResults(wiki?.images), imageResults);
  const wikiSections = Array.isArray(wiki?.sections) ? wiki.sections : [];

  // Układanie dokumentu za pomocą silnika komend blokowych #HEADER1#...#HEADER1#, #TABLE#, #CALLOUT_INFO# itd.
  let tagStream = composeDynamicBlockTagStream(
    resolvedTitle,
    mainExtract,
    wikiSections,
    allSources,
    findings,
    combinedImages
  );

  // Jeśli w przeglądarce jest aktywne darmowe Puter.js AI, pozwól modelowi LLM wygenerować własny strumień #TAG#...#TAG#
  try {
    const puterAi = typeof window !== 'undefined' ? (window as any)?.puter?.ai : undefined;
    if (puterAi && typeof puterAi.chat === 'function' && allSources.length > 0) {
      const prompt = buildAiBlockTagSystemPrompt(resolvedTitle, allSources, mainExtract);
      const llmResp = await withDeadline<any>(
        puterAi.chat(prompt, { model: 'gpt-4o-mini' }),
        4200
      );
      const llmText =
        typeof llmResp === 'string'
          ? llmResp
          : llmResp?.message?.content || llmResp?.text || '';
      if (typeof llmText === 'string' && hasAiBlockTags(llmText)) {
        tagStream = llmText;
      }
    }
  } catch {
    // Fallback na deterministyczny strumień tagów composeDynamicBlockTagStream
  }

  const parsedFromTags = parseAiBlockTagsToBlocks(tagStream, resolvedTitle);
  const fallbackBlocks = buildDynamicTopicBlocks(
    category,
    resolvedTitle,
    mainExtract,
    wikiSections,
    allSources,
    findings,
    combinedImages,
    options
  );

  const blocks = parsedFromTags.blocks.length >= 4
    ? ensureUniqueBlockIds(parsedFromTags.blocks)
    : fallbackBlocks;

  return {
    query,
    resolvedTitle,
    summary: mainExtract || 'Brak wystarczającej treści źródłowej. Sprawdź odnośniki i spróbuj ponownie.',
    keyTakeaway,
    sourcesCount: allSources.length,
    uniqueDomainsCount,
    sources: allSources,
    findings,
    thumbnailUrl: safeHttpUrl(wiki?.thumbnailUrl) || combinedImages[0]?.url,
    blocks,
    depthUsed: preferredDepth,
  };
}



/**
 * Public diagnostics for callers and tests. They intentionally report coverage,
 * not a made-up accuracy percentage or an absolute guarantee of correctness.
 */
export interface ResearchDiagnostics {
  queryValid: boolean;
  sourceCount: number;
  distinctTargetDomains: number;
  sourceCoverage: number;
  hasSubstantiveText: boolean;
  hasUsableCitationLinks: boolean;
  warnings: string[];
}

export function inspectResearchResult(result: Partial<MultiSourceResearchResult>): ResearchDiagnostics {
  const sources = normalizeSources(result.sources);
  const domains = uniqueStrings(sources.map((source) => normalizeDomainForCounting(source.url)));
  const warnings: string[] = [];
  const summary = safeText(result.summary);
  const queryValid = safeText(result.query).length > 0;
  if (!queryValid) warnings.push('Brak poprawnego zapytania.');
  if (!sources.length) warnings.push('Nie pobrano żadnych poprawnych źródeł.');
  if (sources.length > 0 && domains.length < 2) warnings.push('Dostępne źródła pochodzą z jednej domeny docelowej; nie należy nazywać tego niezależną weryfikacją.');
  if (summary.length < 120) warnings.push('Podsumowanie jest krótkie lub brak treści źródłowej.');
  if (!sources.some((source) => source.snippet.length > 80)) warnings.push('Brak obszernych fragmentów źródłowych.');
  return {
    queryValid,
    sourceCount: sources.length,
    distinctTargetDomains: domains.length,
    sourceCoverage: sources.length ? clampNumber(sources.filter((source) => source.snippet.length > 40).length / sources.length, 0, 1) : 0,
    hasSubstantiveText: summary.length >= 120 || sources.some((source) => source.snippet.length >= 120),
    hasUsableCitationLinks: sources.some((source) => Boolean(safeHttpUrl(source.url))),
    warnings,
  };
}

/** Normalize a user-supplied query before network access. */
export function validateResearchQuery(rawQuery: unknown): { valid: boolean; query: string; error?: string } {
  if (typeof rawQuery !== 'string') return { valid: false, query: '', error: 'Zapytanie musi być tekstem.' };
  const query = cleanResearchQuery(rawQuery).slice(0, RESEARCH_LIMITS.maxQueryLength);
  if (!query) return { valid: false, query: '', error: 'Wpisz temat, który mam zbadać.' };
  if (query.length < 2) return { valid: false, query, error: 'Temat jest zbyt krótki.' };
  return { valid: true, query };
}

/** Build a compact, transparent source report for telemetry or a UI panel. */
export function summarizeResearchCoverage(result: Partial<MultiSourceResearchResult>): string[] {
  const diagnostics = inspectResearchResult(result);
  const output = [
    `Źródła: ${diagnostics.sourceCount}`,
    `Domeny docelowe: ${diagnostics.distinctTargetDomains}`,
    `Pokrycie fragmentami źródeł: ${Math.round(diagnostics.sourceCoverage * 100)}%`,
  ];
  return output.concat(diagnostics.warnings.map((warning) => `Uwaga: ${warning}`));
}

/**
 * Return the best available source candidates for a user-visible bibliography.
 * This ranking is heuristic; it is not a scientific peer-review classifier.
 */
export function rankResearchSources(sources: VerifiedSource[], query = ''): VerifiedSource[] {
  return deduplicateSources(normalizeSources(sources))
    .sort((a, b) => sourceQualityScore(b, query) - sourceQualityScore(a, query));
}

/**
 * Format citation text without trusting source metadata as markup.
 * The editor can use this for clipboard, plain text export or audit logs.
 */
export function formatResearchCitation(source: VerifiedSource, index = 0): string {
  const normalized = normalizeSource(source, index);
  if (!normalized) return '';
  const publisher = normalized.authorOrPublisher ? `${normalized.authorOrPublisher}. ` : '';
  const year = normalized.publishDate ? ` (${normalized.publishDate}).` : '.';
  return `[${Math.max(1, Math.floor(index) + 1)}] ${publisher}${normalized.name}${year} ${normalized.url}`;
}

/**
 * Deduplicate claims by normalized text. This helper deliberately does not mark
 * claims verified; it only reduces repeated presentation in a report.
 */
export function deduplicateResearchClaims(claims: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const claim of claims || []) {
    const value = safeText(claim);
    const key = normalizeForComparison(value);
    if (!value || !key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

/** A pure utility for unit tests: true only for HTTP(S) URLs without credentials. */
export function isValidResearchUrl(value: string): boolean {
  return Boolean(safeHttpUrl(value));
}

/**
 * Safe result fallback for UI code that wants to recover from a failed provider.
 * It never fabricates sources or claims that research succeeded.
 */
export function createResearchFailureResult(rawQuery: string, message: string): MultiSourceResearchResult {
  const query = safeText(rawQuery) || 'Nieokreślony temat';
  const reason = safeText(message) || 'Nieznany błąd dostawcy.';
  const blocks: DocBlock[] = ensureUniqueBlockIds([
    { id: 'research-failure-title', type: 'h1', content: `Research: ${query}` } as DocBlock,
    { id: 'research-failure-callout', type: 'callout_warning', calloutType: 'warning', content: `Nie udało się ukończyć badania. ${reason}` } as DocBlock,
    { id: 'research-failure-next-step', type: 'p', content: 'Sprawdź połączenie i konfigurację API, skróć zapytanie lub spróbuj ponownie. Żadne źródła nie zostały dopisane automatycznie.' } as DocBlock,
  ]);
  return {
    query,
    resolvedTitle: query,
    summary: `Badanie nie zostało ukończone: ${reason}`,
    keyTakeaway: 'Brak wystarczających danych, aby przedstawić wiarygodny wniosek.',
    sourcesCount: 0,
    uniqueDomainsCount: 0,
    sources: [],
    findings: [],
    blocks,
    depthUsed: 'deep_research',
  };
}


/**
 * Validate externally supplied research options so callers cannot accidentally
 * turn a malformed value into unexpected network load or rendering behavior.
 */
export function normalizeResearchOptions(input?: ResearchOptions): ResearchOptions {
  const value = input && typeof input === 'object' ? input : {};
  const depthValues: ResearchDepth[] = ['quick_note', 'fact_check', 'deep_research'];
  const styleValues: NoteStyleOption[] = [
    'comprehensive', 'practical', 'visual_study', 'executive', 'school_student',
    'scientific_paper', 'comparison_matrix', 'historical_timeline', 'personal_minimal',
  ];
  const focusValues: NoteFocusOption[] = [
    'highlights', 'diagrams_tables', 'swot_risks', 'action_plan', 'definitions_formulas', 'dates_events', 'pros_cons',
  ];
  const detailValues = ['concise', 'standard', 'exhaustive'] as const;
  return {
    depth: depthValues.includes(value.depth as ResearchDepth) ? value.depth : 'deep_research',
    style: styleValues.includes(value.style as NoteStyleOption) ? value.style : 'comprehensive',
    focus: focusValues.includes(value.focus as NoteFocusOption) ? value.focus : 'highlights',
    detailLevel: detailValues.includes(value.detailLevel as any) ? value.detailLevel : 'standard',
    includeMedia: value.includeMedia !== false,
    includeQuestions: value.includeQuestions === true,
  };
}

/** Return a UI-friendly status without implying unsupported verification. */
export function getFindingStatusLabel(status: CrossCheckFinding['status']): string {
  switch (status) {
    case 'verified_consensus': return 'Potwierdzone zgodne dowody';
    case 'contradiction_detected': return 'Wykryta sprzeczność';
    case 'partial_evidence':
    default: return 'Dowody częściowe — wymaga oceny';
  }
}

/** Extract only safe source URLs from a result, preserving source order. */
export function extractResearchSourceUrls(result: Partial<MultiSourceResearchResult>): string[] {
  return uniqueStrings(normalizeSources(result.sources).map((source) => safeHttpUrl(source.url) || '').filter(Boolean));
}

/**
 * Report source diversity by target host and provider hints. It intentionally
 * avoids claiming statistical independence because domain names alone cannot prove it.
 */
export function describeSourceDiversity(sources: VerifiedSource[]): { domains: string[]; count: number; note: string } {
  const domains = uniqueStrings(normalizeSources(sources).map((source) => normalizeDomainForCounting(source.url))).sort();
  return {
    domains,
    count: domains.length,
    note: domains.length > 1
      ? 'Wyniki obejmują więcej niż jedną domenę docelową; nie dowodzi to niezależności redakcyjnej ani zgodności treści.'
      : domains.length === 1
        ? 'Wszystkie dostępne odnośniki prowadzą do jednej domeny docelowej.'
        : 'Brak poprawnych domen docelowych do oceny.',
  };
}

/** Keep source excerpts readable while removing accidental duplicate whitespace. */
export function normalizeSourceExcerpt(value: unknown, maxLength = 1200): string {
  const limit = Math.floor(clampNumber(maxLength, 80, RESEARCH_LIMITS.maxSnippetLength));
  return safeText(value).replace(/\\s+/g, ' ').slice(0, limit);
}

/**
 * Rank potential image candidates using basic relevance and attribution signals.
 * The score is only a presentation heuristic, never a license or factuality check.
 */
export function rankResearchImages(images: ResearchImageResult[], query: string): ResearchImageResult[] {
  const terms = normalizeForComparison(query).split(' ').filter((term) => term.length > 2);
  return normalizeImageResults(images).sort((a, b) => {
    const score = (image: ResearchImageResult) => {
      const text = normalizeForComparison(`${image.title} ${image.caption || ''}`);
      const coverage = terms.length ? terms.filter((term) => text.includes(term)).length / terms.length : 0;
      return coverage + (image.sourceUrl ? 0.1 : 0) + (image.license ? 0.08 : 0);
    };
    return score(b) - score(a);
  });
}

/** Build a short audit record useful in tests and development logs. */
export function createResearchAuditRecord(result: Partial<MultiSourceResearchResult>): Record<string, unknown> {
  const diagnostics = inspectResearchResult(result);
  return {
    queryHash: stableHash(safeText(result.query)),
    depthUsed: result.depthUsed || 'unknown',
    resolvedTitle: safeText(result.resolvedTitle),
    sourceCount: diagnostics.sourceCount,
    distinctTargetDomains: diagnostics.distinctTargetDomains,
    blockCount: Array.isArray(result.blocks) ? result.blocks.length : 0,
    hasSummary: safeText(result.summary).length > 0,
    warnings: diagnostics.warnings,
  };
}

// =========================================================================
// MULTI-TOPIC DELIVERABLE SPLITTER & REAL BROWSER AUTOMATION HELPERS
// =========================================================================

export interface DeliverableTopicPlan {
  topic: string;
  searchQueries: string[];
  suggestedIcon: string;
}

/**
 * Rozdziela złożone polecenie użytkownika (np. "Stwórz notatkę o psach, napisz biznes plan
 * i jak zdobyć pierwszą miłość") na osobne, niezależne tematy (deliverables).
 * Każdy temat otrzymuje własny zestaw zapytań wyszukiwawczych.
 */
export function splitMultiTopicResearchPrompt(rawPrompt: string): DeliverableTopicPlan[] {
  if (!rawPrompt || typeof rawPrompt !== 'string') return [];

  const cleanedPrompt = rawPrompt
    .replace(/^(@deepresearch|@research|@noteweb|@note|\/research|\/note)\s+/i, '')
    .replace(/\[(szybko|precyzja)\]/gi, '')
    .trim();

  // Dzielenie po średnikach, nowych liniach, przecinkach poprzedzających czasowniki kreacji
  // lub spójnikach ("oraz", "a także", "i stwórz", "i napisz", "i jak")
  const rawSegments = cleanedPrompt
    .split(
      /\s*(?:;|\n|\|\||,(?=\s*(?:stwórz|stworz|napisz|przygotuj|zrób|zrob|opracuj|zbadaj|jak\b|biznes\s*plan|notatk))|\b(?:oraz|a także)\b|\bi\s+(?=(?:stwórz|stworz|napisz|przygotuj|zrób|zrob|opracuj|zbadaj|jak\b|biznes\s*plan|notatk)))\s*/i
    )
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);

  // Jeśli użytkownik podał wyliczenie po przecinkach typu: "stwórz notatkę o psach, biznes plan, jak zdobyć 1 miłość"
  let expandedSegments: string[] = [];
  for (const seg of rawSegments) {
    if (seg.includes(',') && seg.split(',').length >= 2 && seg.length > 25) {
      const subParts = seg.split(',').map((p) => p.trim()).filter((p) => p.length >= 3);
      if (subParts.length >= 2) {
        expandedSegments.push(...subParts);
        continue;
      }
    }
    expandedSegments.push(seg);
  }

  const seen = new Set<string>();
  const plans: DeliverableTopicPlan[] = [];

  for (const seg of expandedSegments) {
    const cleanedTopic = cleanResearchQuery(seg)
      .replace(/^(?:stwórz|stworz|napisz|przygotuj|zrób|zrob|opracuj|dodaj)\s+(?:mi\s+)?(?:notatkę|notatke|stronę|strone|dokument|opracowanie)?\s*(?:o|na temat|dotyczącą)?\s*/i, '')
      .trim();

    if (!cleanedTopic || cleanedTopic.length < 2) continue;
    const normKey = cleanedTopic.toLowerCase();
    if (seen.has(normKey)) continue;
    seen.add(normKey);

    const lower = normKey;
    const icon =
      /pies|psach|psy|kot|zwierz/.test(lower)
        ? '🐾'
        : /biznes|finans|inwest|spółk|strategi|startup|plan/.test(lower)
          ? '📈'
          : /miłoś|milos|relacj|związk|zwiazk|psycholog|uczu/.test(lower)
            ? '❤️'
            : /ustaw|praw|kodeks|podat|gov/.test(lower)
              ? '⚖️'
              : /typescript|javascript|python|kod|program|react|api/.test(lower)
                ? '💻'
                : '📄';

    plans.push({
      topic: cleanedTopic.charAt(0).toUpperCase() + cleanedTopic.slice(1),
      searchQueries: [
        cleanedTopic,
        `${cleanedTopic} analiza i kluczowe informacje`,
        `${cleanedTopic} badania i źródła`,
      ],
      suggestedIcon: icon,
    });
  }

  if (plans.length === 0 && cleanedPrompt) {
    const fallback = cleanResearchQuery(cleanedPrompt) || cleanedPrompt;
    return [
      {
        topic: fallback,
        searchQueries: [fallback],
        suggestedIcon: '📄',
      },
    ];
  }

  return plans;
}

export interface BrowserSearchLaunchReport {
  engine: 'google' | 'bing' | 'duckduckgo';
  launchedUrls: string[];
  openedTabsCount: number;
  blockedByPopupBlocker: boolean;
  statusMessage: string;
}

/**
 * Otwiera rzeczywiste karty wyszukiwarki (Google / Bing / DuckDuckGo) w przeglądarce użytkownika
 * (np. Chrome / Edge / Brave) i uczciwie raportuje, czy przeglądarka pozwoliła na otwarcie kart,
 * czy zablokowała okno (popup blocker).
 */
export function openRealBrowserSearchTabs(
  queries: string[],
  engine: 'google' | 'bing' | 'duckduckgo' = 'google'
): BrowserSearchLaunchReport {
  const cleanQueries = queries.map((q) => q.trim()).filter(Boolean).slice(0, 5);
  const launchedUrls: string[] = [];
  let openedTabsCount = 0;
  let blockedByPopupBlocker = false;

  for (const q of cleanQueries) {
    const encoded = encodeURIComponent(q);
    const url =
      engine === 'bing'
        ? `https://www.bing.com/search?q=${encoded}`
        : engine === 'duckduckgo'
          ? `https://duckduckgo.com/?q=${encoded}`
          : `https://www.google.com/search?q=${encoded}`;

    launchedUrls.push(url);

    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      try {
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (win) {
          openedTabsCount += 1;
        } else {
          blockedByPopupBlocker = true;
        }
      } catch {
        blockedByPopupBlocker = true;
      }
    } else {
      // W środowisku Node/headless rejestrujemy wygenerowane URL-e bez udawania otwarcia okna GUI
      blockedByPopupBlocker = false;
    }
  }

  const statusMessage =
    openedTabsCount > 0
      ? `Otwarto ${openedTabsCount} kart(y) wyszukiwania w przeglądarce (${engine.toUpperCase()}).`
      : blockedByPopupBlocker
        ? `Przygotowano ${launchedUrls.length} bezpośrednich linków wyszukiwania (${engine.toUpperCase()}). Przeglądarka zablokowała automatyczne wyskakujące okno — kliknij link, aby otworzyć kartę.`
        : `Wygenerowano ${launchedUrls.length} zapytań wyszukiwawczych (${engine.toUpperCase()}).`;

  return {
    engine,
    launchedUrls,
    openedTabsCount,
    blockedByPopupBlocker,
    statusMessage,
  };
}

