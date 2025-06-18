
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// More prominent check and error message
if (!firebaseApiKey) {
  const errorMessage =
    "FATAL ERROR: Firebase API Key is missing or undefined. " +
    "Firebase services cannot be initialized. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in your .env.local file " +
    "and that you have RESTARTED your Next.js development server after any changes to .env.local.";
  console.error("**************************************************************************************");
  console.error(errorMessage);
  console.error("**************************************************************************************");
}

const firebaseConfig = {
  apiKey: firebaseApiKey, // Using the variable checked above
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
// Initialize auth and db as potentially null if config is missing, to be handled by consuming code or throw.
// However, Firebase SDK itself will throw if initializeApp fails.
let auth;
let db;

if (!getApps().length) {
  // Firebase SDK will throw an error here if firebaseConfig.apiKey is still
  // effectively undefined or invalid, leading to the "auth/invalid-api-key" error.
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Uncomment the following lines to use the Firebase Emulator Suite for local development
    // if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    //   try {
    //     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    //     console.log('Using Firebase Auth Emulator');
        
    //     connectFirestoreEmulator(db, 'localhost', 8080);
    //     console.log('Using Firebase Firestore Emulator');

    //   } catch (emulatorError) {
    //     console.error("Error connecting to Firebase Emulators:", emulatorError);
    //   }
    // }

  } catch (initError) {
    console.error("CRITICAL: Firebase initialization failed. This is likely due to an invalid API key or other configuration issue, even if the initial check passed.", initError);
    // Depending on how critical Firebase is, you might re-throw or handle this state
    // For now, auth and db will remain undefined, and parts of the app relying on them will fail.
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
}


export { app, auth, db };
