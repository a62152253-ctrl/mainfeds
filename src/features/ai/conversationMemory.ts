/**
 * Pamięć Kontekstu Konwersacji (Multi-Turn Conversation Memory)
 * Zapewnia doświadczenie ciągłości dialogu jak w GPT.
 * Pamięta poprzednie wątki, encje i kontekst pytań pomocniczych.
 */

export interface ConversationTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  extractedTopic?: string;
  intent?: string;
}

export interface ConversationContextState {
  lastTopic?: string;
  lastIntent?: string;
  lastCodeSnippet?: string;
  lastPageDraft?: { title: string; content: string };
  lastTaskDraft?: { title: string; priority: string };
  recentTurns: ConversationTurn[];
}

class ConversationMemoryManager {
  private state: ConversationContextState = {
    recentTurns: [],
  };

  public recordTurn(turn: ConversationTurn) {
    this.state.recentTurns.push(turn);
    if (this.state.recentTurns.length > 10) {
      this.state.recentTurns.shift(); // zachowaj ostatnie 10 wypowiedzi
    }

    if (turn.extractedTopic) {
      this.state.lastTopic = turn.extractedTopic;
    }
    if (turn.intent) {
      this.state.lastIntent = turn.intent;
    }
  }

  public setLastPageDraft(draft: { title: string; content: string }) {
    this.state.lastPageDraft = draft;
  }

  public setLastTaskDraft(draft: { title: string; priority: string }) {
    this.state.lastTaskDraft = draft;
  }

  public getLastTopic(): string | undefined {
    return this.state.lastTopic;
  }

  public getLastPageDraft() {
    return this.state.lastPageDraft;
  }

  public getLastTaskDraft() {
    return this.state.lastTaskDraft;
  }

  public getContextState(): ConversationContextState {
    return { ...this.state };
  }

  public clear() {
    this.state = {
      recentTurns: [],
    };
  }

  public clearHistory() {
    this.clear();
  }
}

export const conversationMemory = new ConversationMemoryManager();
