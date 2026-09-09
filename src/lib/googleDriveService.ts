import { LocalStorageState } from '../types';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id?: string;
            scope: string;
            callback: (response: { access_token?: string; error?: any }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// In-memory token cache compliant with workspace-integration guidelines
let cachedAccessToken: string | null = null;
let pendingAuthPromise: Promise<string> | null = null;
const DEFAULT_CLIENT_ID = '288837409172-39lnnindd31qsr999cdi4ikjb4t8u3ho.apps.googleusercontent.com';

export function clearGoogleDriveTokenCache() {
  cachedAccessToken = null;
  pendingAuthPromise = null;
}

export function setGoogleDriveCachedToken(token: string | null) {
  cachedAccessToken = token;
}

export async function requestGoogleDriveToken(clientId?: string): Promise<string> {
  // 1. If we already have a valid in-memory cached token, return it immediately
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  // 2. If a sign-in or token request is already in progress, share the same promise
  // This prevents multiple popups and the "INTERNAL ASSERTION FAILED: Pending promise was never set" error
  if (pendingAuthPromise) {
    return pendingAuthPromise;
  }

  pendingAuthPromise = (async () => {
    const customClientId = clientId || localStorage.getItem('money_tracker_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

    // First attempt: Firebase Auth signInWithPopup with GoogleAuthProvider & drive.file scope
    let firebaseFailed = false;
    let failureReason = '';
    try {
      if (auth) {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          return cachedAccessToken;
        }
      }
    } catch (firebaseErr: any) {
      firebaseFailed = true;
      failureReason = firebaseErr?.message || firebaseErr?.code || '';
      console.warn('Firebase signInWithPopup for Drive token encountered an issue:', firebaseErr);
      
      // If the domain is unauthorized or popup was blocked/closed on mobile, fallback to Google Identity Services
      const isDomainError = failureReason.includes('unauthorized-domain') || failureReason.includes('auth/unauthorized-domain');
      const isPopupError = firebaseErr?.code === 'auth/popup-closed-by-user' || 
                           firebaseErr?.code === 'auth/cancelled-popup-request' ||
                           failureReason.includes('INTERNAL ASSERTION FAILED') ||
                           failureReason.includes('Pending promise');

      if (!isDomainError && !isPopupError && !customClientId) {
        throw new Error('Google sign-in was cancelled or failed. Please try again.');
      }
    }

    // Second attempt: Fallback to Google Identity Services (GSI) Token Client
    // Works reliably on mobile and custom domains even when Firebase popup handler is blocked
    if (window.google?.accounts?.oauth2 && customClientId) {
      try {
        const gsiToken = await new Promise<string>((resolve, reject) => {
          const client = window.google!.accounts.oauth2.initTokenClient({
            client_id: customClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
              if (response.error) {
                reject(new Error(typeof response.error === 'string' ? response.error : response.error.message || 'Google Auth Error'));
              } else if (response.access_token) {
                resolve(response.access_token);
              } else {
                reject(new Error('Failed to obtain Google Drive access token from Google Identity Services.'));
              }
            },
          });
          client.requestAccessToken({ prompt: '' });
        });

        if (gsiToken) {
          cachedAccessToken = gsiToken;
          return cachedAccessToken;
        }
      } catch (gsiErr: any) {
        console.warn('Google Identity Services token fallback error:', gsiErr);
        if (firebaseFailed) {
          if (failureReason.includes('unauthorized-domain')) {
            throw new Error('This domain is not authorized yet in Firebase / Google Cloud. Please add logexpense786.ai.studio to Authorized Domains in Firebase Console.');
          }
          throw new Error('Google sign-in was closed or blocked. Please check that popups are allowed in your browser settings.');
        }
        throw gsiErr;
      }
    }

    if (cachedAccessToken) {
      return cachedAccessToken;
    }

    if (failureReason.includes('unauthorized-domain')) {
      throw new Error('This domain (logexpense786.ai.studio) is not yet added to Firebase Authorized Domains.');
    }

    throw new Error('Google Drive access token could not be obtained. Please allow popups and ensure you are signed in.');
  })().finally(() => {
    pendingAuthPromise = null;
  });

  return pendingAuthPromise;
}

export async function uploadBackupToGoogleDrive(token: string, state: any): Promise<{ fileId: string; fileName: string }> {
  const fileName = `MoneyTracker_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fileContent = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    ...state,
  });

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive upload failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return { fileId: data.id, fileName };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Drive upload timed out after 20 seconds. Please check your network connection.');
    }
    throw err;
  }
}

export async function listGoogleDriveBackups(token: string): Promise<Array<{ id: string; name: string; modifiedTime: string; size?: string }>> {
  const query = encodeURIComponent("name contains 'MoneyTracker_Backup' and trashed = false");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id, name, modifiedTime, size)&orderBy=modifiedTime desc`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list Google Drive backups (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Drive listing timed out. Please check your network connection.');
    }
    throw err;
  }
}

export async function downloadGoogleDriveBackup(token: string, fileId: string): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to download backup from Google Drive (${res.status}): ${errText}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Google Drive download timed out. Please check your network connection.');
    }
    throw err;
  }
}
