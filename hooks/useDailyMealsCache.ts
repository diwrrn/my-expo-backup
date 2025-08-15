// hooks/useDailyMealsCache.ts
import { useState, useEffect, useRef } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { getTodayDateString } from '@/utils/dateUtils';
import { useAppStore } from '@/store/appStore';

interface DailyMealsCache {
  dailyMeals: any;
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

export function useDailyMealsCache(selectedDate?: string) {
  const { user } = useAppStore();
  const [cache, setCache] = useState<DailyMealsCache>({
    dailyMeals: null,
    loading: false,
    error: null,
    lastUpdated: 0,
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // ADD THIS LINE
  const currentDateRef = useRef<string>('');

  // Get today's date in YYYY-MM-DD format
  const defaultDate = getTodayDateString();

  // Setup real-time listener for daily meals
  const setupListener = (date: string = selectedDate || defaultDate) => {
    if (!user) return;

    // Clean up existing listener/interval
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (intervalRef.current) { // ADD THIS BLOCK
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }

    setCache(prev => ({ ...prev, loading: true, error: null }));
    currentDateRef.current = date;

    const today = getTodayDateString(); // ADD THIS LINE

    if (date === today) { // ADD THIS CONDITIONAL BLOCK
      // Real-time for TODAY only
      try {
        const unsubscribe = FirebaseService.subscribeToDailyMeals(
          user.id,
          date,
          (meals) => {
            setCache({
              dailyMeals: meals,
              loading: false,
              error: null,
              lastUpdated: Date.now(),
            });
          },
          (error) => {
            console.error('❌ Real-time listener error:', error);
            setCache(prev => ({
              ...prev,
              loading: false,
              error: error.message,
            }));
          }
        );
        unsubscribeRef.current = unsubscribe;
      } catch (error) {
        console.error('❌ Failed to setup real-time listener:', error);
        setCache(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to setup real-time updates',
        }));
      }
    } else { // ADD THIS ELSE BLOCK
      // Polling for historical dates
      const loadHistoricalData = async () => {
        try {
          const meals = await FirebaseService.getDailyMeals(user.id, date); // This is a one-time get
          setCache({
            dailyMeals: meals,
            loading: false,
            error: null,
            lastUpdated: Date.now(),
          });
        } catch (error) {
          console.error('❌ Failed to load historical data:', error);
          setCache(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load historical data',
          }));
        }
      };

      // Initial load
      loadHistoricalData();

      // Set up polling interval
      const interval = setInterval(loadHistoricalData, 300000); // Poll every 5 minutes seconds
      intervalRef.current = interval; // Store interval ID for cleanup
    }
  };

  // Load daily meals when user changes or selectedDate changes
  useEffect(() => {
    if (user) {
      setupListener(selectedDate);
    } else {
      // Clean up when user logs out
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (intervalRef.current) { // ADD THIS LINE
        clearInterval(intervalRef.current); // ADD THIS LINE
        intervalRef.current = null; // ADD THIS LINE
      }
      setCache({
        dailyMeals: null,
        loading: false,
        error: null,
        lastUpdated: 0,
      });
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (intervalRef.current) { // ADD THIS LINE
        clearInterval(intervalRef.current); // ADD THIS LINE
        intervalRef.current = null; // ADD THIS LINE
      }
    };
  }, [user, selectedDate]);

  // Calculate daily totals
  const dailyTotals = cache.dailyMeals ? 
    Object.values(cache.dailyMeals.meals || {}).reduce(
      (totals: any, mealData: any) => {
        Object.values(mealData || {}).forEach((foodData: any) => {
          const nutrition = foodData['0'] || {};
          totals.calories += nutrition.calories || 0;
          totals.protein += nutrition.protein || 0;
          totals.carbs += nutrition.carbs || 0;
          totals.fat += nutrition.fat || 0;
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    ) : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Calculate meal totals
  const mealTotals = cache.dailyMeals ? 
    Object.entries(cache.dailyMeals.meals || {}).reduce((totals: any, [mealName, mealData]: [string, any]) => {
      const mealTotal = { calories: 0, protein: 0, carbs: 0, fat: 0, items: 0 };
      
      Object.values(mealData || {}).forEach((foodData: any) => {
        const nutrition = foodData['0'] || {};
        mealTotal.calories += nutrition.calories || 0;
        mealTotal.protein += nutrition.protein || 0;
        mealTotal.carbs += nutrition.carbs || 0;
        mealTotal.fat += nutrition.fat || 0;
        mealTotal.items += 1;
      });
      
      totals[mealName] = mealTotal;
      return totals;
    }, {}) : {};

  // Helper function to get foods from a meal
  const getFoodsFromMeal = (mealName: string) => {
    if (!cache.dailyMeals?.meals?.[mealName]) return [];
    
    const mealData = cache.dailyMeals.meals[mealName];
    return Object.entries(mealData).map(([foodKey, foodData]: [string, any]) => ({
      foodKey,
      ...foodData['0'],
    }));
  };

  return {
    dailyMeals: cache.dailyMeals,
    loading: cache.loading,
    error: cache.error,
    lastUpdated: cache.lastUpdated,
    dailyTotals,
    mealTotals,
    getFoodsFromMeal,
  };
}