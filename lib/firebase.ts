import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

// Configuration updated with user provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyAic7vjNYjZN_WrYVhNGSTe6CGXJup6w6c",
  authDomain: "video-portfolio-c38e0.firebaseapp.com",
  projectId: "video-portfolio-c38e0",
  storageBucket: "video-portfolio-c38e0.firebasestorage.app",
  messagingSenderId: "165858899230",
  appId: "1:165858899230:web:cf57e807e494a510c2c50f"
};

// Check if config is valid
export const isConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

if (isConfigured) {
    try {
        // Prevent double initialization in React Strict Mode or hot reloads
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Firebase App initialization failed:", e);
    }

    if (app) {
        try {
            // Initialize Firestore with default settings to avoid 'getFirestore' ambiguity
            // in some environments. We do NOT force long polling here to avoid performance hits,
            // relying instead on the index.tsx SW cleanup to fix interception errors.
            db = initializeFirestore(app, {}); 
        } catch (e) {
            console.warn("Firestore initialization failed:", e);
        }

        try {
            storage = getStorage(app);
        } catch (e) {
            console.warn("Firebase Storage initialization failed:", e);
        }

        try {
            auth = getAuth(app);
            googleProvider = new GoogleAuthProvider();
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });
        } catch (e) {
            console.warn("Firebase Auth initialization failed:", e);
        }
    }
}

export { db, storage, auth, googleProvider };