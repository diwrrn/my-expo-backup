import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { User, UserProfile } from '@/types/api'
import { Food } from '@/types/api'
import { FirebaseService } from '@/services/firebaseService'
import { StreakService } from '@/services/streakService'
import { revenueCatService } from '@/services/revenueCatService'
import i18n from '@/services/i18n'
import { I18nManager, Platform } from 'react-native'
import { getTodayDateString } from '@/utils/dateUtils';
import { useStreakManager } from '@/contexts/StreakGlobal';

// ===== AUTH STATE =====
interface AuthState {
  user: User | null
  userLoading: boolean
  authError: string | null
}

// ===== PROFILE STATE =====
interface ProfileState {
  profile: UserProfile | null
  profileLoading: boolean
  profileError: string | null
  profileLastUpdated: number
}

// ===== PREMIUM STATE =====
interface PremiumState {
  hasPremium: boolean
  premiumLoading: boolean
  customerInfo: any
  subscriptionLoading: boolean
  localPremiumOverride: boolean | null
}

// ===== DAILY MEALS STATE =====
interface DailyMealsState {
  dailyMeals: any
  dailyTotals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
  mealTotals: Record<string, any>
  mealsLoading: boolean
  selectedDate: string
  mealsError: string | null
}

// ===== FOOD CACHE STATE =====
interface FoodCacheState {
  foods: Food[]
  categories: string[]
  foodsLoading: boolean
  foodsError: string | null
  foodsLastUpdated: number
}

// ===== STREAK STATE =====
interface StreakState {
  currentStreak: number
  bestStreak: number
  streakLoading: boolean
  streakError: string | null
  streakMonthlyData: Record<string, string[]>
  streakLastUpdated: number
  streakUserId: string | null
}

// ===== WATER STATE =====
interface WaterState {
  waterIntake: number
  waterLoading: boolean
  waterError: string | null
}

// ===== LANGUAGE STATE =====
interface LanguageState {
  currentLanguage: string
  isRTL: boolean
}

// ===== CALCULATOR STATE =====
interface CalculatorState {
  // Add calculator-specific state here
}

