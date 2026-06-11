import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import baseConfig from '../../firebase-applet-config.json';

const firebaseConfig = import.meta.env.VITE_FIREBASE_CONFIG
  ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG)
  : baseConfig;

const app = initializeApp(firebaseConfig);

const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId ?? undefined;
export const db = firestoreDatabaseId
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

// Firebase Auth removed — wallet address (SP...) is used as the user identity.
