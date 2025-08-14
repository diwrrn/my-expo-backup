import { useState, useEffect, useCallback, useMemo } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { DiaryEntry, Food, UserProfile } from '@/types/api';
import { useAuth } from './useAuth';
import { getTodayDateString } from '@/utils/dateUtils';
import { useAppStore } from '@/store/appStore';
import { StreakService } from '@/services/streakService';
import { useDailyMealsCache } from './useDailyMealsCache';
import { GeneratedMealPlan } from '@/services/mealPlanningService';

export function useFirebaseData(selectedDate?: string) {
  const { user } = useAuth();
  const { 
    foods, 
    categories, 
    foodsLoading, 
    foodsError,
    searchFoodsInCache,
    getFoodsByCategoryFromCache,
    getPopularFoodsFromCache,
    refreshFoodCache,
    clearFoodCache
  } = useAppStore();
  const foodCache = {
    foods,
    categories,
    isLoading: foodsLoading,
    error: foodsError,
    searchFoodsInCache,
    getFoodsByCategoryFromCache,
    getPopularFoodsFromCache,
    refreshCache: refreshFoodCache,
    clearAsyncStorageCache: clearFoodCache,
  };
  // Stable date parameter using useMemo
  const date = useMemo(() => selectedDate || getTodayDateString(), [selectedDate]);
  
  const dailyMealsCache = useDailyMealsCache(date);
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workoutCategories, setWorkoutCategories] = useState<any[]>([]);
  const [workoutCategoriesLoading, setWorkoutCategoriesLoading] = useState(false);
  const [workoutCategoriesError, setWorkoutCategoriesError] = useState<string | null>(null);

  // Load diary entries - using useCallback with user?.id

  // Load daily meals - using useCallback with user?.id
  const loadDailyMeals = useCallback(async (targetDate: string = date) => {
    if (!user?.id) return;
    try {
      setError(null);
      // useDailyMealsCache handles the loading automatically
      // No need to call setupListener manually
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daily meals';
      setError(errorMessage);
    }
  }, [user?.id, date]);  // Main useEffect to load data when user or date changes
  useEffect(() => {
    if (user?.id) {
      loadDailyMeals(date);
    }
  }, [user?.id, date]);

  // Add food to daily meal - using useCallback with user?.id
  const addFoodToDailyMeal = useCallback(async (
    mealType: string,
    food: Food,
    quantity: number,
    unit: string,
    targetDate: string = date
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.addDailyMeal(user.id, targetDate, mealType, {
        foodId: food.id,
        foodName: food.name,
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        quantity: quantity,
        unit: unit,
        kurdishName: food.kurdishName,
        arabicName: food.arabicName
      });      // Update streak after adding food
      try {
        await StreakService.updateStreak(user.id, targetDate);
        } catch (streakError) {
        // Don't throw - streak update is not critical
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add food';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, date]);

  // Remove food from daily meal - using useCallback with user?.id
  const removeFoodFromDailyMeal = useCallback(async (
    mealType: string,
    foodKey: string,
    targetDate: string = date
  ) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.removeFoodFromDailyMeal(user.id, targetDate, mealType, foodKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove food';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, date]);

  // Update water intake - using useCallback with user?.id
  const updateWaterIntake = useCallback(async (glasses: number, targetDate: string = date) => {
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.updateWaterIntake(user.id, targetDate, glasses);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update water intake';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, date]);

  // Add diary entry - using useCallback with user?.id
  // Add diary entry - using useCallback with user?.id
  const addDiaryEntry = useCallback(async (content: string, mood?: string, targetDate: string = date) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);
      const entryId = await FirebaseService.addDiaryEntry({
        userId: user.id,
        date: targetDate,
        content: content,
        mood: mood
      });

      // Create the entry object for state update
      const entry = {
        id: entryId,
        userId: user.id,
        date: targetDate,
        content: content,
        mood: mood,
        createdAt: new Date()
      };
      
      setEntries(prev => [entry, ...prev]);
      return entry;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add entry';
      setError(errorMessage);
      throw err;
    }
  }, [user?.id, date]);



  // Food search methods - using foodCache for efficient caching
  const searchFoods = useCallback(async (query: string, useCache = true, includeSnacks = false): Promise<Food[]> => {
    try {
      if (useCache) {
        return foodCache.searchFoodsInCache(query, 20, includeSnacks);
      } else {
        return await FirebaseService.searchFoods(query, includeSnacks ? 1 : 0);
      }
    } catch (err) {
      return [];
    }
  }, [foodCache]);

  const getPopularFoods = useCallback(async (useCache = true): Promise<Food[]> => {
    try {
      if (useCache) {
        const result = foodCache.getPopularFoodsFromCache(10);
        return result;
      } else {
        const result = await FirebaseService.getPopularFoods();
        return result;
      }
    } catch (err) {
      return [];
    }
  }, [foodCache]);

  const getFoodsByCategory = useCallback(async (category: string, useCache = true): Promise<Food[]> => {
    try {
      if (useCache) {
        return foodCache.getFoodsByCategoryFromCache(category, 20);
      } else {
        return await FirebaseService.getFoodsByCategory(category);
      }
    } catch (err) {
      return [];
    }
  }, [foodCache]);

  const getFoodCategories = useCallback(async (useCache = true): Promise<string[]> => {
    try {
      if (useCache) {
        return foodCache.categories;
      } else {
        return await FirebaseService.getFoodCategories();
      }
    } catch (err) {
      return [];
    }
  }, [foodCache]);

  // Profile methods - using useCallback with user?.id
  const getUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.id) return null;
    try {
      return await FirebaseService.getUserProfileDocument(user.id);
    } catch (err) {
      return null;
    }
  }, [user?.id]);
    
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');
    try {
      await FirebaseService.updateUserProfileDocument(user.id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  // Meal plan methods - using useCallback with user?.id
  const getMealPlanCountForDate = useCallback(async (targetDate: string): Promise<number> => {
    if (!user?.id) return 0;
    try {
      return await FirebaseService.getMealPlanCountForDate(user.id, targetDate);
    } catch (err) {
      return 0;
    }
  }, [user?.id]);

  const saveMealPlan = useCallback(async (mealPlanData: GeneratedMealPlan, name: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');
    try {
      await FirebaseService.saveMealPlan(user.id, mealPlanData, name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save meal plan';
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  // Workout categories - using useCallback for stable reference
  const loadWorkoutCategories = useCallback(async () => {
      try {
        setWorkoutCategoriesLoading(true);
        setWorkoutCategoriesError(null);
        const categories = await FirebaseService.getWorkoutCategories();
        setWorkoutCategories(categories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load workout categories';
        setWorkoutCategoriesError(errorMessage);
      } finally {
        setWorkoutCategoriesLoading(false);
      }
  }, []);

    // Load workout categories when user changes
    useEffect(() => {
      if (user?.id) {
        loadWorkoutCategories();
      }
    }, [user?.id, loadWorkoutCategories]);
  
  // Get foods from meal - convert object to array format
  const getFoodsFromMeal = useCallback((mealName: string) => {
    const mealData = dailyMealsCache.dailyMeals?.meals?.[mealName];
    
    if (!mealData || typeof mealData !== 'object') {
      return [];
    }
    
    // Convert object format to array format - extract food data from nested structure
    const foodsArray = Object.entries(mealData).map(([key, value]) => {
      // Extract the actual food data from the "0" key
      const foodData = value?.["0"] || value;
      return {
        ...foodData,
        foodKey: key, // Add key for removal
      };
    });
    
    return foodsArray;
    }, [dailyMealsCache.dailyMeals]);

  // Calculate daily nutrition totals
  const dailyTotals = useMemo(() => {
    if (!dailyMealsCache.dailyMeals?.meals) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const meals = dailyMealsCache.dailyMeals.meals;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(meals).forEach(meal => {
      if (meal && typeof meal === 'object') {
        Object.values(meal).forEach(foodEntry => {
          // Extract food data from the "0" key (same fix as getFoodsFromMeal)
          const foodData = foodEntry?.["0"] || foodEntry;
          if (foodData && typeof foodData === 'object') {
            totalCalories += foodData.calories || 0;
            totalProtein += foodData.protein || 0;
            totalCarbs += foodData.carbs || 0;
            totalFat += foodData.fat || 0;
          }
        });
      }
    });
    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
    };
  }, [dailyMealsCache.dailyMeals]);

  return {
    // Data state
    loading,
    error,
    dailyMealsCache,
    dailyTotals,
    
    // Add these missing properties:
    dailyMeals: dailyMealsCache.dailyMeals,
    mealTotals: dailyMealsCache.mealTotals || {},
    
    // Food cache - expose the global cache
    foodCache,
    
    // Daily meals methods
    addFoodToDailyMeal,
    removeFoodFromDailyMeal,
    updateWaterIntake,
    getFoodsFromMeal,
    
    // Food search methods
    searchFoods,
    getPopularFoods,
    getFoodsByCategory,
    getFoodCategories,
    
    // Profile methods
    getUserProfile,
    updateUserProfile,
    
    // Meal plan methods
    getMealPlanCountForDate,
    saveMealPlan,
    
    // Workout methods
    workoutCategories,
    workoutCategoriesLoading,
    workoutCategoriesError,
    loadWorkoutCategories,
  };
}