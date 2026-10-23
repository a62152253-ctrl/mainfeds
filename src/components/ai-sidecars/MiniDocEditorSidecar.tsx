import React from 'react';
import {
  FileText,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  CheckSquare,
  BookOpen,
  Info,
  Award,
  Star,
  Terminal,
  Code2,
  ThumbsUp,
  ThumbsDown,
  PenTool,
  AlertTriangle,
  AlertOctagon,
  Lightbulb,
} from 'lucide-react';
import { DocBlock } from '../../types/workspace';

interface MiniDocEditorSidecarProps {
  title: string;
  blocks: DocBlock[];
  isStreaming?: boolean;
  sourceUrl?: string;
  thumbnailUrl?: string;
  pageId?: string | null;
  onOpenFullEditor?: (pageId?: string) => void;
  onUpdateBlockContent?: (blockId: string, newContent: string) => void;
  onToggleTodo?: (blockId: string) => void;
}

export const MiniDocEditorSidecar: React.FC<MiniDocEditorSidecarProps> = ({
  title,
  blocks,
  isStreaming = false,
  sourceUrl,
  thumbnailUrl,
  pageId,
  onOpenFullEditor,
  onUpdateBlockContent,
  onToggleTodo,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyAll = () => {
    const markdown = blocks
      .map((b) => {
        if (b.type === 'h1') return `# ${b.content}`;
        if (b.type === 'h2') return `## ${b.content}`;
        if (b.type === 'h3') return `### ${b.content}`;
        if (b.type === 'bullet') return `* ${b.content}`;
        if (b.type === 'todo') return `- [${b.checked ? 'x' : ' '}] ${b.content}`;
        if (b.type === 'callout') return `> 💡 ${b.content}`;
        return b.content;
      })
      .join('\n\n');

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/90 shadow-lg">
      {/* Mini Editor Top Header */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">
                {title || 'Notatka na żywo'}
              </span>
              {isStreaming && (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-full border border-blue-200 shrink-0">
                  <Sparkles size={10} className="animate-spin" />
                  <span>Generowanie...</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Live Preview Edytora · Wikipedia API
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Otwórz oryginalne źródło na Wikipedii"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={handleCopyAll}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Kopiuj zawartość Markdown"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
          {onOpenFullEditor && (
            <button
              onClick={() => onOpenFullEditor(pageId || undefined)}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Otwórz notatkę w pełnym edytorze dokumentów"
            >
              <Maximize2 size={11} />
              <span>Pełny edytor</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Editor Document Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
        {/* Optional Thumbnail Image */}
        {thumbnailUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-200/80 max-h-48 bg-slate-100 flex items-center justify-center">
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover max-h-48"
              loading="lazy"
            />
          </div>
        )}

        {/* Block Stream */}
        {blocks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <BookOpen size={24} className="mx-auto mb-2 text-slate-300" />
            <p>Pobieranie i formatowanie treści z Wikipedii...</p>
          </div>
        ) : (
          blocks.map((block, idx) => {
            switch (block.type) {
              case 'h1':
                return (
                  <h1
                    key={block.id || idx}
                    className="text-base font-extrabold text-slate-900 tracking-tight pt-1 border-b border-slate-100 pb-1"
                  >
                    {block.content}
                  </h1>
                );

              case 'h2':
                return (
                  <h2
                    key={block.id || idx}
                    className="text-xs font-bold text-slate-800 tracking-tight pt-2 border-b border-slate-100 pb-0.5 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{block.content}</span>
                  </h2>
                );

              case 'h3':
                return (
                  <h3
                    key={block.id || idx}
                    className="text-xs font-semibold text-slate-700 pt-1"
                  >
                    {block.content}
                  </h3>
                );

              case 'h4':
                return (
                  <h4
                    key={block.id || idx}
                    className="text-[11px] font-bold text-slate-600 uppercase tracking-wider pt-1"
                  >
                    {block.content}
                  </h4>
                );

              case 'key_takeaway':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950 text-[11px] leading-relaxed shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 text-[10px] mb-1">
                      <Award size={13} className="text-amber-600" />
                      <span>Kluczowy Wniosek</span>
                    </div>
                    <div className="whitespace-pre-wrap">{block.content}</div>
                  </div>
                );

              case 'stat_grid':
                return (
                  <div
                    key={block.id || idx}
                    className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-center"
                  >
                    <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {block.content.split('|')[0]?.trim() || 'Wskaźnik'}
                      </div>
                      <div className="text-xs font-black text-slate-800 truncate">
                        {block.statValue?.split('|')[0]?.trim() || '—'}
                      </div>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {block.content.split('|')[1]?.trim() || 'Status'}
                      </div>
                      <div className="text-xs font-black text-slate-800 truncate">
                        {block.statValue?.split('|')[1]?.trim() || '—'}
                      </div>
                    </div>
                  </div>
                );

              case 'callout':
              case 'callout_info':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-slate-700 text-[11px] leading-relaxed flex items-start gap-2"
                  >
                    <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <div className="flex-1 whitespace-pre-wrap">{block.content}</div>
                  </div>
                );

              case 'callout_tip':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-slate-700 text-[11px] leading-relaxed flex items-start gap-2"
                  >
                    <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 whitespace-pre-wrap">{block.content}</div>
                  </div>
                );

              case 'callout_warning':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-300 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2"
                  >
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 whitespace-pre-wrap">{block.content}</div>
                  </div>
                );

              case 'callout_danger':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-900 text-[11px] leading-relaxed flex items-start gap-2"
                  >
                    <AlertOctagon size={14} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 whitespace-pre-wrap">{block.content}</div>
                  </div>
                );

              case 'pros_cons':
                return (
                  <div key={block.id || idx} className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg space-y-1">
                      <div className="font-bold text-emerald-800 flex items-center gap-1">
                        <ThumbsUp size={11} className="text-emerald-600" />
                        <span>Zalety</span>
                      </div>
                      <div className="text-emerald-900 whitespace-pre-wrap">{block.content}</div>
                    </div>
                    <div className="p-2 bg-rose-50/80 border border-rose-200 rounded-lg space-y-1">
                      <div className="font-bold text-rose-800 flex items-center gap-1">
                        <ThumbsDown size={11} className="text-rose-600" />
                        <span>Wady</span>
                      </div>
                      <div className="text-rose-900 whitespace-pre-wrap">{block.toggleDetails}</div>
                    </div>
                  </div>
                );

              case 'code':
              case 'terminal':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg border border-slate-800 overflow-x-auto space-y-1"
                  >
                    <div className="text-slate-400 text-[9px] flex items-center gap-1">
                      {block.type === 'terminal' ? <Terminal size={10} /> : <Code2 size={10} />}
                      <span>{block.language || 'code'}</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{block.content}</pre>
                  </div>
                );

              case 'rating':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2 bg-amber-50/50 border border-amber-200/60 rounded-xl flex items-center justify-between text-[11px]"
                  >
                    <span className="font-medium text-slate-700">{block.content || 'Ocena'}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= (block.ratingStars || 5) ? 'fill-amber-400' : 'text-slate-300'}
                        />
                      ))}
                    </div>
                  </div>
                );

              case 'ai_prompt':
                return (
                  <div
                    key={block.id || idx}
                    className="p-2 bg-indigo-50/70 border border-indigo-200 rounded-xl text-[10px] text-indigo-900 flex items-center gap-2"
                  >
                    <Sparkles size={12} className="text-indigo-600 shrink-0" />
                    <span className="truncate italic">{block.content}</span>
                  </div>
                );

              case 'signature':
                return (
                  <div
                    key={block.id || idx}
                    className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500"
                  >
                    <div className="flex items-center gap-1">
                      <PenTool size={11} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{block.content}</span>
                    </div>
                    {block.timelineDate && <span>{block.timelineDate}</span>}
                  </div>
                );

              case 'divider':
                return <hr key={block.id || idx} className="border-t border-slate-200 my-1" />;

              case 'image':
                return block.imageUrl ? (
                  <div key={block.id || idx} className="rounded-xl overflow-hidden border border-slate-200">
                    <img
                      src={block.imageUrl}
                      alt={block.imageCaption || 'Ilustracja'}
                      className="w-full h-32 object-cover"
                    />
                    {block.imageCaption && (
                      <div className="p-1 bg-slate-50 text-[9px] text-slate-500 italic text-center">
                        {block.imageCaption}
                      </div>
                    )}
                  </div>
                ) : null;

              case 'table':
                return (
                  <div key={block.id || idx} className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-[10px] text-left border-collapse">
                      <tbody>
                        {(block.tableData || []).map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold' : 'border-t border-slate-100'}>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-1.5 border-r border-slate-100 last:border-r-0">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );

              case 'number':
                return (
                  <div
                    key={block.id || idx}
                    className="flex items-start gap-2 pl-2 text-slate-700 leading-relaxed text-[11px]"
                  >
                    <span className="text-blue-500 font-bold select-none">{idx + 1}.</span>
                    <span className="flex-1">{block.content}</span>
                  </div>
                );

              case 'bullet':
                return (
                  <div
                    key={block.id || idx}
                    className="flex items-start gap-2 pl-2 text-slate-700 leading-relaxed text-[11px]"
                  >
                    <span className="text-blue-500 font-bold select-none">•</span>
                    <span className="flex-1">{block.content}</span>
                  </div>
                );

              case 'todo':
                return (
                  <div
                    key={block.id || idx}
                    className="flex items-center gap-2 pl-1 text-[11px] text-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => onToggleTodo?.(block.id)}
                      className="cursor-pointer"
                    >
                      <CheckSquare
                        size={13}
                        className={block.checked ? 'text-blue-600' : 'text-slate-300'}
                      />
                    </button>
                    <span className={block.checked ? 'line-through text-slate-400' : ''}>
                      {block.content}
                    </span>
                  </div>
                );

              default:
                return (
                  <p
                    key={block.id || idx}
                    className="text-slate-600 leading-relaxed text-[11px]"
                  >
                    {block.content}
                  </p>
                );
            }
          })
        )}

        {/* Live typing cursor indicator if streaming */}
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[10px] text-blue-500 pt-1 font-mono">
            <span className="w-1.5 h-3 bg-blue-500 animate-pulse" />
            <span>Formatowanie bloków w toku...</span>
          </div>
        )}
      </div>

      {/* Mini Editor Bottom Status */}
      <div className="p-2.5 border-t border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
        <span>{blocks.length} bloków dokumentu</span>
        <span>Autozapis w przestrzeni roboczej</span>
      </div>
    </div>
  );
};
