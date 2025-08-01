import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { StreakData, StreakService } from '@/services/streakService';

interface UseStreakResult {
  currentStreak: number;
  bestStreak: number;
  isLoading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
}

export function useStreak(userId?: string): UseStreakResult {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastLogDate: null,
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listener for streak data
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const streakRef = doc(db, 'users', userId, 'stats', 'streak');
    
    const unsubscribe = onSnapshot(
      streakRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as StreakData;
          setStreakData(data);
        } else {
          // No streak data yet, use defaults
          console.log('🔥 useStreak: No streak data found, using defaults');
          setStreakData({
            currentStreak: 0,
            bestStreak: 0,
            lastLogDate: null,
            updatedAt: new Date().toISOString()
          });
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error getting streak data:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Function to manually refresh streak data
  const refreshStreak = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await StreakService.getStreak(userId);
      setStreakData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh streak';
      setError(errorMessage);
      console.error('Error refreshing streak:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    currentStreak: streakData.currentStreak,
    bestStreak: streakData.bestStreak,
    isLoading,
    error,
    refreshStreak
  };
}