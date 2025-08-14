import { create } from 'zustand'

interface AppStore {
  // Calculator data
  profile: any
  profileLoading: boolean
  
  // Meal planner data
  hasPremium: boolean
  premiumLoading: boolean
  
  // Home screen data
  dailyMeals: any
  dailyTotals: any
  mealTotals: any
  mealsLoading: boolean
  selectedDate: string
  
  // Profile screen data
  currentStreak: number
  bestStreak: number
  streakLoading: boolean
  streakError: string | null
  streakMonthlyData: Record<string, string[]>
  streakLastUpdated: number
  streakUserId: string | null
  waterIntake: number
  customerInfo: any
  subscriptionLoading: boolean
  
  // User data
  user: any
  userLoading: boolean
  
  // Food cache data
  foods: any[]
  foodsLoading: boolean
  currentLanguage: string
  isRTL: boolean

  // Actions
  setProfile: (profile: any) => void
  setProfileLoading: (loading: boolean) => void
  setPremium: (hasPremium: boolean) => void
  setPremiumLoading: (loading: boolean) => void
  setDailyMeals: (meals: any) => void
  setDailyTotals: (totals: any) => void
  setMealTotals: (totals: any) => void
  setMealsLoading: (loading: boolean) => void
  setSelectedDate: (date: string) => void
  setCurrentStreak: (streak: number) => void
  setBestStreak: (streak: number) => void
  setStreakLoading: (loading: boolean) => void
  setStreakError: (error: string | null) => void
  setStreakMonthlyData: (data: Record<string, string[]>) => void
  setStreakLastUpdated: (timestamp: number) => void
  setStreakUserId: (userId: string | null) => void
  setWaterIntake: (intake: number) => void
  setCustomerInfo: (info: any) => void
  setSubscriptionLoading: (loading: boolean) => void
  setUser: (user: any) => void
  setUserLoading: (loading: boolean) => void
  setFoods: (foods: any[]) => void
  setFoodsLoading: (loading: boolean) => void
  setLanguage: (language: string) => void
  setRTL: (isRTL: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  profileLoading: false,
  hasPremium: false,
  premiumLoading: false,
  
  setProfile: (profile) => set({ profile }),
  setProfileLoading: (loading) => set({ profileLoading: loading }),
  setPremium: (hasPremium) => set({ hasPremium }),
  setPremiumLoading: (loading) => set({ premiumLoading: loading }),
  
  dailyMeals: null,
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  mealTotals: {},
  mealsLoading: false,
  selectedDate: '',
  setDailyMeals: (dailyMeals) => set({ dailyMeals }),
  setDailyTotals: (dailyTotals) => set({ dailyTotals }),
  setMealTotals: (mealTotals) => set({ mealTotals }),
  setMealsLoading: (loading) => set({ mealsLoading: loading }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  
  currentStreak: 0,
  bestStreak: 0,
  streakLoading: false,
  streakError: null,
  streakMonthlyData: {},
  streakLastUpdated: 0,
  streakUserId: null,
  waterIntake: 0,
  setCurrentStreak: (currentStreak) => set({ currentStreak }),
  setBestStreak: (bestStreak) => set({ bestStreak }),
  setStreakLoading: (loading) => set({ streakLoading: loading }),
  setStreakError: (error) => set({ streakError: error }),
  setStreakMonthlyData: (data) => set({ streakMonthlyData: data }),
  setStreakLastUpdated: (timestamp) => set({ streakLastUpdated: timestamp }),
  setStreakUserId: (userId) => set({ streakUserId: userId }),
  setWaterIntake: (waterIntake) => set({ waterIntake }),

  customerInfo: null,
  subscriptionLoading: false,
  setCustomerInfo: (customerInfo) => set({ customerInfo }),
  setSubscriptionLoading: (loading) => set({ subscriptionLoading: loading }),
  
  user: null,
  userLoading: false,
  setUser: (user) => set({ user }),
  setUserLoading: (loading) => set({ userLoading: loading }),

  foods: [],
  foodsLoading: false,
  setFoods: (foods) => set({ foods }),
  setFoodsLoading: (loading) => set({ foodsLoading: loading }),

  currentLanguage: 'en',
  isRTL: false,
  setLanguage: (currentLanguage) => set({ currentLanguage }),
  setRTL: (isRTL) => set({ isRTL }),
}))