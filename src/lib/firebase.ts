import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Fallback configuration for standard Firebase Auth & Google Drive OAuth
// No locked Firestore database dependency required
const fallbackFirebaseConfig = {
  projectId: "gen-lang-client-0862665518",
  appId: "1:288837409172:web:bfb0f059299bb75ce49781",
  apiKey: "AIzaSyAF_VJMVpUB7MCvPXV-RJEGI_357XoBpUo",
  authDomain: "gen-lang-client-0862665518.firebaseapp.com",
};

let app: any = null;
let auth: any = null;
const db: any = null; // Decoupled from locked Firestore

try {
  app = !getApps().length ? initializeApp(fallbackFirebaseConfig) : getApps()[0];
  if (app) {
    auth = getAuth(app);
  }
} catch (err) {
  console.warn('Firebase initialization error:', err);
}

export { auth, db };
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
