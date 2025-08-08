// hooks/useExerciseCache.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/firebaseService';

const CACHE_KEY = 'exercise_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

interface Exercise {
  id: string;
  name: string;
  nameKurdish?: string;
  nameArabic?: string;
  description: string;
  videoUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
}

interface ExerciseCache {
  exercise: Exercise;
  lastUpdated: number;
}

export const useExerciseCache = (exerciseId: string, categoryId?: string, subcategoryId?: string) => {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = () => `${CACHE_KEY}_${exerciseId}`;

  const loadExerciseFromAsyncStorage = async (): Promise<Exercise | null> => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (!cached) return null;

      const cache: ExerciseCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.lastUpdated < CACHE_DURATION) {
        console.log('📱 Using cached exercise from AsyncStorage');
        return cache.exercise;
      }

      console.log('📱 Exercise cache expired, will refresh');
      return null;
    } catch (error) {
      console.log('📱 Error loading exercise from AsyncStorage:', error);
      return null;
    }
  };

  const saveExerciseToAsyncStorage = async (exercise: Exercise) => {
    try {
      const cache: ExerciseCache = {
        exercise,
        lastUpdated: Date.now()
      };
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify(cache));
      console.log('📱 Exercise saved to AsyncStorage');
    } catch (error) {
      console.log('📱 Error saving exercise to AsyncStorage:', error);
    }
  };

  const loadExercise = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cachedExercise = await loadExerciseFromAsyncStorage();
        if (cachedExercise) {
          setExercise(cachedExercise);
          setIsLoading(false);
          return;
        }
      }

      console.log('🔥 Fetching exercise from Firebase...');
      let fetchedExercise;
      
      if (categoryId && subcategoryId) {
        fetchedExercise = await FirebaseService.getExerciseById(categoryId, subcategoryId, exerciseId);
      } else {
        fetchedExercise = await FirebaseService.findExerciseById(exerciseId);
      }
      
      if (fetchedExercise) {
        setExercise(fetchedExercise);
        await saveExerciseToAsyncStorage(fetchedExercise);
        console.log('🔥 Loaded exercise from Firebase');
      } else {
        setError('Exercise not found');
      }
    } catch (error) {
      console.log('🔥 Error loading exercise:', error);
      setError('Failed to load exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshExercise = () => loadExercise(true);

  useEffect(() => {
    if (exerciseId) {
      loadExercise();
    }
  }, [exerciseId, categoryId, subcategoryId]);

  return {
    exercise,
    isLoading,
    error,
    refreshExercise
  };
};