/**
 * Zaawansowany Silnik Konwersacyjny, Reasoning & Wykonawca Akcji Studio AI Copilot
 * Obsługuje lokalne AI w środowisku Ollama (SmolLM2) z wywoływaniem narzędzi,
 * bazę 5200+ słów, lemmatyzację odmian fleksyjnych,
 * dedykowaną komendę /wiki z Wikipedią w czasie rzeczywistym, darmowe tłumaczenia
 * oraz bezpośrednie wykonywanie modyfikacji w edytorze blokowym.
 */

import { DocBlock, Priority } from '../../types/workspace';
import { matchWordsInQuery, getVocabularyBaseSize } from './polishVocabularyDatabase';
import { matchesConcept, stemPolishWord, removePolishDiacritics } from './polishStemmer';
import { ADVANCED_TEMPLATES } from '../templates/advancedTemplates';
import { translateDocumentBlocks, SupportedLanguage } from './polishTranslator';
import { searchWikipedia, WikipediaArticleResult } from './wikipediaService';
import { isBlockedUrl } from '../../utils/contentFilter';
import {
  checkOllamaAvailability,
  callOllamaWithTools,
  OllamaStatus,
} from './ollamaService';

export interface CopilotActionPayload {
  type:
    | 'INSERT_BLOCKS'
    | 'REPLACE_ALL_BLOCKS'
    | 'RENAME_PAGE'
    | 'CHANGE_ICON'
    | 'TRANSLATE_DOC'
    | 'CLEAN_EMPTY_BLOCKS'
    | 'EXTRACT_KANBAN_TASKS'
    | 'SUMMARIZE_DOC';
  description: string;
  blocks?: Partial<DocBlock>[];
  newTitle?: string;
  newIcon?: string;
  targetLang?: SupportedLanguage;
  tasks?: { title: string; priority: Priority; tag: string }[];
}

export interface CopilotMessageResponse {
  reply: string;
  action?: CopilotActionPayload;
  suggestedFollowUps?: string[];
  matchedWordsCount: number;
  wikiSource?: { title: string; url: string };
  ollamaUsed?: boolean;
}

