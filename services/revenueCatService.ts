import { Platform } from 'react-native';

const PurchasesModule = require('react-native-purchases');
const Purchases = PurchasesModule.default;
import { CustomerInfo } from 'react-native-purchases';

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_rrHcIDjifMqESTYYVaMhKyEEtCA',
  android: 'goog_TVHMPnPthYyBPlVzigjneKJakMv',
};

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isInitialized = false;
  private currentUserId: string | null = null; // ADD THIS LINE

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId?: string): Promise<void> {
    // ADD THIS BLOCK - Check if user changed
    if (this.isInitialized && this.currentUserId !== userId) {
      console.log('🔄 User changed, switching RevenueCat user...');
      if (userId) {
        await this.setUser(userId);
      }
      return;
    }

    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing RevenueCat...');
      
      // Check if Purchases is available
      if (!Purchases) {
        console.warn('⚠️ RevenueCat Purchases module is not available - skipping initialization');
        this.isInitialized = true; // Mark as initialized to prevent retries
        return;
      }

      // Check if already configured
      try {
        const isConfigured = await Purchases.isConfigured();
        if (isConfigured) {
          console.log('✅ RevenueCat already configured');
          this.isInitialized = true;
          return;
        }
      } catch (error) {
        console.log('⚠️ isConfigured check failed, proceeding with configuration');
      }

      console.log('⚙️ Configuring RevenueCat with API key...');
      console.log('🔧 API Key:', Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android);

      // Configure RevenueCat
      await Purchases.configure({
        apiKey: Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android,
        appUserID: userId,
        verboseLogLevel: false,

      });

      // Enable debug logs in development
      if (__DEV__) {
        try {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
                } catch (logError) {
          console.warn('⚠️ Could not set log level:', logError);
        }
      }

      this.currentUserId = userId || null; // ADD THIS LINE
      this.isInitialized = true;
      console.log('✅ RevenueCat initialized successfully');
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      // Mark as initialized to prevent retries
      this.isInitialized = true;
    }
  }

  async showPaywall(): Promise<any | null> {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized, attempting to initialize...');
        await this.initialize();
      }

      if (!Purchases) {
        console.warn('⚠️ RevenueCat not available - cannot show paywall');
        return null;
      }

      console.log('🎯 Showing RevenueCat paywall...');
      // Note: You'll need to configure the paywall in RevenueCat dashboard first
      // The paywall will be shown automatically when you call this method
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('✅ Paywall check completed:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('❌ Paywall error:', error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  async restorePurchases(): Promise<any | null> {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized, attempting to initialize...');
        await this.initialize();
      }

      if (!Purchases) {
        console.warn('⚠️ RevenueCat not available - cannot restore purchases');
        return null;
      }

      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('❌ Restore failed:', error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  async getCustomerInfo(): Promise<any | null> {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized, attempting to initialize...');
        await this.initialize();
      }

      if (!Purchases) {
        console.warn('⚠️ RevenueCat not available - cannot get customer info');
        return null;
      }

      const customerInfo = await Purchases.getCustomerInfo();
          // ADD THESE DEBUG LOGS:
    console.log('🔍 RevenueCat DebugNEEEEEEEEEEEEEW:');
    console.log('User ID:', this.currentUserId);
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));
    console.log('All Entitlements:', customerInfo.entitlements.all);
    console.log('Active Entitlements:', customerInfo.entitlements.active);

      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo?.entitlements?.active?.['premium'] != null; // FIXED THIS LINE
    } catch (error) {
      console.error('❌ Failed to check subscription status:', error);
      return false;
    }
  }
  async refreshCustomerInfo(): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized, attempting to initialize...');
        await this.initialize();
      }
  
      if (!Purchases) {
        console.warn('⚠️ RevenueCat not available - cannot refresh customer info');
        return;
      }
  
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('✅ Customer info refreshed:', customerInfo);
    } catch (error) {
      console.error('❌ Failed to refresh customer info:', error);
      // Don't throw error to prevent app crashes
    }
  }
  async setUser(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('⚠️ RevenueCat not initialized, attempting to initialize...');
        await this.initialize();
      }

      if (!Purchases) {
        console.warn('⚠️ RevenueCat not available - cannot set user');
        return;
      }

      // REPLACE THIS BLOCK - Only switch if different user
      if (this.currentUserId !== userId) {
        await Purchases.logIn(userId);
        this.currentUserId = userId;
        console.log('✅ User switched in RevenueCat:', userId);
      }
    } catch (error) {
      console.error('❌ Failed to set user:', error);
      // Don't throw error to prevent app crashes
    }
  }
}

export const revenueCatService = RevenueCatService.getInstance();