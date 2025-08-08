// hooks/usePurchases.ts
import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '@/services/revenueCatService';
import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Entitlement identifiers (configure these in RevenueCat dashboard)
export const ENTITLEMENTS = {
  premium: 'premium', // Replace with your actual entitlement ID
} as const;

interface RestoreResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}

// Enhanced cache structure
interface PremiumCache {
  isPremium: boolean;
  timestamp: number;
  expirationDate?: string; // RevenueCat expiration date
  lastChecked: number;
}

interface UsePurchasesReturn {
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  loading: boolean;
  hasPremium: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<RestoreResult>;
  refreshCustomerInfo: () => Promise<void>;
  getAvailablePackages: () => PurchasesPackage[];
}

// Cache configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const getCacheKey = (userId: string) => `premium_status_${userId}`;

// Helper function to get cached premium status
const getCachedPremiumStatus = async (userId: string): Promise<boolean | null> => {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(userId));
    if (cached) {
      const cacheData: PremiumCache = JSON.parse(cached);
      
      // Check if cache is still valid (24 hours)
      if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
        
        // Additional check: If we have expiration date, check if subscription actually expired
        if (cacheData.expirationDate) {
          const expirationTime = new Date(cacheData.expirationDate).getTime();
          const currentTime = Date.now();
          
          if (currentTime > expirationTime) {
            console.log('⚠️ Cached premium expired on:', cacheData.expirationDate);
            return false; // Subscription expired
          }
        }
        
        console.log('📱 Using cached premium status for user:', userId, 'Premium:', cacheData.isPremium);
        return cacheData.isPremium;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error reading cached premium status:', error);
  }
  return null;
};

// Helper function to save premium status to cache
const savePremiumStatusToCache = async (userId: string, isPremium: boolean, customerInfo?: CustomerInfo): Promise<void> => {
  try {
    // Get expiration date from RevenueCat data
    const expirationDate = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium]?.expirationDate;
    
    const cacheData: PremiumCache = {
      isPremium,
      timestamp: Date.now(),
      expirationDate,
      lastChecked: Date.now()
    };
    
    await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify(cacheData));
    console.log('💾 Cached premium status for user:', userId, 'Premium:', isPremium, 'Expires:', expirationDate);
  } catch (error) {
    console.warn('⚠️ Error saving premium status to cache:', error);
  }
};

