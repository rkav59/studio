
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Directly using the provided Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_HdshgnYruTYAVPiAWHP5vAKTO4AALak",
  authDomain: "sheild-xt9s1.firebaseapp.com",
  projectId: "sheild-xt9s1",
  storageBucket: "sheild-xt9s1.firebasestorage.app",
  messagingSenderId: "862879666585",
  appId: "1:862879666585:web:a242c2bd5db582f5064308"
};

let app: FirebaseApp;
let authInstance; // Renamed to avoid conflict with auth export
let dbInstance; // Renamed to avoid conflict with db export

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);

    // To use the Firebase Emulator Suite for local development, uncomment the following lines
    // and ensure your emulators are running.
    // if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    //   try {
    //     connectAuthEmulator(authInstance, 'http://localhost:9099', { disableWarnings: true });
    //     console.log('Using Firebase Auth Emulator');
        
    //     connectFirestoreEmulator(dbInstance, 'localhost', 8080);
    //     console.log('Using Firebase Firestore Emulator');

    //   } catch (emulatorError) {
    //     console.error("Error connecting to Firebase Emulators:", emulatorError);
    //   }
    // }

  } catch (initError) {
    console.error("CRITICAL: Firebase initialization failed. This could be due to an invalid API key, or other configuration issues with your Firebase project.", initError);
    // Depending on how critical Firebase is, you might re-throw or handle this state.
    // For now, authInstance and dbInstance will remain undefined if initialization fails.
  }
} else {
  app = getApps()[0];
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
}

// Export the instances with their intended names
const auth = authInstance;
const db = dbInstance;

export { app, auth, db };
