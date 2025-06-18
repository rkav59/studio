
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

if (!firebaseApiKey) {
  const errorMessage =
    "FATAL ERROR: Firebase API Key is missing or undefined. " +
    "Firebase services cannot be initialized. " +
    "Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is correctly set in your .env.local file " +
    "and that you have RESTARTED your Next.js development server after any changes to .env.local.";
  console.error("**************************************************************************************");
  console.error(errorMessage);
  console.error("**************************************************************************************");
  // Note: Firebase SDK will likely throw its own error when initializeApp is called with an invalid key,
  // but this explicit check provides an earlier, more direct warning.
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

if (!getApps().length) {
  // Firebase SDK will throw an error here if firebaseConfig.apiKey is still
  // effectively undefined or invalid, leading to the "auth/invalid-api-key" error.
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

// Uncomment the following lines to use the Firebase Emulator Suite for local development
// Make sure to also handle potential errors if 'auth' instance could not be initialized
// if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
//   try {
//     connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//     console.log('Using Firebase Auth Emulator');
//   } catch (error) {
//     console.error("Error connecting to Firebase Auth Emulator:", error);
//   }
// }

export { app, auth };
