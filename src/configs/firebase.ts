import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPDyWb1788CLyiCpfUR_pyf1UYQ0S09Tw",
  authDomain: "lichhoc-beb3e.firebaseapp.com",
  projectId: "lichhoc-beb3e",
  storageBucket: "lichhoc-beb3e.firebasestorage.app",
  messagingSenderId: "533041299457",
  appId: "1:533041299457:web:4360777648cac244a84000",
  measurementId: "G-XN84C6QM0F",
  databaseURL: "https://lichhoc-beb3e-default-rtdb.asia-southeast1.firebasedatabase.app",
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const rtdb = getDatabase(app);

export default app;