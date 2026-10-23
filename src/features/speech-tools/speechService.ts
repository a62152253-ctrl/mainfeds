let isCancelled = false;

/**
 * Splits long text into natural sentence chunks to bypass browser utterance timeouts.
 */
function splitIntoSentenceChunks(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!matches) return [text];
  return matches.map((s) => s.trim()).filter(Boolean);
}

export const speakText = (text: string, onEnd?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  isCancelled = false;
  window.speechSynthesis.cancel();

  const cleanText = text.replace(/<[^>]*>?/gm, '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const chunks = splitIntoSentenceChunks(cleanText);
  const voices = window.speechSynthesis.getVoices();
  const plVoice = voices.find((v) => v.lang === 'pl-PL' || v.lang.startsWith('pl'));

  let currentChunkIndex = 0;

  function speakNextChunk() {
    if (isCancelled || currentChunkIndex >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunk = chunks[currentChunkIndex];
    currentChunkIndex++;

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = 'pl-PL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (plVoice) {
      utterance.voice = plVoice;
    }

    utterance.onend = () => {
      speakNextChunk();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled') {
        console.warn('Speech synthesis error:', e);
      }
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  speakNextChunk();
};

export const stopSpeaking = (): void => {
  isCancelled = true;
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
