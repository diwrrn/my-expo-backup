import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '@/store/appStore';
import { FirebaseService } from '@/services/firebaseService';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

type CacheShape = {
  timezone?: string;
  token?: string;
  savedAt?: number;
};

export function useNotifications() {
  const user = useAppStore(state => state.user);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermission();
  }, []);

  useEffect(() => {
    if (!user?.id || permissionStatus !== 'granted') return;

    // Avoid double invoke in dev StrictMode / repeated mounts
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeNotifications = async () => {
      try {
        setIsLoading(true);

        const cacheKey = `notif:lastSaved:${user.id}`;
        const raw = await AsyncStorage.getItem(cacheKey);
        let cache: CacheShape = {};
        try {
          cache = raw ? JSON.parse(raw) : {};
        } catch {
          cache = {};
        }

        // Save timezone only if changed (no Firestore read)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (cache.timezone !== timezone) {
          await FirebaseService.saveUserTimezone(user.id, timezone);
          cache.timezone = timezone;
          cache.savedAt = Date.now();
          console.log('📱 Timezone saved:', timezone);
        } else {
          console.log('📱 Timezone unchanged, skip save');
        }

        // Get Expo push token (must be physical device)
        if (!Device.isDevice) {
          console.log('📱 Must use physical device for Push Notifications');
          return;
        }

        const projectId =
          (Constants.expoConfig as any)?.extra?.eas?.projectId ??
          (Constants as any)?.easConfig?.projectId;

        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('📱 Expo push token obtained:', token);
        setExpoPushToken(token);

        // Save push token only if changed (no Firestore read)
        if (cache.token !== token) {
          await FirebaseService.savePushToken(user.id, token);
          cache.token = token;
          cache.savedAt = Date.now();
          console.log('📱 Push token saved to Firebase');
        } else {
          console.log('📱 Push token unchanged, skip save');
        }

        // Persist cache
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cache));
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
    if (permissionStatus !== 'granted') return false;

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