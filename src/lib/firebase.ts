import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Firebase config must come from the VITE_FIREBASE_CONFIG environment
// variable (see .env.example). There is no bundled fallback config file —
// committing Firebase project identifiers to the repo is avoided even
// though Firebase Web API keys are not secret by design; this keeps the
// project identifiers out of source control entirely.
//
// IMPORTANT: this module deliberately never throws at import time. Many
// files import `db` directly (`import { db } from './lib/firebase'`), and
// a top-level throw here would fail the entire module graph before React
// ever mounts — producing a silent blank screen with no visible error,
// which is far harder to diagnose than an explicit in-app message. Instead,
// we capture any failure into `firebaseInitError` and let App.tsx render a
// clear error screen for it.

export let firebaseInitError: string | null = null;
let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

try {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  if (!raw) {
    throw new Error(
      'VITE_FIREBASE_CONFIG is not set. Copy .env.example to .env and fill in your Firebase project config, or set it in your deployment platform (e.g. Vercel) environment variables.'
    );
  }
  const firebaseConfig = JSON.parse(raw);
  app = initializeApp(firebaseConfig);
  const firestoreDatabaseId = firebaseConfig.firestoreDatabaseId ?? undefined;
  dbInstance = firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
} catch (err: any) {
  firebaseInitError = err?.message ?? 'Failed to initialize Firebase.';
  // eslint-disable-next-line no-console
  console.error('[firebase] initialization failed:', err);
}

// `db` is exported as a Firestore instance for normal usage. If init failed,
// this will be `null` at runtime; every call site already wraps Firestore
// calls in try/catch (see App.tsx's listeners), so a failed init surfaces
// as those individual calls failing gracefully rather than a blank screen.
// Components should still primarily rely on checking `firebaseInitError` if
// they need to short-circuit before attempting any Firestore call.
export const db = dbInstance as Firestore;

// Firebase Auth removed — wallet address (SP...) is used as the user identity.
