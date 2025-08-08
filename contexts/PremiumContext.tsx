import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePurchases } from '@/hooks/usePurchases';

interface PremiumContextType {
  hasPremium: boolean;
  loading: boolean;
  refreshPremium: () => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { hasPremium, loading } = usePurchases();
  
  return (
    <PremiumContext.Provider value={{ hasPremium, loading, refreshPremium: () => {} }}>
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