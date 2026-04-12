import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCtsAPOW9KJv7Ct1uxUxN1Sy14YR9YjZwc",
  authDomain: "dj-event-56cac.firebaseapp.com",
  projectId: "dj-event-56cac",
  storageBucket: "dj-event-56cac.firebasestorage.app",
  messagingSenderId: "55761900645",
  appId: "1:55761900645:web:84a5281dfc7328e7c8628c",
  measurementId: "G-VP2B6H2GDP",
};

// Prevent duplicate initialization (important for Expo hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

// Analytics — web only (not supported in React Native runtime)
export async function initAnalytics() {
  if (Platform.OS === 'web') {
    const { getAnalytics } = await import('firebase/analytics');
    getAnalytics(app);
  }
}

export default app;
