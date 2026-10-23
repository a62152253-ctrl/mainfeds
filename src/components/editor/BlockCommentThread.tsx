import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  X,
  AtSign,
  CornerDownRight,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PageComment, TeamMember } from '../../types/workspace';

interface BlockCommentThreadProps {
  pageId: string;
  blockId: string;
  comments: PageComment[];
  teamMembers?: TeamMember[];
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (text: string) => Promise<void>;
  onReplyToComment: (commentId: string, text: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
}

export const BlockCommentThread: React.FC<BlockCommentThreadProps> = ({
  pageId,
  blockId,
  comments,
  teamMembers = [],
  isOpen,
  onClose,
  onAddComment,
  onReplyToComment,
  onResolveComment,
}) => {
  const [newText, setNewText] = useState('');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filter comments belonging to this block
  const blockComments = comments.filter((c) => c.blockId === blockId);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    await onAddComment(newText.trim());
    setNewText('');
    setShowMentionMenu(false);
  };

  const handleSendReply = async (commentId: string) => {
    const text = replyTextMap[commentId];
    if (!text || !text.trim()) return;
    await onReplyToComment(commentId, text.trim());
    setReplyTextMap((prev) => ({ ...prev, [commentId]: '' }));
    setActiveReplyId(null);
  };

  const handleInsertMention = (member: TeamMember) => {
    const mentionTag = `@${member.name || member.email.split('@')[0]} `;
    if (activeReplyId) {
      setReplyTextMap((prev) => ({
        ...prev,
        [activeReplyId]: (prev[activeReplyId] || '') + mentionTag,
      }));
    } else {
      setNewText((prev) => prev + mentionTag);
    }
    setShowMentionMenu(false);
  };

  // Helper to format text with @mentions
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+|@[a-zA-Z0-9_ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.2 rounded-md bg-blue-100/90 text-blue-700 font-semibold text-[11px] mx-0.5"
          >
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className="my-2.5 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-1 text-slate-800 z-20 relative select-text"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Thread Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare size={13} />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 leading-none">
              Dyskusja pod tą sekcją
            </h4>
            <span className="text-[10px] text-slate-400">
              {blockComments.length === 0
                ? 'Brak wpisów · Rozpocznij wątek'
                : `${blockComments.length} ${blockComments.length === 1 ? 'komentarz' : 'komentarze'}`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Comments List */}
      <div className="py-3 space-y-3 max-h-72 overflow-y-auto">
        {blockComments.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            Napisz pierwszy komentarz do tego akapitu i oznacz zespół przez @.
          </div>
        ) : (
          blockComments.map((comment) => (
            <div
              key={comment.id}
              className={`p-3 rounded-xl border transition-all ${
                comment.resolved
                  ? 'bg-slate-50/60 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              {/* Comment Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {comment.avatar || (comment.author || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-900">{comment.author}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(comment.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onResolveComment(comment.id)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${
                    comment.resolved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                  }`}
                  title={comment.resolved ? 'Wznów dyskusję' : 'Oznacz jako rozwiązane'}
                >
                  <CheckCircle2 size={11} />
                  <span>{comment.resolved ? 'Rozwiązane' : 'Rozwiąż'}</span>
                </button>
              </div>

              {/* Comment Content */}
              <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                {renderFormattedText(comment.text)}
              </p>

              {/* Replies List */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2.5 pt-2 pl-3 border-l-2 border-indigo-100 space-y-2">
                  {comment.replies.map((reply, index) => (
                    <div key={index} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-800">{reply.author}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">
                          {new Date(reply.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {renderFormattedText(reply.text)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Trigger or Reply Box */}
              {!comment.resolved && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  {activeReplyId === comment.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={replyTextMap[comment.id] || ''}
                        onChange={(e) =>
                          setReplyTextMap({ ...replyTextMap, [comment.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendReply(comment.id);
                          }
                        }}
                        placeholder="Napisz odpowiedź (@oznacz)..."
                        className="flex-1 px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(comment.id)}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer"
                        title="Wyślij odpowiedź"
                      >
                        <Send size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveReplyId(comment.id)}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <CornerDownRight size={11} />
                      <span>Odpowiedz</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Main Comment Input Form */}
      <form onSubmit={handleSend} className="pt-2 border-t border-slate-100 space-y-2">
        {/* Mention Picker Popover */}
        {showMentionMenu && teamMembers.length > 0 && (
          <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xl space-y-1 mb-2 animate-in zoom-in-95 duration-100">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
              Wybierz osobę do oznaczenia (@):
            </span>
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {teamMembers.map((m) => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => handleInsertMention(m)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 text-xs flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                      {(m.name || m.email)[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{m.name || m.email.split('@')[0]}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{m.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <textarea
            ref={inputRef}
            rows={2}
            value={newText}
            onChange={(e) => {
              setNewText(e.target.value);
              if (e.target.value.endsWith('@')) {
                setShowMentionMenu(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Napisz komentarz... Wpisz @ aby oznaczyć współpracownika"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowMentionMenu(!showMentionMenu)}
            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              showMentionMenu
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Oznacz członka zespołu (@)"
          >
            <AtSign size={13} />
            <span>Oznacz (@)</span>
          </button>

          <button
            type="submit"
            disabled={!newText.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
          >
            <Send size={12} />
            <span>Wyślij</span>
          </button>
        </div>
      </form>
    </div>
  );
};
