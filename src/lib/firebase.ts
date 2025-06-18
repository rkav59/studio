
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // New import

// Firebase configuration (Hardcoded as per user request)
const firebaseConfig = {
  apiKey: "AIzaSyB_HdshgnYruTYAVPiAWHP5vAKTO4AALak",
  authDomain: "sheild-xt9s1.firebaseapp.com",
  projectId: "sheild-xt9s1",
  storageBucket: "sheild-xt9s1.appspot.com", // User confirmed this bucket name
  messagingSenderId: "862879666585",
  appId: "1:862879666585:web:a242c2bd5db582f5064308"
};

let app: FirebaseApp;
let authInstance;
let dbInstance;
let storageInstance; // New variable for storage

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app); // Initialize storage
  } catch (initError) {
    console.error("CRITICAL: Firebase initialization failed.", initError);
    // Handle initialization error appropriately
  }
} else {
  app = getApps()[0];
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app); // Initialize storage for already initialized app
}

const auth = authInstance;
const db = dbInstance;
const storage = storageInstance; // Export storage

export { app, auth, db, storage };
