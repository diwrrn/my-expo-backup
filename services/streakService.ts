import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastLogDate: string | null;
  updatedAt: string;
}

export class StreakService {
  /**
   * Get streak data for a user
   */
  static async getStreak(userId: string): Promise<StreakData> {
    try {
      const streakRef = doc(db, 'users', userId, 'stats', 'streak');
      const streakDoc = await getDoc(streakRef);
      
      if (streakDoc.exists()) {
        return streakDoc.data() as StreakData;
      } else {
        // Return default values if no streak data exists
        return {
          currentStreak: 0,
          bestStreak: 0,
          lastLogDate: null,
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error getting streak data:', error);
      throw error;
    }
  }

  /**
   * Update streak data when user logs food
   * @param userId User ID
   * @param logDate Date of food logging (YYYY-MM-DD format)
   */
  static async updateStreak(userId: string, logDate: string): Promise<StreakData> {
    try {
      
      // Get current streak data
      const currentData = await this.getStreak(userId);
      
      // If this is the same day as the last log, no streak update needed
      if (currentData.lastLogDate === logDate) {
        return currentData;
      }
      
      let newCurrentStreak = currentData.currentStreak;
      let newBestStreak = currentData.bestStreak;
      
      // If this is the first log ever
      if (!currentData.lastLogDate) {
        console.log('🆕 StreakService: First log ever, setting streak to 1');
        newCurrentStreak = 1;
      } 
      // If this is a consecutive day (yesterday)
      else if (this.isConsecutiveDay(currentData.lastLogDate, logDate)) {
        console.log('🔥 StreakService: Consecutive day, incrementing streak');
        newCurrentStreak += 1;
        
        // Update best streak if current streak is higher
        if (newCurrentStreak > newBestStreak) {
          newBestStreak = newCurrentStreak;
        }
      } 
      // If there's a gap (more than 1 day)
      else if (this.isDayAfter(currentData.lastLogDate, logDate)) {
        console.log('⏱️ StreakService: Non-consecutive day, resetting streak to 1');
        newCurrentStreak = 1;
      }
      
      // Create updated streak data
      const updatedData: StreakData = {
        currentStreak: newCurrentStreak,
        bestStreak: newBestStreak,
        lastLogDate: logDate,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ StreakService: Saving updated streak data:', updatedData);
      
      // Save to Firestore
      const streakRef = doc(db, 'users', userId, 'stats', 'streak');
      await setDoc(streakRef, updatedData, { merge: true });
      
      return updatedData;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }
  
  /**
   * Check if two dates are consecutive days
   * @param date1 First date (YYYY-MM-DD)
   * @param date2 Second date (YYYY-MM-DD)
   * @returns true if date2 is the day after date1
   */
  static isConsecutiveDay(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Set to midnight to compare just the dates
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays === 1;
  }
  
  /**
   * Check if there's a gap between dates
   * @param date1 First date (YYYY-MM-DD)
   * @param date2 Second date (YYYY-MM-DD)
   * @returns true if date2 is more than one day after date1
   */
  static isDayAfter(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Set to midnight to compare just the dates
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays > 1;
  }
}