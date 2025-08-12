import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePurchases } from '@/hooks/usePurchases';

interface PremiumContextType {
  hasPremium: boolean;
  loading: boolean;
  refreshPremium: () => Promise<void>;
  setImmediatePremium: (status: boolean) => void; // NEW: For instant updates
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { hasPremium: contextHasPremium, loading, refreshCustomerInfo } = usePurchases();
  
  // ADD: Local state override (same pattern as subscription screen)
  const [localPremiumStatus, setLocalPremiumStatus] = useState<boolean | null>(null);
  
  // Enhanced premium status (prioritizes local state)
  const effectiveHasPremium = localPremiumStatus !== null ? localPremiumStatus : contextHasPremium;
  
  // Function to set immediate premium status (for instant updates)
  const setImmediatePremium = useCallback((status: boolean) => {
    console.log('🚀 PremiumContext: Setting immediate premium status to:', status);
    setLocalPremiumStatus(status);
    
    // Auto-clear local override after successful background sync
    setTimeout(() => {
      refreshCustomerInfo().then(() => {
        console.log('✅ PremiumContext: Background refresh complete, clearing local override');
        setLocalPremiumStatus(null);
      }).catch(() => {
        console.log('❌ PremiumContext: Background refresh failed, keeping local override');
      });
    }, 1000);
  }, [refreshCustomerInfo]);

  // Enhanced refresh function
  const refreshPremium = useCallback(async () => {
    await refreshCustomerInfo();
  }, [refreshCustomerInfo]);

  // Reset local status when context updates to match
  useEffect(() => {
    if (localPremiumStatus !== null && localPremiumStatus === contextHasPremium) {
      console.log('🔄 PremiumContext: Context caught up with local state, clearing override');
      setLocalPremiumStatus(null);
    }
  }, [contextHasPremium, localPremiumStatus]);

  console.log('🔍 PremiumContext Debug:', {
    contextHasPremium,
    localPremiumStatus,
    effectiveHasPremium,
    loading
  });
  
  return (
    <PremiumContext.Provider value={{ 
      hasPremium: effectiveHasPremium, 
      loading, 
      refreshPremium,
      setImmediatePremium // NEW: Expose this function
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremiumContext() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremiumContext must be used within a PremiumProvider');
  }
  return context;
}