// hooks/usePurchases.ts
import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import { revenueCatService } from '@/services/revenueCatService';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';

// Entitlement identifiers (configure these in RevenueCat dashboard)
export const ENTITLEMENTS = {
  premium: 'premium', // Replace with your actual entitlement ID
} as const;

interface RestoreResult {
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
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

export const usePurchases = (): UsePurchasesReturn => {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [firebasePremium, setFirebasePremium] = useState<boolean>(false);
  const [firebaseLoading, setFirebaseLoading] = useState<boolean>(true);

  // Check premium status from both sources
  const revenueCatPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
  const hasPremium = revenueCatPremium || firebasePremium;

  // Load Firebase premium status
  useEffect(() => {
    const loadFirebasePremium = async () => {
      if (!user?.id) {
        setFirebasePremium(false);
        setFirebaseLoading(false);
        return;
      }

      try {
        setFirebaseLoading(true);
        const userProfile = await FirebaseService.getUserProfileDocument(user.id);
        setFirebasePremium(userProfile?.isPremium || false);
        console.log('📱 Firebase premium status loaded:', userProfile?.isPremium || false);
      } catch (error) {
        console.error('❌ Failed to load Firebase premium status:', error);
        setFirebasePremium(false);
      } finally {
        setFirebaseLoading(false);
      }
    };

    loadFirebasePremium();
  }, [user?.id]);

  // Load RevenueCat data
  useEffect(() => {
    const loadRevenueCatData = async () => {
      try { 
        setLoading(true);
        const [customerInfo, offerings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings()
        ]);

// ADD DEBUG LOGS RIGHT AFTER:
console.log('🔍🔍🔍🔍🔍 RevenueCat Hook Debug:');
console.log('User ID:', user?.id);
console.log('Customer Info Raw:', JSON.stringify(customerInfo, null, 2));
console.log('All Entitlements:', customerInfo.entitlements.all);
console.log('Active Entitlements:', customerInfo.entitlements.active);
console.log('Verification:', customerInfo.entitlements.verification);

        setCustomerInfo(customerInfo);
        setOfferings(offerings);

        // Sync to Firebase if RevenueCat has premium status
        const revenueCatHasPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
        if (user?.id && revenueCatHasPremium !== firebasePremium) {
          console.log('🔄 Syncing RevenueCat premium status to Firebase:', revenueCatHasPremium);
          try {
            await FirebaseService.updateUserPremiumStatus(user.id, revenueCatHasPremium);
            setFirebasePremium(revenueCatHasPremium);
          } catch (error) {
            console.error('❌ Failed to sync premium status to Firebase:', error);
          }
        }

      } catch (error) {
        console.error('❌ Error loading RevenueCat data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set up listener for purchase updates
    const purchaseUpdateListener = (info: CustomerInfo) => {
      console.log('🔄 Purchase update received:', info);
      setCustomerInfo(info);

      // Sync updated premium status to Firebase
      const updatedPremium = info?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
      if (user?.id) {
        FirebaseService.updateUserPremiumStatus(user.id, updatedPremium).then(() => {
          setFirebasePremium(updatedPremium);
          console.log('✅ Premium status synced to Firebase after purchase update');
        }).catch(error => {
          console.error('❌ Failed to sync premium status after purchase update:', error);
        });
      }
    };

    Purchases.addCustomerInfoUpdateListener(purchaseUpdateListener);

    // Load initial data
    loadRevenueCatData();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(purchaseUpdateListener);
    };
}, [user?.id]); // Remove firebasePremium from dependencies
  const purchasePackage = async (pkg: PurchasesPackage): Promise<{ success: boolean; error?: string }> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);   

      // Sync successful purchase to Firebase
      if (user?.id) {
        const isPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
        await FirebaseService.updateUserPremiumStatus(user.id, isPremium);
        setFirebasePremium(isPremium);
        console.log('✅ Purchase synced to Firebase');
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      
      if (error.code === 'PURCHASE_CANCELLED') {
        return { success: false, error: 'Purchase was cancelled' };
      } else if (error.code === 'PRODUCT_ALREADY_PURCHASED') {
        return { success: false, error: 'Product already purchased' };
      } else {
        return { success: false, error: error.message || 'Purchase failed' };
      }
    }
  };

  const restorePurchases = async (): Promise<RestoreResult> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);

      // Sync restored purchases to Firebase
      if (user?.id) {
        const isPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
        await FirebaseService.updateUserPremiumStatus(user.id, isPremium);
        setFirebasePremium(isPremium);
        console.log('✅ Restored purchases synced to Firebase');
      }

      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('❌ Restore purchases error:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
  };

  const refreshCustomerInfo = async (): Promise<void> => {
    try {
      setLoading(true);
      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings()
      ]);
      setCustomerInfo(customerInfo);
      setOfferings(offerings);

      // Sync refreshed data to Firebase
      if (user?.id) {
        const isPremium = customerInfo?.entitlements?.active?.[ENTITLEMENTS.premium] != null;
        await FirebaseService.updateUserPremiumStatus(user.id, isPremium);
        setFirebasePremium(isPremium);
        console.log('✅ Refreshed data synced to Firebase');
      }

    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailablePackages = (): PurchasesPackage[] => {
    if (!offerings?.current) return [];
    return offerings.current.availablePackages;
  };

  return {
    customerInfo,
    offerings,
    loading: loading || firebaseLoading,
    hasPremium,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    getAvailablePackages
  };
};