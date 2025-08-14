import { onSnapshot, doc, Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { StreakService, StreakData } from '@/services/streakService';
import { FirebaseService } from '@/services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/appStore'; // Update path to your store
import { useCallback } from 'react';
  
class StreakManager {
  private static instance: StreakManager;
  private unsubscribeStreak: Unsubscribe | null = null;
  private currentUserId: string | null = null;
  
  // Cache keys
  private readonly STREAK_CACHE_KEY = 'streak_cache_v2_';
  private readonly MONTHLY_CACHE_KEY = 'monthly_cache_v2_';
  private readonly CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  static getInstance(): StreakManager {
    if (!StreakManager.instance) {
      StreakManager.instance = new StreakManager();
    }
    return StreakManager.instance;
  }

  /**
   * Initialize streak tracking for a user
   */
  async initializeUser(userId: string): Promise<void> {
    console.log('🔥 StreakManager: Initializing user:', userId);
    
    // If same user, don't reinitialize
    if (this.currentUserId === userId && this.unsubscribeStreak) {
      console.log('🔥 StreakManager: Same user, skipping initialization');
      return;
    }
    
    // Clean up previous user
    this.cleanup();
    
    // Set new user
    this.currentUserId = userId;
    useAppStore.getState().setStreakUserId(userId);
    useAppStore.getState().setStreakLoading(true);
    useAppStore.getState().setStreakError(null);
    
    try {
      // Try to load from cache first
      await this.loadFromCache(userId);
      
      // Set up real-time listener
      await this.setupRealtimeListener(userId);
      
    } catch (error) {
      console.error('❌ StreakManager: Failed to initialize user:', error);
      useAppStore.getState().setStreakError('Failed to load streak data');
      useAppStore.getState().setStreakLoading(false);
    }
  }

  /**
   * Clean up when user logs out
   */
  cleanup(): void {
    console.log('🧹 StreakManager: Cleaning up');
    
    if (this.unsubscribeStreak) {
      this.unsubscribeStreak();
      this.unsubscribeStreak = null;
    }
    
    this.currentUserId = null;
    
    // Reset Zustand state
    useAppStore.getState().setCurrentStreak(0);
    useAppStore.getState().setBestStreak(0);
    useAppStore.getState().setStreakLoading(false);
    useAppStore.getState().setStreakError(null);
    useAppStore.getState().setStreakMonthlyData({});
    useAppStore.getState().setStreakUserId(null);
  }

  /**
   * Load streak data from cache
   */
  private async loadFromCache(userId: string): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(`${this.STREAK_CACHE_KEY}${userId}`);
      if (cached) {
        const cacheData = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - cacheData.lastUpdated < this.CACHE_DURATION) {
          console.log('📱 StreakManager: Using cached streak data');
          
          useAppStore.getState().setCurrentStreak(cacheData.currentStreak);
          useAppStore.getState().setBestStreak(cacheData.bestStreak);
          useAppStore.getState().setStreakLastUpdated(cacheData.lastUpdated);
          
          return true;
        }
      }
    } catch (error) {
      console.error('❌ StreakManager: Cache load error:', error);
    }
    return false;
  }

  /**
   * Save streak data to cache
   */
  private async saveToCache(userId: string, streakData: StreakData): Promise<void> {
    try {
      const cacheData = {
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        lastUpdated: Date.now(),
      };
      
      await AsyncStorage.setItem(
        `${this.STREAK_CACHE_KEY}${userId}`, 
        JSON.stringify(cacheData)
      );
      
      console.log('💾 StreakManager: Saved to cache');
    } catch (error) {
      console.error('❌ StreakManager: Cache save error:', error);
    }
  }

  /**
   * Set up real-time Firebase listener
   */
  private async setupRealtimeListener(userId: string): Promise<void> {
    const streakRef = doc(db, 'users', userId, 'stats', 'streak');
    
    this.unsubscribeStreak = onSnapshot(
      streakRef,
      async (doc) => {
        console.log('🔄 StreakManager: Real-time update received');
        
        if (doc.exists()) {
          const streakData = doc.data() as StreakData;
          
          // Update Zustand store
          useAppStore.getState().setCurrentStreak(streakData.currentStreak);
          useAppStore.getState().setBestStreak(streakData.bestStreak);
          useAppStore.getState().setStreakLastUpdated(Date.now());
          
          // Save to cache
          await this.saveToCache(userId, streakData);
          
        } else {
          console.log('📄 StreakManager: No streak document found, using defaults');
          useAppStore.getState().setCurrentStreak(0);
          useAppStore.getState().setBestStreak(0);
        }
        
        useAppStore.getState().setStreakLoading(false);
        useAppStore.getState().setStreakError(null);
      },
      (error) => {
        console.error('❌ StreakManager: Real-time listener error:', error);
        useAppStore.getState().setStreakError(error.message);
        useAppStore.getState().setStreakLoading(false);
      }
    );
  }

  /**
   * Get monthly dates for calendar
   */
  async getMonthlyDates(year: number, month: number): Promise<string[]> {
    if (!this.currentUserId) {
      console.warn('⚠️ StreakManager: No user ID for monthly dates');
      return [];
    }

    const monthKey = `${year}_${month}`;
    const cacheKey = `${this.MONTHLY_CACHE_KEY}${this.currentUserId}_${monthKey}`;
    
    try {
      // Try cache first
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (Date.now() - cacheData.lastUpdated < this.CACHE_DURATION) {
          console.log('📱 StreakManager: Using cached monthly data');
          return cacheData.dates;
        }
      }
      
      // Cache miss - fetch from Firebase
      console.log('🔍 StreakManager: Fetching monthly dates from Firebase');
      const dates = await FirebaseService.getDailyMealDatesForMonth(
        this.currentUserId, 
        year, 
        month
      );
      
      // Save to cache
      const newCache = {
        dates,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(newCache));
      
      // Update Zustand store
      const currentMonthlyData = useAppStore.getState().streakMonthlyData;
      useAppStore.getState().setStreakMonthlyData({
        ...currentMonthlyData,
        [monthKey]: dates
      });
      
      return dates;
      
    } catch (error) {
      console.error('❌ StreakManager: Monthly dates error:', error);
      return [];
    }
  }

  /**
   * Force refresh streak data
   */
  async refreshStreak(): Promise<void> {
    if (!this.currentUserId) {
      console.warn('⚠️ StreakManager: No user ID for refresh');
      return;
    }
    
    try {
      useAppStore.getState().setStreakLoading(true);
      useAppStore.getState().setStreakError(null);
      
      const streakData = await StreakService.getStreak(this.currentUserId);
      
      // Update Zustand store
      useAppStore.getState().setCurrentStreak(streakData.currentStreak);
      useAppStore.getState().setBestStreak(streakData.bestStreak);
      useAppStore.getState().setStreakLastUpdated(Date.now());
      
      // Save to cache
      await this.saveToCache(this.currentUserId, streakData);
      
      useAppStore.getState().setStreakLoading(false);
      
      console.log('✅ StreakManager: Streak refreshed');
      
    } catch (error) {
      console.error('❌ StreakManager: Refresh error:', error);
      useAppStore.getState().setStreakError('Failed to refresh streak');
      useAppStore.getState().setStreakLoading(false);
    }
  }

  /**
   * Update streak when food is logged
   */
  async updateStreak(date: string): Promise<void> {
    if (!this.currentUserId) {
      console.warn('⚠️ StreakManager: No user ID for streak update');
      return;
    }
    
    try {
      console.log('🔥 StreakManager: Updating streak for date:', date);
      await StreakService.updateStreak(this.currentUserId, date);
      // Real-time listener will automatically update the store
      
    } catch (error) {
      console.error('❌ StreakManager: Streak update error:', error);
      useAppStore.getState().setStreakError('Failed to update streak');
    }
  }
}

// Export singleton instance
export const streakManager = StreakManager.getInstance();

// Export hook for components
export function useStreakManager() {
  const store = useAppStore();
  
  // MEMOIZE the functions to prevent infinite loops!
  const initializeUser = useCallback((userId: string) => {
    return streakManager.initializeUser(userId);
  }, []);
  
  const cleanup = useCallback(() => {
    return streakManager.cleanup();
  }, []);
  
  const getMonthlyDates = useCallback((year: number, month: number) => {
    return streakManager.getMonthlyDates(year, month);
  }, []);
  
  const refreshStreak = useCallback(() => {
    return streakManager.refreshStreak();
  }, []);
  
  const updateStreak = useCallback((date: string) => {
    return streakManager.updateStreak(date);
  }, []);
  
  return {
    // State
    currentStreak: store.currentStreak,
    bestStreak: store.bestStreak,
    isLoading: store.streakLoading,
    error: store.streakError,
    monthlyData: store.streakMonthlyData,
    
    // Memoized actions
    initializeUser,
    cleanup,
    getMonthlyDates,
    refreshStreak,
    updateStreak,
  };
}