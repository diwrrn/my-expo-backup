import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { StreakData, StreakService } from '@/services/streakService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseStreakResult {
  currentStreak: number;
  bestStreak: number;
  isLoading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
}

interface StreakCache {
  streakData: StreakData;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

// Cache duration: 12 hours (streak data doesn't change frequently)
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

// Cache key
const getStreakCacheKey = (userId: string) => `streak_data_${userId}`;

export function useStreak(userId?: string): UseStreakResult {
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastLogDate: null,
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<StreakCache>({
    streakData: {
      currentStreak: 0,
      bestStreak: 0,
      lastLogDate: null,
      updatedAt: new Date().toISOString()
    },
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if cache is expired
  const isCacheExpired = useCallback(() => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  }, [cache.lastUpdated]);

  // Load streak data from cache
  const loadStreakFromCache = useCallback(async () => {
    if (!userId) return null;

    try {
      const cached = await AsyncStorage.getItem(getStreakCacheKey(userId));
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          console.log('📱 Using cached streak data for user:', userId);
          setStreakData(cacheData.streakData);
          setCache({
            streakData: cacheData.streakData,
            lastUpdated: cacheData.timestamp,
            isLoading: false,
            error: null,
          });
          return cacheData.streakData;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached streak data:', error);
    }
    return null;
  }, [userId]);

  // Save streak data to cache
  const saveStreakToCache = useCallback(async (data: StreakData) => {
    if (!userId) return;

    try {
      const cacheData = {
        streakData: data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(getStreakCacheKey(userId), JSON.stringify(cacheData));
      console.log('�� Cached streak data for user:', userId);
    } catch (error) {
      console.warn('⚠️ Error saving streak data to cache:', error);
    }
  }, [userId]);

  // Set up real-time listener for streak data with caching
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    // Load from cache first
    const loadCachedData = async () => {
      const cached = await loadStreakFromCache();
      if (cached) {
        setIsLoading(false);
      }
    };

    loadCachedData();

    setIsLoading(true);
    setError(null);

    const streakRef = doc(db, 'users', userId, 'stats', 'streak');
    
    const unsubscribe = onSnapshot(
      streakRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as StreakData;
          
          // Save to cache
          saveStreakToCache(data);
          
          setStreakData(data);
          setCache({
            streakData: data,
            lastUpdated: Date.now(),
            isLoading: false,
            error: null,
          });
        } else {
          // No streak data yet, use defaults
          console.log('🔥 useStreak: No streak data found, using defaults');
          const defaultData = {
            currentStreak: 0,
            bestStreak: 0,
            lastLogDate: null,
            updatedAt: new Date().toISOString()
          };
          
          // Save defaults to cache
          saveStreakToCache(defaultData);
          
          setStreakData(defaultData);
          setCache({
            streakData: defaultData,
            lastUpdated: Date.now(),
            isLoading: false,
            error: null,
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
  }, [userId, loadStreakFromCache, saveStreakToCache]);

  // Function to manually refresh streak data
  const refreshStreak = useCallback(async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await StreakService.getStreak(userId);
      
      // Save to cache
      await saveStreakToCache(data);
      
      setStreakData(data);
      setCache({
        streakData: data,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });
      
      console.log('✅ Streak data refreshed and cached');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh streak';
      setError(errorMessage);
      console.error('Error refreshing streak:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, saveStreakToCache]);

  // Clear cache for this user
  const clearCache = useCallback(async () => {
    if (!userId) return;

    try {
      await AsyncStorage.removeItem(getStreakCacheKey(userId));
      setCache({
        streakData: {
          currentStreak: 0,
          bestStreak: 0,
          lastLogDate: null,
          updatedAt: new Date().toISOString()
        },
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
      console.log('🗑️ Streak cache cleared for user:', userId);
    } catch (error) {
      console.warn('⚠️ Error clearing streak cache:', error);
    }
  }, [userId]);

  return {
    currentStreak: streakData.currentStreak,
    bestStreak: streakData.bestStreak,
    isLoading,
    error,
    refreshStreak,
    clearCache,
    isCacheExpired,
  };
}