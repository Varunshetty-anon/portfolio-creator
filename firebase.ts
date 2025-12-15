import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION
// Get this from your Firebase Console -> Project Settings -> General
// ------------------------------------------------------------------
const firebaseConfig = {
  // Example placeholder - replace these values
  apiKey: "AIzaSyDOCS_KEY_PLACEHOLDER",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
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