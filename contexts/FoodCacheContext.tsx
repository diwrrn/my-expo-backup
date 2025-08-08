import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '@/services/firebaseService';
import { Food } from '@/types/api';

interface FoodCache {
  foods: Food[];
  categories: string[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface FoodCacheContextType {
  // Cache state
  foods: Food[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  
  // Cache methods
  searchFoodsInCache: (query: string, limit?: number, includeSnacks?: boolean) => Food[];
  getFoodsByCategoryFromCache: (category: string, limit?: number) => Food[];
  getPopularFoodsFromCache: (limit?: number) => Food[];
  refreshCache: () => void;
  clearAsyncStorageCache: () => Promise<void>;
}

const FoodCacheContext = createContext<FoodCacheContextType | undefined>(undefined);

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const FOOD_CACHE_KEY = 'food_cache_v1';

interface FoodCacheProviderProps {
  children: ReactNode;
}

export function FoodCacheProvider({ children }: FoodCacheProviderProps) {
  const [cache, setCache] = useState<FoodCache>({
    foods: [],
    categories: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if cache is expired
  const isCacheExpired = useCallback(() => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  }, [cache.lastUpdated]);

  // Load foods from AsyncStorage cache
  const loadFoodsFromAsyncStorage = async () => {
    try {
      const cached = await AsyncStorage.getItem(FOOD_CACHE_KEY);
      if (cached) {
        const cacheData: FoodCache = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - cacheData.lastUpdated <= CACHE_DURATION) {
          console.log('🔍 FOOD CACHE CONTEXT: Using AsyncStorage cache');
          setCache(cacheData);
          return true;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading food cache from AsyncStorage:', error);
    }
    return false;
  };

  // Save foods to AsyncStorage cache
  const saveFoodsToAsyncStorage = async (cacheData: FoodCache) => {
    try {
      await AsyncStorage.setItem(FOOD_CACHE_KEY, JSON.stringify(cacheData));
      console.log('💾 Food cache saved to AsyncStorage (CONTEXT)');
    } catch (error) {
      console.warn('⚠️ Error saving food cache to AsyncStorage:', error);
    }
  };

  // Load foods from Firebase and cache them
  const loadFoodsToCache = useCallback(async (forceRefresh = false) => {
    // Try AsyncStorage first if not forcing refresh
    if (!forceRefresh) {
      const hasCache = await loadFoodsFromAsyncStorage();
      if (hasCache) return;
    }

    // Cache expired or force refresh - load from Firebase
    if (!forceRefresh && cache.foods.length > 0 && !isCacheExpired()) {
      return; // Use existing memory cache
    }

    try {
      setCache(prev => ({ ...prev, isLoading: true, error: null }));

      // Load all foods from Firebase
      let foods = await FirebaseService.getAllFoods();
      
      // Extract unique categories
      const categories = Array.from(new Set(foods.map(food => food.category))).sort();

      console.log(`🔍 FOOD CACHE CONTEXT: Loaded ${foods.length} foods and ${categories.length} categories from Firebase.`);
      
      const newCache = {
        foods,
        categories,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };

      setCache(newCache);
      
      // Save to AsyncStorage
      await saveFoodsToAsyncStorage(newCache);

    } catch (error) {
      console.error('Error loading foods to cache:', error);
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load foods',
      }));
    }
  }, [cache.foods.length, isCacheExpired]);

  // Search foods in cache
  const searchFoodsInCache = useCallback((query: string, limit = 20, includeSnacks = false): Food[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    let results = cache.foods.filter(food => {
      const matchesName = food.name.toLowerCase().includes(lowerQuery) ||
                         food.kurdishName?.toLowerCase().includes(lowerQuery) ||
                         food.arabicName?.toLowerCase().includes(lowerQuery);
      
      if (!includeSnacks && food.mealTiming?.includes('snack')) {
        return false;
      }
      
      return matchesName;
    });
    
    return results.slice(0, limit);
  }, [cache.foods]);

  // Get foods by category from cache
  const getFoodsByCategoryFromCache = useCallback((category: string, limit = 20): Food[] => {
    return cache.foods
      .filter(food => food.category === category)
      .slice(0, limit);
  }, [cache.foods]);

  // Get popular foods from cache
  const getPopularFoodsFromCache = useCallback((limit = 10): Food[] => {
    
    // If cache is empty and not loading, try to load it
    if (cache.foods.length === 0 && !cache.isLoading) {
      loadFoodsToCache(false);
      return []; // Return empty for now, will get data on next call
    }
    
    const results = cache.foods
      .sort((a, b) => {
        if (a.popularity && b.popularity) {
          return b.popularity - a.popularity;
        }
        return a.name.localeCompare(b.name);
      });
    
    const finalResults = results.slice(0, limit);
    
    return finalResults;
  }, [cache.foods, cache.isLoading, loadFoodsToCache]);

  // Refresh cache manually
  const refreshCache = useCallback(() => {
    loadFoodsToCache(true);
  }, [loadFoodsToCache]);

  // Clear AsyncStorage cache
  const clearAsyncStorageCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FOOD_CACHE_KEY);
      setCache({
        foods: [],
        categories: [],
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
      console.log('🗑️ Food cache cleared from AsyncStorage (CONTEXT)');
    } catch (error) {
      console.warn('⚠️ Error clearing food cache from AsyncStorage:', error);
    }
  }, []);

  // Load foods automatically when provider mounts
  useEffect(() => {
    loadFoodsToCache(false);
  }, [loadFoodsToCache]);

  const contextValue: FoodCacheContextType = {
    // Cache state
    foods: cache.foods,
    categories: cache.categories,
    isLoading: cache.isLoading,
    error: cache.error,
    
    // Cache methods
    searchFoodsInCache,
    getFoodsByCategoryFromCache,
    getPopularFoodsFromCache,
    refreshCache,
    clearAsyncStorageCache,
  };

  return (
    <FoodCacheContext.Provider value={contextValue}>
      {children}
    </FoodCacheContext.Provider>
  );
}

// Custom hook to use food cache context
export function useFoodCacheContext(): FoodCacheContextType {
  const context = useContext(FoodCacheContext);
  if (!context) {
    throw new Error('useFoodCacheContext must be used within a FoodCacheProvider');
  }
  return context;
}