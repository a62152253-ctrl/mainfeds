import React, { useState } from 'react';
import {
  ArrowLeft,
  Globe,
  Share2,
  Copy,
  Check,
  Heart,
  Eye,
  User,
  Home,
  Download,
  ExternalLink,
  Video as VideoIcon,
  Music as MusicIcon,
  TrendingUp,
  Sliders,
  Milestone,
  Paperclip,
  Layout,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';
import { isBlockedUrl } from '../utils/contentFilter';

function parseYouTubeId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const PublicPageView: React.FC = () => {
  const { activeDoc, activePublicPage, setActiveView, likePublicPage } = useWorkspace();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const displayDoc = activePublicPage || activeDoc;

  if (!displayDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] text-slate-500 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Globe size={28} />
        </div>
        <h3 className="font-bold text-base text-slate-800">Nie wybrano publicznej strony</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Wybierz opublikowaną stronę z widoku głównego lub opublikuj własny dokument z poziomu edytora.
        </p>
        <button
          onClick={() => setActiveView('home')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <Home size={14} />
          <span>Wróć do strony głównej</span>
        </button>
      </div>
    );
  }

  const isOwner = user && displayDoc.ownerId === user.uid;

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('public', displayDoc.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = async () => {
    if (hasLiked) return;
    setHasLiked(true);
    await likePublicPage(displayDoc.id);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white dark:bg-[#191919] text-[#37352f] dark:text-[#d4d4d4] flex flex-col font-sans transition-colors">
      {/* Top Public Header */}
      <header className="h-11 px-4 bg-white dark:bg-[#191919] border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] flex items-center justify-between text-xs shrink-0 select-none sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveView('home')}
            className="flex items-center gap-1.5 text-[#787774] dark:text-[#9b9a97] hover:text-[#37352f] dark:hover:text-white cursor-pointer font-medium transition-colors"
          >
            <Home size={13} />
            <span>Pulpit</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveView('doc')}
              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#2383e2]/10 text-[#2383e2] hover:bg-[#2383e2]/20 cursor-pointer font-medium transition-colors"
            >
              <ArrowLeft size={12} />
              <span>Edytuj stronę</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[rgba(55,53,47,0.04)] dark:bg-[rgba(255,255,255,0.06)] text-[#787774] dark:text-[#9b9a97] font-mono text-[11px]">
            <Globe size={11} className="text-[#2383e2]" />
            <span className="truncate max-w-[200px]">
              searchpoint.pl/p/{displayDoc.publicSlug || displayDoc.id}
            </span>
          </div>

          <button
            onClick={handleLike}
            disabled={hasLiked}
            className={`px-2.5 py-1 rounded-[4px] border flex items-center gap-1 text-xs font-medium cursor-pointer transition-all ${
              hasLiked
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200'
                : 'bg-white dark:bg-[#202020] hover:bg-rose-50 text-[#787774] dark:text-[#9b9a97] hover:text-rose-600 border-[rgba(55,53,47,0.12)] dark:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            <Heart size={12} className={hasLiked ? 'fill-rose-500 text-rose-500' : ''} />
            <span>{displayDoc.likesCount ? displayDoc.likesCount + (hasLiked ? 1 : 0) : hasLiked ? 1 : 0}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-2.5 py-1 bg-[#2383e2] hover:bg-[#1d6fc2] text-white rounded-[4px] cursor-pointer flex items-center gap-1 text-xs font-medium transition-all shadow-2xs"
          >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            <span>{copied ? 'Skopiowano' : 'Udostępnij'}</span>
          </button>
        </div>
      </header>

      {/* Page Content Body */}
      <div className="flex-1 flex flex-col items-center">
        {displayDoc.coverGradient && (
          <div
            className="w-full h-44 shrink-0 transition-all"
            style={{ background: displayDoc.coverGradient }}
          />
        )}

        <div className={`w-full max-w-3xl px-6 md:px-12 pb-32 ${displayDoc.coverGradient ? '-mt-10' : 'pt-10'}`}>
          <div className="text-5xl mb-3 select-none leading-none inline-block">
            {displayDoc.icon || '📄'}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#37352f] dark:text-white mb-2.5">
            {displayDoc.title}
          </h1>

          {/* Author metadata and stats bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#787774] dark:text-[#9b9a97] font-sans mb-6 border-b border-[rgba(55,53,47,0.09)] dark:border-[rgba(255,255,255,0.094)] pb-3">
            <div className="flex items-center gap-2">
              {displayDoc.authorPhoto ? (
                <img
                  src={displayDoc.authorPhoto}
                  alt={displayDoc.authorName || 'Autor'}
                  className="w-5 h-5 rounded-full object-cover border border-[rgba(55,53,47,0.12)]"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#2383e2]/10 text-[#2383e2] flex items-center justify-center font-bold text-[10px]">
                  {(displayDoc.authorName || 'A')[0].toUpperCase()}
                </div>
              )}
              <span className="font-medium text-[#37352f] dark:text-white">
                {displayDoc.authorName || 'Anonim'}
              </span>
              <span>•</span>
              <span>
                {new Date(displayDoc.updatedAt || Date.now()).toLocaleDateString([], {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-[#787774] dark:text-[#9b9a97]">
              <span className="flex items-center gap-1">
                <Eye size={12} />
                <span>{displayDoc.viewsCount || 1} wyświetleń</span>
              </span>
              <span className="flex items-center gap-1">
                <Heart size={12} className="text-rose-400" />
                <span>{displayDoc.likesCount || 0}</span>
              </span>
            </div>
          </div>

          {/* Tags */}
          {displayDoc.tags && displayDoc.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-6">
              {displayDoc.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-[4px] text-[11px] bg-[rgba(55,53,47,0.06)] dark:bg-[rgba(255,255,255,0.08)] text-[#787774] dark:text-[#9b9a97]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Rendered Blocks */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            {displayDoc.blocks && displayDoc.blocks.length > 0 ? (
              displayDoc.blocks.map((b) => (
                <div key={b.id}>
                  {b.type === 'h1' && (
                    <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-2 tracking-tight">
                      {b.content}
                    </h1>
                  )}
                  {b.type === 'h2' && (
                    <h2 className="text-xl font-semibold text-slate-900 mt-5 mb-2 tracking-tight">
                      {b.content}
                    </h2>
                  )}
                  {b.type === 'h3' && (
                    <h3 className="text-lg font-medium text-slate-800 mt-4 mb-1">
                      {b.content}
                    </h3>
                  )}
                  {b.type === 'p' && (
                    <p className="text-slate-700 leading-relaxed text-[15px]">
                      {b.content}
                    </p>
                  )}
                  {b.type === 'todo' && (
                    <div className="flex items-center gap-2.5 my-1.5">
                      <input
                        type="checkbox"
                        checked={!!b.checked}
                        readOnly
                        className="w-4 h-4 rounded text-blue-600 accent-blue-600 pointer-events-none"
                      />
                      <span className={b.checked ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                        {b.content}
                      </span>
                    </div>
                  )}
                  {b.type === 'callout' && (
                    <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 my-3 text-slate-800 shadow-2xs">
                      <span className="text-lg shrink-0">💡</span>
                      <span className="text-xs lg:text-sm leading-relaxed">{b.content}</span>
                    </div>
                  )}
                  {b.type === 'quote' && (
                    <blockquote className="border-l-3 border-blue-500 pl-4 py-1.5 my-3 italic text-slate-600 bg-slate-50/60 rounded-r-xl">
                      {b.content}
                    </blockquote>
                  )}
                  {b.type === 'toggle' && (
                    <details className="my-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 group">
                      <summary className="cursor-pointer font-medium text-slate-800 list-none flex items-center justify-between">
                        <span>{b.content}</span>
                        <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-2.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
                        {b.toggleDetails}
                      </div>
                    </details>
                  )}
                  {b.type === 'code' && (
                    <pre className="my-3 bg-slate-900 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-sm">
                      {b.content}
                    </pre>
                  )}
                  {b.type === 'bullet' && (
                    <div className="flex items-start gap-2.5 my-1.5 pl-2">
                      <span className="text-slate-400 text-lg leading-none">•</span>
                      <span className="text-slate-700">{b.content}</span>
                    </div>
                  )}
                  {b.type === 'number' && (
                    <div className="flex items-start gap-2.5 my-1.5 pl-2">
                      <span className="text-slate-500 font-mono text-xs font-semibold">1.</span>
                      <span className="text-slate-700">{b.content}</span>
                    </div>
                  )}
                  {b.type === 'image' && (
                    <figure className="my-4 text-center">
                      {isBlockedUrl(b.imageUrl || b.content) ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-rose-600 font-medium">
                          ⛔ Obrazek zablokowany ze względów bezpieczeństwa (treści 18+)
                        </div>
                      ) : (
                        <>
                          <img
                            src={b.imageUrl || b.content}
                            alt={b.imageCaption || 'Obraz'}
                            className="max-w-full max-h-[480px] rounded-2xl mx-auto border border-slate-200 shadow-sm object-contain"
                          />
                          {b.imageCaption && (
                            <figcaption className="text-xs text-slate-400 mt-1.5 italic">
                              {b.imageCaption}
                            </figcaption>
                          )}
                        </>
                      )}
                    </figure>
                  )}
                  {b.type === 'table' && b.tableData && b.tableData.length > 0 && (
                    <div className="my-4 overflow-x-auto border border-slate-200 rounded-2xl shadow-2xs">
                      <table className="w-full border-collapse text-xs">
                        <tbody>
                          {b.tableData.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className={
                                rIdx === 0
                                  ? 'bg-slate-50 font-bold text-slate-800 border-b border-slate-200'
                                  : 'border-b border-slate-100 hover:bg-slate-50/50'
                              }
                            >
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2.5 border-r border-slate-100 last:border-r-0">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {b.type === 'bookmark' && (
                    isBlockedUrl(b.bookmarkUrl || b.content) ? (
                      <div className="my-3 p-3.5 bg-slate-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-600 font-medium">
                        <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                        <span>Zakładka do strony dla dorosłych została zablokowana (18+)</span>
                      </div>
                    ) : (
                      <a
                        href={b.bookmarkUrl || b.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="my-3 p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-blue-600 transition-colors block group"
                      >
                        <div className="truncate">
                          <div className="font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                            {b.bookmarkTitle || b.content || 'Zakładka URL'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {b.bookmarkUrl || b.content}
                          </div>
                        </div>
                        <span className="text-slate-400 group-hover:text-blue-600 ml-2">↗</span>
                      </a>
                    )
                  )}
                  {/* Video */}
                  {b.type === 'video' && (
                    <div className="my-4">
                      {isBlockedUrl(b.videoUrl) ? (
                        <div className="p-4 bg-slate-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-medium text-center">
                          ⛔ Wideo zablokowane ze względów bezpieczeństwa (treści 18+)
                        </div>
                      ) : b.videoUrl && parseYouTubeId(b.videoUrl) ? (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-sm">
                          <iframe
                            src={`https://www.youtube.com/embed/${parseYouTubeId(b.videoUrl)}`}
                            title="YouTube video player"
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : b.videoUrl ? (
                        <video
                          src={b.videoUrl}
                          controls
                          className="w-full rounded-2xl border border-slate-200 bg-black max-h-80 shadow-sm"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Audio */}
                  {b.type === 'audio' && b.audioUrl && (
                    <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      {isBlockedUrl(b.audioUrl) ? (
                        <span className="text-xs text-rose-600 font-medium">⛔ Źródło audio zablokowane (18+)</span>
                      ) : (
                        <audio controls src={b.audioUrl} className="w-full h-10 rounded-xl" />
                      )}
                    </div>
                  )}

                  {/* Stat */}
                  {b.type === 'stat' && (
                    <div className="my-4 p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">{b.content || 'Wskaźnik KPI'}</div>
                        <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{b.statValue || '0'}</div>
                      </div>
                      {b.statTrend && (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            b.statTrend.startsWith('-')
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}
                        >
                          {b.statTrend}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Progress */}
                  {b.type === 'progress' && (
                    <div className="my-4 p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-800 font-semibold">{b.content || 'Postęp'}</span>
                        <span className="font-mono text-slate-500 font-bold">{b.progressPercent ?? 50}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, b.progressPercent ?? 50))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Button */}
                  {b.type === 'button' && (() => {
                    const isBlocked = isBlockedUrl(b.buttonUrl);
                    if (isBlocked) {
                      return (
                        <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <Lock size={14} className="text-rose-600 shrink-0" />
                          <span>Link przycisku zablokowany ze względów bezpieczeństwa (treść 18+).</span>
                        </div>
                      );
                    }
                    return (
                      <div className="my-4 text-center sm:text-left">
                        <a
                          href={b.buttonUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ backgroundColor: b.buttonColor || '#2563eb' }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                        >
                          <span>{b.content || 'Przejdź do strony'}</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    );
                  })()}

                  {/* Timeline */}
                  {b.type === 'timeline' && (
                    <div className="flex items-start gap-3.5 my-3.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-2xs">
                      <div className="w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-amber-100 mt-1 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono">
                          {b.timelineDate || 'Etap'}
                        </span>
                        <div className="text-xs text-slate-800 font-medium mt-1.5">{b.content}</div>
                      </div>
                    </div>
                  )}

                  {/* File */}
                  {b.type === 'file' && (() => {
                    const isBlocked = isBlockedUrl(b.fileUrl);
                    if (isBlocked) {
                      return (
                        <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <Lock size={14} className="text-rose-600 shrink-0" />
                          <span>Pobieranie pliku zablokowane ze względów bezpieczeństwa (treść 18+).</span>
                        </div>
                      );
                    }
                    return (
                      <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Download size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-800 truncate">{b.fileName || 'Plik do pobrania'}</div>
                            <div className="text-[11px] text-slate-400">{b.fileSize || 'Rozmiar nieznany'}</div>
                          </div>
                        </div>
                        <a
                          href={b.fileUrl || '#'}
                          download
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Download size={13} />
                          <span>Pobierz</span>
                        </a>
                      </div>
                    );
                  })()}

                  {/* Embed */}
                  {b.type === 'embed' && b.embedUrl && (() => {
                    const isBlocked = isBlockedUrl(b.embedUrl);
                    if (isBlocked) {
                      return (
                        <div className="my-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                          <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                          <span>Osadzona zawartość została zablokowana ze względów bezpieczeństwa (treść 18+ / niedozwolony URL).</span>
                        </div>
                      );
                    }
                    return (
                      <div className="my-4 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xs">
                        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                          <span className="truncate max-w-xs font-mono text-[10px]">{b.embedUrl}</span>
                          <a
                            href={b.embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1 text-[10px]"
                          >
                            <span>Otwórz w nowej karcie</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                        <iframe
                          src={b.embedUrl}
                          title={b.content || 'Osadzona treść'}
                          className="w-full h-72 border-none"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />
                      </div>
                    );
                  })()}

                  {b.type === 'math' && (
                    <div className="my-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-center text-blue-700">
                      {b.content}
                    </div>
                  )}
                  {b.type === 'divider' && <div className="my-5 border-t border-slate-200" />}
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">Ten dokument nie ma jeszcze treści.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
