import React, { createContext, useContext, useState, useMemo } from 'react';

const WaterContext = createContext<any>(undefined);

export function WaterProvider({ children }: { children: React.ReactNode }) {
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWaterIntake = async (glasses: number) => {
    // Empty for now
  };

  const loadWaterIntake = async () => {
    // Empty for now
  };

  const contextValue = useMemo(() => ({
    waterIntake,
    loading,
    error,
    updateWaterIntake,
    loadWaterIntake,
  }), [waterIntake, loading, error]);

  return (
    <WaterContext.Provider value={contextValue}>
      {children}
    </WaterContext.Provider>
  );
}

export function useWaterContext() {
  const context = useContext(WaterContext);
  return context || { 
    waterIntake: 0, 
    loading: false, 
    error: null,
    updateWaterIntake: async () => {},
    loadWaterIntake: async () => {},
  };
}