export const usePurchases = (): UsePurchasesReturn => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cachedPremium, setCachedPremium] = useState<boolean | null>(null);

  // Check premium status with cache fallback
  const hasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null || cachedPremium || false;

  // Load cached premium status immediately when user changes
  useEffect(() => {
    const loadCachedPremium = async () => {
      if (!user?.id) {
        setCachedPremium(null);
        return;
      }

      const cached = await getCachedPremiumStatus(user.id);
      setCachedPremium(cached);
      
      // If we have cached data, we can show it immediately
      if (cached !== null) {
        setLoading(false);
      }
    };

    loadCachedPremium();
  }, [user?.id]);

  // Clear cached data when user changes
  useEffect(() => {
    console.log('🔄 User changed, clearing cached RevenueCat data for user:', user?.id);
    setCustomerInfo(null);
    setOfferings(null);
    setCachedPremium(null);
    setLoading(true);
  }, [user?.id]);

  // Load RevenueCat data
  useEffect(() => {
    const loadRevenueCatData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(' Loading RevenueCat data for user:', user.id);
        
        // FIRST: Switch RevenueCat user to match Firebase user
        console.log('🔄 Switching RevenueCat user to:', user.id);
        const { customerInfo: currentCustomerInfo } = await Purchases.logIn(user.id);
        console.log('✅ RevenueCat user switched. Previous user:', currentCustomerInfo.originalAppUserId);
        
        // SECOND: Get fresh data for the new user
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings()
        ]);

        // Calculate premium status BEFORE setting state
        const currentHasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
        
        // Save to cache with expiration date
        await savePremiumStatusToCache(user.id, currentHasPremium, customerInfo);
        
        setCustomerInfo(customerInfo);
        setOfferings(offerings);
        setCachedPremium(currentHasPremium);

        console.log('✅ RevenueCat data loaded successfully for user:', user.id);
        console.log(' Premium status for user', user.id + ':', currentHasPremium);
        console.log('📦 Available offerings for user', user.id + ':', offerings?.current?.availablePackages?.length || 0);
        
        // Add detailed premium debugging with user ID
        console.log('🔍 Premium Debug Details for user', user.id + ':');
        console.log('  - Active entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
        console.log('  - Premium entitlement:', customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium]);
        console.log('  - All entitlements:', Object.keys(customerInfo?.entitlements?.all || {}));
        console.log('  - Premium in all:', customerInfo?.entitlements?.all?.[ENTITLEMENTS.premium]);
        console.log('  - RevenueCat App User ID:', customerInfo?.originalAppUserId);

      } catch (error) {
        console.error('❌ Error loading RevenueCat data for user', user.id + ':', error);
      } finally {
        setLoading(false);
      }
    };

    loadRevenueCatData();
  }, [user?.id]);

  // Listen for purchase updates
  useEffect(() => {
    const purchaseUpdateListener = (info: CustomerInfo) => {
      console.log('🔄 Purchase update received for user', user?.id + ':', info.entitlements.active);
      
      // Update cache when purchase status changes
      const newPremiumStatus = info?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
      if (user?.id) {
        savePremiumStatusToCache(user.id, newPremiumStatus, info);
      }
      
      setCustomerInfo(info);
      setCachedPremium(newPremiumStatus);
    };

    Purchases.addCustomerInfoUpdateListener(purchaseUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(purchaseUpdateListener);
    };
  }, [user?.id]);

  const purchasePackage = async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🛒 Attempting to purchase package for user', user?.id + ':', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      
      // Update cache after successful purchase
      const newPremiumStatus = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
      if (user?.id) {
        await savePremiumStatusToCache(user.id, newPremiumStatus, customerInfo);
      }
      
      setCustomerInfo(customerInfo);
      setCachedPremium(newPremiumStatus);
      console.log('✅ Purchase successful for user:', user?.id);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Purchase failed for user', user?.id + ':', error);
      return { 
        success: false, 
        error: error.message || 'Purchase failed' 
      };
    }
  };

  const restorePurchases = async (): Promise<RestoreResult> => {
    try {
      console.log('🔄 Restoring purchases for user:', user?.id);
      const customerInfo = await Purchases.restorePurchases();
      
      // Update cache after restore
      const newPremiumStatus = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
      if (user?.id) {
        await savePremiumStatusToCache(user.id, newPremiumStatus, customerInfo);
      }
      
      setCustomerInfo(customerInfo);
      setCachedPremium(newPremiumStatus);
      console.log('✅ Purchases restored successfully for user:', user?.id);
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('❌ Restore failed for user', user?.id + ':', error);
      return { 
        success: false, 
        error: error.message || 'Restore failed' 
      };
    }
  };

  const refreshCustomerInfo = async (): Promise<void> => {
    try {
      console.log('🔄 Refreshing customer info for user:', user?.id);
      
      // Switch user first, then get fresh data
      await Purchases.logIn(user?.id || '');
      const customerInfo = await Purchases.getCustomerInfo();
      
      // Calculate premium status before setting state
      const currentHasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
      
      // Update cache
      if (user?.id) {
        await savePremiumStatusToCache(user.id, currentHasPremium, customerInfo);
      }
      
      setCustomerInfo(customerInfo);
      setCachedPremium(currentHasPremium);
      console.log('✅ Customer info refreshed for user:', user?.id);
      console.log('📱 Updated premium status for user', user?.id + ':', currentHasPremium);
      
      // Add detailed debugging for refresh with user ID
      console.log('🔍 Refresh Debug Details for user', user?.id + ':');
      console.log('  - Active entitlements:', Object.keys(customerInfo?.entitlements?.active || {}));
      console.log('  - Premium entitlement:', customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium]);
      console.log('  - RevenueCat App User ID:', customerInfo?.originalAppUserId);
      
    } catch (error) {
      console.error('❌ Failed to refresh customer info for user', user?.id + ':', error);
    }
  };

  const getAvailablePackages = (): PurchasesPackage[] => {
    return offerings?.current?.availablePackages || [];
  };

  return {
    customerInfo,
    offerings,
    loading,
    hasPremium,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    getAvailablePackages,
  };
};