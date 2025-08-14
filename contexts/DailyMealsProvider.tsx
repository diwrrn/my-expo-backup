import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from '@/hooks/useAuth';
import { getTodayDateString } from '@/utils/dateUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { streakManager } from '@/contexts/StreakGlobal';
import { useAppStore } from '@/store/appStore';
const DailyMealsContext = createContext<any>(undefined);

const DAILY_MEALS_CACHE_KEY = 'daily_meals_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for historical data

interface DailyMealsCache {
  meals: any;
  lastUpdated: number;
}

export function DailyMealsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [dailyMeals, setDailyMeals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const currentDateRef = useRef<string>('');

  const defaultDate = getTodayDateString();

  const isCacheExpired = useCallback((lastUpdated: number) => {
    return Date.now() - lastUpdated > CACHE_DURATION;
  }, []);

  const loadFromCache = useCallback(async (userId: string, date: string): Promise<any | null> => {
    try {
      const cacheKey = `${DAILY_MEALS_CACHE_KEY}${userId}_${date}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache: DailyMealsCache = JSON.parse(cached);
        if (!isCacheExpired(parsedCache.lastUpdated)) {
          return parsedCache.meals;
        }
      }
      return null;
    } catch (error) {
      console.log('❌ Error loading daily meals from cache:', error);
      return null;
    }
  }, [isCacheExpired]);

  const saveToCache = useCallback(async (userId: string, date: string, meals: any) => {
    try {
      const cacheKey = `${DAILY_MEALS_CACHE_KEY}${userId}_${date}`;
      const cacheData: DailyMealsCache = {
        meals,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.log('❌ Error saving daily meals to cache:', error);
    }
  }, []);

  const setupListener = useCallback((date: string = defaultDate) => {
    if (!user?.id) return;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setLoading(true);
    useAppStore.getState().setMealsLoading(true);
    setError(null);
    currentDateRef.current = date;
    const today = getTodayDateString();
    
    if (date === today) {
      // Real-time listener for TODAY
      try {
        const unsubscribe = FirebaseService.subscribeToDailyMeals(
          user.id, date, 
          (meals) => { 
            setDailyMeals(meals);
            setLoading(false);
            setError(null);
            useAppStore.getState().setDailyMeals(meals);
            useAppStore.getState().setMealsLoading(false);
            
          },
          (error) => { 
            setLoading(false); 
            setError(error.message); 
          }
        );
        unsubscribeRef.current = unsubscribe;
      } catch (error) { 
        setLoading(false); 
        setError('Failed to setup real-time updates'); 
      }
    } else {
      // Cache + Firebase for historical dates
      const loadHistoricalData = async () => {
        try {
          // Try cache first
          const cachedMeals = await loadFromCache(user.id, date);
          if (cachedMeals) {
            setDailyMeals(cachedMeals);
            setLoading(false);
            setError(null);
            return;
          }
          
          // Cache miss - fetch from Firebase
          const meals = await FirebaseService.getDailyMeals(user.id, date);
          setDailyMeals(meals);
          setLoading(false);
          setError(null);
          useAppStore.getState().setDailyMeals(meals);
          useAppStore.getState().setMealsLoading(false);

          
          // Save to cache
          await saveToCache(user.id, date, meals);
        } catch (error) { 
          setLoading(false); 
          setError('Failed to load historical data'); 
        }
      };
      loadHistoricalData();
    }
  }, [user?.id, loadFromCache, saveToCache]);

  // REPLACE the addFoodToDailyMeal function:
const addFoodToDailyMeal = useCallback(async (meal: string, foodData: any, targetDate?: string) => {
  if (!user?.id) return;

  const dateToUse = targetDate || currentDateRef.current || defaultDate;
  
  try {
    await FirebaseService.addDailyMeal(user.id, dateToUse, meal, foodData);
    
    // Update streak using our bulletproof system (only for today's date)
    if (dateToUse === getTodayDateString()) {
      try {
        await streakManager.updateStreak(dateToUse);
        console.log('✅ Streak updated for today:', dateToUse);
      } catch (streakError) {
        console.log('❌ Error updating streak:', streakError);
      }
    }
    
    // If it's not today, invalidate cache so next load gets fresh data
    if (dateToUse !== getTodayDateString()) {
      const cacheKey = `${DAILY_MEALS_CACHE_KEY}${user.id}_${dateToUse}`;
      await AsyncStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.log('❌ addDailyMeal error:', error);
  }
}, [user?.id]);

const removeFoodFromDailyMeal = useCallback(async (meal: string, foodKey: string, targetDate?: string) => {
  if (!user?.id) return;

  const dateToUse = targetDate || currentDateRef.current || defaultDate;
  
  try {
    await FirebaseService.removeFoodFromDailyMeal(user.id, dateToUse, meal, foodKey);
    
    // Check if this was the last food for today before updating streak
    if (dateToUse === getTodayDateString()) {
      try {
        // Get the updated meals data after removal
        const updatedMeals = await FirebaseService.getDailyMeals(user.id, dateToUse);
        
        // Check if there are any foods left for today
        const hasAnyFoods = ['breakfast', 'lunch', 'dinner', 'snacks'].some(mealType => {
          const mealData = updatedMeals.meals?.[mealType];
          if (!mealData || typeof mealData !== 'object') return false;
          
          // Count foods in this meal
          const foodCount = Object.keys(mealData).filter(key => key.startsWith('food')).length;
          return foodCount > 0;
        });
        
        // Update streak using our bulletproof system
        await streakManager.updateStreak(dateToUse);
        
        if (!hasAnyFoods) {
          console.log('🔥 No foods left for today, streak may reset');
        } else {
          console.log('✅ Still have foods for today, streak maintained');
        }
      } catch (streakError) {
        console.log('❌ Error checking streak after food removal:', streakError);
      }
    }
    
    // If it's not today, invalidate cache so next load gets fresh data
    if (dateToUse !== getTodayDateString()) {
      const cacheKey = `${DAILY_MEALS_CACHE_KEY}${user.id}_${dateToUse}`;
      await AsyncStorage.removeItem(cacheKey);
    }
  } catch (error) {
    console.log('❌ removeFoodFromDailyMeal error:', error);
  }
}, [user?.id]);

  const refreshMeals = useCallback(async () => {
    setupListener(currentDateRef.current || defaultDate);
  }, [setupListener]);

  const changeDate = useCallback(async (newDate: string) => {
    setupListener(newDate);
  }, [setupListener]);

  const getFoodsFromMeal = useCallback((mealName: string) => {
    if (!dailyMeals) return [];
    
    try {
      // dailyMeals is the full document, so we need dailyMeals.meals[mealName]
      const mealData = dailyMeals.meals?.[mealName];
      if (!mealData || typeof mealData !== 'object') return [];
      
      const foods: any[] = [];
      Object.keys(mealData).forEach(foodKey => {
        if (foodKey.startsWith('food')) {
          const foodItem = mealData[foodKey];
          if (foodItem && foodItem["0"]) {
            // Add the foodKey to the food object so it can be used for deletion
            foods.push({
              ...foodItem["0"],
              foodKey: foodKey // Add this line
            });
          }
        }
      });
      
      return foods;
    } catch (error) {
      console.log('❌ Error getting foods from meal:', error);
      return [];
    }
  }, [dailyMeals]);
  const dailyTotals = useMemo(() => {
    if (!dailyMeals) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealName => {
      const foods = getFoodsFromMeal(mealName);
      foods.forEach((food: any) => {
        if (food && typeof food === 'object') {
          totalCalories += parseFloat(food.calories || 0);
          totalProtein += parseFloat(food.protein || 0);
          totalCarbs += parseFloat(food.carbs || 0);
          totalFat += parseFloat(food.fat || 0);
        }
      });
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    };
  }, [dailyMeals, getFoodsFromMeal]);
// Sync to Zustand
      useEffect(() => {
        useAppStore.getState().setDailyTotals(dailyTotals);
      }, [dailyTotals]);
  const mealTotals = useMemo(() => {
    const totals: { [key: string]: { calories: number; protein: number; carbs: number; fat: number; } } = {};
    
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealName => {
      const foods = getFoodsFromMeal(mealName);
      let calories = 0;
      let protein = 0;
      let carbs = 0;
      let fat = 0;

      foods.forEach((food: any) => {
        if (food && typeof food === 'object') {
          calories += parseFloat(food.calories || 0);
          protein += parseFloat(food.protein || 0);
          carbs += parseFloat(food.carbs || 0);
          fat += parseFloat(food.fat || 0);
        }
      });

      totals[mealName] = {
        calories: Math.round(calories),
        protein: Math.round(protein * 10) / 10,
        carbs: Math.round(carbs * 10) / 10,
        fat: Math.round(fat * 10) / 10,
      };
    });

    return totals;
  }, [getFoodsFromMeal]);

  // Sync to Zustand
useEffect(() => {
  useAppStore.getState().setMealTotals(mealTotals);
}, [mealTotals]);


  useEffect(() => {
    if (user?.id) {
      setupListener();
    } else {
      setDailyMeals(null);
      setLoading(false);
      setError(null);
    }
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user?.id, setupListener]);

  const contextValue = useMemo(() => ({
    dailyMeals,
    loading,
    error,
    addFoodToDailyMeal,
    removeFoodFromDailyMeal,
    refreshMeals,
    getFoodsFromMeal,
    dailyTotals,
    mealTotals,
    changeDate,
  }), [dailyMeals, loading, error, addFoodToDailyMeal, removeFoodFromDailyMeal, refreshMeals, getFoodsFromMeal, dailyTotals, mealTotals, changeDate]);

  return (
    <DailyMealsContext.Provider value={contextValue}>
      {children}
    </DailyMealsContext.Provider>
  );
}

export function useDailyMealsContext() {
  const context = useContext(DailyMealsContext);
  if (!context) {
    throw new Error('useDailyMealsContext must be used within a DailyMealsProvider');
  }
  return context;
}