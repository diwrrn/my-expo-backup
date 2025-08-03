import { useState, useEffect } from 'react';
import { Food } from '@/types/api';
import { FirebaseService } from '@/services/firebaseService';

interface FoodCache {
  foods: Food[];
  categories: string[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

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

  // Load foods from Firebase and cache them
  const loadFoodsToCache = async (forceRefresh = false) => {
    if (!forceRefresh && cache.foods.length > 0 && !isCacheExpired()) {
      return; // Use existing cache
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

      console.log(`🔍 FOOD CACHE: Loaded ${foods.length} foods and ${categories.length} categories.`);
      // ADDED LOG: Inspect the first few loaded food items

      
      
      setCache({
        foods,
        categories,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });

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

  // Get popular foods from cache
  const getPopularFoodsFromCache = (limit = 10, includeSnacks = false): Food[] => {
    let results = cache.foods
      .sort((a, b) => {
        if (a.popularity && b.popularity) {
          return b.popularity - a.popularity;
        }
        return a.name.localeCompare(b.name);
      });
    
    // Filter out snacks unless explicitly requested
    if (!includeSnacks) {
      results = results.filter(food => 
        !food.mealTiming || !food.mealTiming.includes('snack')
      );
    }
    
    return results.slice(0, limit);
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

  return {
    // Cache state
    foods: cache.foods,
    categories: cache.categories,
    lastUpdated: cache.lastUpdated,
    isLoading: cache.isLoading,
    error: cache.error,
    isCacheExpired: isCacheExpired(),
    
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
