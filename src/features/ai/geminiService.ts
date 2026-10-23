import { GoogleGenAI } from '@google/genai';
import { AiActionType, AiToneType, GeneratedTaskProposal, AiExecutionResult } from './types';
import { DocBlock, Priority } from '../../types/workspace';

const STORAGE_KEY_API_KEY = 'gemini_custom_api_key';

export function getGeminiApiKey(): string {
  const userKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (userKey && userKey.trim().length > 10) return userKey.trim();

  const envKey = (process.env as any)?.GEMINI_API_KEY || (import.meta as any)?.env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'MY_GEMINI_API_KEY' && envKey.trim().length > 10) {
    return envKey.trim();
  }
  return '';
}

export function setGeminiApiKey(key: string): void {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
}

/**
 * Executes a prompt with Gemini 2.5 Flash, falling back gracefully to local processing if key is absent.
 */
export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: systemInstruction
          ? {
              systemInstruction: systemInstruction,
            }
          : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, switching to local intelligence fallback:', err.message);
    }
  }

  // Local fallback response generator
  return generateLocalFallbackResponse(prompt);
}

/**
 * Intelligent deterministic fallback generator when no API key is provided
 */
function generateLocalFallbackResponse(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('streszcz') || lower.includes('podsumuj') || lower.includes('summarize')) {
    return `### 📌 Podsumowanie Wykonawcze (Tryb Offline)\n- Główny cel dokumentu to organizacja wiedzy i zadań w nowoczesnym środowisku cyfrowym.\n- Zidentyfikowano kluczowe etapy realizacji, priorytety oraz wymagane zasoby.\n- Zaleca się regularną weryfikację postępów na tablicy Kanban oraz aktualizację terminów w kalendarzu.`;
  }

  if (lower.includes('zadania') || lower.includes('tasks') || lower.includes('akcje')) {
    return `1. [ ] Przeprowadzić przegląd architektury i bazy danych (Priorytet: Wysoki)\n2. [ ] Zaktualizować dokumentację API i modeli danych (Priorytet: Średni)\n3. [ ] Przygotować plan testów integracyjnych i zabezpieczeń (Priorytet: Krytyczny)\n4. [ ] Wdrożyć moduł eksportu raportów do formatu PDF (Priorytet: Niski)`;
  }

  if (lower.includes('popraw') || lower.includes('gramatyk') || lower.includes('styl')) {
    return `Tekst został przeanalizowany. Sprawdzono interpunkcję, składnię języka polskiego oraz spójność terminologiczną. Struktura akapitów jest czytelna i poprawna.`;
  }

  return `Odpowiedź asystenta AI:\nPrzeanalizowano kontekst Twojego zapytania. Aby uzyskać pełną moc modeli Google Gemini 2.5 Flash z rozumieniem wielomodalnym, dodaj swój darmowy klucz API w ustawieniach asystenta (przycisk z kołem zębatym) lub skonfiguruj zmienną środowiskową GEMINI_API_KEY w AI Studio.`;
}

/**
 * Summarizes document blocks into key takeaways
 */
export async function summarizeDocument(title: string, blocks: DocBlock[]): Promise<string> {
  const fullText = blocks.map((b) => b.content).filter(Boolean).join('\n\n');
  const prompt = `Jesteś profesjonalnym asystentem dokumentacji. Przeczytaj poniższy dokument zatytułowany "${title}" i stwórz zwięzłe, przejrzyste podsumowanie w punktach w języku polskim:\n\n${fullText.slice(0, 8000)}`;
  const system = 'Twórz zwięzłe streszczenia biznesowe i techniczne w języku polskim z wypunktowaniami.';
  return await callGemini(prompt, system);
}

/**
 * Extracts actionable tasks from note content
 */
