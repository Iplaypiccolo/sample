import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

// Config from firebase-applet-config.json
const firebaseConfig = {
  projectId: "curious-device-gxhgq",
  appId: "1:618435392901:web:01287f996d2f7454a3c0ec",
  apiKey: "AIzaSyB2sLmiezIp0H8NJlVg3hBqh338R_Lsjxw",
  authDomain: "curious-device-gxhgq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-d7ba873b-948a-421d-98b9-b3100c9b346f",
  storageBucket: "curious-device-gxhgq.firebasestorage.app",
  messagingSenderId: "618435392901"
};

// Initialize Firebase with the custom database ID
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { collection, doc, getDoc, getDocs, setDoc, updateDoc };
