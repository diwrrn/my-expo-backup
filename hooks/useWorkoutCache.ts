// hooks/useWorkoutCache.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '@/services/firebaseService';

interface WorkoutCategoriesCache {
  categories: any[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface ExercisesCache {
  exercises: any[];
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

// Cache durations
const CATEGORIES_CACHE_DURATION = 14 * 24 * 60 * 60 * 1000; // 2 weeks
const EXERCISES_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

// Cache keys
const getCategoriesCacheKey = () => 'workout_categories_cache';
const getExercisesCacheKey = (categoryId: string, subcategoryId: string) => 
  `workout_exercises_${categoryId}_${subcategoryId}_cache`;

export function useWorkoutCache() {
  const [categoriesCache, setCategoriesCache] = useState<WorkoutCategoriesCache>({
    categories: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  const [exercisesCache, setExercisesCache] = useState<ExercisesCache>({
    exercises: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if categories cache is expired
  const isCategoriesCacheExpired = useCallback(() => {
    return Date.now() - categoriesCache.lastUpdated > CATEGORIES_CACHE_DURATION;
  }, [categoriesCache.lastUpdated]);

  // Check if exercises cache is expired
  const isExercisesCacheExpired = useCallback(() => {
    return Date.now() - exercisesCache.lastUpdated > EXERCISES_CACHE_DURATION;
  }, [exercisesCache.lastUpdated]);

  // Load categories from cache
  const loadCategoriesFromCache = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(getCategoriesCacheKey());
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < CATEGORIES_CACHE_DURATION) {
          console.log('📱 Using cached workout categories');
          setCategoriesCache({
            categories: cacheData.categories,
            lastUpdated: cacheData.timestamp,
            isLoading: false,
            error: null,
          });
          return cacheData.categories;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached workout categories:', error);
    }
    return null;
  }, []);

  // Load exercises from cache
  const loadExercisesFromCache = useCallback(async (categoryId: string, subcategoryId: string) => {
    try {
      const cached = await AsyncStorage.getItem(getExercisesCacheKey(categoryId, subcategoryId));
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.timestamp < EXERCISES_CACHE_DURATION) {
          console.log('📱 Using cached exercises for:', categoryId, subcategoryId);
          setExercisesCache({
            exercises: cacheData.exercises,
            lastUpdated: cacheData.timestamp,
            isLoading: false,
            error: null,
          });
          return cacheData.exercises;
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached exercises:', error);
    }
    return null;
  }, []);

  // Save categories to cache
  const saveCategoriesToCache = useCallback(async (categories: any[]) => {
    try {
      const cacheData = {
        categories,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(getCategoriesCacheKey(), JSON.stringify(cacheData));
      console.log('💾 Cached workout categories');
    } catch (error) {
      console.warn('⚠️ Error saving workout categories to cache:', error);
    }
  }, []);

  // Save exercises to cache
  const saveExercisesToCache = useCallback(async (categoryId: string, subcategoryId: string, exercises: any[]) => {
    try {
      const cacheData = {
        exercises,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(getExercisesCacheKey(categoryId, subcategoryId), JSON.stringify(cacheData));
      console.log('💾 Cached exercises for:', categoryId, subcategoryId);
    } catch (error) {
      console.warn('⚠️ Error saving exercises to cache:', error);
    }
  }, []);

  // Load workout categories with caching
  const loadWorkoutCategories = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = await loadCategoriesFromCache();
      if (cached) {
        return cached;
      }
    }

    try {
      setCategoriesCache(prev => ({ ...prev, isLoading: true, error: null }));
      
      const categories = await FirebaseService.getWorkoutCategories();
      
      // Save to cache
      await saveCategoriesToCache(categories);
      
      setCategoriesCache({
        categories,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });

      console.log('✅ Workout categories loaded from Firebase');
      return categories;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load workout categories';
      setCategoriesCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Error loading workout categories:', error);
      throw error;
    }
  }, [loadCategoriesFromCache, saveCategoriesToCache]);

  // Load exercises with caching
  const loadExercises = useCallback(async (categoryId: string, subcategoryId: string, forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = await loadExercisesFromCache(categoryId, subcategoryId);
      if (cached) {
        return cached;
      }
    }

    try {
      setExercisesCache(prev => ({ ...prev, isLoading: true, error: null }));
      
      const exercises = await FirebaseService.getExercises(categoryId, subcategoryId);
      
      // Clean the fetched data
      const cleanedExercises = exercises.map(ex => ({
        ...ex,
        id: ex.id || '',
        name: ex.name || '',
        nameKurdish: ex.nameKurdish || '',
        nameArabic: ex.nameArabic || '',
      }));
      
      // Save to cache
      await saveExercisesToCache(categoryId, subcategoryId, cleanedExercises);
      
      setExercisesCache({
        exercises: cleanedExercises,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });

      console.log('✅ Exercises loaded from Firebase for:', categoryId, subcategoryId);
      return cleanedExercises;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load exercises';
      setExercisesCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('❌ Error loading exercises:', error);
      throw error;
    }
  }, [loadExercisesFromCache, saveExercisesToCache]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        getCategoriesCacheKey(),
        // Note: We can't easily clear all exercise caches without knowing all category/subcategory combinations
        // Individual exercise caches will expire naturally
      ]);
      setCategoriesCache({
        categories: [],
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
      setExercisesCache({
        exercises: [],
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
      console.log('🗑️ Workout cache cleared');
    } catch (error) {
      console.warn('⚠️ Error clearing workout cache:', error);
    }
  }, []);

  return {
    // Categories
    categories: categoriesCache.categories,
    categoriesLoading: categoriesCache.isLoading,
    categoriesError: categoriesCache.error,
    loadWorkoutCategories,
    
    // Exercises
    exercises: exercisesCache.exercises,
    exercisesLoading: exercisesCache.isLoading,
    exercisesError: exercisesCache.error,
    loadExercises,
    
    // Cache utilities
    clearCache,
    isCategoriesCacheExpired,
    isExercisesCacheExpired,
  };
}