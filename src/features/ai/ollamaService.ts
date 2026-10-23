/**
 * Serwis integracji z lokalnym modelem Ollama (domyślnie SmolLM2).
 * Umożliwia w 100% lokalne, darmowe i prywatne generowanie odpowiedzi oraz wywoływanie narzędzi edytora.
 */

export interface OllamaModelInfo {
  name: string;
  size: number;
  modified_at: string;
}

export interface OllamaStatus {
  isAvailable: boolean;
  url: string;
  selectedModel: string;
  availableModels: string[];
  error?: string;
}

const STORAGE_OLLAMA_URL = 'ollama_endpoint_url';
const STORAGE_OLLAMA_MODEL = 'ollama_selected_model';

export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_MODEL = 'smollm2';

export function getOllamaUrl(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem(STORAGE_OLLAMA_URL);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
  }
  return DEFAULT_OLLAMA_URL;
}

export function setOllamaUrl(url: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && url.trim()) {
      localStorage.setItem(STORAGE_OLLAMA_URL, url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem(STORAGE_OLLAMA_URL);
    }
  }
}

export function getOllamaModel(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const custom = localStorage.getItem(STORAGE_OLLAMA_MODEL);
    if (custom && custom.trim()) {
      return custom.trim();
    }
  }
  return DEFAULT_OLLAMA_MODEL;
}

export function setOllamaModel(model: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (model && model.trim()) {
      localStorage.setItem(STORAGE_OLLAMA_MODEL, model.trim());
    } else {
      localStorage.removeItem(STORAGE_OLLAMA_MODEL);
    }
  }
}

/**
 * Sprawdza czy Ollama działa na komputerze użytkownika
 */
export async function checkOllamaAvailability(): Promise<OllamaStatus> {
  const url = getOllamaUrl();
  const currentModel = getOllamaModel();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${url}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        isAvailable: false,
        url,
        selectedModel: currentModel,
        availableModels: [],
        error: `Ollama odpowiedziała statusem HTTP ${res.status}`,
      };
    }

    const data = await res.json();
    const models: string[] = Array.isArray(data.models)
      ? data.models.map((m: any) => m.name || m.model).filter(Boolean)
      : [];

    // Jeśli wybrany model nie istnieje, ale są inne modele, wybierz smollm2 lub pierwszy pasujący
    let activeModel = currentModel;
    if (models.length > 0 && !models.some((m) => m.startsWith(currentModel))) {
      const smol = models.find((m) => m.toLowerCase().includes('smollm'));
      if (smol) {
        activeModel = smol;
      } else {
        activeModel = models[0];
      }
    }

    return {
      isAvailable: true,
      url,
      selectedModel: activeModel,
      availableModels: models,
    };
  } catch (err: any) {
    const isCorsOrOffline =
      err.name === 'AbortError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError');

    return {
      isAvailable: false,
      url,
      selectedModel: currentModel,
      availableModels: [],
      error: isCorsOrOffline
        ? 'Brak połączenia z lokalną Ollamą (127.0.0.1:11434). Upewnij się, że Ollama jest uruchomiona.'
        : err.message,
    };
  }
}

export interface OllamaToolCallResult {
  thought?: string;
  reply: string;
  action?: {
    tool: string;
    args: Record<string, any>;
  };
}

/**
 * Wywołuje Ollamę (np. model SmolLM2) z instruktarzem narzędzi edytora.
 */
export async function callOllamaWithTools(
  prompt: string,
  context: {
    docTitle: string;
    existingBlocksCount: number;
    headings: string[];
  }
): Promise<OllamaToolCallResult> {
  const url = getOllamaUrl();
  const model = getOllamaModel();

  const systemPrompt = `Jesteś "Studio AI Copilot" – inteligentnym, przyjaznym asystentem w polskiej aplikacji do notatek i dokumentów "Nowoczesne Studio".
Pracujesz na modelu: ${model} działającym w 100% lokalnie w środowisku Ollama.
Rozmawiasz naturalnie po polsku, życzliwie, rzeczowo i swobodnie (jak pomocny kolega z zespołu). Rozumiesz slang, luźną rozmowę oraz pytania techniczne i ogólne.

Aktualny dokument:
- Tytuł: "${context.docTitle || 'Nowy dokument'}"
- Liczba bloków: ${context.existingBlocksCount}
- Nagłówki w dokumencie: ${context.headings.join(', ') || 'Brak'}

MASZ DO DYSPOZYCJI NARZĘDZIA EDYTORA.
Gdy użytkownik prosi Cię o dodanie lub zmianę czegokolwiek w dokumencie, dołącz na końcu swojej odpowiedzi blok JSON w formacie:
<<<TOOL_CALL>>>
{
  "tool": "NAZWA_NARZĘDZIA",
  "args": { ...argumenty... }
}
<<<END_TOOL_CALL>>>

DOSTĘPNE NARZĘDZIA:
1. "insert_header" - dodaje nagłówek. args: {"title": "Tekst nagłówka", "level": "h1"|"h2"|"h3"}
2. "insert_button" - dodaje przycisk akcji (CTA). args: {"text": "Treść przycisku", "url": "https://..."}
3. "insert_template" - wstawia zaawansowany szablon. args: {"template": "saas_prd"|"b2b_offer"|"company_onboarding"}
4. "insert_todo" - dodaje zadanie To-Do. args: {"text": "Treść zadania", "checked": false}
5. "insert_callout" - dodaje wyróżniony boks. args: {"text": "Ważna informacja", "type": "info"|"tip"|"warning"}
6. "insert_table" - dodaje tabelę. args: {"title": "Tabela", "headers": ["Kolumna 1", "Kolumna 2"], "rows": [["A", "B"]]}
7. "search_wiki" - przeszukuje Wikipedię. args: {"query": "hasło"}
8. "translate_doc" - tłumaczy cały dokument. args: {"targetLang": "en"|"de"|"es"|"fr"|"pl"}
9. "summarize_doc" - generuje podsumowanie dokumentu. args: {}

ZASADY:
- Jeśli użytkownik po prostu z Tobą rozmawia (np. "jak się masz", "co umiesz", "pomóż mi w pomyśle"), ODPOWIADAJ NORMALNIE PO POLSKU bez wywoływania narzędzi.
- NIE wstawiaj bloku <<<TOOL_CALL>>>, chyba że użytkownik wyraźnie prosi o wykonanie akcji (np. dodaj nagłówek, wstaw szablon, przycisk).
- Bądź zwięzły, konkretny i pomocny.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: {
          temperature: 0.7,
        },
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama zwróciła błąd ${res.status}: ${errText || res.statusText}`);
    }

    const json = await res.json();
    const rawContent: string = json.message?.content || json.response || '';

    // Parsowanie wywołania narzędzia
    let cleanReply = rawContent;
    let toolAction: { tool: string; args: Record<string, any> } | undefined;

    const toolMatch = rawContent.match(/<<<TOOL_CALL>>>([\s\S]*?)<<<END_TOOL_CALL>>>/);
    if (toolMatch) {
      try {
        const parsed = JSON.parse(toolMatch[1].trim());
        if (parsed.tool) {
          toolAction = {
            tool: parsed.tool,
            args: parsed.args || {},
          };
          cleanReply = rawContent.replace(/<<<TOOL_CALL>>>[\s\S]*?<<<END_TOOL_CALL>>>/, '').trim();
        }
      } catch (e) {
        console.warn('Nie udało się sparsować TOOL_CALL:', e);
      }
    }

    return {
      reply: cleanReply || 'Gotowe! Wykonałem to dla Ciebie.',
      action: toolAction,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    throw err;
  }
}
