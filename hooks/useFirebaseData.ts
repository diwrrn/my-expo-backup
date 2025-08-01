import { useState, useEffect } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { DiaryEntry, Food, UserProfile } from '@/types/api';
import { useAuth } from './useAuth';
import { getTodayDateString } from '@/utils/dateUtils';
import { useFoodCache } from './useFoodCache';
import { StreakService } from '@/services/streakService';
import { useDailyMealsCache } from './useDailyMealsCache';
import { GeneratedMealPlan } from '@/services/mealPlanningService';

export function useFirebaseData(selectedDate?: string) {
  const { user } = useAuth();
  const foodCache = useFoodCache();
  
  // Use daily meals cache
  const dailyMealsCache = useDailyMealsCache(selectedDate);
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Workout categories state
  const [workoutCategories, setWorkoutCategories] = useState<any[]>([]);
  const [workoutCategoriesLoading, setWorkoutCategoriesLoading] = useState(false);
  const [workoutCategoriesError, setWorkoutCategoriesError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => selectedDate || getTodayDateString();

  // Load diary entries for a specific date
  const loadDiaryEntries = async (date: string = selectedDate || getTodayDateString()) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const entries = await FirebaseService.getDiaryEntries(user.id, date);
      setEntries(entries);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load entries';
      setError(errorMessage);
      console.error('Load diary entries error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load daily meals for a specific date
  const loadDailyMeals = async (date: string = selectedDate || getTodayDateString()) => {
    if (!user) return;
    try {
      setError(null);
      await FirebaseService.getDailyMeals(user.id, date);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daily meals';
      setError(errorMessage);
      console.error('Load daily meals error:', err);
    }
  };

  // Add food to daily meals
  const addFoodToDailyMeal = async (
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    foodData: {
      foodId: string;
      foodName: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      quantity: number;
      unit: string;
      [key: string]: any;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Ensure kurdishName and arabicName are always strings
      const processedFoodData = {
        ...foodData,
        kurdishName: foodData.kurdishName || '',
        arabicName: foodData.arabicName || '',
      };
      
      
      
      await FirebaseService.addDailyMeal(user.id, selectedDate || getTodayDateString(), meal, processedFoodData);
      
      // Only update streak if adding food to today's meals
      if (!selectedDate || selectedDate === getTodayDateString()) {
        try {
          await StreakService.updateStreak(user.id, getTodayDateString());
        } catch (streakError) {
          console.error('❌ useFirebaseData: Error updating streak:', streakError);
        }
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add food to meal';
      setError(errorMessage);
      throw err;
    }
  };

  // Remove food from daily meals
  const removeFoodFromDailyMeal = async (
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    foodKey: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.removeFoodFromDailyMeal(user.id, selectedDate || getTodayDateString(), meal, foodKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove food from meal';
      setError(errorMessage);
      throw err;
    }
  };

  // Update water intake
  const updateWaterIntake = async (waterIntake: number) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.updateWaterIntake(user.id, selectedDate || getTodayDateString(), waterIntake);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update water intake';
      setError(errorMessage);
      throw err;
    }
  };

  // Add a new diary entry
  const addDiaryEntry = async (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const entryWithUser = {
        ...entry,
        userId: user.id,
        date: entry.date || getTodayDate(),
      };

      const entryId = await FirebaseService.addDiaryEntry(entryWithUser);
      
      // Add to local state
      const newEntry: DiaryEntry = {
        id: entryId,
        ...entryWithUser,
        createdAt: new Date().toISOString(),
      };
      
      setEntries(prev => [newEntry, ...prev]);
      return entryId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add entry';
      setError(errorMessage);
      throw err;
    }
  };

  // Update a diary entry
  const updateDiaryEntry = async (entryId: string, updates: Partial<DiaryEntry>) => {
    try {
      setError(null);
      await FirebaseService.updateDiaryEntry(entryId, updates);
      
      // Update local state
      setEntries(prev => 
        prev.map(entry => 
          entry.id === entryId ? { ...entry, ...updates } : entry
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entry';
      setError(errorMessage);
      throw err;
    }
  };

  // Delete a diary entry
  const deleteDiaryEntry = async (entryId: string) => {
    try {
      setError(null);
      await FirebaseService.deleteDiaryEntry(entryId);
      
      // Remove from local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry';
      setError(errorMessage);
      throw err;
    }
  };

  // Search foods
  const searchFoods = async (query: string, useCache = true, includeSnacks = false): Promise<Food[]> => {
    try {
      setError(null);
      
      if (useCache && foodCache.foods.length > 0) {
        // Use cached search for better performance
        return foodCache.searchFoodsInCache(query, 20, includeSnacks);
      } else {
        // Fallback to Firebase search
        return await FirebaseService.searchFoods(query, 20);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search foods';
      setError(errorMessage);
      return [];
    }
  };

  // Get popular foods
  const getPopularFoods = async (useCache = true, includeSnacks = false): Promise<Food[]> => {
    try {
      setError(null);
      
      if (useCache && foodCache.foods.length > 0) {
        // Use cached popular foods
        return foodCache.getPopularFoodsFromCache(10, includeSnacks);
      } else {
        // Fallback to Firebase
        return await FirebaseService.getPopularFoods();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get popular foods';
      setError(errorMessage);
      return [];
    }
  };

  // Get foods by category
  const getFoodsByCategory = async (category: string, useCache = true): Promise<Food[]> => {
    try {
      setError(null);
      
      if (useCache && foodCache.foods.length > 0) {
        // Use cached category foods
        return foodCache.getFoodsByCategoryFromCache(category);
      } else {
        // Fallback to Firebase
        return await FirebaseService.getFoodsByCategory(category);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get foods by category';
      setError(errorMessage);
      return [];
    }
  };

  // Get all food categories
  const getFoodCategories = async (useCache = true): Promise<string[]> => {
    try {
      setError(null);
      
      if (useCache && foodCache.categories.length > 0) {
        // Use cached categories
        return foodCache.categories;
      } else {
        // Fallback to Firebase
        return await FirebaseService.getFoodCategories();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get food categories';
      setError(errorMessage);
      return [];
    }
  };

 // Get recently logged foods from cache
  // Get recently logged foods from cache
  const getRecentlyLoggedFoodsFromCache = async (numberOfDays = 7): Promise<Food[]> => {
    try {
      if (!user) {
        console.log('DEBUG: getRecentlyLoggedFoodsFromCache: User is null, returning empty array.');
        return [];
      }

      console.log('DEBUG: getRecentlyLoggedFoodsFromCache: User ID:', user.id);
      console.log('DEBUG: getRecentlyLoggedFoodsFromCache: foodCache.foods.length:', foodCache.foods.length);
      // console.log('DEBUG: getRecentlyLoggedFoodsFromCache: foodCache.foods:', foodCache.foods); // Too verbose, only if needed

      // Get the last N days of dates
      const recentDates: string[] = [];
      const today = new Date();
      
      for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        recentDates.push(date.toISOString().split('T')[0]);
      }
      console.log('DEBUG: getRecentlyLoggedFoodsFromCache: Recent dates to check:', recentDates);

      // Aggregate all individual food entries from recent days
      const allFoodEntriesFromRecentDays: any[] = [];
      for (const dateString of recentDates) {
        console.log('DEBUG: getRecentlyLoggedFoodsFromCache: Fetching daily meals for date:', dateString);
        const dailyMeals = await FirebaseService.getDailyMeals(user.id, dateString);
        console.log('DEBUG: getRecentlyLoggedFoodsFromCache: Fetched dailyMeals for', dateString, ':', dailyMeals);
        if (dailyMeals && dailyMeals.meals) {
          // Iterate through each meal type (breakfast, lunch, etc.)
          for (const mealTypeKey in dailyMeals.meals) {
            const mealData = dailyMeals.meals[mealTypeKey];
            // Iterate through each food entry within that meal type
            for (const foodKey in mealData) {
              const foodEntry = mealData[foodKey]['0']; // Get the actual food nutrition data
              if (foodEntry) {
                allFoodEntriesFromRecentDays.push(foodEntry);
              }
            }
          }
        } else {
          console.log('DEBUG: getRecentlyLoggedFoodsFromCache: No meals found for', dateString, 'or dailyMeals.meals is null/undefined.');
        }
      }

      // Extract unique food IDs and their frequencies from the aggregated list
      const uniqueFoodIds = new Set<string>();
      const foodFrequency = new Map<string, number>();

      allFoodEntriesFromRecentDays.forEach((foodEntry: any) => {
        const foodId = foodEntry.id; // Corrected: Access 'id' property directly

        if (foodId) {
          uniqueFoodIds.add(foodId);
          foodFrequency.set(foodId, (foodFrequency.get(foodId) || 0) + 1);
        }
      });

      // Get Food objects from cache for these IDs
      const recentlyLoggedFoods: Food[] = [];
      
      uniqueFoodIds.forEach(foodId => {
        const food = foodCache.foods.find(f => f.id === foodId);

        if (food) {
          recentlyLoggedFoods.push(food);
        }
      });

      // Sort by frequency (most logged first)
      recentlyLoggedFoods.sort((a, b) => {
        const freqA = foodFrequency.get(a.id) || 0;
        const freqB = foodFrequency.get(b.id) || 0;
        return freqB - freqA;
      });
      console.log('DEBUG: getRecentlyLoggedFoodsFromCache: Final recentlyLoggedFoods (before slice):', recentlyLoggedFoods.map(f => f.name));

      return recentlyLoggedFoods.slice(0, 10); // Return top 10 most frequent
    } catch (err) {
      console.error('ERROR: getRecentlyLoggedFoodsFromCache:', err);
      return [];
    }
  };


 // User profile methods
  const getUserProfile = async (): Promise<UserProfile | null> => {
    if (!user) return null;
    
    try {
      setError(null);
      return await FirebaseService.getUserProfileDocument(user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user profile';
      setError(errorMessage);
      return null;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      await FirebaseService.updateUserProfileDocument(user.id, updates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user profile';
      setError(errorMessage);
      throw err;
    }
  };

  // Meal plan methods
  const getMealPlanCountForDate = async (date: string): Promise<number> => {
    if (!user) throw new Error('User not authenticated');
    
    // Use a simpler query to avoid index requirements
    try {
      setError(null);
      const plans = await FirebaseService.getSavedMealPlans(user.id);
      // Filter plans by date client-side instead of using a compound query
      const plansForDate = plans.filter(plan => plan.generatedAt.startsWith(date));
      return plansForDate.length;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get meal plan count';
      setError(errorMessage);
      throw err;
    }
  };

  const saveMealPlan = async (mealPlanData: GeneratedMealPlan, name: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    // Get today's date in YYYY-MM-DD format
    const today = getTodayDateString();
    
    // Get count of meal plans already saved today
    let mealNumber = 1;
    try {
      setError(null);
      
      const mealCount = await FirebaseService.getMealPlanCountForDate(user.id, today);
      mealNumber = mealCount + 1;
      
      
      // Clean the meal plan data to remove any undefined values
      const cleanedMealPlanData = JSON.parse(JSON.stringify(mealPlanData, (key, value) => {
        return value === undefined ? null : value;
      }));
      
      await FirebaseService.saveMealPlan(user.id, cleanedMealPlanData, name, mealNumber);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save meal plan';
      console.error(`[useFirebaseData] Error in saveMealPlan:`, err);
      setError(errorMessage);
      throw err;
    }
  };

  // Load entries when user changes
  useEffect(() => {
    if (user) {
      loadDiaryEntries(selectedDate);
      // The dailyMealsCache automatically sets up its real-time listener
    } else {
      setEntries([]);
    }
  }, [user, selectedDate]);

  // Load workout categories on mount
  useEffect(() => {
    const loadWorkoutCategories = async () => {
      try {
        setWorkoutCategoriesLoading(true);
        setWorkoutCategoriesError(null);
        const categories = await FirebaseService.getWorkoutCategories();
        setWorkoutCategories(categories);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load workout categories';
        setWorkoutCategoriesError(errorMessage);
        console.error('Error loading workout categories:', err);
      } finally {
        setWorkoutCategoriesLoading(false);
      }
    };

    loadWorkoutCategories();
  }, []);

  // Calculate daily totals
  const dailyTotals = dailyMealsCache.dailyMeals ? 
    Object.values(dailyMealsCache.dailyMeals.meals || {}).reduce(
      (totals: any, mealData: any) => {
        
        // Iterate through each food in the meal (food1, food2, etc.)
        Object.values(mealData || {}).forEach((foodData: any) => {
          // Each food has a '0' key with the nutrition data
          const nutrition = foodData['0'] || {};
          
          
          // The nutrition values are already calculated per serving in the database
          // So we just add them directly without multiplying by quantity again
          totals.calories += nutrition.calories || 0;
          totals.protein += nutrition.protein || 0;
          totals.carbs += nutrition.carbs || 0;
          totals.fat += nutrition.fat || 0;
          // Add micronutrients
          totals.fiber += nutrition.fiber || 0;
          totals.sugar += nutrition.sugar || 0;
          totals.sodium += nutrition.sodium || 0;
          totals.calcium += nutrition.calcium || 0;
          totals.vitaminD += nutrition.vitaminD || 0;
          totals.potassium += nutrition.potassium || 0;
          totals.iron += nutrition.iron || 0;
          
        });
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, calcium: 0, vitaminD: 0, potassium: 0, iron: 0 }
    ) : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, calcium: 0, vitaminD: 0, potassium: 0, iron: 0 };
    

  // Calculate meal totals
  const mealTotals = dailyMealsCache.dailyMeals ? 
    Object.entries(dailyMealsCache.dailyMeals.meals || {}).reduce((totals: any, [mealName, mealData]: [string, any]) => {
      const mealTotal = { calories: 0, protein: 0, carbs: 0, fat: 0, items: 0 };
      
      // Iterate through each food in the meal (food1, food2, etc.)
      Object.values(mealData || {}).forEach((foodData: any) => {
        // Each food has a '0' key with the nutrition data
        const nutrition = foodData['0'] || {};
        
        // The nutrition values are already calculated per serving in the database
        // So we just add them directly without multiplying by quantity again
        mealTotal.calories += nutrition.calories || 0;
        mealTotal.protein += nutrition.protein || 0;
        mealTotal.carbs += nutrition.carbs || 0;
        mealTotal.fat += nutrition.fat || 0;
        mealTotal.items += 1;
      });
      
      totals[mealName] = mealTotal;
      return totals;
    }, {}) : {};

  // Helper function to get foods from a meal in a more usable format
  const getFoodsFromMeal = (mealName: string) => {
    if (!dailyMealsCache.dailyMeals?.meals?.[mealName]) return [];
    
    const mealData = dailyMealsCache.dailyMeals.meals[mealName];
    
    
    // Log the first food item in this meal to inspect its structure
    if (Object.keys(mealData).length > 0) {
      const firstFoodKey = Object.keys(mealData)[0];
      const firstFood = mealData[firstFoodKey];
  
    }
    
    return Object.entries(mealData).map(([foodKey, foodData]: [string, any]) => ({
      foodKey,
      ...foodData['0'], // Extract the nutrition data from the '0' key
      name: foodData['0'].name || foodData['0'].foodName, // Ensure name is available
      kurdishName: foodData['0'].kurdishName, // Ensure kurdishName is extracted
      arabicName: foodData['0'].arabicName, // Ensure arabicName is extracted
    }));
  };

  return {
    entries,
    dailyMeals: dailyMealsCache.dailyMeals,
    loading,
    error: error || dailyMealsCache.error,
    dailyTotals,
    mealTotals,
    getFoodsFromMeal, // New helper function
    loadDiaryEntries,
    loadDailyMeals,
    addDiaryEntry,
    addFoodToDailyMeal,
    removeFoodFromDailyMeal,
    updateWaterIntake,
    updateDiaryEntry,
    deleteDiaryEntry,
    searchFoods,
    getPopularFoods,
    getFoodsByCategory,
    getFoodCategories,
    getUserProfile,
    updateUserProfile,
    
    // Meal plan methods
    getMealPlanCountForDate,
    saveMealPlan,
    
    // Food cache utilities
    foodCache: {
      foods: foodCache.foods,
      categories: foodCache.categories,
      lastUpdated: foodCache.lastUpdated,
      isLoading: foodCache.isLoading,
      error: foodCache.error,
      refreshCache: foodCache.refreshCache,
      isCacheExpired: foodCache.isCacheExpired,
      getFoodsByBaseName: foodCache.getFoodsByBaseName,
      getAvailableUnits: foodCache.getAvailableUnits,
      convertNutrition: foodCache.convertNutrition,
    },
    
    // Daily meals cache utilities
    dailyMealsCache: {
      dailyMeals: dailyMealsCache.dailyMeals,
      isLoading: dailyMealsCache.isLoading,
      error: dailyMealsCache.error,
      refreshCache: dailyMealsCache.refreshCache,
      isCacheExpired: dailyMealsCache.isCacheExpired,
    },
    
    // Workout categories
    workoutCategories,
    workoutCategoriesLoading,
    workoutCategoriesError,
    
    // Recently logged foods
    getRecentlyLoggedFoodsFromCache,
  };
}