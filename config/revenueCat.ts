// config/revenueCat.ts
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// Your RevenueCat API keys from the dashboard
const API_KEYS = {
  apple: 'appl_rrHcIDjifMqESTYYVaMhKyEEtCA',
  google: 'goog_TVHMPnPthYyBPlVzigjneKJakMv'
};

export const initRevenueCat = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: API_KEYS.google });
    }
    
    console.log('RevenueCat configured successfully');
  } catch (error) {
    console.error('Error configuring RevenueCat:', error);
  }
};

// Entitlement identifiers (configure these in RevenueCat dashboard)
export const ENTITLEMENTS = {
  premium: 'premium', // Replace with your actual entitlement ID
} as const;

export type EntitlementKey = keyof typeof ENTITLEMENTS;