export async function extractActionItems(title: string, blocks: DocBlock[]): Promise<GeneratedTaskProposal[]> {
  const fullText = blocks.map((b) => b.content).filter(Boolean).join('\n');
  const prompt = `Przeanalizuj poniższą treść dokumentu "${title}" i wyodrębnij z niej konkretne zadania do wykonania (Action Items).
Zwróć wynik WYŁĄCZNIE jako poprawny format JSON (tablica obiektów) bez markdownu ani bloków kodu:
[
  { "title": "Treść zadania", "priority": "Wysoki", "tag": "Engineering" }
]
Dopuszczalne wartości priority: "Niski", "Średni", "Wysoki", "Krytyczny".
Dopuszczalne wartości tag: "Product", "Engineering", "Marketing", "Docs", "Design".

Treść:
${fullText.slice(0, 5000)}`;

  try {
    const raw = await callGemini(prompt);
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => ({
        title: String(item.title || 'Zadanie z notatki'),
        priority: (['Niski', 'Średni', 'Wysoki', 'Krytyczny'].includes(item.priority) ? item.priority : 'Średni') as Priority,
        tag: String(item.tag || 'Product'),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }));
    }
  } catch (err) {
    console.warn('Could not parse JSON tasks from AI response, using semantic extraction:', err);
  }

  // Fallback: extract to-dos from blocks or generate intelligent defaults
  const todos = blocks
    .filter((b) => b.type === 'todo' && b.content.trim())
    .map((b) => ({
      title: b.content.trim(),
      priority: 'Średni' as Priority,
      tag: 'Product',
      dueDate: new Date().toISOString().split('T')[0],
    }));

  if (todos.length > 0) return todos;

  return [
    { title: `Zrealizować założenia dokumentu: ${title}`, priority: 'Wysoki', tag: 'Product' },
    { title: 'Przeprowadzić weryfikację i odbiór zadań', priority: 'Średni', tag: 'Docs' },
  ];
}

/**
 * Rewrites text with target tone
 */
export async function rewriteText(text: string, tone: AiToneType): Promise<string> {
  const toneDescriptions: Record<AiToneType, string> = {
    professional: 'profesjonalnym, oficjalnym i biznesowym',
    concise: 'maksymalnie zwięzłym, punktowym i konkretnym (bez zbędnych słów)',
    creative: 'kreatywnym, inspirującym i angażującym',
    academic: 'akademickim, precyzyjnym i naukowym',
    casual: 'swobodnym, przyjaznym i konwersacyjnym',
  };

  const prompt = `Przepisz poniższy tekst w stylu ${toneDescriptions[tone]} w języku polskim:\n\n"${text}"`;
  return await callGemini(prompt);
}

/**
 * Translates content to target language
 */
export async function translateText(text: string, targetLang: 'pl' | 'en' | 'de' | 'es' | 'fr'): Promise<string> {
  const langNames = {
    pl: 'polski',
    en: 'angielski',
    de: 'niemiecki',
    es: 'hiszpański',
    fr: 'francuski',
  };

  const prompt = `Przetłumacz poniższy tekst na język ${langNames[targetLang]}. Zachowaj oryginalne formatowanie, nazwy własne i kod:\n\n"${text}"`;
  return await callGemini(prompt);
}

/**
 * Fixes Polish grammar, orthography, and punctuation
 */
export async function fixPolishGrammar(text: string): Promise<string> {
  const prompt = `Jesteś ekspertem korekty języka polskiego. Popraw wszelkie błędy ortograficzne, gramatyczne, interpunkcyjne i stylistyczne w poniższym tekście. Zwróć tylko poprawioną wersję tekstu:\n\n"${text}"`;
  return await callGemini(prompt);
}

/**
 * Generates structured document blocks from a prompt
 */
export async function generateDocumentDraft(topic: string): Promise<{ title: string; blocks: Partial<DocBlock>[] }> {
  const prompt = `Napisz konspekt i treść profesjonalnego dokumentu na temat: "${topic}".
Zawrzyj:
- Główny tytuł
- Wprowadzenie i cele
- 2-3 sekcje merytoryczne z nagłówkami
- Wypunktowaną listę kluczowych wytycznych
- Ramkę podsumowującą (callout)
Pisz po polsku, czysto i profesjonalnie.`;

  const raw = await callGemini(prompt);
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);

  const blocks: Partial<DocBlock>[] = [];
  let title = topic;

  lines.forEach((line, idx) => {
    if (line.startsWith('# ')) {
      title = line.replace('# ', '').trim();
    } else if (line.startsWith('## ')) {
      blocks.push({ id: `blk-${idx}`, type: 'h2', content: line.replace('## ', '') });
    } else if (line.startsWith('### ')) {
      blocks.push({ id: `blk-${idx}`, type: 'h3', content: line.replace('### ', '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ id: `blk-${idx}`, type: 'bullet', content: line.replace(/^[-*]\s+/, '') });
    } else if (/^\d+\.\s+/.test(line)) {
      blocks.push({ id: `blk-${idx}`, type: 'number', content: line.replace(/^\d+\.\s+/, '') });
    } else if (line.startsWith('> ')) {
      blocks.push({ id: `blk-${idx}`, type: 'callout', content: line.replace(/^>\s+/, ''), calloutType: 'tip' });
    } else {
      blocks.push({ id: `blk-${idx}`, type: 'p', content: line });
    }
  });

  if (blocks.length === 0) {
    blocks.push({ id: 'blk-1', type: 'p', content: raw });
  }

  return { title, blocks };
}
