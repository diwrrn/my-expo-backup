import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
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

export function NotificationManager() {
  const user = useAppStore(state => state.user);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user?.id || isInitialized.current) {
      return;
    }

    isInitialized.current = true;

    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification response received:', response);
    });

    // Save timezone
    const saveTimezone = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        await FirebaseService.saveUserTimezone(user.id, timezone);
        console.log('📱 Timezone saved:', timezone);
      } catch (error) {
        console.error('📱 Error saving timezone:', error);
      }
    };

    saveTimezone();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [user?.id]);

  return null; // This component doesn't render anything
}