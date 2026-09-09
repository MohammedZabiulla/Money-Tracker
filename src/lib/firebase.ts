import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let auth: any = null;
let db: any = null;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
  if (app) {
    auth = getAuth(app);
    try {
      db = getFirestore(app);
    } catch (dbErr) {
      console.warn('Firestore database not found or unprovisioned:', dbErr);
    }
  }
} catch (err) {
  console.warn('Firebase initialization error:', err);
}

export { auth, db };
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
