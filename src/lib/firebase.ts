// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Firebase web configuration is safe to expose to the client. Access control is
// enforced by Firebase Authentication, Firestore rules and Storage rules.
const firebaseConfig = {
  apiKey: "AIzaSyB_HdshgnYruTYAVPiAWHP5vAKTO4AALak",
  authDomain: "sheild-xt9s1.firebaseapp.com",
  projectId: "sheild-xt9s1",
  storageBucket: "sheild-xt9s1.appspot.com",
  messagingSenderId: "862879666585",
  appId: "1:862879666585:web:a242c2bd5db582f5064308"
};

const app: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
