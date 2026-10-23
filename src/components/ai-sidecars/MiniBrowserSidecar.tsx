import React, { useState } from 'react';
import {
  Search,
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  ExternalLink,
  Copy,
  Check,
  FilePlus,
  BookOpen,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { WebSearchPackage, WebSearchResultItem } from '../../features/ai/webSearchService';

interface MiniBrowserSidecarProps {
  searchPackage: WebSearchPackage;
  isLoading?: boolean;
  onSearchNewQuery?: (query: string) => void;
  onCreateNoteFromSearch?: (pkg: WebSearchPackage) => void;
  onCopySnippetToNote?: (title: string, text: string, url: string) => void;
}

export const MiniBrowserSidecar: React.FC<MiniBrowserSidecarProps> = ({
  searchPackage,
  isLoading = false,
  onSearchNewQuery,
  onCreateNoteFromSearch,
  onCopySnippetToNote,
}) => {
  const [urlInput, setUrlInput] = useState(searchPackage.query || '');
  const [activeTab, setActiveTab] = useState<'results' | 'reader'>('results');
  const [selectedReaderItem, setSelectedReaderItem] = useState<WebSearchResultItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim() && onSearchNewQuery) {
      onSearchNewQuery(urlInput.trim());
      setActiveTab('results');
    }
  };

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleOpenInReader = (item: WebSearchResultItem) => {
    setSelectedReaderItem(item);
    setActiveTab('reader');
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-xl select-text">
      {/* ======================================================================= */}
      {/* 1. BROWSER WINDOW CONTROLS & URL BAR                                    */}
      {/* ======================================================================= */}
      <div className="p-2.5 border-b border-slate-200/90 bg-slate-50/90 backdrop-blur-xs space-y-2 shrink-0">
        {/* Navigation & Address Bar */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Powrót do wyników wyszukiwania"
          >
            <ArrowLeft size={13} />
          </button>
          <button
            type="button"
            disabled
            className="p-1.5 text-slate-300 rounded-lg"
          >
            <ArrowRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onSearchNewQuery?.(urlInput)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="Odśwież wyniki wyszukiwania"
          >
            <RotateCw size={13} className={isLoading ? 'animate-spin text-blue-600' : ''} />
          </button>

          {/* Real Browser URL Input Form */}
          <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0">
            <div className="flex items-center bg-white border border-slate-200/90 rounded-xl px-2.5 py-1 text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-400/20 shadow-2xs">
              <Lock size={11} className="text-emerald-600 shrink-0 mr-1.5" />
              <span className="text-slate-400 font-mono text-[10px] select-none shrink-0 mr-1 hidden sm:inline">
                https://search.web/
              </span>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Wpisz hasło lub adres www..."
                className="w-full bg-transparent border-none focus:outline-none text-slate-800 text-[11px] placeholder-slate-400 font-medium"
              />
              <button
                type="submit"
                className="text-slate-400 hover:text-blue-600 ml-1 p-0.5 cursor-pointer"
              >
                <Search size={12} />
              </button>
            </div>
          </form>
        </div>

        {/* Browser Tabs & Quick Actions */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('results')}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                activeTab === 'results'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Globe size={11} />
              <span>Wyniki ({searchPackage.results.length})</span>
            </button>

            {selectedReaderItem && (
              <button
                onClick={() => setActiveTab('reader')}
                className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  activeTab === 'reader'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <BookOpen size={11} />
                <span className="truncate max-w-[100px]">{selectedReaderItem.title}</span>
              </button>
            )}
          </div>

          {/* Button: "Utwórz Notatkę z Sieci (@noteweb)" */}
          {onCreateNoteFromSearch && (
            <button
              type="button"
              onClick={() => onCreateNoteFromSearch(searchPackage)}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-2xs shrink-0"
              title="Utwórz pełną notatkę ze wszystkich znalezionych źródeł"
            >
              <FilePlus size={11} />
              <span>Utwórz notatkę</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================================= */}
      {/* 2. MAIN BROWSER VIEW CANVAS                                             */}
      {/* ======================================================================= */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <RotateCw size={24} className="animate-spin text-blue-500 mx-auto" />
            <p className="text-xs font-medium text-slate-600">
              Przeszukiwanie internetu dla: &quot;{searchPackage.query}&quot;...
            </p>
            <p className="text-[10px] text-slate-400">
              Łączenie z bazami Wikipedii i DuckDuckGo (100% Free API)
            </p>
          </div>
        ) : activeTab === 'results' ? (
          <>
            {/* Top Featured Hit / Answer Card */}
            {searchPackage.topHit && (
              <div className="p-3 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-200/80 rounded-2xl shadow-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-bold text-blue-700 uppercase tracking-wider">
                    <Sparkles size={11} className="text-blue-600" />
                    <span>Wyróżniony artykuł (Wikipedia)</span>
                  </span>
                  <a
                    href={searchPackage.topHit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 flex items-center gap-0.5"
                  >
                    <span>Oryginał</span>
                    <ExternalLink size={10} />
                  </a>
                </div>

                <div className="flex gap-3">
                  {searchPackage.topHit.thumbnailUrl && (
                    <img
                      src={searchPackage.topHit.thumbnailUrl}
                      alt={searchPackage.topHit.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-xs">
                      {searchPackage.topHit.title}
                    </h3>
                    {searchPackage.topHit.description && (
                      <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        {searchPackage.topHit.description}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                      {searchPackage.topHit.extract}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-[10px]">
                  <button
                    onClick={() =>
                      handleCopySnippet(
                        'top-hit',
                        searchPackage.topHit!.extract
                      )
                    }
                    className="flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-md transition-colors cursor-pointer font-medium"
                  >
                    {copiedId === 'top-hit' ? (
                      <Check size={11} className="text-emerald-500" />
                    ) : (
                      <Copy size={11} />
                    )}
                    <span>Kopiuj treść</span>
                  </button>

                  {onCopySnippetToNote && (
                    <button
                      onClick={() =>
                        onCopySnippetToNote(
                          searchPackage.topHit!.title,
                          searchPackage.topHit!.extract,
                          searchPackage.topHit!.url
                        )
                      }
                      className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors cursor-pointer font-semibold shadow-2xs"
                    >
                      <FilePlus size={11} />
                      <span>Wstaw do notatki</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Results Feed */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Wyniki wyszukiwania w sieci ({searchPackage.results.length}):</span>
              </div>

              {searchPackage.results.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Globe size={24} className="mx-auto mb-2 text-slate-300" />
                  <p>Brak bezpośrednich wyników dla zapytania: &quot;{searchPackage.query}&quot;</p>
                  <p className="text-[10px] mt-1 text-slate-400">
                    Spróbuj wpisać inne słowa kluczowe w pasku adresu powyżej.
                  </p>
                </div>
              ) : (
                searchPackage.results.map((hit) => (
                  <div
                    key={hit.id}
                    className="p-3 bg-white hover:bg-slate-50/70 border border-slate-200/90 rounded-xl transition-all shadow-2xs group space-y-1.5"
                  >
                    {/* Source & Category Header */}
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="font-semibold text-slate-600">{hit.source}</span>
                        {hit.category && (
                          <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                            {hit.category}
                          </span>
                        )}
                      </div>
                      <a
                        href={hit.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 flex items-center gap-0.5"
                        title="Otwórz link zewnętrzny"
                      >
                        <ExternalLink size={10} />
                      </a>
                    </div>

                    {/* Title */}
                    <h4
                      onClick={() => handleOpenInReader(hit)}
                      className="font-bold text-xs text-slate-900 group-hover:text-blue-600 cursor-pointer transition-colors leading-snug"
                    >
                      {hit.title}
                    </h4>

                    {/* Snippet */}
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {hit.snippet}
                    </p>

                    {/* Hit Action Buttons */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <button
                        onClick={() => handleOpenInReader(hit)}
                        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Czytaj w czytniku</span>
                        <ChevronRight size={11} />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopySnippet(hit.id, hit.snippet)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="Kopiuj fragment do schowka"
                        >
                          {copiedId === hit.id ? (
                            <Check size={11} className="text-emerald-500" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                        {onCopySnippetToNote && (
                          <button
                            onClick={() =>
                              onCopySnippetToNote(hit.title, hit.snippet, hit.url)
                            }
                            className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 rounded text-[9px] font-semibold cursor-pointer transition-colors"
                            title="Wstaw ten fragment do notatki"
                          >
                            + Notatka
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* Reader Mode View */
          selectedReaderItem && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setActiveTab('results')}
                className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer mb-2"
              >
                <ArrowLeft size={12} />
                <span>Wróć do listy wyników</span>
              </button>

              <div className="border-b border-slate-200 pb-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Tryb Czytnika · {selectedReaderItem.source}
                </span>
                <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
                  {selectedReaderItem.title}
                </h2>
              </div>

              <div className="text-xs text-slate-700 leading-relaxed space-y-2 whitespace-pre-wrap">
                <p>{selectedReaderItem.snippet}</p>
                <p className="text-[11px] text-slate-500 italic">
                  Artykuł pobrany w całości z publicznego repozytorium sieci internetowej.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={selectedReaderItem.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 font-medium"
                >
                  <ExternalLink size={12} />
                  <span>Otwórz stronę źródłową</span>
                </a>

                {onCopySnippetToNote && (
                  <button
                    onClick={() =>
                      onCopySnippetToNote(
                        selectedReaderItem.title,
                        selectedReaderItem.snippet,
                        selectedReaderItem.url
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
                  >
                    <FilePlus size={12} />
                    <span>Dodaj artykuł do notatki</span>
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* ======================================================================= */}
      {/* 3. BROWSER STATUS FOOTER                                                */}
      {/* ======================================================================= */}
      <div className="p-2 border-t border-slate-200/90 bg-slate-50/90 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <Globe size={11} className="text-emerald-600" />
          <span>Darmowe wyszukiwanie w sieci · Zero reklam i kosztów</span>
        </span>
        <span>Search Engine: Open Web</span>
      </div>
    </div>
  );
};
