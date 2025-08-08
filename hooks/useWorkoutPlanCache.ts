// hooks/useWorkoutPlanCache.ts
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/firebaseService';

const CACHE_KEY = 'workout_plan_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface WorkoutPlan {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }> | number;
    notes?: string;
    order: number;
  }>;
}

interface WorkoutPlanCache {
  plan: WorkoutPlan;
  lastUpdated: number;
}

export const useWorkoutPlanCache = (userId: string, planId: string) => {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const getCacheKey = () => `${CACHE_KEY}_${userId}_${planId}`;

  const loadPlanFromAsyncStorage = async (): Promise<WorkoutPlan | null> => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (!cached) return null;

      const cache: WorkoutPlanCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.lastUpdated < CACHE_DURATION) {
        console.log('📱 Using cached workout plan from AsyncStorage');
        return cache.plan;
      }

      console.log('�� Workout plan cache expired, will refresh');
      return null;
    } catch (error) {
      console.log('📱 Error loading workout plan from AsyncStorage:', error);
      return null;
    }
  };

  const savePlanToAsyncStorage = async (plan: WorkoutPlan) => {
    try {
      const cache: WorkoutPlanCache = {
        plan,
        lastUpdated: Date.now()
      };
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify(cache));
      console.log('�� Workout plan saved to AsyncStorage');
    } catch (error) {
      console.log('📱 Error saving workout plan to AsyncStorage:', error);
    }
  };

  const loadPlan = async (forceRefresh = false) => {
    if (loadingRef.current && !forceRefresh) {
      console.log('📱 Already loading, skipping duplicate request');
      return;
    }
  
    loadingRef.current = true;
    
    try {
        setIsLoading(true);
      setError(null);
  
      if (!forceRefresh) {
        const cachedPlan = await loadPlanFromAsyncStorage();
        if (cachedPlan) {
          setPlan(cachedPlan);
          setIsLoading(false);
          return;
        }
      }
  
      console.log('🔥 Fetching workout plan from Firebase...');
      const fetchedPlan = await FirebaseService.getWorkoutPlanById(userId, planId);
      
      if (fetchedPlan) {
        setPlan(fetchedPlan);
        await savePlanToAsyncStorage(fetchedPlan);
        console.log('🔥 Loaded workout plan from Firebase');
      } else {
        setError('Workout plan not found');
      }
    } catch (error) {
      console.log('🔥 Error loading workout plan:', error);
      setError('Failed to load workout plan');
    } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    };  
  const updatePlan = async (updatedPlan: WorkoutPlan) => {
    try {
      setPlan(updatedPlan);
      await savePlanToAsyncStorage(updatedPlan);
    } catch (error) {
      console.log('🔥 Error updating workout plan cache:', error);
    }
  };

  const refreshPlan = () => loadPlan(true);

  useEffect(() => {
    if (userId && planId) {
      loadPlan();
    }
  }, [userId, planId]);

  return {
    plan,
    isLoading,
    error,
    loadPlan,
    updatePlan,
    refreshPlan
  };
};