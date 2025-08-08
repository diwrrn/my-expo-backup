import { useState, useEffect, useCallback } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from './useAuth';
import { getTodayDateString } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WeightLog {
  date: string;
  weight: number;
}

interface WeightHistoryCache {
  weightLogs: WeightLog[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

// Cache duration: 24 hours (weight history doesn't change frequently)
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Cache key
const getWeightHistoryCacheKey = (userId: string) => `weight_history_${userId}`;

export function useWeightHistory(userId?: string) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<WeightHistoryCache>({
    weightLogs: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if cache is expired
  const isCacheExpired = useCallback(() => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  }, [cache.lastUpdated]);

  // Load weight history from cache
  const loadWeightHistoryFromCache = useCallback(async () => {
    if (!userId) return null;

    try {
      const cached = await AsyncStorage.getItem(getWeightHistoryCacheKey(userId));
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
          console.log('📱 Using cached weight history for user:', userId);
          setWeightLogs(cacheData.weightLogs);
          setCache({
            weightLogs: cacheData.weightLogs,
            lastUpdated: cacheData.timestamp,
            isLoading: false,
            error: null,
          });
          return cacheData.weightLogs;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached weight history:', error);
    }
    return null;
  }, [userId]);

  // Save weight history to cache
  const saveWeightHistoryToCache = useCallback(async (weightLogs: WeightLog[]) => {
    if (!userId) return;

    try {
      const cacheData = {
        weightLogs,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(getWeightHistoryCacheKey(userId), JSON.stringify(cacheData));
      console.log('💾 Cached weight history for user:', userId);
    } catch (error) {
      console.warn('⚠️ Error saving weight history to cache:', error);
    }
  }, [userId]);

  // Load weight history when userId changes
  useEffect(() => {
    if (userId) {
      loadWeightHistory();
    } else {
      setWeightLogs([]);
      setCache({
        weightLogs: [],
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
    }
  }, [userId]);

  const loadWeightHistory = async (forceRefresh = false) => {
    if (!userId) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = await loadWeightHistoryFromCache();
      if (cached) {
        return cached;
      }
    }

    try {
      setIsLoading(true);
      setError(null);
      setCache(prev => ({ ...prev, isLoading: true, error: null }));

      const history = await FirebaseService.getWeightHistory(userId);
      
      // Save to cache
      await saveWeightHistoryToCache(history);
      
      setWeightLogs(history);
      setCache({
        weightLogs: history,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });

      console.log('✅ Weight history loaded from Firebase for user:', userId);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight history';
      setError(errorMessage);
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Error loading weight history:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logWeight = async (weight: number) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
  
    if (weight <= 0 || weight > 500) {
      throw new Error('Weight must be between 1 and 500 kg');
    }
  
    try {
      setError(null);
      const today = getTodayDateString();
      
      // ADD TIMESTAMP to the date
      const timestamp = new Date().toISOString(); // This includes time!
      
      // Add weight log to Firebase with timestamp
      await FirebaseService.addWeightLog(userId, weight, timestamp);
      
      // Update the user's main profile weight
      await FirebaseService.updateUserProfileDocument(userId, { weight: weight });
  
      // Add new weight log to local state and cache WITH TIMESTAMP
      const newWeightLog: WeightLog = { date: timestamp, weight }; // Use timestamp instead of today
      const updatedWeightLogs = [...weightLogs, newWeightLog];
      
      setWeightLogs(updatedWeightLogs);
      await saveWeightHistoryToCache(updatedWeightLogs);
      
      console.log('✅ Weight logged and cache updated:', weight);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log weight';
      setError(errorMessage);
      console.error('useWeightHistory: Error logging weight:', err);
      throw err;
    }
  };

  // Clear cache for this user
  const clearCache = useCallback(async () => {
    if (!userId) return;

    try {
      await AsyncStorage.removeItem(getWeightHistoryCacheKey(userId));
      setCache({
        weightLogs: [],
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
      console.log('🗑️ Weight history cache cleared for user:', userId);
    } catch (error) {
      console.warn('⚠️ Error clearing weight history cache:', error);
    }
  }, [userId]);

  return {
    weightLogs,
    isLoading,
    error,
    logWeight,
    refreshHistory: () => loadWeightHistory(true), // Force refresh
    clearCache,
    isCacheExpired,
  };
}