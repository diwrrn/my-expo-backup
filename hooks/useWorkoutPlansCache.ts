// hooks/useWorkoutPlansCache.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/firebaseService';

const CACHE_KEY = 'workout_plans_cache';
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
    reps: number;
    weight?: number;
    notes?: string;
    order: number;
  }>;
}

interface WorkoutPlansCache {
  plans: WorkoutPlan[];
  lastUpdated: number;
}

export const useWorkoutPlansCache = (userId: string) => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = () => `${CACHE_KEY}_${userId}`;

  const loadPlansFromAsyncStorage = async (): Promise<WorkoutPlan[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (!cached) return null;

      const cache: WorkoutPlansCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.lastUpdated < CACHE_DURATION) {
        console.log('📱 Using cached workout plans from AsyncStorage');
        return cache.plans;
      }

      console.log('📱 Workout plans cache expired, will refresh');
      return null;
    } catch (error) {
      console.log('📱 Error loading workout plans from AsyncStorage:', error);
      return null;
    }
  };

  const savePlansToAsyncStorage = async (plans: WorkoutPlan[]) => {
    try {
      const cache: WorkoutPlansCache = {
        plans,
        lastUpdated: Date.now()
      };
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify(cache));
      console.log('📱 Workout plans saved to AsyncStorage');
    } catch (error) {
      console.log('📱 Error saving workout plans to AsyncStorage:', error);
    }
  };

  const loadPlans = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cachedPlans = await loadPlansFromAsyncStorage();
        if (cachedPlans) {
          setPlans(cachedPlans);
          setIsLoading(false);
          return;
        }
      }

      console.log('🔥 Fetching workout plans from Firebase...');
      const fetchedPlans = await FirebaseService.getWorkoutPlans(userId);
      
      if (fetchedPlans) {
        setPlans(fetchedPlans);
        await savePlansToAsyncStorage(fetchedPlans);
        console.log(`🔥 Loaded ${fetchedPlans.length} workout plans from Firebase`);
      } else {
        setError('No workout plans found');
      }
    } catch (error) {
      console.log('🔥 Error loading workout plans:', error);
      setError('Failed to load workout plans');
    } finally {
      setIsLoading(false);
    }
  };

  const addPlan = async (planData: any) => {
    try {
      const newPlanId = await FirebaseService.addWorkoutPlan(userId, planData);
      
      // Fetch the complete plan data
      const newPlan = await FirebaseService.getWorkoutPlanById(userId, newPlanId);
      
      if (newPlan) {
        const updatedPlans = [...plans, newPlan];
        setPlans(updatedPlans);
        await savePlansToAsyncStorage(updatedPlans);
        return newPlan;
      } else {
        throw new Error('Failed to fetch newly created plan');
      }
    } catch (error) {
      console.log('🔥 Error adding workout plan:', error);
      throw error;
    }
  };
  
  const deletePlan = async (planId: string) => {
    try {
      await FirebaseService.deleteWorkoutPlan(userId, planId);
      const updatedPlans = plans.filter(plan => plan.id !== planId);
      setPlans(updatedPlans);
      await savePlansToAsyncStorage(updatedPlans);
    } catch (error) {
      console.log('🔥 Error deleting workout plan:', error);
      throw error;
    }
  };

  const refreshPlans = () => loadPlans(true);

  useEffect(() => {
    if (userId) {
      loadPlans();
    }
  }, [userId]);

  return {
    plans,
    isLoading,
    error,
    loadPlans,
    addPlan,
    deletePlan,
    refreshPlans
  };
};