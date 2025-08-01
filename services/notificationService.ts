/**
 * Notification Service
 * Handles sending push notifications and managing notification templates
 */

import { FirebaseService } from './firebaseService';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  scheduledFor: string; // ISO date string
  data?: Record<string, any>;
  sent: boolean;
  createdAt: string;
}

export class NotificationService {
  /**
   * Send a push notification to a specific user
   */
  static async sendNotificationToUser(
    userId: string, 
    notification: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's push token from Firebase
      const pushToken = await FirebaseService.getPushToken(userId);
      
      if (!pushToken) {
        console.log(`📱 No push token found for user ${userId}`);
        return false;
      }

      // Send notification via Expo's push service
      const message = {
        to: pushToken,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data && result.data.status === 'ok') {
        console.log(`📱 Notification sent successfully to user ${userId}`);
        return true;
      } else {
        console.error('📱 Failed to send notification:', result);
        return false;
      }
    } catch (error) {
      console.error('📱 Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send meal reminder notification
   */
  static async sendMealReminder(
    userId: string, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  ): Promise<boolean> {
    const mealTitles = {
      breakfast: 'Time for Breakfast! 🌅',
      lunch: 'Lunch Time! 🍽️',
      dinner: 'Dinner Time! 🌙',
      snacks: 'Snack Time! 🍎',
    };

    const mealBodies = {
      breakfast: 'Start your day right with a nutritious breakfast!',
      lunch: 'Fuel your afternoon with a healthy lunch!',
      dinner: 'End your day with a satisfying dinner!',
      snacks: 'Time for a healthy snack to keep you energized!',
    };

    return await this.sendNotificationToUser(userId, {
      title: mealTitles[mealType],
      body: mealBodies[mealType],
      data: {
        type: 'meal_reminder',
        mealType,
        screen: '/(tabs)/',
      },
    });
  }

  /**
   * Send goal achievement notification
   */
  static async sendGoalAchievement(
    userId: string, 
    goalType: 'calories' | 'protein' | 'water' | 'streak',
    value: number
  ): Promise<boolean> {
    const goalTitles = {
      calories: 'Calorie Goal Achieved! 🎯',
      protein: 'Protein Goal Reached! 💪',
      water: 'Hydration Goal Complete! 💧',
      streak: 'Streak Milestone! 🔥',
    };

    const goalBodies = {
      calories: `Congratulations! You've reached your daily calorie goal of ${value} kcal!`,
      protein: `Amazing! You've hit your protein target of ${value}g today!`,
      water: `Great job! You've completed your water goal of ${value} glasses!`,
      streak: `Incredible! You're on a ${value}-day tracking streak!`,
    };

    return await this.sendNotificationToUser(userId, {
      title: goalTitles[goalType],
      body: goalBodies[goalType],
      data: {
        type: 'goal_achievement',
        goalType,
        value,
        screen: '/(tabs)/',
      },
    });
  }

  /**
   * Send weekly progress summary
   */
  static async sendWeeklyProgress(
    userId: string,
    stats: {
      avgCalories: number;
      daysTracked: number;
      goalStreak: number;
    }
  ): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: 'Weekly Progress Summary 📊',
      body: `This week: ${stats.avgCalories} avg calories, ${stats.daysTracked} days tracked, ${stats.goalStreak} day streak!`,
      data: {
        type: 'weekly_progress',
        stats,
        screen: '/(tabs)/stats',
      },
    });
  }

  /**
   * Send meal plan suggestion
   */
  static async sendMealPlanSuggestion(userId: string): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: 'New Meal Plan Available! 🍽️',
      body: 'We\'ve created a personalized meal plan based on your goals. Check it out!',
      data: {
        type: 'meal_plan_suggestion',
        screen: '/(tabs)/meal-planner',
      },
    });
  }

  /**
   * Schedule a notification for later
   */
  static async scheduleNotification(
    userId: string,
    notification: NotificationPayload,
    scheduledFor: Date
  ): Promise<string | null> {
    try {
      // For now, we'll just log the scheduled notification
      // In a production app, you'd want to store this in Firebase
      // and have a server-side job that sends notifications at the scheduled time
      
      const scheduledNotification: ScheduledNotification = {
        id: Date.now().toString(),
        userId,
        title: notification.title,
        body: notification.body,
        scheduledFor: scheduledFor.toISOString(),
        data: notification.data,
        sent: false,
        createdAt: new Date().toISOString(),
      };

      console.log('📱 Notification scheduled:', scheduledNotification);
      
      // TODO: Save to Firebase collection for server-side processing
      // await FirebaseService.saveScheduledNotification(scheduledNotification);
      
      return scheduledNotification.id;
    } catch (error) {
      console.error('📱 Error scheduling notification:', error);
      return null;
    }
  }
}