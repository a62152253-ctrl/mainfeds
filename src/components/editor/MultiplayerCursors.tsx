import React, { useEffect, useState, useRef, useMemo } from 'react';
import { User, Sparkles, Eye, Lock } from 'lucide-react';
import { CollaboratorPresence, TeamMember } from '../../types/workspace';

const COLLABORATOR_COLORS = [
  { bg: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9', border: '#7c3aed' }, // Purple
  { bg: '#10b981', light: '#ecfdf5', text: '#047857', border: '#059669' }, // Emerald
  { bg: '#f43f5e', light: '#fff1f2', text: '#be123c', border: '#e11d48' }, // Rose
  { bg: '#0284c7', light: '#f0f9ff', text: '#0369a1', border: '#0284c7' }, // Blue
  { bg: '#d97706', light: '#fffbeb', text: '#b45309', border: '#d97706' }, // Amber
  { bg: '#059669', light: '#ecfdf5', text: '#065f46', border: '#047857' }, // Green
  { bg: '#7c3aed', light: '#f5f3ff', text: '#5b21b6', border: '#6d28d9' }, // Violet
];

export function getCollaboratorColor(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

interface MultiplayerCursorsProps {
  pageId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  teamMembers?: TeamMember[];
  activeBlockId: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScrollToBlock?: (blockId: string) => void;
}

export const MultiplayerCursors: React.FC<MultiplayerCursorsProps> = ({
  pageId,
  currentUserId,
  currentUserName,
  currentUserEmail,
  teamMembers = [],
  activeBlockId,
  containerRef,
  onScrollToBlock,
}) => {
  const [remotePresences, setRemotePresences] = useState<Record<string, CollaboratorPresence>>({});
  const channelRef = useRef<BroadcastChannel | null>(null);
  const myColor = useMemo(() => getCollaboratorColor(currentUserEmail || currentUserId), [currentUserEmail, currentUserId]);

  // Set up BroadcastChannel for real-time local / multi-window collaboration
  useEffect(() => {
    const channelName = `nowoczesne_presence_${pageId}`;
    let bc: BroadcastChannel | null = null;

    try {
      bc = new BroadcastChannel(channelName);
      channelRef.current = bc;

      bc.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || !data.userId || data.userId === currentUserId) return;

        if (data.type === 'leave') {
          setRemotePresences((prev) => {
            const next = { ...prev };
            delete next[data.userId];
            return next;
          });
          return;
        }

        if (data.type === 'presence') {
          setRemotePresences((prev) => ({
            ...prev,
            [data.userId]: {
              userId: data.userId,
              userName: data.userName,
              userEmail: data.userEmail,
              userColor: data.userColor,
              activeBlockId: data.activeBlockId,
              cursor: data.cursor,
              lastActive: Date.now(),
              isTyping: data.isTyping,
            },
          }));
        }
      };

      // Announce initial join
      bc.postMessage({
        type: 'presence',
        userId: currentUserId,
        userName: currentUserName,
        userEmail: currentUserEmail,
        userColor: myColor.bg,
        activeBlockId,
        cursor: null,
      });
    } catch {
      // Fallback if BroadcastChannel unavailable
    }

    // Cleanup stale presences every 10 seconds
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemotePresences((prev) => {
        let changed = false;
        const next: Record<string, CollaboratorPresence> = {};
        for (const [id, pres] of Object.entries(prev)) {
          if (now - pres.lastActive < 30000) {
            next[id] = pres;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 10000);

    return () => {
      clearInterval(cleanupInterval);
      if (bc) {
        try {
          bc.postMessage({ type: 'leave', userId: currentUserId });
          bc.close();
        } catch {}
      }
      channelRef.current = null;
    };
  }, [pageId, currentUserId, currentUserName, currentUserEmail, myColor]);

  // Broadcast mouse movements throttled
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastSent = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSent < 40) return; // ~25 fps throttle
      lastSent = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left + container.scrollLeft;
      const y = e.clientY - rect.top + container.scrollTop;

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'presence',
            userId: currentUserId,
            userName: currentUserName,
            userEmail: currentUserEmail,
            userColor: myColor.bg,
            activeBlockId,
            cursor: { x: Math.round(x), y: Math.round(y) },
          });
        } catch {}
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [containerRef, currentUserId, currentUserName, currentUserEmail, myColor, activeBlockId]);

  // Broadcast active block change
  useEffect(() => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'presence',
          userId: currentUserId,
          userName: currentUserName,
          userEmail: currentUserEmail,
          userColor: myColor.bg,
          activeBlockId,
          cursor: null,
        });
      } catch {}
    }
  }, [activeBlockId, currentUserId, currentUserName, currentUserEmail, myColor]);

  const activeCollaborators = Object.values(remotePresences);

  return (
    <>
      {/* 1. Real-time Collaborators Top Bar Header Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200/60 transition-colors px-2.5 py-1 rounded-full text-xs border border-slate-200/80 backdrop-blur-xs select-none">
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {/* Current User Pill */}
          <div
            className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs cursor-default"
            style={{ backgroundColor: myColor.bg }}
            title={`Ty (${currentUserName}) - Na żywo`}
          >
            {(currentUserName || 'U')[0].toUpperCase()}
          </div>

          {/* Remote Collaborators */}
          {activeCollaborators.map((c) => (
            <button
              key={c.userId}
              onClick={() => c.activeBlockId && onScrollToBlock?.(c.activeBlockId)}
              className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: c.userColor }}
              title={`${c.userName} (${c.userEmail}) ${c.activeBlockId ? '· Kliknij, aby przejść do edytowanej sekcji' : ''}`}
            >
              {(c.userName || c.userEmail)[0].toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 pl-1 text-[11px] font-medium text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {activeCollaborators.length > 0
              ? `${activeCollaborators.length + 1} na żywo`
              : 'Multiplayer gotowy'}
          </span>
        </div>
      </div>

      {/* 2. Floating Figma-Style Multiplayer Cursors on Canvas */}
      {activeCollaborators.map((c) => {
        if (!c.cursor) return null;

        return (
          <div
            key={c.userId}
            className="absolute pointer-events-none z-30 transition-all duration-75 ease-out select-none"
            style={{
              left: `${c.cursor.x}px`,
              top: `${c.cursor.y}px`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Figma Arrow Pointer */}
            <svg
              className="w-4 h-4 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={c.userColor}
              stroke="white"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35z" />
            </svg>

            {/* Name Badge */}
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md flex items-center gap-1 mt-0.5 whitespace-nowrap"
              style={{ backgroundColor: c.userColor }}
            >
              <span>{c.userName}</span>
              {c.activeBlockId && (
                <span className="opacity-80 text-[9px] font-normal">✍️ pisze...</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};
