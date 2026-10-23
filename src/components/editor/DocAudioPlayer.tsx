import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DocBlock } from '../../types/workspace';

interface DocAudioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  blocks: DocBlock[];
  onHighlightBlock: (blockId: string) => void;
}

export const DocAudioPlayer: React.FC<DocAudioPlayerProps> = ({
  isOpen,
  onClose,
  title,
  blocks,
  onHighlightBlock,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number>(-1);

  // Queue of chunks to read: index -1 is title, 0..N are blocks
  const readableItems = useRef<{ id: string; text: string }[]>([]);
  const currentItemIndex = useRef<number>(0);

  // Re-build readable items
  useEffect(() => {
    const items: { id: string; text: string }[] = [];
    if (title.trim()) {
      items.push({ id: 'title', text: title });
    }
    blocks.forEach((b) => {
      const cleanText = (b.content || '').replace(/[#*`_~>[\]]/g, '').trim();
      if (cleanText) {
        items.push({ id: b.id, text: cleanText });
      }
    });
    readableItems.current = items;
  }, [title, blocks]);

  const speakNext = () => {
    if (!('speechSynthesis' in window)) return;
    if (currentItemIndex.current >= readableItems.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentBlockIndex(-1);
      return;
    }

    const item = readableItems.current[currentItemIndex.current];
    if (!item) return;

    if (item.id !== 'title') {
      onHighlightBlock(item.id);
    }
    setCurrentBlockIndex(currentItemIndex.current);

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.rate = speed;

    // Pick best voice
    const voices = window.speechSynthesis.getVoices();
    const plVoice = voices.find((v) => v.lang.startsWith('pl'));
    if (plVoice) {
      utterance.voice = plVoice;
      utterance.lang = 'pl-PL';
    }

    utterance.onend = () => {
      currentItemIndex.current += 1;
      speakNext();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    currentItemIndex.current = 0;
    setIsPlaying(true);
    setIsPaused(false);
    speakNext();
  };

  const handlePause = () => {
    if (!('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentBlockIndex(-1);
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    setSpeed(speeds[nextIdx]);
    if (isPlaying && !isPaused) {
      window.speechSynthesis.cancel();
      speakNext();
    }
  };

  // Auto-start when modal opens
  useEffect(() => {
    if (isOpen) {
      handleStart();
    } else {
      handleStop();
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center animate-in slide-in-from-bottom-5 duration-200 select-none">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-3 px-4 flex items-center gap-3.5 border border-slate-700/80">
        {/* Animated Soundwave or Speaker */}
        <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
          {isPlaying && !isPaused ? (
            <div className="flex items-center gap-0.5 h-3.5">
              <span className="w-0.5 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-0.5 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-0.5 h-3.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          ) : (
            <Volume2 size={16} />
          )}
        </div>

        {/* Text Info */}
        <div className="max-w-[200px] sm:max-w-xs min-w-0">
          <h4 className="text-xs font-semibold text-slate-200 truncate">
            {isPlaying
              ? currentBlockIndex === 0
                ? `Tytuł: ${title}`
                : `Czytanie dokumentu (${currentBlockIndex + 1}/${readableItems.current.length})`
              : 'Czytanie zatrzymane'}
          </h4>
          <p className="text-[10px] text-slate-400 truncate">
            Syntezator mowy AI Audio
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 ml-2">
          {isPlaying ? (
            <button
              type="button"
              onClick={handlePause}
              title={isPaused ? 'Wznów' : 'Wstrzymaj'}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl cursor-pointer transition-colors"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              title="Rozpocznij czytanie od początku"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              <Play size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            title="Zatrzymaj"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
          >
            <Square size={14} />
          </button>

          <button
            type="button"
            onClick={cycleSpeed}
            title="Prędkość mowy"
            className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-colors"
          >
            {speed}x
          </button>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            handleStop();
            onClose();
          }}
          title="Zamknij odtwarzacz"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors ml-1"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
