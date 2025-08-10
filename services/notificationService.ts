/**
 * Notification Service for Expo
 * - Remote push via Expo push service (using stored Expo push tokens)
 * - Local daily meal reminders (customizable per meal, persisted in AsyncStorage)
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type MealType = 'breakfast' | 'lunch' | 'dinner';

export class NotificationService {
  /**
   * Initialize notifications and get push token (does not save to Firestore)
   */
  static async initializeNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
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

      // Get Expo push token (SDK 52: projectId required when using dev client/EAS)
      const projectId =
        (Constants.expoConfig as any)?.extra?.eas?.projectId ??
        (Constants as any)?.easConfig?.projectId;

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      return token;
    } catch (error) {
      console.error('📱 Error initializing notifications:', error);
      return null;
    }
  }

  /**
   * Send a push notification to a specific user via Expo push service
   */
  static async sendNotificationToUser(
    userId: string,
    notification: NotificationPayload
  ): Promise<boolean> {
    try {
      // Get user's push token from Firebase
      const pushToken = await FirebaseService.getPushToken(userId);

      if (!pushToken) {
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

      if ((result as any).data && (result as any).data.status === 'ok') {
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
        action: 'open_stats',
      },
      sound: 'default',
      badge: 1,
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
        action: 'open_stats',
      },
      sound: 'default',
      badge: 1,
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
        value,
      },
      sound: 'default',
      badge: 1,
    });
  }

  /**
   * Send meal reminder notification (remote push variant)
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
      },
      sound: 'default',
      badge: 1,
    });
  }

  /**
   * Test notification (remote push)
   */
  static async sendTestNotification(userId: string): Promise<boolean> {
    return await this.sendNotificationToUser(userId, {
      title: '🧪 Test Notification',
      body: 'This is a test notification from your meal planning app!',
      data: {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
      sound: 'default',
      badge: 1,
    });
  }

  // =========================
  // Local Daily Meal Reminders (Customizable)
  // =========================

  private static readonly MEAL_REMINDER_STORAGE_KEY = 'meal_reminder_settings_v2';
  private static readonly DEFAULT_MEAL_TIMES: Record<MealType, { hour: number; minute: number }> = {
    breakfast: { hour: 11, minute: 0 },
    lunch: { hour: 15, minute: 0 },
    dinner: { hour: 20, minute: 30 },
  };

  static async getMealReminderSettings(): Promise<{
    enabled: Record<MealType, boolean>;
    ids: Partial<Record<MealType, string>>;
    times: Record<MealType, { hour: number; minute: number }>;
  }> {
    try {
      const raw = await AsyncStorage.getItem(this.MEAL_REMINDER_STORAGE_KEY);
      if (!raw) {
        return { enabled: { breakfast: false, lunch: false, dinner: false }, ids: {}, times: this.DEFAULT_MEAL_TIMES };
      }
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? { breakfast: false, lunch: false, dinner: false },
        ids: parsed.ids ?? {},
        times: parsed.times ?? this.DEFAULT_MEAL_TIMES,
      };
    } catch {
      return { enabled: { breakfast: false, lunch: false, dinner: false }, ids: {}, times: this.DEFAULT_MEAL_TIMES };
    }
  }

  private static async saveMealReminderSettings(settings: {
    enabled: Record<MealType, boolean>;
    ids: Partial<Record<MealType, string>>;
    times: Record<MealType, { hour: number; minute: number }>;
  }) {
    await AsyncStorage.setItem(this.MEAL_REMINDER_STORAGE_KEY, JSON.stringify(settings));
  }

  private static async ensureAndroidChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  private static mealCopy(meal: MealType) {
    if (meal === 'breakfast') {
      return {
        title: 'Log your breakfast 🌅',
        body: 'Reminder to log your morning food to keep your streak!',
      };
    }
    if (meal === 'lunch') {
      return {
        title: 'Lunch reminder 🍽️',
        body: 'Log your lunch and stay on track!',
      };
    }
    return {
      title: 'Dinner reminder 🌙',
      body: 'Don’t forget to log your dinner!',
    };
  }

  private static async scheduleLocalMealReminder(
    meal: MealType,
    hour: number,
    minute: number
  ): Promise<string> {
    await this.ensureAndroidChannel();
    const content = this.mealCopy(meal);

    // Daily trigger (Android/iOS)
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        sound: 'default',
        data: { type: 'meal_reminder', meal },
      },
      trigger: {
        type: 'daily',
        hour,
        minute,
        repeats: true,
      } as Notifications.DailyTriggerInput,
    });

    return id;
  }

  private static async cancelLocalReminderById(id?: string) {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // ignore
      }
    }
  }

  static async setMealReminderEnabled(meal: MealType, enabled: boolean): Promise<void> {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') throw new Error('Notifications permission not granted');
  
    const settings = await this.getMealReminderSettings();
    
    // Cancel ALL existing notifications for this meal type (not just the stored ID)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const mealNotifications = scheduled.filter(n => 
      n.content.data?.type === 'meal_reminder' && 
      n.content.data?.meal === meal
    );
    
    await Promise.all(mealNotifications.map(n => 
      Notifications.cancelScheduledNotificationAsync(n.identifier)
    ));
  
    if (enabled) {
      const { hour, minute } = settings.times[meal] ?? this.DEFAULT_MEAL_TIMES[meal];
      const id = await this.scheduleLocalMealReminder(meal, hour, minute);
      settings.enabled[meal] = true;
      settings.ids[meal] = id;
    } else {
      settings.enabled[meal] = false;
      delete settings.ids[meal];
    }
  
    await this.saveMealReminderSettings(settings);
  }

  static async setMealReminderTime(meal: MealType, hour: number, minute: number): Promise<void> {
    const settings = await this.getMealReminderSettings();
    settings.times[meal] = { hour, minute };
  
    // If enabled, reschedule with the new time
    if (settings.enabled[meal]) {
      // Cancel ALL existing notifications for this meal type
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const mealNotifications = scheduled.filter(n => 
        n.content.data?.type === 'meal_reminder' && 
        n.content.data?.meal === meal
      );
      
      await Promise.all(mealNotifications.map(n => 
        Notifications.cancelScheduledNotificationAsync(n.identifier)
      ));
      
      const id = await this.scheduleLocalMealReminder(meal, hour, minute);
      settings.ids[meal] = id;
    }
  
    await this.saveMealReminderSettings(settings);
  }

  static async disableAllMealReminders(): Promise<void> {
    
    // Cancel ALL meal reminder notifications (not just stored IDs)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const mealNotifications = scheduled.filter(n => 
      n.content.data?.type === 'meal_reminder'
    );
    
    await Promise.all(mealNotifications.map(n => 
      Notifications.cancelScheduledNotificationAsync(n.identifier)
    ));
    
    // Reset settings completely
    await this.saveMealReminderSettings({
      enabled: { breakfast: false, lunch: false, dinner: false },
      ids: {}, // Clear all stored IDs
      times: this.DEFAULT_MEAL_TIMES,
    });
    
  }
  static async cleanupDuplicateNotifications(): Promise<void> {
    
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const mealNotifications = scheduled.filter(n => 
      n.content.data?.type === 'meal_reminder'
    );
    
    // Group by meal type
    const byMeal: Record<string, any[]> = {};
    mealNotifications.forEach(n => {
      const meal = n.content.data?.meal;
      if (!byMeal[meal]) byMeal[meal] = [];
      byMeal[meal].push(n);
    });
    
    // Keep only the first notification for each meal, cancel the rest
    let cancelledCount = 0;
    for (const [meal, notifications] of Object.entries(byMeal)) {
      if (notifications.length > 1) {
        for (let i = 1; i < notifications.length; i++) {
          await Notifications.cancelScheduledNotificationAsync(notifications[i].identifier);
          cancelledCount++;
        }
      }
    }
    
  }
}