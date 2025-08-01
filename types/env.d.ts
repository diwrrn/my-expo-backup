declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_API_KEY?: string;
      EXPO_PUBLIC_DATABASE_URL?: string;
      EXPO_PUBLIC_JWT_SECRET?: string;
      
      // Firebase configuration
      EXPO_PUBLIC_FIREBASE_API_KEY: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
      EXPO_PUBLIC_FIREBASE_APP_ID: string;
    }
  }
}

// Global variables for meal planning
interface Window {
}

// Ensure this file is treated as a module
export {};