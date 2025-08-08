// hooks/useRecentlyLoggedFoods.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { FirebaseService } from '@/services/firebaseService';
import { Food } from '@/types/api';

interface RecentlyLoggedFoodsCache {
  foods: Food[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const getRecentlyLoggedFoodsCacheKey = (userId: string, numberOfDays: number) => 
  `recently_logged_foods_${userId}_${numberOfDays}days`;

export function useRecentlyLoggedFoods(numberOfDays: number = 7) {
  const { user } = useAuth();
  const { foodCache } = useFirebaseData();
  
  const [recentlyLoggedFoods, setRecentlyLoggedFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if cache is expired
  const isCacheExpired = useCallback((lastUpdated: number) => {
    return Date.now() - lastUpdated > CACHE_DURATION;
  }, []);

  // Load recently logged foods from cache
  const loadRecentlyLoggedFoodsFromCache = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const cached = await AsyncStorage.getItem(getRecentlyLoggedFoodsCacheKey(user.id, numberOfDays));
      if (cached) {
        const cacheData: RecentlyLoggedFoodsCache = JSON.parse(cached);
        
        // Check if cache is still valid
        if (!isCacheExpired(cacheData.lastUpdated)) {
          console.log('📱 Using cached recently logged foods for user:', user.id);
          return cacheData.foods;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached recently logged foods:', error);
    }
    return null;
  }, [user?.id, numberOfDays, isCacheExpired]);

  // Save recently logged foods to cache
  const saveRecentlyLoggedFoodsToCache = useCallback(async (foods: Food[]) => {
    if (!user?.id) return;

    try {
      const cacheData: RecentlyLoggedFoodsCache = {
        foods,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };
      
      await AsyncStorage.setItem(getRecentlyLoggedFoodsCacheKey(user.id, numberOfDays), JSON.stringify(cacheData));
      console.log('💾 Cached recently logged foods for user:', user.id);
    } catch (error) {
      console.warn('⚠️ Error saving recently logged foods to cache:', error);
    }
  }, [user?.id, numberOfDays]);

  // Fetch recently logged foods from Firebase
  const fetchRecentlyLoggedFoodsFromFirebase = useCallback(async () => {
    if (!user?.id) return [];

    try {
      console.log('🔄 Fetching recently logged foods from Firebase for user:', user.id);

      // Get the last N days of dates
      const recentDates: string[] = [];
      const today = new Date();
      
      for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().split('T')[0]);
      }

      // Aggregate all individual food entries from recent days
      const allFoodEntriesFromRecentDays: any[] = [];
      
      for (const dateString of recentDates) {
        const dailyMeals = await FirebaseService.getDailyMeals(user.id, dateString);
        if (dailyMeals && dailyMeals.meals) {
          // Iterate through each meal type (breakfast, lunch, etc.)
          for (const mealTypeKey in dailyMeals.meals) {
            const mealData = dailyMeals.meals[mealTypeKey];
            // Iterate through each food entry within that meal type
            for (const foodKey in mealData) {
              const foodEntry = mealData[foodKey]['0']; // Get the actual food nutrition data
              if (foodEntry) {
                allFoodEntriesFromRecentDays.push(foodEntry);
              }
            }
          }
        }
      }

      // Count frequency of each food ID
      const uniqueFoodIds = new Set<string>();
      const foodFrequency = new Map<string, number>();
      allFoodEntriesFromRecentDays.forEach((foodEntry: any) => {
        const foodId = foodEntry.id;
        if (foodId) {
          uniqueFoodIds.add(foodId);
          foodFrequency.set(foodId, (foodFrequency.get(foodId) || 0) + 1);
        }
      });

      // Get Food objects from cache for these IDs
      const recentlyLoggedFoods: Food[] = [];
      uniqueFoodIds.forEach(foodId => {
        const food = foodCache.foods.find(f => f.id === foodId);
        if (food) {
          recentlyLoggedFoods.push(food);
        }
      });

      // Sort by frequency (most logged first)
      recentlyLoggedFoods.sort((a, b) => {
        const freqA = foodFrequency.get(a.id) || 0;
        const freqB = foodFrequency.get(b.id) || 0;
        return freqB - freqA;
      });

      const topFoods = recentlyLoggedFoods.slice(0, 10); // Return top 10 most frequent

      console.log('✅ Recently logged foods fetched from Firebase for user:', user.id);
      return topFoods;
    } catch (err) {
      console.error('❌ Error loading recently logged foods from Firebase:', err);
      throw err;
    }
  }, [user?.id, numberOfDays, foodCache.foods]);

  // Main function to get recently logged foods (cache-first approach)
  const loadRecentlyLoggedFoods = useCallback(async (forceRefresh: boolean = false) => {
    if (!user?.id) {
      setRecentlyLoggedFoods([]);
      return;
    }
  
    // Set loading immediately if we don't have data yet
    if (recentlyLoggedFoods.length === 0) {
      setIsLoading(true);
    }
  
    // If not forcing refresh, try cache first
    if (!forceRefresh) {
      const cachedFoods = await loadRecentlyLoggedFoodsFromCache();
      if (cachedFoods && cachedFoods.length > 0) {
        setRecentlyLoggedFoods(cachedFoods);
        setError(null);
        setIsLoading(false); // Clear loading state
        console.log('🚀 Showing cached recently logged foods immediately');
        return;
      }
    }
        
    // No valid cache or forced refresh - fetch from Firebase
    try {
      setIsLoading(true);
      setError(null);
      
      const freshFoods = await fetchRecentlyLoggedFoodsFromFirebase();
      
      // Save to cache
      await saveRecentlyLoggedFoodsToCache(freshFoods);
      
      setRecentlyLoggedFoods(freshFoods);
      console.log('✅ Recently logged foods loaded and cached for user:', user.id);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recently logged foods';
      setError(errorMessage);
      console.error('❌ Error loading recently logged foods:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, loadRecentlyLoggedFoodsFromCache, fetchRecentlyLoggedFoodsFromFirebase, saveRecentlyLoggedFoodsToCache, recentlyLoggedFoods.length]);
  useEffect(() => {
    loadRecentlyLoggedFoods(false);
  }, [user?.id, numberOfDays, loadRecentlyLoggedFoods]); // ADD loadRecentlyLoggedFoods back here
  // Manual refresh
  const refresh = useCallback(() => {
    loadRecentlyLoggedFoods(true);
  }, [loadRecentlyLoggedFoods]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!user?.id) return;
    try {
      await AsyncStorage.removeItem(getRecentlyLoggedFoodsCacheKey(user.id, numberOfDays));
      setRecentlyLoggedFoods([]);
      setError(null);
      console.log('🗑️ Recently logged foods cache cleared for user:', user.id);
    } catch (error) {
      console.warn('⚠️ Error clearing recently logged foods cache:', error);
    }
  }, [user?.id, numberOfDays]);

  return {
    recentlyLoggedFoods,
    isLoading,
    error,
    refresh,
    clearCache,
    isCacheExpired: useCallback((lastUpdated: number) => isCacheExpired(lastUpdated), [isCacheExpired]),
  };
}