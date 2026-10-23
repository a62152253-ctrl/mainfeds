import React, { useState } from 'react';
import { Trash2, RotateCcw, FileText, AlertCircle, Search, AlertTriangle } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export const TrashView: React.FC = () => {
  const { pages, restorePage, permanentlyDeletePage, emptyTrash, setActiveView } = useWorkspace();
  const [filterQuery, setFilterQuery] = useState('');

  const deletedPages = pages.filter((p) => p.isDeleted);
  const visiblePages = deletedPages.filter((p) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase().trim();
    return (
      (p.title || '').toLowerCase().includes(q) ||
      (p.tags || []).some((t) => (t || '').toLowerCase().includes(q))
    );
  });

  const handleConfirmPermanentDelete = (pageId: string, pageTitle: string) => {
    if (window.confirm(`Czy na pewno chcesz bezpowrotnie usunąć dokument „${pageTitle}”? Tej operacji nie można cofnąć.`)) {
      permanentlyDeletePage(pageId);
    }
  };

  const handleConfirmEmptyTrash = () => {
    if (window.confirm(`Czy na pewno chcesz bezpowrotnie opróżnić cały kosz (${deletedPages.length} stron)?`)) {
      emptyTrash();
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] p-6 lg:p-8 space-y-6 text-[#37352f] dark:text-[#d4d4d4] font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[4px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97] flex items-center justify-center">
              <Trash2 size={16} />
            </div>
            <h1 className="text-xl font-bold text-[#37352f] dark:text-white">Kosz i Archiwum dokumentów</h1>
          </div>
          <p className="text-xs text-[#787774] dark:text-[#9b9a97] mt-1">
            W koszu znajduje się {deletedPages.length} usuniętych stron. Możesz je przywrócić lub trwale wyczyścić.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {deletedPages.length > 0 && (
            <>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#787774] dark:text-[#9b9a97]" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filtruj kosz..."
                  className="bg-[rgba(55,53,47,0.03)] dark:bg-[#202020] border border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-[4px] pl-7 pr-3 py-1 text-xs text-[#37352f] dark:text-white placeholder:text-[#787774] focus:outline-none focus:border-[#2383e2] w-36 sm:w-44"
                />
              </div>

              <button
                onClick={handleConfirmEmptyTrash}
                className="px-3 py-1 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-[4px] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 size={12} />
                <span>Opróżnij kosz</span>
              </button>
            </>
          )}
        </div>
      </div>

      {deletedPages.length === 0 ? (
        <div className="text-center py-20 text-[#787774] dark:text-[#9b9a97]">
          <Trash2 size={36} className="mx-auto mb-3 opacity-30" />
          <h3 className="text-sm font-medium text-[#37352f] dark:text-white">Kosz jest pusty</h3>
          <p className="text-xs mt-1">Żadne dokumenty nie zostały usunięte.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#202020] border border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] rounded-[6px] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fbfbfa] dark:bg-[#1c1c1c] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] text-[#787774] dark:text-[#9b9a97] font-medium text-[11px]">
              <tr>
                <th className="px-4 py-2.5">Dokument</th>
                <th className="px-4 py-2.5">Tagi</th>
                <th className="px-4 py-2.5">Data modyfikacji</th>
                <th className="px-4 py-2.5 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(55,53,47,0.06)] dark:divide-[rgba(255,255,255,0.06)] text-[#37352f] dark:text-[#d4d4d4]">
              {visiblePages.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#787774] dark:text-[#9b9a97] italic">
                    Brak dokumentów pasujących do filtra „{filterQuery}”.
                  </td>
                </tr>
              ) : (
                visiblePages.map((page) => (
                  <tr key={page.id} className="hover:bg-[rgba(55,53,47,0.03)] dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[#37352f] dark:text-white flex items-center gap-2">
                      <span className="text-base">{page.icon || '📄'}</span>
                      <span>{page.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      {page.tags && page.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {page.tags.map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded-[3px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[10px] text-[#787774] dark:text-[#9b9a97]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#787774] dark:text-[#9b9a97] text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#787774] dark:text-[#9b9a97] text-[11px]">
                      {new Date(page.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => restorePage(page.id)}
                          className="px-2.5 py-1 bg-[#2383e2]/10 hover:bg-[#2383e2]/20 text-[#2383e2] rounded-[4px] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw size={11} />
                          <span>Przywróć</span>
                        </button>
                        <button
                          onClick={() => handleConfirmPermanentDelete(page.id, page.title)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-[#787774] hover:text-red-600 rounded-[4px] cursor-pointer transition-colors"
                          title="Usuń bezpowrotnie"
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
      )}
    </div>
  );
};
