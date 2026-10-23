import React, { useState } from 'react';
import { FileText, Star, Globe, Plus, Trash2, Folder, Calendar, Tag, Filter, X, Search, ArrowUpDown } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

const PAGE_TAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Product: { bg: 'bg-[#ddedea] dark:bg-[#1c3829]', text: 'text-[#0f7b6c] dark:text-[#4dab9b]', border: 'border-transparent' },
  AI: { bg: 'bg-[#eae4f2] dark:bg-[#2b1e3a]', text: 'text-[#6940a5] dark:text-[#b089e6]', border: 'border-transparent' },
  Marketing: { bg: 'bg-[#fbe4dd] dark:bg-[#3d2216]', text: 'text-[#d44c47] dark:text-[#ff7875]', border: 'border-transparent' },
  Backend: { bg: 'bg-[#ddebf1] dark:bg-[#14283c]', text: 'text-[#0b6e99] dark:text-[#529cca]', border: 'border-transparent' },
  Premium: { bg: 'bg-[#f4dfeb] dark:bg-[#341b2e]', text: 'text-[#ad1a72] dark:text-[#e255a1]', border: 'border-transparent' },
  Docs: { bg: 'bg-[#eae4f2] dark:bg-[#202030]', text: 'text-[#443592] dark:text-[#9086da]', border: 'border-transparent' },
  Engineering: { bg: 'bg-[#ddebf1] dark:bg-[#14283c]', text: 'text-[#0b6e99] dark:text-[#529cca]', border: 'border-transparent' },
  Strategia: { bg: 'bg-[#fbe4dd] dark:bg-[#3a1a1a]', text: 'text-[#d44c47] dark:text-[#ff7875]', border: 'border-transparent' },
};

const getTagStyles = (tag: string) => {
  return PAGE_TAG_STYLES[tag] || {
    bg: 'bg-[#f1f1ef] dark:bg-[#262626]',
    text: 'text-[#787774] dark:text-[#9b9a97]',
    border: 'border-transparent',
  };
};

