/**
 * Goal Tracking Service
 * Monitors user progress and triggers notifications for achievements
 */

import { NotificationService } from './notificationService';
import { FirebaseService } from './firebaseService';
import { UserProfile } from '@/types/api';

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
          await NotificationService.sendGoalAchievement(userId, 'calories', calorieGoal);
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
          await NotificationService.sendGoalAchievement(userId, 'protein', proteinGoal);
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
          await NotificationService.sendGoalAchievement(userId, 'water', Math.round(waterGoal));
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
          await NotificationService.sendGoalAchievement(userId, 'streak', currentStreak);
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
      // This would typically be stored in a Firebase subcollection
      // For now, we'll use a simple approach with user document
      const userProfile = await FirebaseService.getUserProfileDocument(userId);
      const notificationData = userProfile?.notificationHistory || {};
      return notificationData[goalType] || null;
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
      await FirebaseService.updateUserProfileDocument(userId, {
        notificationHistory: {
          [goalType]: date
        }
      });
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
      const userProfile = await FirebaseService.getUserProfileDocument(userId);
      const notificationData = userProfile?.notificationValues || {};
      return notificationData[goalType] || null;
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
      await FirebaseService.updateUserProfileDocument(userId, {
        notificationValues: {
          [goalType]: value
        }
      });
    } catch (error) {
      console.error('Error setting last notification value:', error);
    }
  }
}