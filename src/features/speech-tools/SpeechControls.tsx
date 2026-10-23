import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { speakText, stopSpeaking } from './speechService';

interface SpeechControlsProps {
  onInsertDictation: (text: string) => void;
  getEditorText: () => string;
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({
  onInsertDictation,
  getEditorText,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isListening, isSupported, toggleListening } = useSpeechRecognition((text) => {
    onInsertDictation(' ' + text.trim());
  });

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const text = getEditorText();
      setIsSpeaking(true);
      speakText(text, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="flex items-center gap-0.5 bg-[#191919] p-0.5 rounded border border-[#2d2d2d] text-xs">
      {isSupported && (
        <button
          onClick={toggleListening}
          title={isListening ? 'Zatrzymaj dyktowanie' : 'Dyktuj głosem (PL)'}
          className={`p-1 rounded cursor-pointer transition-colors ${
            isListening
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'hover:bg-[#2b2b2b] text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isListening ? <Mic size={13} className="text-red-400" /> : <Mic size={13} />}
        </button>
      )}

      <button
        onClick={handleToggleSpeak}
        title={isSpeaking ? 'Zatrzymaj lektora' : 'Odsłuchaj notatkę (Lektor PL)'}
        className={`p-1 rounded cursor-pointer transition-colors ${
          isSpeaking
            ? 'bg-blue-500/20 text-blue-400'
            : 'hover:bg-[#2b2b2b] text-zinc-400 hover:text-zinc-200'
        }`}
      >
        {isSpeaking ? <VolumeX size={13} className="text-blue-400" /> : <Volume2 size={13} />}
      </button>
    </div>
  );
};
