import React, { createContext, useContext, useCallback } from 'react';
import { LocalStorageState } from '../lib/storage';

interface AuthContextType {
  user: any;
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
  const signIn = useCallback(async (): Promise<any> => {
    return null;
  }, []);

  const signOut = useCallback(async () => {}, []);

  const pushStateToCloud = useCallback(
    async (_state: LocalStorageState) => {},
    []
  );

  const pullStateFromCloud = useCallback(async (): Promise<LocalStorageState | null> => {
    return null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: null,
        loading: false,
        isFirebaseConnected: false,
        syncStatus: 'idle',
        lastSynced: null,
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