function uid(prefix: string = 'copilot'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Wykonuje wywołanie narzędzia zgłoszone przez model LLM (np. SmolLM2) lub silnik deterministyczny
 */
async function executeToolCall(
  tool: string,
  args: Record<string, any>,
  context: { docTitle: string; blocks: DocBlock[] }
): Promise<{
  action?: CopilotActionPayload;
  replyPrefix?: string;
  wikiSource?: { title: string; url: string };
}> {
  switch (tool) {
    case 'insert_header': {
      const level = (args.level === 'h1' || args.level === 'h3' ? args.level : 'h2') as
        | 'h1'
        | 'h2'
        | 'h3';
      const title = args.title || 'Nowy Nagłówek';
      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: `Dodano nagłówek (${level.toUpperCase()}): "${title}"`,
          blocks: [{ id: uid('h'), type: level, content: title }],
        },
        replyPrefix: `✅ Dodałem nagłówek ${level.toUpperCase()}: **"${title}"** do dokumentu.`,
      };
    }

    case 'insert_button': {
      const url = args.url || 'https://google.com';
      if (isBlockedUrl(url)) {
        return {
          replyPrefix: `⛔ Nie mogę dodać przycisku z linkiem ${url} ze względów bezpieczeństwa (treści 18+).`,
        };
      }
      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: `Dodano przycisk CTA: "${args.text || 'Przycisk'}"`,
          blocks: [
            {
              id: uid('btn'),
              type: 'button',
              content: args.text || 'Kliknij tutaj',
              buttonUrl: url,
              buttonColor: 'blue',
            },
          ],
        },
        replyPrefix: `✅ Dodałem przycisk CTA: **"${args.text || 'Przycisk'}"** (${url}).`,
      };
    }

    case 'insert_template': {
      const tplKey = String(args.template || 'saas').toLowerCase();
      const allTemplates = Object.values(ADVANCED_TEMPLATES);
      let template = allTemplates.find((t) => t.id.toLowerCase().includes(tplKey));
      if (!template) template = allTemplates[0];

      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: `Załadowano szablon: ${template.shortTitle}`,
          blocks: template.blocks.map((b) => ({ ...b, id: uid('tpl') })),
        },
        replyPrefix: `🚀 Załadowałem szablon **"${template.shortTitle}"** (${template.blocks.length} bloków)!`,
      };
    }

    case 'insert_todo': {
      const text = args.text || 'Nowe zadanie';
      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: `Dodano zadanie: "${text}"`,
          blocks: [{ id: uid('todo'), type: 'todo', content: text, checked: !!args.checked }],
        },
        replyPrefix: `✅ Dodałem zadanie To-Do: **"${text}"**.`,
      };
    }

    case 'insert_callout': {
      const text = args.text || 'Ważna informacja';
      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: `Dodano boks: "${text}"`,
          blocks: [
            {
              id: uid('callout'),
              type: 'callout',
              content: text,
              calloutType: args.type || 'info',
            },
          ],
        },
        replyPrefix: `💡 Wstawiłem wyróżniony boks informacyjny.`,
      };
    }

    case 'insert_table': {
      const headers: string[] = args.headers || ['Kolumna 1', 'Kolumna 2'];
      const rows: string[][] = args.rows || [['Wartość A', 'Wartość B']];
      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: 'Dodano tabelę danych',
          blocks: [
            {
              id: uid('table'),
              type: 'table',
              content: args.title || 'Nowa Tabela',
              tableData: [headers, ...rows],
            },
          ],
        },
        replyPrefix: `📊 Dodałem tabelę z kolumnami: ${headers.join(', ')}.`,
      };
    }

    case 'search_wiki': {
      const query = args.query || 'Sztuczna inteligencja';
      const wiki = await searchWikipedia(query);
      if (wiki && wiki.ok) {
        return {
          action: {
            type: 'INSERT_BLOCKS',
            description: `Wstawiono wiedzę z Wikipedii: ${wiki.title}`,
            blocks: wiki.suggestedBlocks,
          },
          replyPrefix: `📖 **Wikipedia: ${wiki.title}**\n\n${wiki.extract}\n\n🔗 *Więcej: [Artykuł w Wikipedii](${wiki.url})*`,
          wikiSource: { title: wiki.title, url: wiki.url },
        };
      }
      return { replyPrefix: `Nie znalazłem artykułu w Wikipedii dla hasła: "${query}".` };
    }

    case 'translate_doc': {
      const targetLang = (args.targetLang || 'en') as SupportedLanguage;
      const translatedBlocks = await translateDocumentBlocks(context.blocks, targetLang);
      return {
        action: {
          type: 'REPLACE_ALL_BLOCKS',
          description: `Przetłumaczono cały dokument na język: ${targetLang.toUpperCase()}`,
          blocks: translatedBlocks,
          targetLang,
        },
        replyPrefix: `🌐 Przetłumaczyłem cały dokument na język **${targetLang.toUpperCase()}**!`,
      };
    }

    case 'summarize_doc': {
      const title = context.docTitle || 'Dokument';
      const totalBlocks = context.blocks.length;
      const headings = context.blocks
        .filter((b) => ['h1', 'h2', 'h3'].includes(b.type) && b.content.trim())
        .map((b) => b.content.trim());
      const tasks = context.blocks.filter((b) => b.type === 'todo');
      const completedTasks = tasks.filter((b) => b.checked).length;

      let summaryText = `### 📌 Podsumowanie Wykonawcze: "${title}"\n\n`;
      summaryText += `• **Rozmiar dokumentu:** ${totalBlocks} bloków roboczych.\n`;
      if (headings.length > 0) {
        summaryText += `• **Struktura rozdziałów:** ${headings.slice(0, 4).join(', ')}.\n`;
      }
      if (tasks.length > 0) {
        summaryText += `• **Realizacja zadań:** ${completedTasks}/${tasks.length} ukończonych.\n`;
      }
      summaryText += `• **Gotowość:** Dokument zredagowany i spójny logicznie.`;

      return {
        action: {
          type: 'INSERT_BLOCKS',
          description: 'Wstawiono podsumowanie wykonawcze dokumentu',
          blocks: [
            {
              id: uid('sum'),
              type: 'callout',
              calloutType: 'info',
              content: summaryText,
            },
          ],
        },
        replyPrefix: `📑 Przygotowałem podsumowanie wykonawcze i wstawiłem je w boksie informacyjnym.`,
      };
    }

    default:
      return {};
  }
}

