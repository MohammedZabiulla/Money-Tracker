import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LocalStorageState } from './storage';

// Initialize Firebase Application
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Get Firestore with the designated database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Standardized Firestore error handler conforming to skill requirements
 */
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Verify Firestore connectivity on application boot and network status change
 */
export async function testConnection(): Promise<boolean> {
  // If browser is offline, operate cleanly in local offline mode
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'unavailable' ||
      err?.code === 'failed-precondition' ||
      (err?.message && (err.message.includes('the client is offline') || err.message.includes('Could not reach Cloud Firestore')))
    ) {
      // Expected offline behavior: Firebase will operate in offline cache mode
      return false;
    }
    console.debug('Firebase connectivity test status:', error);
    return false;
  }
}

/**
 * Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Create/update user document in Firestore
    const userDocRef = doc(db, 'users', result.user.uid);
    await setDoc(
      userDocRef,
      {
        userId: result.user.uid,
        email: result.user.email || '',
        displayName: result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        lastSyncedAt: Date.now(),
        updatedAt: Date.now(),
        createdAt: Date.now(),
      },
      { merge: true }
    );
    return result.user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'auth/popup-closed-by-user' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/user-cancelled'
    ) {
      // User closed or dismissed the popup naturally; return null without noisy error logging
      return null;
    }
    if (err?.code === 'auth/popup-blocked') {
      console.warn('Google Sign-In popup was blocked by the browser. Please allow popups or open in a new tab.');
      throw new Error('Sign-in popup was blocked by browser. Please enable popups or open in a new tab.');
    }
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync entire local financial state to Firestore under the authenticated user
 */
export async function syncStateToFirestore(userId: string, state: LocalStorageState): Promise<void> {
  const financeDocRef = doc(db, 'users', userId, 'finance', 'main_store');
  const path = `users/${userId}/finance/main_store`;
  try {
    await setDoc(
      financeDocRef,
      {
        userId,
        accounts: state.accounts,
        creditCards: state.creditCards,
        categories: state.categories,
        merchants: state.merchants,
        paymentApps: state.paymentApps,
        transactions: state.transactions,
        recurring: state.recurring || [],
        subscriptions: state.subscriptions || [],
        budgets: state.budgets || [],
        goals: state.goals || [],
        loans: state.loans || [],
        investments: state.investments || [],
        debts: state.debts || [],
        reconciliations: state.reconciliations || [],
        settings: state.settings,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // Update user profile last sync
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        lastSyncedAt: Date.now(),
        updatedAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch financial state from Firestore for an authenticated user
 */
export async function fetchStateFromFirestore(userId: string): Promise<LocalStorageState | null> {
  const financeDocRef = doc(db, 'users', userId, 'finance', 'main_store');
  const path = `users/${userId}/finance/main_store`;
  try {
    const snapshot = await getDoc(financeDocRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return {
      accounts: data.accounts || [],
      creditCards: data.creditCards || [],
      categories: data.categories || [],
      merchants: data.merchants || [],
      paymentApps: data.paymentApps || [],
      transactions: data.transactions || [],
      recurring: data.recurring || [],
      subscriptions: data.subscriptions || [],
      budgets: data.budgets || [],
      goals: data.goals || [],
      loans: data.loans || [],
      investments: data.investments || [],
      debts: data.debts || [],
      reconciliations: data.reconciliations || [],
      settings: data.settings || {},
    } as LocalStorageState;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