export const AllPagesView: React.FC = () => {
  const {
    pages,
    folders,
    createPage,
    deletePage,
    toggleFavorite,
    setActivePageId,
    setActiveView,
    selectedTag,
    setSelectedTag,
  } = useWorkspace();

  const [searchFilter, setSearchFilter] = useState('');
  const [sortOption, setSortOption] = useState<'updated' | 'title' | 'favorites'>('updated');

  let activePages = pages.filter((p) => !p.isDeleted);

  if (selectedTag) {
    activePages = activePages.filter((p) => (p.tags || []).includes(selectedTag));
  }

  if (searchFilter.trim()) {
    const q = searchFilter.toLowerCase().trim();
    activePages = activePages.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.tags || []).some((t) => (t || '').toLowerCase().includes(q))
    );
  }

  // Sort active pages
  activePages = [...activePages].sort((a, b) => {
    if (sortOption === 'title') {
      return (a.title || '').localeCompare(b.title || '');
    }
    if (sortOption === 'favorites') {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    }
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  const allAvailableTags = Array.from(
    new Set(pages.filter((p) => !p.isDeleted).flatMap((p) => p.tags || []))
  ).filter(Boolean);

  const getFolderName = (folderId?: string) => {
    if (!folderId) return 'Główny katalog';
    const f = folders.find((folder) => folder.id === folderId);
    return f ? f.name : 'Główny katalog';
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] p-6 lg:p-8 text-[#37352f] dark:text-[#d4d4d4] font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97]">
              <span className="hover:text-[#37352f] dark:hover:text-white cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="text-[#37352f] dark:text-[#d4d4d4] font-medium">Katalog</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#37352f] dark:text-white flex items-center gap-2.5 mt-1">
              <span>Wszystkie dokumenty</span>
              <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] font-normal tabular-nums">
                {activePages.length} stron
              </span>
            </h1>
            <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1">
              Przegląd wszystkich dokumentów w przestrzeni roboczej z informacjami o folderach, tagach i publikacji WWW.
            </p>
          </div>

          <button
            onClick={async () => {
              const newId = await createPage(undefined, 'Nowy dokument');
              if (newId) {
                setActivePageId(newId);
                setActiveView('doc');
              }
            }}
            className="px-3.5 py-1.5 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Nowy dokument</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] p-2.5 rounded-[6px]">
          <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm relative">
            <Search size={13} className="absolute left-2.5 text-[#787774] dark:text-[#9b9a97]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtruj po tytule lub tagu..."
              className="w-full bg-[rgba(55,53,47,0.03)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] pl-8 pr-7 py-1.5 rounded-[4px] text-xs text-[#37352f] dark:text-white placeholder:text-[#787774] focus:outline-none focus:border-[#2383e2] transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 text-[#787774] hover:text-[#37352f] dark:hover:text-white text-xs cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Tag filter badges */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] text-[#787774] dark:text-[#9b9a97] flex items-center gap-1 mr-1">
              <Filter size={10} />
              <span>Tag:</span>
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2 py-0.5 rounded-[4px] text-[11px] cursor-pointer transition-colors ${
                !selectedTag
                  ? 'bg-[#2383e2] text-white font-medium'
                  : 'bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] hover:bg-[rgba(55,53,47,0.09)]'
              }`}
            >
              Wszystkie
            </button>
            {allAvailableTags.map((tag) => {
              const style = getTagStyles(tag);
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2383e2] text-white font-medium'
                      : `${style.bg} ${style.text} hover:opacity-80`
                  }`}
                >
                  <span>#{tag}</span>
                </button>
              );
            })}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#787774] dark:text-[#9b9a97] bg-[rgba(55,53,47,0.03)] dark:bg-[#191919] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] px-2.5 py-1 rounded-[4px]">
            <ArrowUpDown size={11} />
            <span className="text-[10px] uppercase font-medium">Sortuj:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-transparent focus:outline-none text-[#37352f] dark:text-[#d4d4d4] text-[11px] cursor-pointer"
            >
              <option value="updated">Ostatnio edytowane</option>
              <option value="title">Tytuł (A-Z)</option>
              <option value="favorites">Najpierw ulubione</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] bg-white dark:bg-[#202020] overflow-hidden">
          <table className="w-full border-collapse text-xs text-left">
            <thead className="bg-[#fbfbfa] dark:bg-[#1c1c1c] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
              <tr className="text-[#787774] dark:text-[#9b9a97] font-medium text-[11px] select-none">
                <th className="py-2.5 px-3.5">Tytuł strony</th>
                <th className="py-2.5 px-3.5 w-44">Folder</th>
                <th className="py-2.5 px-3.5 w-48">Tagi</th>
                <th className="py-2.5 px-3.5 w-32">Status WWW</th>
                <th className="py-2.5 px-3.5 w-36">Ostatnia edycja</th>
                <th className="py-2.5 px-3.5 w-20 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4]">
              {activePages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#787774] dark:text-[#9b9a97] text-xs italic">
                    Brak dokumentów spełniających kryteria.
                  </td>
                </tr>
              ) : (
                activePages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => {
                      setActivePageId(page.id);
                      setActiveView('doc');
                    }}
                    className="hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3.5 flex items-center gap-2 font-medium text-[#37352f] dark:text-white">
                      <span className="text-base shrink-0">
                        {page.icon || '📄'}
                      </span>
                      <span className="group-hover:text-[#2383e2] transition-colors truncate">
                        {page.title}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-[#787774] dark:text-[#9b9a97]">
                      <div className="flex items-center gap-1.5">
                        <Folder size={12} className="opacity-60" />
                        <span className="truncate">{getFolderName(page.folderId)}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1">
                        {page.tags.length === 0 ? (
                          <span className="text-[#787774] dark:text-[#9b9a97] text-[10px]">—</span>
                        ) : (
                          page.tags.map((t) => {
                            const style = getTagStyles(t);
                            return (
                              <button
                                key={t}
                                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] text-[10px] cursor-pointer transition-colors ${style.bg} ${style.text}`}
                              >
                                <span>#{t}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      {page.isPublic ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
                          <Globe size={10} />
                          <span>Opublikowano</span>
                        </span>
                      ) : (
                        <span className="text-[#787774] dark:text-[#9b9a97] text-[10px]">Prywatna</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5 text-[#787774] dark:text-[#9b9a97] text-[11px]">
                      {new Date(page.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-2.5 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleFavorite(page.id)}
                          className={`p-1 rounded-[3px] hover:bg-[rgba(55,53,47,0.06)] dark:hover:bg-[rgba(255,255,255,0.08)] cursor-pointer ${
                            page.isFavorite ? 'text-amber-500' : 'text-[#787774] dark:text-[#9b9a97]'
                          }`}
                          title="Ulubione"
                        >
                          <Star size={13} fill={page.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => deletePage(page.id)}
                          className="p-1 text-[#787774] dark:text-[#9b9a97] hover:text-red-600 rounded-[3px] hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Usuń dokument"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
