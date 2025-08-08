import { FirebaseService } from '@/services/firebaseService';
import { StreakService } from '@/services/streakService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface StreakListener {
  onStreakChange: (currentStreak: number, bestStreak: number) => void;
  onMonthlyDataChange: (monthlyData: Record<string, string[]>) => void;
  onLoadingChange: (isLoading: boolean) => void;
  onErrorChange: (error: string | null) => void;
}

class StreakGlobal {
  private listeners: Set<StreakListener> = new Set();
  private _currentStreak = 0;
  private _bestStreak = 0;
  private _monthlyData: Record<string, string[]> = {};
  private _isLoading = false;
  private _error: string | null = null;
  private userId: string | null = null;

  private STREAK_CACHE_KEY = 'streak_cache_';
  private MONTHLY_CACHE_KEY = 'monthly_cache_';
  private CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  get currentStreak() { return this._currentStreak; }
  get bestStreak() { return this._bestStreak; }
  get monthlyData() { return this._monthlyData; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener.onStreakChange(this._currentStreak, this._bestStreak);
      listener.onMonthlyDataChange(this._monthlyData);
      listener.onLoadingChange(this._isLoading);
      listener.onErrorChange(this._error);
    });
  }

  private setCurrentStreak(value: number) {
    this._currentStreak = value;
    this.notifyListeners();
  }

  private setBestStreak(value: number) {
    this._bestStreak = value;
    this.notifyListeners();
  }

  private setMonthlyData(value: Record<string, string[]>) {
    this._monthlyData = value;
    this.notifyListeners();
  }

  private setIsLoading(value: boolean) {
    this._isLoading = value;
    this.notifyListeners();
  }

  private setError(value: string | null) {
    this._error = value;
    this.notifyListeners();
  }

  addListener(listener: StreakListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setUser(userId: string | null) {
    this.userId = userId;
    if (userId) {
      this.loadStreak();
    } else {
      this.setCurrentStreak(0);
      this.setBestStreak(0);
      this.setMonthlyData({});
      this.setIsLoading(false);
      this.setError(null);
    }
  }

  private isCacheExpired(lastUpdated: number): boolean {
    return Date.now() - lastUpdated > this.CACHE_DURATION;
  }

  private async loadStreakFromAsyncStorage(userId: string) {
    try {
      const cached = await AsyncStorage.getItem(`${this.STREAK_CACHE_KEY}${userId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.log('❌ Error loading streak from AsyncStorage:', error);
      return null;
    }
  }

  private async saveStreakToAsyncStorage(userId: string, cacheData: any) {
    try {
      await AsyncStorage.setItem(`${this.STREAK_CACHE_KEY}${userId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.log('❌ Error saving streak to AsyncStorage:', error);
    }
  }

  private async loadStreak(forceRefresh = false) {
    if (!this.userId) return;

    this.setIsLoading(true);
    this.setError(null);

    try {
      if (!forceRefresh) {
        const cachedData = await this.loadStreakFromAsyncStorage(this.userId);
        if (cachedData && !this.isCacheExpired(cachedData.lastUpdated)) {
          this.setCurrentStreak(cachedData.currentStreak);
          this.setBestStreak(cachedData.bestStreak);
          this.setIsLoading(false);
          return;
        }
      }

      const streakData = await StreakService.getStreak(this.userId);
            this.setCurrentStreak(streakData.currentStreak);
      this.setBestStreak(streakData.bestStreak);

      const newCache = {
        currentStreak: streakData.currentStreak,
        bestStreak: streakData.bestStreak,
        lastUpdated: Date.now(),
      };
      await this.saveStreakToAsyncStorage(this.userId, newCache);
      
      this.setIsLoading(false);
    } catch (error: any) {
      this.setError(error.message);
      this.setIsLoading(false);
    }
  }

  async getMonthlyDates(year: number, month: number): Promise<string[]> {
    if (!this.userId) {
      return [];
    }

    const key = `${year}_${month}`;
    
    try {
      const cached = await AsyncStorage.getItem(`${this.MONTHLY_CACHE_KEY}${this.userId}_${key}`);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (!this.isCacheExpired(parsedCache.lastUpdated)) {
          return parsedCache.dates;
        }
      } 

      const dates = await FirebaseService.getDailyMealDatesForMonth(this.userId, year, month);
      
      const newCache = {
        dates,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(`${this.MONTHLY_CACHE_KEY}${this.userId}_${key}`, JSON.stringify(newCache));

      this.setMonthlyData({ ...this._monthlyData, [key]: dates });
      return dates;
    } catch (error) {
      console.log('❌ Error loading monthly dates:', error);
      return [];
    }
  }

  async refreshStreak(): Promise<void> {
    await this.loadStreak(true);
  }

  async refreshMonthlyData(year: number, month: number): Promise<void> {
    if (!this.userId) return;

    const key = `${year}_${month}`;
    try {
      const dates = await FirebaseService.getDailyMealDatesForMonth(this.userId, year, month);
      
      const newCache = {
        dates,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(`${this.MONTHLY_CACHE_KEY}${this.userId}_${key}`, JSON.stringify(newCache));

      this.setMonthlyData({ ...this._monthlyData, [key]: dates });
    } catch (error) {
      console.log('❌ Error refreshing monthly data:', error);
    }
  }
}

export const streakGlobal = new StreakGlobal();

export function useStreakContext() {
  return streakGlobal;
}