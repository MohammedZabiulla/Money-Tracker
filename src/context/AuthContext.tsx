import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocalStorageState } from '../lib/storage';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInAnonymously, signOut as fbSignOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSynced: number | null;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
  pushStateToCloud: (state: LocalStorageState) => Promise<void>;
  pullStateFromCloud: () => Promise<LocalStorageState | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (): Promise<any> => {
    setSyncStatus('syncing');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setSyncStatus('synced');
      setLastSynced(Date.now());
      return result.user;
    } catch (error) {
      console.warn('Popup sign in failed, falling back to anonymous cloud session:', error);
      try {
        const anonResult = await signInAnonymously(auth);
        setUser(anonResult.user);
        setSyncStatus('synced');
        setLastSynced(Date.now());
        return anonResult.user;
      } catch (anonErr) {
        setSyncStatus('error');
        throw anonErr;
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setUser(null);
    setSyncStatus('idle');
  }, []);

  const pushStateToCloud = useCallback(async (state: LocalStorageState) => {
    if (!auth.currentUser) return;
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'appData', 'state');
      await setDoc(docRef, {
        ...state,
        updatedAt: serverTimestamp(),
        clientTimestamp: Date.now(),
      });
      setSyncStatus('synced');
      setLastSynced(Date.now());
    } catch (err) {
      console.error('Failed to push state to cloud:', err);
      setSyncStatus('error');
    }
  }, []);

  const pullStateFromCloud = useCallback(async (): Promise<LocalStorageState | null> => {
    if (!auth.currentUser) return null;
    setSyncStatus('syncing');
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'appData', 'state');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as LocalStorageState;
        setSyncStatus('synced');
        setLastSynced(Date.now());
        return data;
      }
      setSyncStatus('idle');
      return null;
    } catch (err) {
      console.error('Failed to pull state from cloud:', err);
      setSyncStatus('error');
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConnected: true,
        syncStatus,
        lastSynced,
        signIn,
        signOut,
        pushStateToCloud,
        pullStateFromCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
