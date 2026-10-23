export interface EncryptedPayload {
  version: number; // schema version (1)
  algorithm: 'AES-GCM-256';
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded (12 bytes)
  salt: string; // Base64 encoded (16 bytes)
  iterations: number; // PBKDF2 iterations (100,000)
  timestamp: number;
  hint?: string;
  docTitle?: string;
}

export interface VaultConfig {
  isLocked: boolean;
  hasPassword: boolean;
  autoLockMinutes: number; // 0 for disabled, 1, 5, 15, 30
  hint?: string;
  lastUnlockedAt?: number;
}

export interface VaultDocumentState {
  isLocked: boolean;
  hasPassword: boolean;
  payload?: EncryptedPayload;
  hint?: string;
  autoLockMinutes?: number;
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Bardzo słabe' | 'Słabe' | 'Średnie' | 'Silne' | 'Bardzo silne';
  color: string;
  feedback: string[];
}
