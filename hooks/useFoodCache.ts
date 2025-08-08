import { useState, useEffect } from 'react';
import { Food } from '@/types/api';
import { FirebaseService } from '@/services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FoodCache {
  foods: Food[];
  categories: string[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const FOOD_CACHE_KEY = 'food_cache_v1';
export function useFoodCache() {
  const [cache, setCache] = useState<FoodCache>({
    foods: [],
    categories: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if cache is expired
  const isCacheExpired = () => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  };
// Load foods automatically when hook initializes
useEffect(() => {
  console.log('🔥 FOOD_CACHE: Hook initialized, loading foods...');
  loadFoodsToCache(false);
}, []);
  // Load foods from AsyncStorage cache
  const loadFoodsFromAsyncStorage = async () => {
    try {
      const cached = await AsyncStorage.getItem(FOOD_CACHE_KEY);
      if (cached) {
        const cacheData: FoodCache = JSON.parse(cached);
        
        // Check if cache is still valid
        if (!isCacheExpired()) {
          console.log('🔍 FOOD CACHE: Using AsyncStorage cache');
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
      console.log('💾 Food cache saved to AsyncStorage');
    } catch (error) {
      console.warn('⚠️ Error saving food cache to AsyncStorage:', error);
    }
  };

  // Load foods from Firebase and cache them
  const loadFoodsToCache = async (forceRefresh = false) => {
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
      
      // If no foods in database, initialize with sample data
      if (foods.length === 0) {
        console.log('No foods found in database, initializing sample data...');
        //await FirebaseService.initializeSampleData();
        //foods = await FirebaseService.getAllFoods();
      }
      
      // Extract unique categories
      const categories = Array.from(new Set(foods.map(food => food.category))).sort();

      console.log(`🔍 FOOD CACHE: Loaded ${foods.length} foods and ${categories.length} categories from Firebase.`);
      
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
  };
  // Search foods in cache
  const searchFoodsInCache = (query: string, limit = 20, includeSnacks = false): Food[] => {
    if (!query.trim()) return [];

    const searchLower = query.toLowerCase();
    console.log('🔍 Search Query (lowercase):', searchLower); // DEBUG LOG: Show the processed search query

    let results = cache.foods
      .filter(food => {
        // Perform individual checks and store their boolean results
        const matchesEnglish = food.name?.toLowerCase().includes(searchLower);
        const matchesKurdish = food.kurdishName?.toLowerCase().includes(searchLower);
        const matchesArabic = food.arabicName?.toLowerCase().includes(searchLower);
        const matchesBaseName = food.baseName?.toLowerCase().includes(searchLower);
        const matchesCategory = food.category?.toLowerCase().includes(searchLower);

        // DEBUG LOGS: Log the result of each check for the current food item
        // This helps identify which specific field is (or isn't) matching

        // Return true if any of the conditions are met
        return matchesEnglish || matchesKurdish || matchesArabic || matchesBaseName || matchesCategory;
      });
    
    // Filter out snacks unless explicitly requested
    if (!includeSnacks) {
      results = results.filter(food => 
        !food.mealTiming || !food.mealTiming.includes('snack')
      );
    }
    
    return results.slice(0, limit);
  };

  // Get foods by category from cache
  const getFoodsByCategoryFromCache = (category: string, limit = 20): Food[] => {
    return cache.foods
      .filter(food => food.category === category)
      .slice(0, limit);
  };

  const getPopularFoodsFromCache = (limit = 10): Food[] => {
    console.log('🔥 FOOD_CACHE: getPopularFoodsFromCache called with limit:', limit);
    console.log('🔥 FOOD_CACHE: Total foods in cache:', cache.foods.length);
    console.log('🔥 FOOD_CACHE: Cache loading status:', cache.isLoading);
    
    // If cache is still loading or empty, try to load it
    if (cache.foods.length === 0 && !cache.isLoading) {
      console.log('🔥 FOOD_CACHE: Cache empty and not loading, triggering load...');
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
    
    console.log('🔥 FOOD_CACHE: After sorting, foods count:', results.length);
    
    const finalResults = results.slice(0, limit);
    console.log('🔥 FOOD_CACHE: Final popular foods returned:', finalResults.length, 'items');
    if (finalResults.length > 0) {
      console.log('🔥 FOOD_CACHE: First few popular foods:', finalResults.slice(0, 3).map(f => ({ id: f.id, name: f.name, popularity: f.popularity })));
    }
    
    return finalResults;
  };
  // Get foods by base name (for preventing duplicates)
  const getFoodsByBaseName = (baseName: string): Food[] => {
    return cache.foods.filter(food => food.baseName === baseName);
  };

  // Get available units for a specific food
  const getAvailableUnits = (foodId: string): string[] => {
    const food = cache.foods.find(f => f.id === foodId);
    return food?.availableUnits || [];
  };

  // Convert nutrition values using custom conversions
  const convertNutrition = (food: Food, unit: string, quantity: number) => {
    if (!food.customConversions || !food.customConversions[unit]) {
      // Fallback to base nutrition values
      return {
        calories: food.calories * quantity,
        protein: food.protein * quantity,
        carbs: food.carbs * quantity,
        fat: food.fat * quantity,
      };
    }

    const conversion = food.customConversions[unit];
    return {
      calories: conversion.calories * quantity,
      protein: conversion.protein * quantity,
      carbs: conversion.carbs * quantity,
      fat: conversion.fat * quantity,
    };
  };

  // Refresh cache manually
  const refreshCache = () => {
    loadFoodsToCache(true);
  };

  // Load cache on mount
  useEffect(() => {
    loadFoodsToCache();
  }, []);

    // Clear AsyncStorage cache
    const clearAsyncStorageCache = async () => {
      try {
        await AsyncStorage.removeItem(FOOD_CACHE_KEY);
        console.log('🗑️ Food cache cleared from AsyncStorage');
      } catch (error) {
        console.warn('⚠️ Error clearing food cache from AsyncStorage:', error);
      }
    };
  return {
    // Cache state
    foods: cache.foods,
    categories: cache.categories,
    lastUpdated: cache.lastUpdated,
    isLoading: cache.isLoading,
    error: cache.error,
    isCacheExpired: isCacheExpired(),
    clearAsyncStorageCache,
    // Cache operations
    refreshCache,
    loadFoodsToCache,
    
    // Search and filter functions
    searchFoodsInCache,
    getFoodsByCategoryFromCache,
    getPopularFoodsFromCache,
    getFoodsByBaseName,
    
    // Utility functions
    getAvailableUnits,
    convertNutrition,
  };
}
