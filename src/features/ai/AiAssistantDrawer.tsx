import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  FileText,
  CheckSquare,
  Wand2,
  Globe,
  Settings,
  Send,
  Copy,
  Check,
  PlusCircle,
  Key,
  Shield,
  Layers,
  RefreshCw,
  LayoutTemplate,
  MessageSquare,
  Bot,
  User,
  Zap,
  ArrowRight,
  Smile,
  ExternalLink,
  Lock,
  BookOpen,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useOllama } from './useOllama';
import {
  callGemini,
  summarizeDocument,
  extractActionItems,
  rewriteText,
  translateText,
  fixPolishGrammar,
  getGeminiApiKey,
  setGeminiApiKey,
} from './geminiService';
import { processPolishCopilotPrompt, CopilotActionPayload } from './polishConversationalEngine';
import { ADVANCED_TEMPLATES, AdvancedTemplate } from '../templates/advancedTemplates';
import { DocBlock, Priority } from '../../types/workspace';
import { AiToneType, GeneratedTaskProposal } from './types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  action?: CopilotActionPayload;
  suggestedFollowUps?: string[];
  matchedWordsCount?: number;
  wikiSource?: {
    title: string;
    url: string;
    extract?: string;
    thumbnail?: string;
  };
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  docId: string;
  docIcon?: string;
  blocks: DocBlock[];
  onInsertBlocks: (newBlocks: Partial<DocBlock>[]) => void;
  onReplaceBlocks: (newBlocks: DocBlock[]) => void;
  onRenameDoc: (newTitle: string) => void;
  onChangeIcon: (newIcon: string) => void;
  onAddTasks?: (tasks: GeneratedTaskProposal[]) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  docTitle,
  docId,
  docIcon,
  blocks,
  onInsertBlocks,
  onReplaceBlocks,
  onRenameDoc,
  onChangeIcon,
  onAddTasks,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'templates' | 'actions' | 'settings'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState<AiToneType>('professional');
  const [selectedLang, setSelectedLang] = useState<'en' | 'de' | 'es' | 'fr' | 'pl'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Lokalne AI - Ollama Hook
  const {
    isOllamaAvailable,
    status: ollamaStatus,
    isChecking: isCheckingOllama,
    recheck: recheckOllama,
    changeModel: changeOllamaModel,
    changeUrl: changeOllamaUrl,
  } = useOllama();

  const [ollamaUrlInput, setOllamaUrlInput] = useState(ollamaStatus.url);
  const [ollamaModelInput, setOllamaModelInput] = useState(ollamaStatus.selectedModel);

  useEffect(() => {
    setOllamaUrlInput(ollamaStatus.url);
    setOllamaModelInput(ollamaStatus.selectedModel);
  }, [ollamaStatus.url, ollamaStatus.selectedModel]);

  // Chat conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Initialize welcoming chat message with active document context
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: 'msg-init',
        sender: 'bot',
        text: isOllamaAvailable
          ? `Hejka! 👋 Jestem Twoim **Studio AI Copilotem** napędzanym modelem **${ollamaStatus.selectedModel}** (Ollama)!
Wszystko działa w 100% lokalnie i prywatnie na Twoim komputerze.

Pracujemy nad dokumentem: **"${docTitle || 'Nowa notatka'}"** (zawiera ${blocks.length} bloków).
Możesz ze mną swobodnie rozmawiać lub wydać konkretną dyspozycję:
• *"Dodaj header [Tytuł]"* (np. *dodaj header Specyfikacja*)
• *"Dodaj przycisk do https://... z tekstem Zamów"*
• *"Wstaw szablon saas"* / *"Wstaw ofertę b2b"* / *"Wstaw onboarding"*
• **/wiki [hasło]** (np. */wiki Mikołaj Kopernik*)
• *"Przetłumacz cały dokument na angielski / niemiecki"*`
          : `Cześć! 👋 Jestem **Studio AI Copilotem**.
Lokalne AI z modelem **SmolLM2** wymaga uruchomienia programu Ollama na Twoim komputerze (\`ollama run smollm2\`).

Niezależnie od AI, możesz od razu używać moich wbudowanych narzędzi:
• *"Dodaj header [Tytuł]"* (np. *dodaj header Wstęp*)
• *"Dodaj przycisk do [URL] z tekstem [Napis]"*
• *"Wstaw szablon saas"* / *"Wstaw ofertę b2b"*
• **/wiki [hasło]** – wyszukiwanie w Wikipedii w czasie rzeczywistym
• *"Przetłumacz na angielski"* – natychmiastowe tłumaczenie`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          '📖 /wiki Sztuczna inteligencja',
          '🚀 Wstaw szablon SaaS PRD',
          '🔘 Dodaj header Wprowadzenie',
          '💼 Wstaw Ofertę B2B',
          'Co umiesz?',
        ],
      };
      setMessages([initialGreeting]);
    }
  }, [isOpen, docTitle, blocks.length, isOllamaAvailable, ollamaStatus.selectedModel]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [messages, activeTab]);

  if (!isOpen) return null;

  const hasApiKey = !!getGeminiApiKey();

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  // Execute an action issued by Copilot
  const handleExecuteAction = (action: CopilotActionPayload) => {
    if (action.type === 'INSERT_BLOCKS' && action.blocks) {
      onInsertBlocks(action.blocks);
    } else if (action.type === 'REPLACE_ALL_BLOCKS' && action.blocks) {
      onReplaceBlocks(action.blocks as DocBlock[]);
    } else if (action.type === 'RENAME_PAGE' && action.newTitle) {
      onRenameDoc(action.newTitle);
    } else if (action.type === 'CHANGE_ICON' && action.newIcon) {
      onChangeIcon(action.newIcon);
    } else if (action.type === 'EXTRACT_KANBAN_TASKS' && action.tasks && onAddTasks) {
      onAddTasks(
        action.tasks.map((t) => ({
          title: t.title,
          priority: t.priority,
          tag: t.tag,
        }))
      );
    }
  };

  // Send message to Copilot
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await processPolishCopilotPrompt(prompt, {
        docTitle,
        blocks,
      });

      // Automatically execute action if generated!
      if (response.action) {
        handleExecuteAction(response.action);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: response.action,
        suggestedFollowUps: response.suggestedFollowUps,
        matchedWordsCount: response.matchedWordsCount,
        wikiSource: response.wikiSource,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `Przepraszam, wystąpił problem podczas przetwarzania: ${err.message}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action execution from Tool tab
  const handleToolAction = async (tool: 'summarize' | 'tasks' | 'fix' | 'rewrite' | 'translate') => {
    setIsLoading(true);
    try {
      if (tool === 'summarize') {
        await handleSendMessage('Podsumuj ten dokument w punktach');
      } else if (tool === 'tasks') {
        const tasks = await extractActionItems(docTitle, blocks);
        if (onAddTasks) {
          onAddTasks(tasks);
        }
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `✅ Wyodrębniłem z dokumentu **${tasks.length} zadań** i dodałem je bezpośrednio na Twoją tablicę Kanban!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (tool === 'fix') {
        await handleSendMessage('Popraw błędy ortograficzne i gramatyczne w tym dokumencie');
      } else if (tool === 'rewrite') {
        await handleSendMessage(`Przepisz treść dokumentu w tonie: ${selectedTone}`);
      } else if (tool === 'translate') {
        const langNames = { en: 'angielski', de: 'niemiecki', es: 'hiszpański', fr: 'francuski', pl: 'polski' };
        await handleSendMessage(`Przetłumacz ten dokument na język ${langNames[selectedLang]}`);
      }
      setActiveTab('chat');
    } catch (err: any) {
      console.warn('Tool error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const templatesList = Object.values(ADVANCED_TEMPLATES);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col text-xs text-slate-800 animate-in slide-in-from-right duration-200 font-sans select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>Studio AI Copilot</span>
              {isOllamaAvailable ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {ollamaStatus.selectedModel}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Wymaga Ollamy
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[210px]">
              {isOllamaAvailable
                ? `Lokalne AI (Ollama) • 100% prywatne`
                : `Narzędzia aktywne • AI czeka na Ollamę`}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-slate-100/70 text-[11px] font-semibold p-1 gap-1">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-blue-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <MessageSquare size={13} />
          <span>Czat & Akcje</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'templates'
              ? 'bg-white text-amber-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <LayoutTemplate size={13} />
          <span>Szablony</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 py-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'actions'
              ? 'bg-white text-emerald-700 font-bold shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Zap size={13} />
          <span>Narzędzia</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-blue-700 shadow-2xs'
              : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
          }`}
          title="Ustawienia silnika"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-between">
        {/* TAB 1: CHAT & LIVE ACTIONS */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full justify-between">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
              {/* Ollama Status Alert Banner */}
              <div className="pb-1">
                {isOllamaAvailable ? (
                  <div className="p-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-[11px] text-emerald-900 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-semibold">Lokalne AI Aktywne:</span>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded-lg border border-emerald-200 font-mono text-[10px] font-bold text-emerald-800">
                        {ollamaStatus.selectedModel}
                      </code>
                    </div>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                    >
                      Konfiguruj
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col gap-2 text-[11px] text-amber-900 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                        <Bot size={14} className="text-amber-600" />
                        <span>Chcesz pełne AI? Uruchom Ollamę ze SmolLM2</span>
                      </div>
                      <button
                        onClick={recheckOllama}
                        disabled={isCheckingOllama}
                        className="text-[10px] bg-white border border-amber-300 text-amber-800 px-2 py-0.5 rounded-lg hover:bg-amber-100 font-semibold cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <RefreshCw size={10} className={isCheckingOllama ? 'animate-spin' : ''} />
                        <span>{isCheckingOllama ? 'Łączę...' : 'Połącz'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Prawdziwe AI działa lokalnie bez limitów i opłat. Wpisz w terminalu:
                    </p>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 text-slate-800 font-mono text-[11px]">
                      <code>ollama run smollm2</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('ollama run smollm2');
                          setCopiedId('cmd-ollama');
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="text-amber-700 hover:text-amber-900 font-sans font-semibold text-[10px] cursor-pointer"
                      >
                        {copiedId === 'cmd-ollama' ? 'Skopiowano!' : 'Kopiuj'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    {isBot && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Bot size={14} />
                      </div>
                    )}

                    <div className={`max-w-[85%] space-y-1.5`}>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isBot
                            ? 'bg-slate-50 border border-slate-200/90 text-slate-800 shadow-2xs'
                            : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                        }`}
                      >
                        {msg.text}

                        {/* Wikipedia Source Pill */}
                        {msg.wikiSource && (
                          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-blue-700 bg-blue-50/70 p-2 rounded-xl">
                            <span className="flex items-center gap-1.5 truncate">
                              <BookOpen size={13} className="text-blue-600 shrink-0" />
                              <span className="truncate">Wikipedia: {msg.wikiSource.title}</span>
                            </span>
                            <a
                              href={msg.wikiSource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 shrink-0"
                            >
                              <span>Otwórz</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        )}

                        {/* Executed Action Pill */}
                        {msg.action && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 p-2 rounded-xl">
                            <span className="flex items-center gap-1.5 truncate">
                              <Check size={13} className="text-emerald-600 shrink-0" />
                              <span className="truncate">{msg.action.description}</span>
                            </span>
                            <span className="text-[10px] text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                              Wdrożono
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Message Footer: Timestamp & Copy */}
                      <div
                        className={`flex items-center gap-2 text-[10px] text-slate-400 px-1 ${
                          isBot ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {isBot && (
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="hover:text-slate-600 cursor-pointer flex items-center gap-0.5"
                          >
                            {copiedId === msg.id ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                            <span>{copiedId === msg.id ? 'Skopiowano' : 'Kopiuj'}</span>
                          </button>
                        )}
                      </div>

                      {/* Suggested Quick Follow-Up Chips */}
                      {isBot && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {msg.suggestedFollowUps.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(chip)}
                              className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-700 rounded-xl text-[10px] font-medium cursor-pointer transition-colors shadow-2xs"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isBot && (
                      <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Bot size={14} />
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm flex items-center gap-2 text-slate-500 text-xs shadow-2xs">
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-medium text-slate-600 ml-1">Copilot myśli i wykonuje akcję...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 border-t border-slate-200 bg-white space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-2xs"
              >
                <input
                  ref={chatInputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Napisz do Copilota (np. /wiki Kopernik, dodaj header, wstaw przycisk)..."
                  className="flex-1 bg-transparent px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  <Send size={13} />
                </button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Wpisz komendę lub zapytaj po polsku</span>
                <span className="font-mono">Enter ↵</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED TEMPLATES (3 MEGA-TEMPLATES) */}
        {activeTab === 'templates' && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/80 rounded-2xl">
              <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <LayoutTemplate size={14} className="text-amber-600" />
                <span>3 Zaawansowane Szablony Produkcyjne</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Każdy szablon zawiera ponad 25 gotowych, profesjonalnych bloków: KPI, diagramy, checklisty, tabele wycen, kod i przyciski CTA.
              </p>
            </div>

            <div className="space-y-3">
              {templatesList.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 transition-all shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl">{tpl.icon}</div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {tpl.category}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs mt-0.5">{tpl.shortTitle}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                      {tpl.blocksCount} bloków
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">{tpl.description}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onInsertBlocks(tpl.blocks);
                        setActiveTab('chat');
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `bot-${Date.now()}`,
                            sender: 'bot',
                            text: `🚀 Wstawiłem szablon **"${tpl.shortTitle}"** (${tpl.blocksCount} bloków) na koniec dokumentu!`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold text-[11px] cursor-pointer transition-colors shadow-2xs"
                    >
                      Dopisz na koniec
                    </button>
                    <button
                      onClick={() => {
                        onReplaceBlocks(tpl.blocks);
                        setActiveTab('chat');
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: `bot-${Date.now()}`,
                            sender: 'bot',
                            text: `🚀 Załadowałem szablon **"${tpl.shortTitle}"** jako nową zawartość dokumentu!`,
                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          },
                        ]);
                      }}
                      className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-[11px] cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1"
                    >
                      <span>Zastąp treść</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: QUICK TOOLS */}
        {activeTab === 'actions' && (
          <div className="p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Natychmiastowe transformacje:
            </div>

            {/* Summarize */}
            <button
              onClick={() => handleToolAction('summarize')}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
                <FileText size={16} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-xs">Podsumuj notatkę (TL;DR)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Generuje przejrzyste streszczenie wykonawcze na podstawie wszystkich bloków.
                </div>
              </div>
            </button>

            {/* Extract Tasks to Kanban */}
            <button
              onClick={() => handleToolAction('tasks')}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
                <CheckSquare size={16} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-xs">Wyodrębnij zadania na Kanban</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Automatycznie tworzy karty zadań na tablicy projektowej.
                </div>
              </div>
            </button>

            {/* Polish Grammar Correction */}
            <button
              onClick={() => handleToolAction('fix')}
              disabled={isLoading}
              className="w-full p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-violet-400 hover:bg-violet-50/30 transition-all text-left flex items-start gap-3 cursor-pointer group shadow-2xs"
            >
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 group-hover:scale-105 transition-transform">
                <Wand2 size={16} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-xs">Korekta ortografii i stylu PL</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Weryfikuje interpunkcję, składnię języka polskiego i czystość językową.
                </div>
              </div>
            </button>

            {/* Translate Section */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Globe size={14} className="text-sky-500" />
                  <span>Przetłumacz na inny język</span>
                </div>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium"
                >
                  <option value="en">Angielski (EN 🇬🇧)</option>
                  <option value="de">Niemiecki (DE 🇩🇪)</option>
                  <option value="es">Hiszpański (ES 🇪🇸)</option>
                  <option value="fr">Francuski (FR 🇫🇷)</option>
                  <option value="pl">Polski (PL 🇵🇱)</option>
                </select>
              </div>
              <button
                onClick={() => handleToolAction('translate')}
                disabled={isLoading}
                className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl font-semibold cursor-pointer transition-colors"
              >
                Przetłumacz dokument teraz
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            {/* Ollama Section */}
            <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
              isOllamaAvailable
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Cpu size={14} className={isOllamaAvailable ? 'text-emerald-600' : 'text-amber-600'} />
                  <span>Lokalne AI: Ollama (SmolLM2)</span>
                </div>
                <button
                  onClick={recheckOllama}
                  disabled={isCheckingOllama}
                  className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <RefreshCw size={10} className={isCheckingOllama ? 'animate-spin' : ''} />
                  <span>{isCheckingOllama ? 'Sprawdzam...' : 'Testuj połączenie'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${isOllamaAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span>
                  {isOllamaAvailable
                    ? `Status: Połączono z modelem ${ollamaStatus.selectedModel}`
                    : `Status: Brak połączenia (Ollama wyłączona)`}
                </span>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Adres URL Ollamy:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={ollamaUrlInput}
                      onChange={(e) => setOllamaUrlInput(e.target.value)}
                      placeholder="http://127.0.0.1:11434"
                      className="flex-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        changeOllamaUrl(ollamaUrlInput);
                        recheckOllama();
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-semibold hover:bg-slate-700 cursor-pointer"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                    Wybrany model:
                  </label>
                  {ollamaStatus.availableModels.length > 0 ? (
                    <select
                      value={ollamaStatus.selectedModel}
                      onChange={(e) => {
                        changeOllamaModel(e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {ollamaStatus.availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m} {m.includes('smollm') ? '⭐ (Zalecany)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={ollamaModelInput}
                        onChange={(e) => setOllamaModelInput(e.target.value)}
                        placeholder="smollm2"
                        className="flex-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => {
                          changeOllamaModel(ollamaModelInput);
                          recheckOllama();
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-semibold hover:bg-slate-700 cursor-pointer"
                      >
                        Ustaw
                      </button>
                    </div>
                  )}
                </div>

                {/* Terminal helper */}
                <div className="pt-1 text-[11px] text-slate-600">
                  <span>Jak uruchomić model SmolLM2 w terminalu:</span>
                  <div className="flex items-center justify-between bg-white px-2 py-1.5 mt-1 rounded-xl border border-slate-200 font-mono text-[11px]">
                    <code>ollama run smollm2</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('ollama run smollm2');
                        setCopiedId('set-ollama');
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-blue-600 font-sans text-[10px] font-bold ml-2 cursor-pointer"
                    >
                      {copiedId === 'set-ollama' ? 'Skopiowano!' : 'Kopiuj'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Gemini Fallback Section */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-slate-800">
              <div className="font-bold flex items-center gap-1.5 text-xs text-slate-900">
                <Key size={14} className="text-blue-600" />
                <span>Opcjonalny klucz Google Gemini API</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Alternatywny silnik chmurowy dla osób bez zainstalowanej Ollamy.
              </p>

              <div>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (opcjonalny)"
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSaveApiKey}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold cursor-pointer transition-colors text-xs"
              >
                {apiKeySaved ? 'Zapisano klucz!' : 'Zapisz klucz Gemini'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
