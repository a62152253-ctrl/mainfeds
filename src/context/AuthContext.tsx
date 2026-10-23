import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfileType } from '../types/workspace';

export interface LocalAuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
}

interface AuthContextType {
  user: LocalAuthUser | null;
  isLoggedIn: boolean;
  userProfile: UserProfileType | null;
  updateUserProfile: (profile: UserProfileType) => Promise<void>;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  quickLocalLogin: (displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USER_KEY = 'searchpoint_local_user';
const ACTIVE_PROFILE_KEY = 'searchpoint_active_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USER_KEY);
      if (saved) return JSON.parse(saved);
      // Niezalogowany uzytkownik - brak dostepu do AI dopoki sie nie zaloguje
      return null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfileType | null>(() => {
    try {
      return (localStorage.getItem(ACTIVE_PROFILE_KEY) as UserProfileType) || 'Founder';
    } catch {
      return 'Founder';
    }
  });

  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const updateUserProfile = async (profile: UserProfileType) => {
    setUserProfile(profile);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profile);
    setIsOnboardingOpen(false);
    if (user) {
      localStorage.setItem(`searchpoint_profile_${user.uid}`, profile);
    }
  };

  const quickLocalLogin = async (displayName?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const name = displayName?.trim() || 'Użytkownik Workspace';
      const localUser: LocalAuthUser = {
        uid: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        displayName: name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@searchpoint.pl`,
        role: 'admin',
      };
      setUser(localUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Zastąpiono Google OAuth błyskawicznym wejściem bez pop-upów i blokad
    await quickLocalLogin('Konto Google (Szybkie logowanie)');
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (!email.trim() || !pass.trim()) {
        throw new Error('Podaj adres email oraz hasło.');
      }
      const name = email.split('@')[0];
      const localUser: LocalAuthUser = {
        uid: `usr-${Math.abs(hashString(email))}`,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        email: email.trim(),
        role: 'admin',
      };
      setUser(localUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Błąd logowania');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      if (!email.trim() || !pass.trim()) {
        throw new Error('Uzupełnij wszystkie pola formularza.');
      }
      const displayName = name?.trim() || email.split('@')[0];
      const localUser: LocalAuthUser = {
        uid: `usr-${Math.abs(hashString(email))}`,
        displayName,
        email: email.trim(),
        role: 'admin',
      };
      setUser(localUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err?.message || 'Błąd rejestracji');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      localStorage.removeItem(LOCAL_USER_KEY);
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: Boolean(user),
        userProfile,
        updateUserProfile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        quickLocalLogin,
        signOutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        authError,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
