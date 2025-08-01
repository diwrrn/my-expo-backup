import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth'; // MODIFIED: Import initializeAuth and getReactNativePersistence
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; // NEW: Import AsyncStorage


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_liZT4SR7h47J9XBJYPiaYCrGNLinhuA",
  authDomain: "calorie-316d8.firebaseapp.com",
  projectId: "calorie-316d8",
  storageBucket: "calorie-316d8.firebasestorage.app",
  messagingSenderId: "817302259483",
  appId: "1:817302259483:web:454240a8702611bb84f5be",
  measurementId: "G-ZRP9DS8EQS",

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth - simplified for web compatibility
// MODIFIED: Use initializeAuth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Initialize Analytics (only on web for now)
let analytics;
if (typeof window !== 'undefined') {
  try {
    const { getAnalytics } = require('firebase/analytics');
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not available:', error);
  }
}

export { analytics };
export default app;