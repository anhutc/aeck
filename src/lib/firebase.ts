import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import { FirebaseCustomConfig } from '../types';
import { safeStorage } from '../utils/safeStorage';

export const CUSTOM_FIREBASE_STORAGE_KEY = 'qunlqu_custom_firebase_config';

// Retrieve custom config if stored in safeStorage
export function getSavedCustomFirebaseConfig(): FirebaseCustomConfig | null {
  try {
    const raw = safeStorage.getItem(CUSTOM_FIREBASE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.apiKey && parsed.projectId) {
      return parsed as FirebaseCustomConfig;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse saved custom firebase config:', e);
    return null;
  }
}

// Get active config (custom or default)
export function getActiveFirebaseConfig(): { isCustom: boolean; config: any } {
  const custom = getSavedCustomFirebaseConfig();
  if (custom) {
    return { isCustom: true, config: custom };
  }
  return { isCustom: false, config: defaultFirebaseConfig };
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig): void {
  safeStorage.setItem(CUSTOM_FIREBASE_STORAGE_KEY, JSON.stringify(config));
}

export function removeCustomFirebaseConfig(): void {
  safeStorage.removeItem(CUSTOM_FIREBASE_STORAGE_KEY);
}

const activeInfo = getActiveFirebaseConfig();
const activeConfig = activeInfo.config;

// Initialize Firebase App
let appInstance: FirebaseApp;
if (!getApps().length) {
  appInstance = initializeApp(activeConfig);
} else {
  appInstance = getApp();
}

const targetDbId =
  activeConfig.firestoreDatabaseId ||
  (activeInfo.isCustom ? '(default)' : defaultFirebaseConfig.firestoreDatabaseId || '(default)');

// Initialize Cloud Firestore with auto-detect long polling enabled to handle proxy / iframe / restricted networks reliably
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    appInstance,
    {
      experimentalAutoDetectLongPolling: true,
    },
    targetDbId
  );
} catch {
  // If already initialized, fallback to getFirestore
  firestoreInstance = getFirestore(appInstance, targetDbId);
}

export const db: Firestore = firestoreInstance;

export { defaultFirebaseConfig };

