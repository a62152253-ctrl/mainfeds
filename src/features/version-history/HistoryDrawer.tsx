import React, { useState, useEffect } from 'react';
import { History, RotateCcw, X, Clock, FileText, GitCompare, Eye } from 'lucide-react';
import { DocumentSnapshot } from './types';
import { loadSnapshots } from './historyStorage';
import { formatSnapshotTime, getPreviewSnippet, computeTextDiff, extractCleanText } from './diffUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  currentContent?: string;
  onRestore: (snapshot: DocumentSnapshot) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  docId,
  currentContent = '',
  onRestore,
}) => {
  const [snapshots, setSnapshots] = useState<DocumentSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<DocumentSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'diff'>('preview');

  useEffect(() => {
    if (isOpen) {
      const list = loadSnapshots(docId);
      setSnapshots(list);
      setSelectedSnapshot(list[0] || null);
    }
  }, [isOpen, docId]);

  if (!isOpen) return null;

  const diffSegments = selectedSnapshot && currentContent
    ? computeTextDiff(extractCleanText(selectedSnapshot.content), extractCleanText(currentContent))
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex justify-end animate-in fade-in">
      <div className="bg-[#1e2026] border-l border-slate-700/80 w-full max-w-2xl h-full flex flex-col shadow-2xl text-xs text-slate-200">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#16181f]">
          <div className="flex items-center gap-2">
            <History size={16} className="text-amber-400" />
            <span className="font-bold text-slate-100 text-sm">
              Historia Wersji & Oś Czasu
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Snapshots list */}
          <div className="w-5/12 border-r border-slate-800 overflow-y-auto p-2.5 space-y-1.5 bg-[#14161d]">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1">
              Zapisane migawki ({snapshots.length})
            </div>

            {snapshots.length === 0 ? (
              <div className="text-slate-500 text-center py-12 italic">
                Brak wcześniejszych wersji tej notatki
              </div>
            ) : (
              snapshots.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-xs'
                        : 'bg-[#1b1d24] border-slate-800 text-slate-400 hover:bg-[#22252e]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-200 truncate">{snap.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatSnapshotTime(snap.timestamp)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {getPreviewSnippet(snap.content)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Preview selected snapshot */}
          <div className="w-7/12 flex flex-col bg-[#111318]">
            {selectedSnapshot ? (
              <>
                <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#171920]">
                  <div>
                    <div className="font-bold text-slate-100">{selectedSnapshot.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {formatSnapshotTime(selectedSnapshot.timestamp)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`p-1 rounded flex items-center gap-1 text-[10px] ${
                          viewMode === 'preview' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'
                        }`}
                        title="Podgląd treści"
                      >
                        <Eye size={11} />
                        <span>Podgląd</span>
                      </button>
                      <button
                        onClick={() => setViewMode('diff')}
                        className={`p-1 rounded flex items-center gap-1 text-[10px] ${
                          viewMode === 'diff' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'
                        }`}
                        title="Porównanie zmian"
                      >
                        <GitCompare size={11} />
                        <span>Diff</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onRestore(selectedSnapshot);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <RotateCcw size={12} />
                      <span>Przywróć</span>
                    </button>
                  </div>
                </div>

                {viewMode === 'preview' ? (
                  <div
                    className="flex-1 p-4 overflow-y-auto text-slate-300 text-xs leading-relaxed select-text"
                    dangerouslySetInnerHTML={{ __html: selectedSnapshot.content }}
                  />
                ) : (
                  <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1 select-text">
                    {diffSegments.length === 0 ? (
                      <div className="text-slate-500 italic">Brak wykrytych różnic tekstowych.</div>
                    ) : (
                      diffSegments.map((seg, idx) => (
                        <div
                          key={idx}
                          className={`px-2 py-0.5 rounded leading-relaxed ${
                            seg.type === 'added'
                              ? 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500'
                              : seg.type === 'removed'
                              ? 'bg-rose-500/20 text-rose-300 line-through border-l-2 border-rose-500 opacity-70'
                              : 'text-slate-400'
                          }`}
                        >
                          {seg.type === 'added' ? '+ ' : seg.type === 'removed' ? '- ' : '  '}
                          {seg.text}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 italic">
                Wybierz migawkę z listy po lewej
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
