import React, { useState } from 'react';
import { ArrowLeft, Globe, Search, Heart, Eye, Sparkles, ExternalLink, Filter, Calendar } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { PublicPage } from '../types/workspace';

export const AllPublicPagesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { publicPages, setActivePublicPageId, setActiveView, incrementPublicPageView } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'views' | 'date'>('likes');

  if (!isOpen) return null;

  const handleOpenPage = async (page: PublicPage) => {
    setActivePublicPageId(page.id);
    setActiveView('public');
    await incrementPublicPageView(page.id);
    onClose();
  };

  const filteredPages = publicPages
    .filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchAuthor = p.authorName?.toLowerCase().includes(q);
      const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchAuthor || matchTag;
    })
    .sort((a, b) => {
      if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans select-none"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[8px] w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-[#37352f] dark:text-[#d4d4d4]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between bg-[#fbfbfa] dark:bg-[#1c1c1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#2383e2]/10 text-[#2383e2] flex items-center justify-center">
              <Globe size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#37352f] dark:text-white flex items-center gap-2">
                <span>Publiczne strony w sieci</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-[3px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] font-mono">
                  {publicPages.length}
                </span>
              </h2>
              <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
                Materiały, artykuły i szablony opublikowane przez społeczność
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-xs text-[#787774] hover:text-[#37352f] dark:hover:text-white px-2.5 py-1 rounded-[4px] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(55,53,47,0.04)] cursor-pointer font-medium transition-colors"
          >
            Zamknij
          </button>
        </div>

        {/* Toolbar: Search and Filter */}
        <div className="p-3 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] bg-white dark:bg-[#202020] flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#9b9a97]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Szukaj po tytule, autorze lub tagu..."
              className="w-full pl-8 pr-3 py-1.5 bg-[rgba(55,53,47,0.03)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[4px] text-xs text-[#37352f] dark:text-white placeholder-[#787774] focus:outline-none focus:border-[#2383e2] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto text-xs">
            <span className="text-[#787774] dark:text-[#9b9a97] mr-1 text-[11px] font-medium flex items-center gap-1">
              <Filter size={11} /> Sortuj:
            </span>
            <button
              onClick={() => setSortBy('likes')}
              className={`px-2 py-0.5 rounded-[4px] text-xs cursor-pointer transition-all ${
                sortBy === 'likes'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.04)]'
              }`}
            >
              ❤️ Polubienia
            </button>
            <button
              onClick={() => setSortBy('views')}
              className={`px-2 py-0.5 rounded-[4px] text-xs cursor-pointer transition-all ${
                sortBy === 'views'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2383e2] font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.04)]'
              }`}
            >
              👁️ Wyświetlenia
            </button>
            <button
              onClick={() => setSortBy('date')}
              className={`px-2 py-0.5 rounded-[4px] text-xs cursor-pointer transition-all ${
                sortBy === 'date'
                  ? 'bg-[rgba(55,53,47,0.08)] dark:bg-[rgba(255,255,255,0.1)] text-[#37352f] dark:text-white font-medium'
                  : 'text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.04)]'
              }`}
            >
              Najnowsze
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#fbfbfa] dark:bg-[#191919]">
          {filteredPages.length === 0 ? (
            <div className="text-center py-16 text-[#787774] dark:text-[#9b9a97]">
              <Globe size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Brak wyników</p>
              <p className="text-xs mt-1">Zmień wpisaną frazę lub filtry.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPages.map((pubPage) => (
                <div
                  key={pubPage.id}
                  onClick={() => handleOpenPage(pubPage)}
                  className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] overflow-hidden hover:bg-[rgba(55,53,47,0.02)] transition-all cursor-pointer flex flex-col group shadow-2xs"
                >
                  <div
                    className="h-20 p-2.5 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      background:
                        pubPage.coverGradient ||
                        'linear-gradient(135deg, #2b3a4a 0%, #1a222d 100%)',
                    }}
                  >
                    <span className="text-xl p-0.5 bg-white/20 backdrop-blur-md rounded-[4px] w-fit">
                      {pubPage.icon || '📄'}
                    </span>
                    <div className="text-[9px] text-white/80 font-mono truncate">
                      searchpoint.pl/p/{pubPage.publicSlug || pubPage.id}
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-[#37352f] dark:text-white group-hover:text-[#2383e2] transition-colors line-clamp-1">
                        {pubPage.title}
                      </h4>
                      <div className="text-[10px] text-[#787774] dark:text-[#9b9a97]">
                        👤 @{pubPage.authorName || 'anonim'}
                      </div>
                      {pubPage.tags && pubPage.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          {pubPage.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] text-[#2383e2] bg-[#2383e2]/10 px-1 py-0.2 rounded-[3px]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[rgba(55,53,47,0.06)] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[10px] text-[#787774] dark:text-[#9b9a97] font-mono">
                      <span className="flex items-center gap-0.5">👁️ {pubPage.viewsCount || 1}</span>
                      <span className="flex items-center gap-0.5 font-medium text-rose-500">
                        ❤️ {pubPage.likesCount || 0}
                      </span>
                      <span>
                        {new Date(pubPage.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
