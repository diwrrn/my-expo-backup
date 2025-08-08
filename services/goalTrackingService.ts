/**
 * Goal Tracking Service
 * Monitors user progress and triggers notifications for achievements
 */

import { FirebaseService } from './firebaseService';
import { UserProfile } from '@/types/api';
import { db } from '@/config/firebase';
import { doc, collection, getDoc, setDoc } from 'firebase/firestore';

export class GoalTrackingService {
  /**
   * Check if user has achieved their daily calorie goal
   */
  static async checkCalorieGoalAchievement(
    userId: string,
    currentCalories: number,
    calorieGoal: number
  ): Promise<void> {
    try {
      // Check if user is within 5% of their goal (95-105% range)
      const lowerBound = calorieGoal * 0.95;
      const upperBound = calorieGoal * 1.05;
      
      if (currentCalories >= lowerBound && currentCalories <= upperBound) {
        // Check if we've already sent this notification today
        const today = new Date().toISOString().split('T')[0];
        const lastNotificationDate = await this.getLastNotificationDate(userId, 'calorie_goal');
        
        if (lastNotificationDate !== today) {
          console.log('🎯 Calorie goal achieved:', calorieGoal);
          await this.setLastNotificationDate(userId, 'calorie_goal', today);
        }
      }
    } catch (error) {
      console.error('Error checking calorie goal achievement:', error);
    }
  }

  /**
   * Check if user has achieved their protein goal
   */
  static async checkProteinGoalAchievement(
    userId: string,
    currentProtein: number,
    proteinGoal: number
  ): Promise<void> {
    try {
      if (currentProtein >= proteinGoal) {
        const today = new Date().toISOString().split('T')[0];
        const lastNotificationDate = await this.getLastNotificationDate(userId, 'protein_goal');
        
        if (lastNotificationDate !== today) {
          console.log('🎯 Protein goal achieved:', proteinGoal);
          await this.setLastNotificationDate(userId, 'protein_goal', today);
        }
      }
    } catch (error) {
      console.error('Error checking protein goal achievement:', error);
    }
  }

  /**
   * Check if user has achieved their water goal
   */
  static async checkWaterGoalAchievement(
    userId: string,
    currentWater: number,
    waterGoal: number
  ): Promise<void> {
    try {
      if (currentWater >= waterGoal) {
        const today = new Date().toISOString().split('T')[0];
        const lastNotificationDate = await this.getLastNotificationDate(userId, 'water_goal');
        
        if (lastNotificationDate !== today) {
          console.log('🎯 Water goal achieved:', waterGoal);
          await this.setLastNotificationDate(userId, 'water_goal', today);
        }
      }
    } catch (error) {
      console.error('Error checking water goal achievement:', error);
    }
  }

  /**
   * Check streak milestones
   */
  static async checkStreakMilestone(userId: string, currentStreak: number): Promise<void> {
    try {
      // Send notifications for streak milestones: 3, 7, 14, 30, 60, 90 days
      const milestones = [3, 7, 14, 30, 60, 90];
      
      if (milestones.includes(currentStreak)) {
        const lastStreakNotification = await this.getLastNotificationValue(userId, 'streak_milestone');
        
        if (lastStreakNotification !== currentStreak) {
          console.log('🎯 Streak milestone achieved:', currentStreak);
          await this.setLastNotificationValue(userId, 'streak_milestone', currentStreak);
        }
      }
    } catch (error) {
      console.error('Error checking streak milestone:', error);
    }
  }

  /**
   * Get the last notification date for a specific goal type
   */
  private static async getLastNotificationDate(
    userId: string, 
    goalType: string
  ): Promise<string | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const notificationsRef = collection(userRef, 'notifications');
      const notificationDocRef = doc(notificationsRef, goalType);
      const notificationDoc = await getDoc(notificationDocRef);
      
      if (notificationDoc.exists()) {
        const data = notificationDoc.data();
        return data?.lastNotificationDate || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last notification date:', error);
      return null;
    }
  }

  /**
   * Set the last notification date for a specific goal type
   */
  private static async setLastNotificationDate(
    userId: string, 
    goalType: string, 
    date: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const notificationsRef = collection(userRef, 'notifications');
      const notificationDocRef = doc(notificationsRef, goalType);
      
      await setDoc(notificationDocRef, {
        lastNotificationDate: date,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error setting last notification date:', error);
    }
  }

  /**
   * Get the last notification value for a specific goal type
   */
  private static async getLastNotificationValue(
    userId: string, 
    goalType: string
  ): Promise<number | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const notificationsRef = collection(userRef, 'notifications');
      const notificationDocRef = doc(notificationsRef, goalType);
      const notificationDoc = await getDoc(notificationDocRef);
      
      if (notificationDoc.exists()) {
        const data = notificationDoc.data();
        return data?.lastNotificationValue || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting last notification value:', error);
      return null;
    }
  }

  /**
   * Set the last notification value for a specific goal type
   */
  private static async setLastNotificationValue(
    userId: string, 
    goalType: string, 
    value: number
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const notificationsRef = collection(userRef, 'notifications');
      const notificationDocRef = doc(notificationsRef, goalType);
      
      await setDoc(notificationDocRef, {
        lastNotificationValue: value,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error setting last notification value:', error);
    }
  }
}