// ===== MAIN STORE INTERFACE =====
interface AppStore extends 
  AuthState,
  ProfileState,
  PremiumState,
  DailyMealsState,
  FoodCacheState,
  StreakState,
  WaterState,
  LanguageState,
  CalculatorState {
  
  // ===== AUTH ACTIONS =====
  setUser: (user: User | null) => void
  setUserLoading: (loading: boolean) => void
  setAuthError: (error: string | null) => void
  
  // Auth methods
  signUp: (email: string, password: string, name: string) => Promise<User>
  signUpWithPhone: (phoneNumber: string, password: string, name: string) => Promise<User>
  signUpWithPhoneVerification: (phoneNumber: string, name: string, password: string) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signInWithPhone: (phoneNumber: string, password: string) => Promise<User>
  signInWithPhoneVerification: (phoneNumber: string, password: string) => Promise<User>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User & { profile?: Partial<UserProfile> }>) => Promise<void>
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  // ===== PROFILE ACTIONS =====
  setProfile: (profile: UserProfile | null) => void
  setProfileLoading: (loading: boolean) => void
  setProfileError: (error: string | null) => void
  setProfileLastUpdated: (timestamp: number) => void
  
  // Profile methods
  loadProfile: (forceRefresh?: boolean) => Promise<UserProfile | null>
  updateProfileData: (updates: Partial<UserProfile>) => Promise<UserProfile | null>
  refreshProfile: () => Promise<void>
  
  // ===== PREMIUM ACTIONS =====
  setPremium: (hasPremium: boolean) => void
  setPremiumLoading: (loading: boolean) => void
  setCustomerInfo: (info: any) => void
  setSubscriptionLoading: (loading: boolean) => void
  setLocalPremiumOverride: (override: boolean | null) => void
  initializePremiumStatus: () => Promise<void>
  // Premium methods
  refreshPremium: () => Promise<void>
  setImmediatePremium: (status: boolean) => void
  
  // ===== DAILY MEALS ACTIONS =====
  setDailyMeals: (meals: any) => void
  setDailyTotals: (totals: any) => void
  setMealTotals: (totals: any) => void
  setMealsLoading: (loading: boolean) => void
  setSelectedDate: (date: string) => void
  setMealsError: (error: string | null) => void
  
  // Daily meals methods
  loadDailyMeals: (date?: string) => Promise<void>
  addFoodToMeal: (mealType: string, food: any) => Promise<void>
  removeFoodFromMeal: (mealType: string, foodId: string) => Promise<void>
  getFoodsFromMeal: (mealName: string) => any[]
  refreshMeals: () => Promise<void>
  changeDate: (newDate: string) => Promise<void>
  // ===== FOOD CACHE ACTIONS =====
  setFoods: (foods: Food[]) => void
  setFoodsLoading: (loading: boolean) => void
  setFoodsError: (error: string | null) => void
  setFoodsLastUpdated: (timestamp: number) => void
  
  // Food cache methods
  searchFoodsInCache: (query: string, limit?: number, includeSnacks?: boolean) => Food[]
  getFoodsByCategoryFromCache: (category: string, limit?: number) => Food[]
  getPopularFoodsFromCache: (limit?: number) => Food[]
  refreshFoodCache: () => Promise<void>
  clearFoodCache: () => Promise<void>
  
  // ===== STREAK ACTIONS =====
  setCurrentStreak: (streak: number) => void
  setBestStreak: (streak: number) => void
  setStreakLoading: (loading: boolean) => void
  setStreakError: (error: string | null) => void
  setStreakMonthlyData: (data: Record<string, string[]>) => void
  setStreakLastUpdated: (timestamp: number) => void
  setStreakUserId: (userId: string | null) => void
  
  // Streak methods
  initializeStreak: (userId: string) => Promise<void>
  cleanupStreak: () => void
  updateStreak: (date: string) => Promise<void>
  
  // ===== WATER ACTIONS =====
  setWaterIntake: (intake: number) => void
  setWaterLoading: (loading: boolean) => void
  setWaterError: (error: string | null) => void
  
  // Water methods
  updateWaterIntake: (glasses: number) => Promise<void>
  loadWaterIntake: () => Promise<void>
  
  // ===== LANGUAGE ACTIONS =====
  setLanguage: (language: string) => void
  setRTL: (isRTL: boolean) => void
  
  // Language methods
  changeLanguage: (lng: string) => Promise<void>
  
  // ===== UTILITY ACTIONS =====
  resetStore: () => void

  
}
// Add this helper function BEFORE the store creation (around line 180)
const calculateMealTotals = (dailyMeals: any) => {
  if (!dailyMeals?.meals) return {};
  
  const totals: { [key: string]: { calories: number; protein: number; carbs: number; fat: number; } } = {};
  
  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealName => {
    const mealData = dailyMeals.meals[mealName];
    if (!mealData || typeof mealData !== 'object') {
      totals[mealName] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      return;
    }
    
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    Object.keys(mealData).forEach(foodKey => {
      if (foodKey.startsWith('food')) {
        const foodItem = mealData[foodKey];
        if (foodItem && foodItem["0"]) {
          const food = foodItem["0"];
          calories += parseFloat(food.calories || 0);
          protein += parseFloat(food.protein || 0);
          carbs += parseFloat(food.carbs || 0);
          fat += parseFloat(food.fat || 0);
        }
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
};
const calculateDailyTotals = (mealTotals: any) => {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealName => {
    const mealTotal = mealTotals[mealName];
    if (mealTotal) {
      totalCalories += mealTotal.calories || 0;
      totalProtein += mealTotal.protein || 0;
      totalCarbs += mealTotal.carbs || 0;
      totalFat += mealTotal.fat || 0;
    }
  });

  return {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbs: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
  };
};
// ===== STORE IMPLEMENTATION =====
export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ===== INITIAL STATE =====
      
      // Auth
      user: null,
      userLoading: false,
      authError: null,
      
      // Profile
      profile: null,
      profileLoading: false,
      profileError: null,
      profileLastUpdated: 0,
      
      // Premium
      hasPremium: false,
      premiumLoading: false,
      customerInfo: null,
      subscriptionLoading: false,
      localPremiumOverride: null,
      
      // Daily Meals
      dailyMeals: null,
      dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      mealTotals: {},
      mealsLoading: false,
      selectedDate: '',
      mealsError: null,
      
      // Food Cache
      foods: [],
      categories: [],
      foodsLoading: false,
      foodsError: null,
      foodsLastUpdated: 0,
      
      // Streak
      currentStreak: 0,
      bestStreak: 0,
      streakLoading: false,
      streakError: null,
      streakMonthlyData: {},
      streakLastUpdated: 0,
      streakUserId: null,
      
      // Water
      waterIntake: 0,
      waterLoading: false,
      waterError: null,
      
      // Language
      currentLanguage: 'en',
      isRTL: false,
      
      // ===== AUTH ACTIONS =====
      setUser: (user) => set({ user }),
      setUserLoading: (loading) => set({ userLoading: loading }),
      setAuthError: (error) => set({ authError: error }),
      
      signUp: async (email, password, name) => {
        set({ userLoading: true, authError: null })
        try {
          const newUser = await FirebaseService.signUp(email, password, name)
          set({ user: newUser, userLoading: false })
          return newUser
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signUpWithPhone: async (phoneNumber, password, name) => {
        set({ userLoading: true, authError: null })
        try {
          const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber)
          if (phoneExists) {
            throw new Error('Phone number already registered')
          }
          const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name)
          set({ user: newUser, userLoading: false })
          return newUser
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signUpWithPhoneVerification: async (phoneNumber, name, password) => {
        set({ userLoading: true, authError: null })
        try {
          const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber)
          if (phoneExists) {
            throw new Error('Phone number already registered')
          }
          const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name)
          set({ user: newUser, userLoading: false })
          return newUser
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign up with phone verification failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signIn: async (email, password) => {
        set({ userLoading: true, authError: null })
        try {
          const user = await FirebaseService.signIn(email, password)
          set({ user, userLoading: false })
          return user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signInWithPhone: async (phoneNumber, password) => {
        set({ userLoading: true, authError: null })
        try {
          const user = await FirebaseService.signInWithPhone(phoneNumber, password)
          set({ user, userLoading: false })
          return user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signInWithPhoneVerification: async (phoneNumber, password) => {
        set({ userLoading: true, authError: null })
        try {
          const user = await FirebaseService.signInWithPhone(phoneNumber, password)
          set({ user, userLoading: false })
          return user
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign in with phone verification failed'
          set({ authError: errorMessage, userLoading: false })
          throw error
        }
      },
      
      signOut: async () => {
        set({ authError: null })
        try {
          await FirebaseService.signOut()
          set({ user: null })
          get().cleanupStreak()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
          set({ authError: errorMessage })
          throw error
        }
      },
      
      updateProfile: async (updates) => {
        const { user } = get()
        if (!user) throw new Error('No user logged in')
        
        set({ authError: null })
        try {
          // Update user data
          if (updates.name || updates.phoneNumber || updates.onboardingCompleted !== undefined) {
            const userUpdates: Partial<User> = {}
            if (updates.name) userUpdates.name = updates.name
            if (updates.phoneNumber) userUpdates.phoneNumber = updates.phoneNumber
            if (updates.onboardingCompleted !== undefined) userUpdates.onboardingCompleted = updates.onboardingCompleted
            
            await FirebaseService.updateUserProfile(user.id, userUpdates)
          }
          
          // Update profile data
          if (updates.profile) {
            await FirebaseService.updateUserProfileDocument(user.id, updates.profile)
          }
          
          // Update local state
          const updatedUser = {
            ...user,
            ...updates,
            profile: updates.profile ? { ...user.profile, ...updates.profile } : user.profile
          }
          set({ user: updatedUser })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
          set({ authError: errorMessage })
          throw error
        }
      },
      
      updateUserPassword: async (currentPassword, newPassword) => {
        const { user } = get()
        if (!user) throw new Error('No user logged in')
        set({ authError: null })
        try {
          // Implement password update logic here
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password update failed'
          set({ authError: errorMessage })
          throw error
        }
      },
      
      // ===== PROFILE ACTIONS =====
      setProfile: (profile) => set({ profile }),
      setProfileLoading: (loading) => set({ profileLoading: loading }),
      setProfileError: (error) => set({ profileError: error }),
      setProfileLastUpdated: (timestamp) => set({ profileLastUpdated: timestamp }),
      
      loadProfile: async (forceRefresh = false) => {
        const { user } = get()
        if (!user?.id) return null
        
        set({ profileLoading: true, profileError: null })
        try {
          const profile = await FirebaseService.getUserProfileDocument(user.id)
          set({ 
            profile, 
            profileLoading: false, 
            profileLastUpdated: Date.now() 
          })
          return profile
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load profile'
          set({ profileError: errorMessage, profileLoading: false })
          throw error
        }
      },
      
      updateProfileData: async (updates) => {
        const { user, profile } = get()
        if (!user?.id) throw new Error('No user logged in')
        
        set({ profileLoading: true, profileError: null })
        try {
          const updatedProfile = await FirebaseService.updateUserProfileDocument(user.id, updates)
          const newProfile = profile ? { ...profile, ...updatedProfile } : updatedProfile
          set({ 
            profile: newProfile, 
            profileLoading: false, 
            profileLastUpdated: Date.now() 
          })
          return newProfile
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update profile'
          set({ profileError: errorMessage, profileLoading: false })
          throw error
        }
      },
      
      refreshProfile: async () => {
        await get().loadProfile(true)
      },
      
      // ===== PREMIUM ACTIONS =====
      setPremium: (hasPremium) => {
        set({ hasPremium });
        // Store in AsyncStorage
        AsyncStorage.setItem('user_premium_status', JSON.stringify(hasPremium));
      },
      initializePremiumStatus: async () => {
        try {
          const stored = await AsyncStorage.getItem('user_premium_status');
          if (stored !== null) {
            const premium = JSON.parse(stored);
            set({ hasPremium: premium });
          }
        } catch (error) {
          console.error('Failed to load premium status:', error);
        }
      },
      setPremiumLoading: (loading) => set({ premiumLoading: loading }),
      setCustomerInfo: (info) => set({ customerInfo: info }),
      setSubscriptionLoading: (loading) => set({ subscriptionLoading: loading }),
      setLocalPremiumOverride: (override) => set({ localPremiumOverride: override }),
      
      refreshPremium: async () => {
        set({ premiumLoading: true })
        try {
          await revenueCatService.refreshCustomerInfo()
          set({ premiumLoading: false })
        } catch (error) {
          set({ premiumLoading: false })
          throw error
        }
      },
      
      setImmediatePremium: (status) => {
        set({ localPremiumOverride: status })
        // Auto-clear after background sync
        setTimeout(() => {
          get().refreshPremium().then(() => {
            set({ localPremiumOverride: null })
          }).catch(() => {
            // Keep override if refresh fails
          })
        }, 1000)
      },
      
      // ===== DAILY MEALS ACTIONS =====
      setDailyMeals: (meals) => set({ dailyMeals: meals }),
      setDailyTotals: (totals) => set({ dailyTotals: totals }),
      setMealTotals: (totals) => set({ mealTotals: totals }),
      setMealsLoading: (loading) => set({ mealsLoading: loading }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setMealsError: (error) => set({ mealsError: error }),
      
      loadDailyMeals: async (date) => {
        const { user } = get();
        if (!user?.id) return;
        
        try {
          const dateToUse = date || getTodayDateString();
          set({ mealsLoading: true, mealsError: null, selectedDate: dateToUse });
          
          const meals = await FirebaseService.getDailyMeals(user.id, dateToUse);
          const mealTotals = calculateMealTotals(meals);
          const dailyTotals = calculateDailyTotals(mealTotals);
          set({ dailyMeals: meals, mealTotals, dailyTotals, mealsLoading: false });
        } catch (error) {
          console.error('❌ loadDailyMeals error:', error);
          set({ mealsError: 'Failed to load meals', mealsLoading: false });
          throw error;
        }
      },
      
      addFoodToMeal: async (mealType, food) => {
        const { user, selectedDate } = get();
        if (!user?.id) return;
        
        try {
          const dateToUse = selectedDate || getTodayDateString();
          await FirebaseService.addDailyMeal(user.id, dateToUse, mealType, food);
          
          // Refresh the meals data
          const updatedMeals = await FirebaseService.getDailyMeals(user.id, dateToUse);
          const updatedMealTotals = calculateMealTotals(updatedMeals);
          const updatedDailyTotals = calculateDailyTotals(updatedMealTotals);
          set({ dailyMeals: updatedMeals, mealTotals: updatedMealTotals, dailyTotals: updatedDailyTotals });
          
          // Update streak if it's today
          if (dateToUse === getTodayDateString()) {
            try {
              // Import and use streakManager
              await useStreakManager().updateStreak(dateToUse);
              console.log('✅ Streak updated for today:', dateToUse);
            } catch (streakError) {
              console.log('❌ Error updating streak:', streakError);
            }
          }
        } catch (error) {
          console.error('❌ addFoodToMeal error:', error);
          throw error;
        }
      },
      
      removeFoodFromMeal: async (mealType, foodId) => {
        const { user, selectedDate } = get();
        if (!user?.id) return;
        
        try {
          const dateToUse = selectedDate || getTodayDateString();
          await FirebaseService.removeFoodFromDailyMeal(user.id, dateToUse, mealType, foodId);
          
          // Refresh the meals data
          const updatedMeals = await FirebaseService.getDailyMeals(user.id, dateToUse);
          const updatedMealTotals = calculateMealTotals(updatedMeals);
          const updatedDailyTotals = calculateDailyTotals(updatedMealTotals);
          set({ dailyMeals: updatedMeals, mealTotals: updatedMealTotals, dailyTotals: updatedDailyTotals });
          
          // Update streak if it's today
          if (dateToUse === getTodayDateString()) {
            try {
              await useStreakManager().updateStreak(dateToUse);
              console.log('✅ Streak updated after food removal:', dateToUse);
            } catch (streakError) {
              console.log('❌ Error updating streak after food removal:', streakError);
            }
          }
        } catch (error) {
          console.error('❌ removeFoodFromMeal error:', error);
          throw error;
        }
      },

// ===== FOOD CACHE ACTIONS =====
      // ===== FOOD CACHE ACTIONS =====
      setFoods: (foods) => set({ foods }),
      setFoodsLoading: (loading) => set({ foodsLoading: loading }),
      setFoodsError: (error) => set({ foodsError: error }),
      setFoodsLastUpdated: (timestamp) => set({ foodsLastUpdated: timestamp }),
      
      searchFoodsInCache: (query, limit = 10, includeSnacks = false) => {
        const { foods } = get()
        const searchTerm = query.toLowerCase()
        return foods
          .filter(food => {
            const matchesQuery = food.name.toLowerCase().includes(searchTerm) ||
                               food.arabicName?.toLowerCase().includes(searchTerm) ||
                               food.kurdishName?.toLowerCase().includes(searchTerm)
            const matchesCategory = includeSnacks || food.category !== 'Snacks'
            return matchesQuery && matchesCategory
          })
          .slice(0, limit)
      },      
      getFoodsByCategoryFromCache: (category, limit = 20) => {
        const { foods } = get()
        return foods
          .filter(food => food.category === category)
          .slice(0, limit)
      },
      
      getPopularFoodsFromCache: (limit = 10) => {
        const { foods } = get()
        return foods
          .filter(food => food.popularity && food.popularity > 0)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, limit)
      },      
      refreshFoodCache: async () => {
        set({ foodsLoading: true, foodsError: null })
        try {
          // Load all foods from Firebase
          let foods = await FirebaseService.getAllFoods();
          
          // Extract unique categories
          const categories = Array.from(new Set(foods.map(food => food.category))).sort();
      
          console.log(`�� FOOD CACHE: Loaded ${foods.length} foods and ${categories.length} categories from Firebase.`);
          
          set({ 
            foods, 
            categories, 
            foodsLoading: false, 
            foodsLastUpdated: Date.now() 
          });
          
          // Save to AsyncStorage
          try {
            const cacheData = {
              foods,
              categories,
              lastUpdated: Date.now(),
            };
            await AsyncStorage.setItem('food_cache_v1', JSON.stringify(cacheData));
            console.log('💾 Food cache saved to AsyncStorage');
          } catch (storageError) {
            console.warn('⚠️ Error saving food cache to AsyncStorage:', storageError);
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to refresh food cache'
          set({ foodsError: errorMessage, foodsLoading: false })
          throw error
        }
      },
      loadFoodCache: async () => {
        const { foods } = get();
        
        // If we already have foods, don't reload
        if (foods.length > 0) return;
        
        try {
          // Try to load from AsyncStorage first
          const cached = await AsyncStorage.getItem('food_cache_v1');
          if (cached) {
            const cacheData = JSON.parse(cached);
            const cacheAge = Date.now() - cacheData.lastUpdated;
            const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
            
            if (cacheAge <= CACHE_DURATION) {
              console.log('🔍 FOOD CACHE: Using AsyncStorage cache');
              set({ 
                foods: cacheData.foods, 
                categories: cacheData.categories, 
                foodsLastUpdated: cacheData.lastUpdated 
              });
              return;
            }
          }
          
          // Cache expired or doesn't exist - load from Firebase
          await get().refreshFoodCache();
          
        } catch (error) {
          console.error('Error loading food cache:', error);
          // Try to load from Firebase as fallback
          try {
            await get().refreshFoodCache();
          } catch (fallbackError) {
            console.error('Failed to load food cache from Firebase:', fallbackError);
          }
        }
      },
      clearFoodCache: async () => {
        set({ foods: [], categories: [], foodsLastUpdated: 0 })
        try {
          await AsyncStorage.removeItem('food_cache_v1')
        } catch (error) {
          console.warn('Failed to clear food cache from storage:', error)
        }
      },
      
      // ===== STREAK ACTIONS =====
      setCurrentStreak: (streak) => set({ currentStreak: streak }),
      setBestStreak: (streak) => set({ bestStreak: streak }),
      setStreakLoading: (loading) => set({ streakLoading: loading }),
      setStreakError: (error) => set({ streakError: error }),
      setStreakMonthlyData: (data) => set({ streakMonthlyData: data }),
      setStreakLastUpdated: (timestamp) => set({ streakLastUpdated: timestamp }),
      setStreakUserId: (userId) => set({ streakUserId: userId }),
      
      initializeStreak: async (userId) => {
        // Implementation will be added in Step 8
      },
      
      cleanupStreak: () => {
        set({
          currentStreak: 0,
          bestStreak: 0,
          streakLoading: false,
          streakError: null,
          streakMonthlyData: {},
          streakUserId: null
        })
      },
      
      updateStreak: async (date) => {
        // Implementation will be added in Step 8
      },
      
      // ===== WATER ACTIONS =====
      setWaterIntake: (intake) => set({ waterIntake: intake }),
      setWaterLoading: (loading) => set({ waterLoading: loading }),
      setWaterError: (error) => set({ waterError: error }),
      
      updateWaterIntake: async (glasses) => {
        // Implementation will be added in Step 4
      },
      
      loadWaterIntake: async () => {
        // Implementation will be added in Step 4
      },
      
      // ===== LANGUAGE ACTIONS =====
      setLanguage: (language) => set({ currentLanguage: language }),
      setRTL: (isRTL) => set({ isRTL }),
      
      changeLanguage: async (lng) => {
        try {
          await i18n.changeLanguage(lng)
          const newIsRTL = ['ar', 'ku'].includes(lng)
          set({ currentLanguage: lng, isRTL: newIsRTL })
        } catch (error) {
          console.error('Failed to change language:', error)
          throw error
        }
      },
      // Add these after the existing daily meals implementations:
getFoodsFromMeal: (mealName: string) => {
  const { dailyMeals } = get();
  if (!dailyMeals) return [];
  
  try {
    const mealData = dailyMeals.meals?.[mealName];
    if (!mealData || typeof mealData !== 'object') return [];
    
    const foods: any[] = [];
    Object.keys(mealData).forEach(foodKey => {
      if (foodKey.startsWith('food')) {
        const foodItem = mealData[foodKey];
        if (foodItem && foodItem["0"]) {
          foods.push({
            ...foodItem["0"],
            foodKey: foodKey
          });
        }
      }
    });
    
    return foods;
  } catch (error) {
    console.log('❌ Error getting foods from meal:', error);
    return [];
  }
},

refreshMeals: async () => {
  const { user, selectedDate } = get();
  if (!user?.id) return;
  
  try {
    set({ mealsLoading: true, mealsError: null });
    const meals = await FirebaseService.getDailyMeals(user.id, selectedDate || getTodayDateString());
    set({ dailyMeals: meals, mealsLoading: false });
  } catch (error) {
    set({ mealsError: 'Failed to refresh meals', mealsLoading: false });
  }
},

changeDate: async (newDate: string) => {
  const { user } = get();
  if (!user?.id) return;
  
  set({ selectedDate: newDate, mealsLoading: true, mealsError: null });
  
  try {
    const meals = await FirebaseService.getDailyMeals(user.id, newDate);
    set({ dailyMeals: meals, mealsLoading: false });
  } catch (error) {
    set({ mealsError: 'Failed to load meals for date', mealsLoading: false });
  }
},
      // ===== UTILITY ACTIONS =====
      resetStore: () => {
        set({
          user: null,
          userLoading: false,
          authError: null,
          profile: null,
          profileLoading: false,
          profileError: null,
          profileLastUpdated: 0,
          hasPremium: false,
          premiumLoading: false,
          customerInfo: null,
          subscriptionLoading: false,
          localPremiumOverride: null,
          dailyMeals: null,
          dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          mealTotals: {},
          mealsLoading: false,
          selectedDate: '',
          mealsError: null,
          foods: [],
          categories: [],
          foodsLoading: false,
          foodsError: null,
          foodsLastUpdated: 0,
          currentStreak: 0,
          bestStreak: 0,
          streakLoading: false,
          streakError: null,
          streakMonthlyData: {},
          streakLastUpdated: 0,
          streakUserId: null,
          waterIntake: 0,
          waterLoading: false,
          waterError: null,
          currentLanguage: 'en',
          isRTL: false
        })
      }
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        currentLanguage: state.currentLanguage,
        isRTL: state.isRTL,
        selectedDate: state.selectedDate,
        foodsLastUpdated: state.foodsLastUpdated,
        streakLastUpdated: state.streakLastUpdated,
        profileLastUpdated: state.profileLastUpdated
      })
    }
  )
)