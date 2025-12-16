import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Firebase App initialization failed:", e);
    }

    if (app) {
        try {
            db = getFirestore(app);
        } catch (e) {
            console.warn("Firestore initialization failed (Database might not exist):", e);
        }

        try {
            storage = getStorage(app);
        } catch (e) {
            console.warn("Firebase Storage initialization failed (Service might not be enabled):", e);
        }
    }
}

export { db, storage };