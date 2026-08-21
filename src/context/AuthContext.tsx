import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle as firebaseSignIn,
  signOutUser as firebaseSignOut,
  testConnection,
  syncStateToFirestore,
  fetchStateFromFirestore,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { LocalStorageState } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSynced: number | null;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  pushStateToCloud: (state: LocalStorageState) => Promise<void>;
  pullStateFromCloud: () => Promise<LocalStorageState | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<number | null>(null);

  // Initialize and test connection on mount + handle online/offline network transitions
  useEffect(() => {
    const checkConn = () => {
      testConnection().then(connected => {
        setIsFirebaseConnected(connected);
      });
    };

    checkConn();

    const handleOnline = () => {
      checkConn();
    };

    const handleOffline = () => {
      setIsFirebaseConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (): Promise<User | null> => {
    setSyncStatus('syncing');
    try {
      const loggedUser = await firebaseSignIn();
      if (loggedUser) {
        setUser(loggedUser);
        setSyncStatus('synced');
        return loggedUser;
      } else {
        // User closed or dismissed the popup
        setSyncStatus('idle');
        return null;
      }
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      if (
        authErr?.code === 'auth/popup-closed-by-user' ||
        authErr?.code === 'auth/cancelled-popup-request'
      ) {
        setSyncStatus('idle');
        return null;
      }
      setSyncStatus('error');
      console.error('Sign-in failed:', err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setSyncStatus('idle');
      setLastSynced(null);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  }, []);

  const pushStateToCloud = useCallback(
    async (state: LocalStorageState) => {
      if (!user) return;
      setSyncStatus('syncing');
      try {
        await syncStateToFirestore(user.uid, state);
        setSyncStatus('synced');
        setLastSynced(Date.now());
      } catch (err) {
        setSyncStatus('error');
        console.error('Cloud state push error:', err);
      }
    },
    [user]
  );

  const pullStateFromCloud = useCallback(async (): Promise<LocalStorageState | null> => {
    if (!user) return null;
    setSyncStatus('syncing');
    try {
      const cloudData = await fetchStateFromFirestore(user.uid);
      setSyncStatus('synced');
      setLastSynced(Date.now());
      return cloudData;
    } catch (err) {
      setSyncStatus('error');
      console.error('Cloud state pull error:', err);
      return null;
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConnected,
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
