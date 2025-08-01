import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from './useAuth';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Change this to false
    shouldPlaySound: false, // Change this to false
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title?: string;
  body?: string;
  data?: any;
}

export interface UseNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  isLoading: boolean;
  sendTestNotification: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Function to register for push notifications
  async function registerForPushNotificationsAsync(): Promise<string | null> {
    try {
      let token: string | null = null;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          throw new Error('Failed to get push token for push notification!');
        }
        
        // Get the Expo push token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        
        console.log('📱 Push token obtained:', token);
      } else {
        console.log('📱 Must use physical device for Push Notifications');
        throw new Error('Must use physical device for Push Notifications');
      }

      return token;
    } catch (error) {
      console.error('📱 Error getting push token:', error);
      throw error;
    }
  }

  // Function to send a test notification (for development)
  const sendTestNotification = async () => {
    if (!expoPushToken) {
      setError('No push token available');
      return;
    }

    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Test Notification',
        body: 'This is a test notification from your meal planning app!',
        data: { testData: 'some data' },
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
      console.log('📱 Test notification sent:', result);
    } catch (error) {
      console.error('📱 Error sending test notification:', error);
      setError('Failed to send test notification');
    }
  };

  // Set up notification listeners and register for push notifications
  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Register for push notifications
        const token = await registerForPushNotificationsAsync();
        
        if (isMounted) {
          setExpoPushToken(token);
          
          // Save token to Firebase if user is logged in
          if (token && user?.id) {
            try {
              await FirebaseService.savePushToken(user.id, token);
              console.log('📱 Push token saved to Firebase for user:', user.id);
            } catch (firebaseError) {
              console.error('📱 Error saving push token to Firebase:', firebaseError);
              setError('Failed to save push token to server');
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to setup notifications';
          setError(errorMessage);
          console.error('📱 Notification setup error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification); // This line already logs the notification
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response received:', response);
      
      // Handle notification tap here
      const notificationData = response.notification.request.content.data;
      
      // Example: Navigate to specific screen based on notification data
      if (notificationData?.screen) {
        // You can add navigation logic here based on the notification data
        console.log('📱 Should navigate to:', notificationData.screen);
      }
    });

    // Only setup notifications if user is logged in
    if (user?.id) {
      setupNotifications();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);

  return {
    expoPushToken,
    notification,
    error,
    isLoading,
    sendTestNotification,
  };
}