/**
 * Główny procesor zapytań i poleceń w języku polskim
 */
export async function processPolishCopilotPrompt(
  prompt: string,
  context: {
    docTitle: string;
    blocks: DocBlock[];
    workspaceName?: string;
  }
): Promise<CopilotMessageResponse> {
  const cleanPrompt = prompt.trim();
  const lower = cleanPrompt.toLowerCase();
  const matchedWords = matchWordsInQuery(cleanPrompt);

  const wordsCountInDoc = context.blocks.reduce(
    (acc, b) => acc + (b.content ? b.content.split(/\s+/).filter(Boolean).length : 0),
    0
  );

  const docHeadings = context.blocks
    .filter((b) => ['h1', 'h2', 'h3'].includes(b.type) && b.content.trim())
    .map((b) => b.content.trim());

  // =========================================================================
  // 1. DEDYKOWANA KOMENDA /WIKI ORAZ JAWNE PYTANIA O WIKIPEDIĘ
  // =========================================================================
  const isWikiCommand = cleanPrompt.startsWith('/wiki') || cleanPrompt.startsWith('!wiki');
  const isWikiExplicitQuestion =
    matchesConcept(cleanPrompt, ['sprawdz w wikipedii', 'wyszukaj na wiki', 'co wikipedia mowi', 'wyszukaj w wikipedii']) ||
    (matchesConcept(cleanPrompt, ['wikipedia', 'wiki']) && matchesConcept(cleanPrompt, ['wyszukaj', 'znajdz', 'sprawdz', 'co to']));

  const isStrictEncyclopedicQuestion =
    !isWikiCommand &&
    (cleanPrompt.startsWith('co to jest ') ||
      cleanPrompt.startsWith('kto to byl ') ||
      cleanPrompt.startsWith('kto to był ') ||
      cleanPrompt.startsWith('czym jest ') ||
      cleanPrompt.startsWith('jaka jest stolica ') ||
      cleanPrompt.startsWith('opowiedz o ') ||
      cleanPrompt.startsWith('opowiedz mi o ')) &&
    !cleanPrompt.includes('umiesz') &&
    !cleanPrompt.includes('potrafisz') &&
    !cleanPrompt.includes('twoje') &&
    !cleanPrompt.includes('copilot') &&
    !cleanPrompt.includes('studio');

  if (isWikiCommand || isWikiExplicitQuestion || isStrictEncyclopedicQuestion) {
    let wikiQuery = cleanPrompt;
    if (isWikiCommand) {
      wikiQuery = cleanPrompt.replace(/^(\/wiki|!wiki)\s*/i, '').trim();
    } else if (isWikiExplicitQuestion) {
      wikiQuery = cleanPrompt
        .replace(/.*(wikipedia|wiki|encyklopedia|sprawdź|wyszukaj|mówi o)\s*(w|na|o)?\s*/i, '')
        .replace(/[?.,!]+$/, '')
        .trim();
    } else if (isStrictEncyclopedicQuestion) {
      wikiQuery = cleanPrompt
        .replace(
          /^(co to jest|co to|kto to jest|kto to był|kto to byl|czym jest|wyjaśnij czym jest|wyjasnij czym jest|jaka jest stolica|opowiedz mi o|opowiedz o)\s*/i,
          ''
        )
        .replace(/[?.,!]+$/, '')
        .trim();
    }

    if (wikiQuery && wikiQuery.length >= 2) {
      const wikiResult: WikipediaArticleResult | null = await searchWikipedia(wikiQuery);

      if (wikiResult && wikiResult.ok) {
        return {
          reply: `📖 **Wikipedia: ${wikiResult.title}**\n\n${wikiResult.extract}\n\n🔗 *Źródło: [${wikiResult.title} w Wikipedii](${wikiResult.url})*`,
          action: {
            type: 'INSERT_BLOCKS',
            description: `Wstawiono artykuł z Wikipedii: ${wikiResult.title}`,
            blocks: wikiResult.suggestedBlocks,
          },
          suggestedFollowUps: [
            `Więcej o temacie ${wikiResult.title}`,
            'Przetłumacz ten artykuł na angielski',
            'Dodaj przycisk do źródła',
          ],
          matchedWordsCount: matchedWords.length,
          wikiSource: { title: wikiResult.title, url: wikiResult.url },
        };
      }
    }
  }

  // =========================================================================
  // 2. BEZPOŚREDNIE POLECENIA EDYTORA (DODAJ HEADER, PRZYCISK, SZABLON, TŁUMACZ)
  // =========================================================================

  // A) Nagłówek (H1 / H2 / H3 / Header)
  const isHeaderAction =
    matchesConcept(cleanPrompt, ['header', 'naglowek', 'nagłówek', 'h1', 'h2', 'h3']) &&
    (matchesConcept(cleanPrompt, [
      'dodaj',
      'wstaw',
      'zrob',
      'stworz',
      'utworz',
      'napisz',
      'daj',
      'chce',
      'ustaw',
      'wrzuc',
    ]) ||
      lower.startsWith('header') ||
      lower.startsWith('nagłówek') ||
      lower.startsWith('naglowek') ||
      lower.startsWith('h1') ||
      lower.startsWith('h2') ||
      lower.startsWith('h3'));

  if (isHeaderAction) {
    let headingLevel: 'h1' | 'h2' | 'h3' = 'h2';
    if (lower.includes('h1') || lower.includes('glowny') || lower.includes('główny')) headingLevel = 'h1';
    if (lower.includes('h3') || lower.includes('maly') || lower.includes('mały')) headingLevel = 'h3';

    let headerText = cleanPrompt
      .replace(/^(dodaj|wstaw|zrób|zrob|stwórz|stworz|daj|ustaw|napisz|wrzuć|chcę)?\s*/i, '')
      .replace(/^(header|nagłówek|naglowek|h1|h2|h3)\s*(o nazwie|o tytule|zatytułowany|z tekstem|:)?\s*/i, '')
      .trim();

    if (!headerText || headerText.length < 2) {
      headerText = 'Nowa Sekcja';
    }

    const toolRes = await executeToolCall(
      'insert_header',
      { title: headerText, level: headingLevel },
      context
    );

    return {
      reply: toolRes.replyPrefix || `✅ Dodałem nagłówek (${headingLevel.toUpperCase()}): **"${headerText}"**!`,
      action: toolRes.action,
      suggestedFollowUps: [
        'Dodaj akapit pod nagłówkiem',
        'Wstaw listę zadań To-Do',
        'Dodaj przycisk CTA',
      ],
      matchedWordsCount: matchedWords.length,
    };
  }

  // B) Przycisk akcji (CTA Button)
  const isButtonAction =
    matchesConcept(cleanPrompt, ['przycisk', 'button', 'cta']) &&
    matchesConcept(cleanPrompt, ['dodaj', 'wstaw', 'zrob', 'stworz', 'utworz', 'daj']);

  if (isButtonAction) {
    let targetUrl = 'https://searchpoint.pl';
    const urlMatch = cleanPrompt.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      targetUrl = urlMatch[0];
    }

    let buttonText = 'Przejdź teraz';
    const textMatch = cleanPrompt.match(/(?:tekstem|opisem|napisem|z tekstem)\s+["']?([^"'\n]+?)["']?(?:\s+|$)/i);
    if (textMatch && textMatch[1]) {
      buttonText = textMatch[1].trim();
    } else {
      const stripped = cleanPrompt
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/(?:dodaj|wstaw|zrób|stwórz|przycisk|button|cta|do|link|url)\s*/gi, '')
        .trim();
      if (stripped.length > 1 && stripped.length < 40) {
        buttonText = stripped;
      }
    }

    const toolRes = await executeToolCall(
      'insert_button',
      { text: buttonText, url: targetUrl },
      context
    );

    return {
      reply: toolRes.replyPrefix || `✅ Dodałem przycisk CTA: **"${buttonText}"**!`,
      action: toolRes.action,
      suggestedFollowUps: ['Zmień kolor przycisku', 'Dodaj nagłówek nad przyciskiem'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // C) Wstawianie Megaszablonów
  const isTemplateAction =
    matchesConcept(cleanPrompt, ['szablon', 'template', 'wzorzec', 'starter']) ||
    matchesConcept(cleanPrompt, ['wstaw saas', 'wstaw oferte', 'wstaw onboarding', 'wstaw prd']);

  if (isTemplateAction) {
    let tplKey = 'saas';
    if (matchesConcept(cleanPrompt, ['oferta', 'ofertę', 'b2b', 'agencja', 'wycena'])) tplKey = 'b2b';
    if (matchesConcept(cleanPrompt, ['onboarding', 'wiki', 'baza wiedzy', 'pracownik'])) tplKey = 'onboarding';

    const toolRes = await executeToolCall('insert_template', { template: tplKey }, context);

    return {
      reply: toolRes.replyPrefix || `🚀 Załadowałem szablon do Twojego dokumentu!`,
      action: toolRes.action,
      suggestedFollowUps: ['Przetłumacz na angielski', 'Podsumuj dokument', 'Wyodrębnij zadania na tablicę'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // D) Tłumaczenie dokumentu
  const isTranslateAction =
    matchesConcept(cleanPrompt, ['tlumacz', 'tłumacz', 'przetlumacz', 'przetłumacz', 'translate']);

  if (isTranslateAction) {
    let targetLang: SupportedLanguage = 'en';
    if (matchesConcept(cleanPrompt, ['niemieck', 'german', 'de'])) targetLang = 'de';
    else if (matchesConcept(cleanPrompt, ['hiszpans', 'spanish', 'es'])) targetLang = 'es';
    else if (matchesConcept(cleanPrompt, ['francus', 'french', 'fr'])) targetLang = 'fr';
    else if (matchesConcept(cleanPrompt, ['wlosk', 'włosk', 'italian', 'it'])) targetLang = 'it';
    else if (matchesConcept(cleanPrompt, ['ukrain', 'ukrainian', 'uk'])) targetLang = 'uk';
    else if (matchesConcept(cleanPrompt, ['polsk', 'polish', 'pl'])) targetLang = 'pl';

    const toolRes = await executeToolCall('translate_doc', { targetLang }, context);

    return {
      reply: toolRes.replyPrefix || `🌐 Przetłumaczyłem dokument na język ${targetLang.toUpperCase()}!`,
      action: toolRes.action,
      suggestedFollowUps: ['Cofnij tłumaczenie', 'Przetłumacz na niemiecki', 'Podsumuj dokument'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // E) Podsumowanie dokumentu (TL;DR)
  if (matchesConcept(cleanPrompt, ['podsumuj', 'stresc', 'streść', 'tldr', 'wnioski'])) {
    const toolRes = await executeToolCall('summarize_doc', {}, context);
    return {
      reply: toolRes.replyPrefix || '📑 Przygotowałem podsumowanie dokumentu.',
      action: toolRes.action,
      suggestedFollowUps: ['Wyodrębnij zadania na tablicę Kanban', 'Przetłumacz na angielski'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // =========================================================================
  // 3. INTELIGENTNA OBSŁUGA CZATU I WULGARYZMÓW (BEZ BŁĘDNEJ WIKIPEDII!)
  // =========================================================================

  // Wulgaryzmy: reagujemy ze spokojem, humorem i asertywnością, NIE przeszukując Wikipedii!
  if (matchesConcept(cleanPrompt, ['kurwa', 'chuj', 'pierdol', 'jebac', 'jebać', 'spierdalaj', 'chuju'])) {
    return {
      reply: `Spokojnie mordeczko, bez nerwów! 😎 Pamiętaj, że jestem tu po to, żeby ułatwić Ci pracę. 
Powiedz po prostu, co chcesz zrobić w dokumencie:
• Wstawić nagłówek (np. *"dodaj header Wstęp"*)
• Dodać przycisk CTA (np. *"dodaj przycisk do https://searchpoint.pl z tekstem Sprawdź"*)
• Wstawić mega-szablon (*"wstaw szablon saas"*, *"wstaw ofertę b2b"*)
• Wyszukać wiedzę (*"/wiki [hasło]"*)
• Przetłumaczyć całość na angielski lub niemiecki!`,
      suggestedFollowUps: ['Dodaj header Wstęp', 'Wstaw szablon saas', 'Co umiesz?'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // "Co umiesz" / "Co potrafisz" / "Jakie masz funkcje"
  if (
    matchesConcept(cleanPrompt, ['co umiesz', 'co potrafisz', 'jakie masz funkcje', 'co mozesz zrobic', 'co potrafi ai', 'pomoc', 'help'])
  ) {
    return {
      reply: `🤖 **Co potrafi Studio AI Copilot?**

1. ⚡ **Lokalne AI (Ollama + SmolLM2):**
   Jeśli masz uruchomioną Ollamę na komputerze (\`ollama run smollm2\`), mogę swobodnie myśleć, pisać teksty, wymyślać pomysły i samodzielnie sterować edytorem!

2. ✍️ **Modyfikacje edytora blokowego:**
   • *„dodaj header [tytuł]”* – wstawia nagłówki H1, H2 lub H3
   • *„dodaj przycisk do [URL] z tekstem [napis]”* – tworzy przycisk CTA
   • *„dodaj zadanie [treść]”* – wstawia checklistę zsynchronizowaną z Kanbanem
   • *„dodaj tabelę”* – generuje interaktywną siatkę danych
   • *„podsumuj dokument”* – tworzy boks z wnioskami wykonawczymi

3. 🚀 **Zaawansowane szablony biznesowe:**
   • *„wstaw szablon saas”* (SaaS PRD 2026 – 28 bloków)
   • *„wstaw ofertę b2b”* (Kompleksowa Oferta B2B 2026 – 26 bloków)
   • *„wstaw onboarding”* (Baza Wiedzy & Onboarding – 27 bloków)

4. 🌐 **Wiedza w czasie rzeczywistym:**
   • *„/wiki [hasło]”* – natychmiast pobiera artykuł z Wikipedii z podglądem i cytowaniem.

5. 🌍 **Darmowy translator wielojęzyczny:**
   • *„przetłumacz na angielski / niemiecki / hiszpański / francuski / ukraiński”*`,
      suggestedFollowUps: ['Wstaw szablon saas', 'Dodaj header Specyfikacja', '/wiki sztuczna inteligencja'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // "Jak się masz" / "Co tam" / "Siemanko"
  if (
    matchesConcept(cleanPrompt, ['jak sie masz', 'jak się masz', 'co tam', 'co slychac', 'co słychać', 'jak leci'])
  ) {
    return {
      reply: `U mnie wszystko super, dzięki za pytanie! 🚀 Silniki gotowe, pracujemy nad dokumentem **"${context.docTitle || 'Twój projekt'}"** (${context.blocks.length} bloków). W czym mogę Ci teraz pomóc? Mogę wstawić nagłówek, przygotować podsumowanie lub załadować szablon!`,
      suggestedFollowUps: ['Dodaj header Następne kroki', 'Wstaw szablon saas', 'Podsumuj dokument'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // Zwykłe powitania
  if (matchesConcept(cleanPrompt, ['hejka', 'hej', 'siema', 'siemanko', 'elo', 'czesc', 'cześć', 'witam', 'dzien dobry'])) {
    return {
      reply: `Cześć! 👋 Melduję się na posterunku. Pracujemy nad **"${context.docTitle}"**. Wpisz polecenie edytora (np. *"dodaj header Nowy Rozdział"*), wpisz *"/wiki [hasło]"* albo zapytaj mnie o cokolwiek!`,
      suggestedFollowUps: ['Dodaj header Wstęp', 'Wstaw szablon saas', 'Co umiesz?'],
      matchedWordsCount: matchedWords.length,
    };
  }

  // =========================================================================
  // 4. LOKALNE AI: OLLAMA + SMOLLM2 (Z PEŁNYM DOSTĘPEM DO NARZĘDZI)
  // =========================================================================
  const ollamaStatus: OllamaStatus = await checkOllamaAvailability();

  if (ollamaStatus.isAvailable) {
    try {
      const ollamaRes = await callOllamaWithTools(cleanPrompt, {
        docTitle: context.docTitle,
        existingBlocksCount: context.blocks.length,
        headings: docHeadings,
      });

      let finalAction: CopilotActionPayload | undefined;
      let replyText = ollamaRes.reply;
      let wikiSource: { title: string; url: string } | undefined;

      // Jeśli SmolLM2 zdecydował się wywołać narzędzie edytora:
      if (ollamaRes.action && ollamaRes.action.tool) {
        const executed = await executeToolCall(
          ollamaRes.action.tool,
          ollamaRes.action.args || {},
          context
        );
        finalAction = executed.action;
        if (executed.replyPrefix) {
          replyText = `${executed.replyPrefix}\n\n${replyText}`.trim();
        }
        if (executed.wikiSource) {
          wikiSource = executed.wikiSource;
        }
      }

      return {
        reply: replyText,
        action: finalAction,
        suggestedFollowUps: [
          'Dodaj kolejną sekcję',
          'Przetłumacz na angielski',
          'Podsumuj dokument',
        ],
        matchedWordsCount: matchedWords.length,
        wikiSource,
        ollamaUsed: true,
      };
    } catch (ollamaErr: any) {
      console.warn('Ollama invocation error:', ollamaErr);
    }
  }

  // =========================================================================
  // 5. GDY BRAK OLLAMY: INFORMACJA O WYMAGANIU OLLAMY DLA GENERATYWNEGO AI
  // =========================================================================
  // "JESLI USER MA OLLAMA NA KOMPIE HELP BY AI SIE POKAZUJE JESLI NIE MA TO NIE MA AI"
  return {
    reply: `💡 **Lokalne AI nie jest obecnie aktywne na Twoim komputerze.**

Twoje zapytanie: *„${cleanPrompt}”*

Aby korzystać z prawdziwego AI i rozmawiać z modelem **SmolLM2** w 100% lokalnie, prywatnie i bez limitów:
1. Zainstaluj i uruchom Ollamę na komputerze:
\`\`\`bash
ollama run smollm2
\`\`\`
2. Kliknij **„Sprawdź połączenie”** w panelu Copilota!

---
🛠️ **Niezależnie od AI, możesz od razu korzystać z szybkich narzędzi:**
• **Dodaj header [Tytuł]** – wstawia nagłówek
• **Dodaj przycisk do [URL] z tekstem [Napis]** – wstawia przycisk CTA
• **/wiki [hasło]** – wyszukiwanie w Wikipedii w czasie rzeczywistym
• **Wstaw szablon saas / ofertę / onboarding** – ładuje 25+ bloków
• **Przetłumacz na angielski / niemiecki / hiszpański** – tłumaczy cały dokument`,
    suggestedFollowUps: [
      'Co umiesz?',
      'Dodaj header Wprowadzenie',
      'Wstaw szablon saas',
      '/wiki sztuczna inteligencja',
    ],
    matchedWordsCount: matchedWords.length,
    ollamaUsed: false,
  };
}
