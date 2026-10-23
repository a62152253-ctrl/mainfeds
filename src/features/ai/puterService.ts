/**
 * Puter.js AI Integration Service (Open-Source MIT from GitHub: HeyPuter/puter)
 * 100% darmowy klient GPT-4o-mini / Claude bez kluczy API, bez rejestracji i bez opłat.
 * Posiada automatyczny fallback na lokalny silnik wiedzy.
 */

import { reasonAboutUserInput, ReasoningResult } from './reasoning';
import { composeBotAnswer, GeneratedAnswer, AnswerContext } from './answering';

interface PuterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class PuterAiService {
  private isLoaded = false;
  private loadPromise: Promise<any> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.ensureScriptLoaded();
    }
  }

  public ensureScriptLoaded(): Promise<any> {
    if (this.loadPromise) return this.loadPromise;

    if (typeof window === 'undefined') {
      return Promise.resolve(null);
    }

    if ((window as any).puter?.ai) {
      this.isLoaded = true;
      return Promise.resolve((window as any).puter);
    }

    this.loadPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[src*="js.puter.com"]');
      if (existing) {
        if ((window as any).puter?.ai) {
          this.isLoaded = true;
          return resolve((window as any).puter);
        }
        existing.addEventListener('load', () => {
          this.isLoaded = true;
          resolve((window as any).puter);
        });
        existing.addEventListener('error', () => resolve(null));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.puter.com/v2/';
      script.async = true;
      script.onload = () => {
        this.isLoaded = true;
        resolve((window as any).puter);
      };
      script.onerror = () => {
        console.warn('Puter.js script load failed, using local engine fallback.');
        resolve(null);
      };
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Sprawdza czy Puter.js jest gotowy
   */
  public isReady(): boolean {
    return !!((window as any).puter?.ai);
  }

  /**
   * Główna funkcja czatu: używa GPT-4o-mini przez Puter.js z fallbackiem na autorski silnik
   */
  public async chat(
    userPrompt: string,
    history: Array<{ sender: 'user' | 'assistant'; content: string }>,
    context: AnswerContext
  ): Promise<GeneratedAnswer & { modelUsed: string }> {
    const rawLower = userPrompt.toLowerCase().trim();

    // 1. Natychmiastowa obsługa komend systemowych (0 opóźnień)
    if (
      rawLower.includes('@swith_workspace') ||
      rawLower.includes('@switch_workspace') ||
      rawLower === 'pulpit'
    ) {
      return {
        text: `🚀 **Przełączam na pełny pulpit workspace!**\n\nZgodnie z poleceniem aktywuję widok Home (Pulpit), z podsumowaniem zadań, projektami i kalendarzem, a sam przechodzę do okna bocznego po prawej stronie ekranu.\n\n💡 **Powrót do AI:** Wpisz polecenie \`@swith_Ai\` lub kliknij przycisk powiększenia w nagłówku.`,
        actionTrigger: 'switch_workspace',
        suggestedPills: ['@swith_Ai', 'Jakie mam zadania?', 'Nowa notatka ze spotkania'],
        modelUsed: 'System Kernel',
      };
    }

    if (
      rawLower.includes('@swith_ai') ||
      rawLower.includes('@switch_ai') ||
      rawLower.includes('@ai_fullscreen') ||
      rawLower === '80%'
    ) {
      return {
        text: `⚡ **Maksymalizuję AI Chatbot na 80% ekranu!**\n\nPrzełączono z powrotem do widoku asystenta (80% szerokości ekranu). Możemy teraz wygodnie pracować nad treściami i projektami.\n\n💡 **Wskazówka:** Aby wrócić do głównego pulpitu, wpisz \`@swith_workspace\`.`,
        actionTrigger: 'expand_ai',
        suggestedPills: ['@swith_workspace', 'Zaplanuj sprint', 'Napisz dokument'],
        modelUsed: 'System Kernel',
      };
    }

    // 2. Analiza semantyczna i przygotowanie lokalne
    const reasoning: ReasoningResult = reasonAboutUserInput(userPrompt);
    const localAnswer = composeBotAnswer(reasoning, context);

    // Jeśli zapytanie wywołało konkretną akcję systemową (streszczenie, badanie, zadania, audyt, live editor itp.)
    if (localAnswer.actionTrigger) {
      return {
        ...localAnswer,
        modelUsed: 'Workspace Engine 2.0',
      };
    }

    // 3. Próba wywołania prawdziwego modelu GPT-4o-mini przez Puter.js
    await this.ensureScriptLoaded();

    const puter = (window as any).puter;
    if (puter?.ai?.chat) {
      try {
        const systemPrompt = `Jesteś oficjalnym inteligentnym asystentem w aplikacji SearchPoint Studio.
Użytkownik ma na imię ${context.userName || 'Użytkownik'}.
Stan jego workspace: ${context.pagesCount} stron notatek, ${context.tasksCount} zadań (${context.activeTasksCount} w toku, ${context.doneTasksCount} ukończonych).
Rozmawiasz naturalnie, płynnie, profesjonalnie i z polotem po polsku – dokładnie jak GPT.

ZASADA KLUCZOWA:
NIGDY nie używaj nazwy 'Notion' – jesteś autorskim asystentem SearchPoint Studio!
SearchPoint Studio to nowoczesne, 100% darmowe środowisko pracy i baza wiedzy, działające jako Local-First na relacyjnej bazie SQLite wprost w przeglądarce (Zero-Lag, 100% prywatności, brak jakichkolwiek limitów bloków czy subskrypcji).

Pełna wiedza o edytorze i blokach SearchPoint Studio:
- Posiada ponad 50 modularnych typów bloków w 6 kategoriach:
  1. Tekst i Nagłówki: p, h1, h2, h3, h4, h5, h6, quote (cytat z autorem), callout (5 typów wyróżnień), summary_box (boks podsumowania TL;DR)
  2. Listy i Zadania: bullet (punktowana), numbered (numerowana), todo (interaktywna z paskiem postępu %), toggle (zwijany akordeon)
  3. Dane i Tabele: table (interaktywny arkusz), spec_table (specyfikacja parametrów klucz-wartość), pros_cons (zalety i wady z kolorowymi plusami/minusami)
  4. Kod, Inżynieria i Diagramy: code (syntax highlighting dla 11 języków), code_runner (live runner kodu w przeglądarce), mermaid (diagramy UML, Flowchart, Sequence, ERD), math (wzory matematyczne LaTeX / KaTeX)
  5. Zarządzanie Projektami & Mini-Asana: kanban (tablica kolumnowa w dokumencie), roadmap (kamienie milowe Q1-Q4), signature (cyfrowy podpis akceptacji)
  6. Interaktywne Widgety: countdown (licznik deadline), faq (zwijane pytania), before_after (suwak porównawczy przed/po), target_meter (wskaźnik celu %), audio (odtwarzacz z TTS), file_card (karta pliku), changelog (historia wydań), testimonial (opinia klienta), ai_prompt (blok generatywny).
- Technologia Wspólnych Notatek: wpisanie \`@email\` (np. \`@kamill@eskp.pl\`) w edytorze notatki natychmiast nadaje współpracownikowi uprawnienia Admina i dostęp do edycji oraz dyskusji/komentarzy. Notatka automatycznie pojawia się w sekcji 'Wspólne notatki' w pasku bocznym.

Znasz komendy systemowe studia:
- @swith_workspace : przełącza widok na pełny pulpit Home
- @swith_Ai : maksymalizuje czat AI na 80% ekranu
Gdy użytkownik poprosi o stworzenie dokumentu lub notatki, ułóż ją w czytelnym formacie Markdown z nagłówkami.
Gdy pyta o zadania, zaproponuj priorytety (Krytyczny, Wysoki, Średni, Niski).
Odpowiadaj na każde pytanie merytorycznie, wyczerpująco i z humorem, bez sztucznych ograniczeń.`;

        // Zbuduj historię ostatnich wiadomości
        const messages: PuterMessage[] = [
          { role: 'system', content: systemPrompt },
        ];

        const recentHistory = history.slice(-6);
        for (const msg of recentHistory) {
          messages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
          });
        }
        messages.push({ role: 'user', content: userPrompt });

        // Timeout 10s na odpowiedź z zewnętrznego API
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Puter timeout')), 10000)
        );

        const chatPromise = puter.ai.chat(messages, {
          model: 'gpt-4o-mini',
          temperature: 0.7,
        });

        const response: any = await Promise.race([chatPromise, timeoutPromise]);

        let responseText = '';
        if (typeof response === 'string') {
          responseText = response;
        } else if (response?.message?.content) {
          responseText = response.message.content;
        } else if (response?.text) {
          responseText = response.text;
        }

        if (responseText && responseText.trim().length > 5) {
          // Wykryj czy model zaproponował @swith_workspace
          let actionTrigger: GeneratedAnswer['actionTrigger'] = undefined;
          if (responseText.includes('@swith_workspace')) {
            actionTrigger = 'switch_workspace';
          } else if (responseText.includes('@swith_Ai')) {
            actionTrigger = 'expand_ai';
          }

          // Sprawdź czy odpowiedź jest notatką
          let preparedPageDraft = localAnswer.preparedPageDraft;
          if (
            (reasoning.intent === 'NOTES_AND_DOCUMENTATION' || responseText.includes('###')) &&
            responseText.length > 200
          ) {
            const firstLine = responseText.split('\n')[0].replace(/[#*`]/g, '').trim() || 'Notatka od AI';
            preparedPageDraft = {
              title: firstLine,
              content: responseText,
            };
          }

          return {
            text: responseText,
            actionTrigger,
            suggestedPills: localAnswer.suggestedPills,
            preparedPageDraft,
            preparedTaskDraft: localAnswer.preparedTaskDraft,
            modelUsed: 'Puter GPT-4o-mini (MIT)',
          };
        }
      } catch (err: any) {
        console.warn('Puter.ai call failed or timed out, falling back to native engine:', err?.message || err);
      }
    }

    // 4. Fallback na autorski silnik z bazą 50k słów
    return {
      ...localAnswer,
      modelUsed: 'Autorski Silnik 50k Słów (Offline & Zero-Lag)',
    };
  }
}

export const puterAi = new PuterAiService();

export function ensurePuterLoaded(): Promise<any> {
  return puterAi.ensureScriptLoaded();
}
