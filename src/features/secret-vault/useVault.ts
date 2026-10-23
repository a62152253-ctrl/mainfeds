import { useState, useEffect, useCallback, useRef } from 'react';
import { EncryptedPayload, VaultConfig, PasswordStrength } from './types';
import {
  encryptData,
  decryptData,
  evaluatePasswordStrength,
  exportEncryptedVaultFile,
} from './crypto';
import { DocBlock } from '../../types/workspace';

interface UseVaultOptions {
  docId: string;
  docTitle: string;
  blocks: DocBlock[];
  onBlocksDecrypted?: (blocks: DocBlock[]) => void;
  onBlocksEncrypted?: (payload: EncryptedPayload) => void;
}

const VAULT_STORAGE_PREFIX = 'workspace_secret_vault_';

export function useVault({
  docId,
  docTitle,
  blocks,
  onBlocksDecrypted,
  onBlocksEncrypted,
}: UseVaultOptions) {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [hint, setHint] = useState<string | undefined>(undefined);
  const [autoLockMinutes, setAutoLockMinutes] = useState<number>(5);
  const [cachedPayload, setCachedPayload] = useState<EncryptedPayload | null>(null);
  const [decryptedBlocks, setDecryptedBlocks] = useState<DocBlock[] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'unlock' | 'setup' | 'settings'>('unlock');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const autoLockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activePasswordRef = useRef<string | null>(null);

  // Load vault metadata from localStorage for this document
  useEffect(() => {
    if (!docId) return;
    try {
      const raw = localStorage.getItem(`${VAULT_STORAGE_PREFIX}${docId}`);
      if (raw) {
        const payload: EncryptedPayload = JSON.parse(raw);
        setCachedPayload(payload);
        setHasPassword(true);
        setIsLocked(true);
        setHint(payload.hint);
      } else {
        setCachedPayload(null);
        setHasPassword(false);
        setIsLocked(false);
        setHint(undefined);
      }
    } catch {
      setCachedPayload(null);
      setHasPassword(false);
      setIsLocked(false);
    }
  }, [docId]);

  // Reset auto-lock timer on user activity
  const resetAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current);
    }
    if (autoLockMinutes > 0 && !isLocked && hasPassword) {
      autoLockTimerRef.current = setTimeout(() => {
        handleLock();
      }, autoLockMinutes * 60 * 1000);
    }
  }, [autoLockMinutes, isLocked, hasPassword]);

  useEffect(() => {
    if (!isLocked && hasPassword) {
      const handleActivity = () => resetAutoLockTimer();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keydown', handleActivity);
      resetAutoLockTimer();
      return () => {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        if (autoLockTimerRef.current) clearTimeout(autoLockTimerRef.current);
      };
    }
  }, [isLocked, hasPassword, resetAutoLockTimer]);

  // Lock the document
  const handleLock = useCallback(() => {
    if (!hasPassword) return;
    activePasswordRef.current = null;
    setDecryptedBlocks(null);
    setIsLocked(true);
  }, [hasPassword]);

  // Unlock with password
  const handleUnlock = useCallback(
    async (password: string): Promise<boolean> => {
      setUnlockError(null);
      if (!cachedPayload) {
        setUnlockError('Brak danych sejfu do odszyfrowania.');
        return false;
      }

      try {
        const json = await decryptData(cachedPayload, password);
        const parsedBlocks: DocBlock[] = JSON.parse(json);
        activePasswordRef.current = password;
        setDecryptedBlocks(parsedBlocks);
        setIsLocked(false);
        if (onBlocksDecrypted) {
          onBlocksDecrypted(parsedBlocks);
        }
        resetAutoLockTimer();
        return true;
      } catch (err: any) {
        setUnlockError(err.message || 'Niepoprawne hasło.');
        return false;
      }
    },
    [cachedPayload, onBlocksDecrypted, resetAutoLockTimer]
  );

  // Setup password & lock
  const handleSetupPassword = useCallback(
    async (password: string, newHint?: string): Promise<void> => {
      const json = JSON.stringify(blocks);
      const payload = await encryptData(json, password, newHint, docTitle);
      localStorage.setItem(`${VAULT_STORAGE_PREFIX}${docId}`, JSON.stringify(payload));
      setCachedPayload(payload);
      setHasPassword(true);
      setHint(newHint);
      activePasswordRef.current = password;
      setDecryptedBlocks(blocks);
      setIsLocked(false);
      if (onBlocksEncrypted) {
        onBlocksEncrypted(payload);
      }
    },
    [blocks, docId, docTitle, onBlocksEncrypted]
  );

  // Remove vault password (decrypt permanently)
  const handleRemovePassword = useCallback(() => {
    localStorage.removeItem(`${VAULT_STORAGE_PREFIX}${docId}`);
    setCachedPayload(null);
    setHasPassword(false);
    setIsLocked(false);
    setHint(undefined);
    activePasswordRef.current = null;
  }, [docId]);

  // Update password
  const handleChangePassword = useCallback(
    async (oldPass: string, newPass: string, newHint?: string): Promise<boolean> => {
      if (!cachedPayload) return false;
      try {
        const json = await decryptData(cachedPayload, oldPass);
        const newPayload = await encryptData(json, newPass, newHint, docTitle);
        localStorage.setItem(`${VAULT_STORAGE_PREFIX}${docId}`, JSON.stringify(newPayload));
        setCachedPayload(newPayload);
        setHint(newHint);
        activePasswordRef.current = newPass;
        return true;
      } catch (err: any) {
        setUnlockError(err.message || 'Niepoprawne dotychczasowe hasło.');
        return false;
      }
    },
    [cachedPayload, docId, docTitle]
  );

  // Export encrypted backup
  const handleExportBackup = useCallback(() => {
    if (cachedPayload) {
      exportEncryptedVaultFile(cachedPayload, docTitle);
    }
  }, [cachedPayload, docTitle]);

  return {
    isLocked,
    hasPassword,
    hint,
    autoLockMinutes,
    setAutoLockMinutes,
    cachedPayload,
    decryptedBlocks,
    isModalOpen,
    setIsModalOpen,
    modalMode,
    setModalMode,
    unlockError,
    setUnlockError,
    lock: handleLock,
    unlock: handleUnlock,
    setupPassword: handleSetupPassword,
    removePassword: handleRemovePassword,
    changePassword: handleChangePassword,
    exportBackup: handleExportBackup,
    openUnlockModal: () => {
      setModalMode('unlock');
      setIsModalOpen(true);
    },
    openSetupModal: () => {
      setModalMode('setup');
      setIsModalOpen(true);
    },
    openSettingsModal: () => {
      setModalMode('settings');
      setIsModalOpen(true);
    },
  };
}
