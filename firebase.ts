import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION
// Get this from your Firebase Console -> Project Settings -> General
// ------------------------------------------------------------------
const firebaseConfig = {
  // Example placeholder - replace these values
  apiKey: "AIzaSyAic7vjNYjZN_WrYVhNGSTe6CGXJup6w6c",
  authDomain: "video-portfolio-c38e0.firebaseapp.com",
  projectId: "video-portfolio-c38e0",
  storageBucket: "video-portfolio-c38e0.firebasestorage.app",
  messagingSenderId: "165858899230",
  appId: "1:165858899230:web:cf57e807e494a510c2c50f"
};

// Check if config is valid (not placeholder) to prevent connection errors
export const isConfigured = firebaseConfig.projectId !== "your-project-id" && !firebaseConfig.apiKey.includes("PLACEHOLDER");

let app;
let db: Firestore | undefined;

if (isConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
}

export { db };
