import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAppStore } from '@/store/appStore';

export default function OnboardingLayout() {
  const user = useAppStore(state => state.user);
  const loading = useAppStore(state => state.userLoading);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading) return;

      // If user is not logged in, redirect to auth
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
 
      // Check if onboarding is completed using user profile (single source of truth)
      if (user.onboardingCompleted === true) {
        console.log('�� ONBOARDING LAYOUT: Redirecting to main app - onboarding completed');
        router.replace('/(tabs)');
      } else {
        console.log('�� ONBOARDING LAYOUT: Staying in onboarding - not completed yet');
      }
    };

    checkOnboardingStatus();
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="language" />
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="activity-level" />
    </Stack>
  );
}