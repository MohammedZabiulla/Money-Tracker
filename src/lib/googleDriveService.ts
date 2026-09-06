import { LocalStorageState } from '../types';

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

export function requestGoogleDriveToken(clientId?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const finalClientId = clientId || localStorage.getItem('money_tracker_google_client_id') || import.meta.env.VITE_GOOGLE_CLIENT_ID || '288837409172-placeholder.apps.googleusercontent.com';

    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      reject(new Error('Google Identity Services script not loaded. Please ensure internet connection or check ad blocker.'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: finalClientId,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response) => {
          if (response.error) {
            reject(new Error(typeof response.error === 'string' ? response.error : JSON.stringify(response.error)));
          } else if (response.access_token) {
            resolve(response.access_token);
          } else {
            reject(new Error('Failed to obtain Google Drive access token.'));
          }
        },
      });
      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      reject(err);
    }
  });
}

export async function uploadBackupToGoogleDrive(token: string, state: any): Promise<{ fileId: string; fileName: string }> {
  const fileName = `MoneyTracker_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fileContent = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    ...state,
  }, null, 2);

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return { fileId: data.id, fileName };
}

export async function listGoogleDriveBackups(token: string): Promise<Array<{ id: string; name: string; modifiedTime: string; size?: string }>> {
  const query = encodeURIComponent("name contains 'MoneyTracker_Backup' and trashed = false");
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id, name, modifiedTime, size)&orderBy=modifiedTime desc`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to list Google Drive backups (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function downloadGoogleDriveBackup(token: string, fileId: string): Promise<any> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download backup from Google Drive (${res.status}): ${errText}`);
  }

  return await res.json();
}
