/**
 * Firebase Notification Service for Expo
 * Handles push notifications using Firebase Cloud Messaging
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { FirebaseService } from './firebaseService';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
}

export interface PushToken {
  token: string;
  platform: 'ios' | 'android';
  createdAt: string;
}

export class NotificationService {
  /**
   * Initialize notifications and get push token
   */
  static async initializeNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('📱 Must use physical device for Push Notifications');
        return null;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('📱 Push notifications not granted');
        return null;
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;

      console.log('📱 Push token obtained:', token);
      return token;
    } catch (error) {
      console.error('📱 Error initializing notifications:', error);
      return null;
    }
  }

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
   * Send weekly report notification
   */
  static async sendWeeklyReportNotification(userId: string): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: '📊 Your Weekly Report is Ready!',
      body: 'Generate your nutrition summary for the previous week and track your progress.',
      data: {
        type: 'weekly_report_ready',
        action: 'open_stats'
      },
      sound: 'default',
      badge: 1
    });
  }

  /**
   * Send monthly report notification
   */
  static async sendMonthlyReportNotification(userId: string): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: '📈 Your Monthly Report is Ready!',
      body: 'Review your monthly nutrition progress and achievements.',
      data: {
        type: 'monthly_report_ready',
        action: 'open_stats'
      },
      sound: 'default',
      badge: 1
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
    const titles = {
      calories: '🎯 Calorie Goal Achieved!',
      protein: '💪 Protein Goal Achieved!',
      water: '💧 Water Goal Achieved!',
      streak: '🔥 Streak Milestone!',
    };

    const bodies = {
      calories: `Great job! You've reached your daily calorie goal of ${value} calories.`,
      protein: `Excellent! You've hit your protein target of ${value}g today.`,
      water: `Amazing! You've reached your water goal of ${value}ml today.`,
      streak: `Incredible! You've maintained a ${value}-day streak!`,
    };

    return await this.sendNotificationToUser(userId, {
      title: titles[goalType],
      body: bodies[goalType],
      data: {
        type: 'goal_achievement',
        goalType,
        value
      },
      sound: 'default',
      badge: 1
    });
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
        mealType
      },
      sound: 'default',
      badge: 1
    });
  }

  /**
   * Test notification (for development)
   */
  static async sendTestNotification(userId: string): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: '🧪 Test Notification',
      body: 'This is a test notification from your meal planning app!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString()
      },
      sound: 'default',
      badge: 1
    });
  }
} 