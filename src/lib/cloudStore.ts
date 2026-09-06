import { 
  doc, 
  setDoc, 
  getDoc,
  getDocFromServer,
  onSnapshot, 
} from 'firebase/firestore';
import { db, getActiveFirebaseConfig, defaultFirebaseConfig } from './firebase';
import { 
  Fund, 
  Transaction, 
  Category, 
  ContributionCampaign, 
  Member, 
  BankSettings,
  GroupNotice,
  AppBranding,
  MemberViewPermissions
} from '../types';

// Collection references in Firestore
export const APP_DOC_ID = 'app_state';
export const SETTINGS_COLLECTION = 'qunlqu_settings';

export function getCloudConfigInfo() {
  const { isCustom, config } = getActiveFirebaseConfig();
  return {
    isCustom,
    projectId: config.projectId || defaultFirebaseConfig.projectId,
    databaseId: config.firestoreDatabaseId || (isCustom ? '(default)' : defaultFirebaseConfig.firestoreDatabaseId || '(default)'),
    authDomain: config.authDomain || defaultFirebaseConfig.authDomain,
    apiKey: config.apiKey ? `${config.apiKey.slice(0, 6)}...${config.apiKey.slice(-4)}` : '',
  };
}

export const CLOUD_CONFIG_INFO = getCloudConfigInfo();


export interface CloudAppState {
  funds: Fund[];
  transactions: Transaction[];
  categories: Category[];
  campaigns: ContributionCampaign[];
  members: Member[];
  bankSettings: BankSettings;
  groupNotice?: GroupNotice;
  branding?: AppBranding;
  adminPassword?: string;
  memberPassword?: string;
  viewPermissions?: MemberViewPermissions;
  language?: string;
  customDictionary?: Record<string, Record<string, string>>;
  updatedAt?: string;
}

export interface CloudConnectionResult {
  success: boolean;
  latencyMs: number;
  databaseId: string;
  projectId: string;
  timestamp: string;
  error?: string;
}

// Test live connection to Firestore
export async function testCloudConnection(): Promise<CloudConnectionResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  const info = getCloudConfigInfo();
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: true,
      latencyMs: Math.max(latencyMs, 1),
      databaseId: info.databaseId,
      projectId: info.projectId,
      timestamp,
    };
  } catch (err: any) {
    // If test doc doesn't exist, getting it from server still confirms connection
    const latencyMs = Math.round(performance.now() - startTime);
    const isNetworkError = err?.message?.includes('offline') || err?.code === 'unavailable';
    if (!isNetworkError) {
      return {
        success: true,
        latencyMs: Math.max(latencyMs, 1),
        databaseId: info.databaseId,
        projectId: info.projectId,
        timestamp,
      };
    }
    return {
      success: false,
      latencyMs,
      databaseId: info.databaseId,
      projectId: info.projectId,
      timestamp,
      error: err?.message || 'Không thể kết nối đến máy chủ Cloud Firestore',
    };
  }
}

// Subscribe to real-time changes
export function subscribeToCloudState(
  onData: (state: Partial<CloudAppState>, exists: boolean) => void,
  onError?: (err: Error) => void
) {
  const docRef = doc(db, SETTINGS_COLLECTION, APP_DOC_ID);
  
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as Partial<CloudAppState>;
      onData(data, true);
    } else {
      onData({}, false);
    }
  }, (err) => {
    console.warn('Firestore subscription warning/error:', err);
    if (onError) onError(err);
  });

  return unsubscribe;
}

// Fetch state once from server
export async function fetchCloudStateOnce(): Promise<Partial<CloudAppState> | null> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, APP_DOC_ID);
    const snapshot = await getDocFromServer(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as Partial<CloudAppState>;
    }
    return null;
  } catch (error) {
    // Fallback to cache getDoc if getDocFromServer fails
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, APP_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return snapshot.data() as Partial<CloudAppState>;
      }
      return null;
    } catch (fallbackErr) {
      console.error('Error fetching Cloud Firestore state:', fallbackErr);
      throw fallbackErr;
    }
  }
}

// Deep clean helper to remove undefined values before Firestore setDoc
function deepClean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, v) => (v === undefined ? null : v)));
}

// Save complete or partial state to Cloud Firestore with retry
export async function saveCloudState(state: Partial<CloudAppState>): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, APP_DOC_ID);
    const payload = {
      ...state,
      updatedAt: new Date().toISOString()
    };
    const cleanPayload = deepClean(payload);
    await setDoc(docRef, cleanPayload, { merge: true });
  } catch (error) {
    console.error('Error saving to Cloud Firestore:', error);
    throw error;
  }
}


