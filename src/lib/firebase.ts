
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if the API key is missing and log a warning
if (!firebaseConfig.apiKey) {
  console.warn(
    "Firebase API Key is missing. Please check your NEXT_PUBLIC_FIREBASE_API_KEY environment variable."
  );
}

let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);

// Uncomment the following lines to use the Firebase Emulator Suite for local development
// if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
//   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
//   console.log('Using Firebase Auth Emulator');
// }


export { app, auth };

