export interface SpeechState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
}
