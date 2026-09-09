import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocalStorageState } from '../lib/storage';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, signInAnonymously, signOut as fbSignOut, onAuthStateChanged, getRedirectResult, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { requestGoogleDriveToken, uploadBackupToGoogleDrive, listGoogleDriveBackups, downloadGoogleDriveBackup, clearGoogleDriveTokenCache, setGoogleDriveCachedToken, signInWithGoogleDriveRedirect } from '../lib/googleDriveService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSynced: number | null;
  cloudProvider: 'firestore' | 'gdrive' | 'none';
  syncMode: 'auto' | 'manual';
  setCloudProvider: (provider: 'firestore' | 'gdrive' | 'none') => void;
  setSyncMode: (mode: 'auto' | 'manual') => void;
  signIn: (provider?: 'firestore' | 'gdrive') => Promise<any>;
  signInWithGoogleRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
  pushStateToCloud: (state: LocalStorageState, providerOverride?: 'firestore' | 'gdrive') => Promise<void>;
  pullStateFromCloud: (providerOverride?: 'firestore' | 'gdrive') => Promise<LocalStorageState | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FIREBASE_TIMEOUT_MS = 12000;

function withTimeout<T>(promise: Promise<T>, ms: number = FIREBASE_TIMEOUT_MS): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Firestore operation timed out. Please check your connection.')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<number | null>(() => {
    const saved = localStorage.getItem('mt_last_synced');
    return saved ? Number(saved) : null;
  });

  const [cloudProvider, setCloudProviderState] = useState<'firestore' | 'gdrive' | 'none'>(() => {
    const saved = localStorage.getItem('mt_cloud_provider');
    if (saved === 'firestore') {
      localStorage.setItem('mt_cloud_provider', 'gdrive');
      return 'gdrive';
    }
    return (saved as any) || 'gdrive';
  });

  const [syncMode, setSyncModeState] = useState<'auto' | 'manual'>(() => {
    return (localStorage.getItem('mt_sync_mode') as any) || 'auto';
  });

  const setCloudProvider = useCallback((provider: 'firestore' | 'gdrive' | 'none') => {
    setCloudProviderState(provider);
    localStorage.setItem('mt_cloud_provider', provider);
  }, []);

  const setSyncMode = useCallback((mode: 'auto' | 'manual') => {
    setSyncModeState(mode);
    localStorage.setItem('mt_sync_mode', mode);
  }, []);

  useEffect(() => {
    if (auth) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            setUser(result.user);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              setGoogleDriveCachedToken(credential.accessToken);
              setSyncStatus('synced');
              setLastSynced(Date.now());
              localStorage.setItem('mt_last_synced', String(Date.now()));
              console.log('Successfully completed Google redirect authentication.');
            }
          }
        })
        .catch((err) => {
          console.warn('Firebase getRedirectResult check:', err);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogleRedirect = useCallback(async () => {
    setSyncStatus('syncing');
    await signInWithGoogleDriveRedirect();
  }, []);

  const signIn = useCallback(async (providerOverride?: 'firestore' | 'gdrive'): Promise<any> => {
    const targetProvider = providerOverride || cloudProvider;
    setSyncStatus('syncing');

    if (targetProvider === 'gdrive') {
      try {
        const token = await requestGoogleDriveToken();
        if (token) {
          const currentUser = auth.currentUser;
          if (currentUser) {
            setUser(currentUser);
          } else {
            setUser({ uid: 'gdrive_user', email: 'Google Drive Account', isAnonymous: false } as any);
          }
          setSyncStatus('synced');
          setLastSynced(Date.now());
          localStorage.setItem('mt_last_synced', String(Date.now()));
          return token;
        }
      } catch (err) {
        setSyncStatus('error');
        throw err;
      }
    }

    // Default to Firestore / Firebase Auth
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      setSyncStatus('synced');
      setLastSynced(Date.now());
      localStorage.setItem('mt_last_synced', String(Date.now()));
      return result.user;
    } catch (error) {
      console.warn('Popup sign in failed, falling back to anonymous cloud session:', error);
      try {
        const anonResult = await signInAnonymously(auth);
        setUser(anonResult.user);
        setSyncStatus('synced');
        setLastSynced(Date.now());
        localStorage.setItem('mt_last_synced', String(Date.now()));
        return anonResult.user;
      } catch (anonErr) {
        setSyncStatus('error');
        throw anonErr;
      }
    }
  }, [cloudProvider]);

  const signOut = useCallback(async () => {
    try {
      await fbSignOut(auth);
    } catch {}
    clearGoogleDriveTokenCache();
    setUser(null);
    setSyncStatus('idle');
  }, []);

  const pushStateToCloud = useCallback(async (state: LocalStorageState, providerOverride?: 'firestore' | 'gdrive') => {
    const targetProvider = providerOverride || cloudProvider;
    if (targetProvider === 'none') return;

    setSyncStatus('syncing');
    try {
      if (targetProvider === 'gdrive') {
        const token = await requestGoogleDriveToken();
        await uploadBackupToGoogleDrive(token, state);
      } else {
        // Firestore
        if (!db) throw new Error('Firestore database is not initialized or provisioned. Please use Google Drive sync.');
        if (!auth.currentUser) {
          await withTimeout(signInAnonymously(auth));
        }
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('No authenticated user for Firestore sync');

        const docRef = doc(db, 'users', currentUser.uid, 'appData', 'state');
        const trimmedLogs = (state.activityLogs || []).slice(-150);
        const backupPayload = JSON.parse(JSON.stringify({
          version: 1,
          exportedAt: new Date().toISOString(),
          ...state,
          activityLogs: trimmedLogs,
          updatedAt: serverTimestamp(),
          clientTimestamp: Date.now(),
        }));
        await withTimeout(setDoc(docRef, backupPayload));
      }

      setSyncStatus('synced');
      const now = Date.now();
      setLastSynced(now);
      localStorage.setItem('mt_last_synced', String(now));
    } catch (err: any) {
      console.warn('Failed to push state to cloud:', err);
      setSyncStatus(err?.message?.includes('offline') ? 'idle' : 'error');
    }
  }, [cloudProvider]);

  const pullStateFromCloud = useCallback(async (providerOverride?: 'firestore' | 'gdrive'): Promise<LocalStorageState | null> => {
    const targetProvider = providerOverride || cloudProvider;
    if (targetProvider === 'none') return null;

    setSyncStatus('syncing');
    try {
      if (targetProvider === 'gdrive') {
        const token = await requestGoogleDriveToken();
        const files = await listGoogleDriveBackups(token);
        if (files && files.length > 0) {
          const rawData = await downloadGoogleDriveBackup(token, files[0].id);
          setSyncStatus('synced');
          const now = Date.now();
          setLastSynced(now);
          localStorage.setItem('mt_last_synced', String(now));
          return rawData as LocalStorageState;
        }
        setSyncStatus('idle');
        return null;
      } else {
        // Firestore
        if (!db) return null;
        if (!auth.currentUser) return null;
        const docRef = doc(db, 'users', auth.currentUser.uid, 'appData', 'state');
        const snap = await withTimeout(getDoc(docRef));
        if (snap.exists()) {
          const data = snap.data() as any;
          setSyncStatus('synced');
          const now = Date.now();
          setLastSynced(now);
          localStorage.setItem('mt_last_synced', String(now));
          return data as LocalStorageState;
        }
        setSyncStatus('idle');
        return null;
      }
    } catch (err: any) {
      console.warn('Failed to pull state from cloud (client offline or no data):', err);
      setSyncStatus(err?.message?.includes('offline') ? 'idle' : 'error');
      return null;
    }
  }, [cloudProvider]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConnected: true,
        syncStatus,
        lastSynced,
        cloudProvider,
        syncMode,
        setCloudProvider,
        setSyncMode,
        signIn,
        signInWithGoogleRedirect,
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
