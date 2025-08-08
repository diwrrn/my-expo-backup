import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from './useAuth';
import { FirebaseService } from '@/services/firebaseService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotifications() {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check permission status
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    
    checkPermission();
  }, []);

  // Initialize notifications and get push token
  useEffect(() => {
    if (!user?.id || permissionStatus !== 'granted') {
      return;
    }

    const initializeNotifications = async () => {
      try {
        setIsLoading(true);

        // Save timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await FirebaseService.saveUserTimezone(user.id, timezone);
        console.log('📱 Timezone saved:', timezone);

        // Get Expo push token (now with FCM credentials)
        if (!Device.isDevice) {
          console.log('📱 Must use physical device for Push Notifications');
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('📱 Expo push token obtained:', token);
        setExpoPushToken(token);

        // Save push token to Firebase
        await FirebaseService.savePushToken(user.id, token);
        console.log('📱 Push token saved to Firebase');

      } catch (error) {
        console.error(' Error initializing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeNotifications();
  }, [user?.id, permissionStatus]);

  const requestPermission = async () => {
    setIsLoading(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      return status === 'granted';
    } catch (error) {
      console.error('📱 Error requesting permission:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (permissionStatus !== 'granted') {
      return false;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from your app!',
          data: { type: 'test' },
        },
        trigger: null, // Send immediately
      });
      return true;
    } catch (error) {
      console.error(' Error sending test notification:', error);
      return false;
    }
  };

  return {
    permissionStatus,
    expoPushToken,
    isLoading,
    requestPermission,
    sendTestNotification,
  };
}