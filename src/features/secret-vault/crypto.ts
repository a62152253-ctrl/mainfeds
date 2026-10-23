import { EncryptedPayload, PasswordStrength } from './types';

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const PBKDF2_ITERATIONS = 100000;

/**
 * Derives an AES-GCM-256 CryptoKey from a user password and a cryptographic salt using PBKDF2.
 */
async function deriveEncryptionKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary plaintext (e.g. JSON string of blocks) using AES-256-GCM.
 */
export async function encryptData(
  plaintext: string,
  password: string,
  hint?: string,
  docTitle?: string
): Promise<EncryptedPayload> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(password, salt);

  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    key,
    encodedPlaintext
  );

  return {
    version: 1,
    algorithm: 'AES-GCM-256',
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
    iterations: PBKDF2_ITERATIONS,
    timestamp: Date.now(),
    hint: hint?.trim() || undefined,
    docTitle: docTitle?.trim() || undefined,
  };
}

/**
 * Decrypts an EncryptedPayload using AES-256-GCM. Throws an Error if password is incorrect.
 */
export async function decryptData(
  payload: EncryptedPayload,
  password: string
): Promise<string> {
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveEncryptionKey(password, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
      },
      key,
      ciphertext as any
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    throw new Error('Niepoprawne hasło do Sejfu Dokumentu lub uszkodzone dane.');
  }
}

/**
 * Evaluates password strength and returns score (0-4), label, color and feedback.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  if (!password) {
    return {
      score: 0,
      label: 'Bardzo słabe',
      color: 'bg-rose-500',
      feedback: ['Wprowadź hasło'],
    };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4
  const normalizedScore = Math.min(score, 4);

  if (password.length < 8) feedback.push('Użyj co najmniej 8 znaków');
  if (!/[A-Z]/.test(password)) feedback.push('Dodaj wielką literę');
  if (!/\d/.test(password)) feedback.push('Dodaj cyfrę');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Dodaj znak specjalny (!@#$%^&*)');

  const levels: Record<number, { label: PasswordStrength['label']; color: string }> = {
    0: { label: 'Bardzo słabe', color: 'bg-rose-500' },
    1: { label: 'Słabe', color: 'bg-orange-500' },
    2: { label: 'Średnie', color: 'bg-amber-500' },
    3: { label: 'Silne', color: 'bg-blue-500' },
    4: { label: 'Bardzo silne', color: 'bg-emerald-500' },
  };

  return {
    score: normalizedScore,
    label: levels[normalizedScore].label,
    color: levels[normalizedScore].color,
    feedback: feedback.length > 0 ? feedback : ['Hasło spełnia wszystkie kryteria bezpieczeństwa'],
  };
}

/**
 * Generates a 12-word cryptographic recovery mnemonic.
 */
const WORD_LIST = [
  'alfa', 'bursztyn', 'chmura', 'diament', 'ekran', 'fala', 'granit', 'horyzont',
  'iskra', 'jaskinia', 'kryształ', 'lawina', 'magma', 'noc', 'ocean', 'pulsar',
  'radar', 'srebro', 'tarcza', 'uran', 'wektor', 'zenit', 'kwant', 'rdzen'
];

export function generateRecoveryPhrase(): string {
  const randomValues = new Uint8Array(12);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((val) => WORD_LIST[val % WORD_LIST.length])
    .join('-');
}

/**
 * Exports an encrypted vault payload as a downloadable JSON file.
 */
export function exportEncryptedVaultFile(payload: EncryptedPayload, docTitle?: string): void {
  const cleanTitle = (docTitle || 'sejf-dokumentu')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = `${cleanTitle}-zaszyfrowany.vault.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports an encrypted vault payload from text.
 */
export function parseEncryptedVaultFile(raw: string): EncryptedPayload | null {
  try {
    const data = JSON.parse(raw);
    if (
      data.algorithm === 'AES-GCM-256' &&
      typeof data.ciphertext === 'string' &&
      typeof data.iv === 'string' &&
      typeof data.salt === 'string'
    ) {
      return data as EncryptedPayload;
    }
  } catch {
    return null;
  }
  return null;
}
