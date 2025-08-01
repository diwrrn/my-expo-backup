import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OnboardingLayout() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading) return;

      // If user is not logged in, redirect to auth
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }
 
      // Check if onboarding is completed
      try {
        const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
        
        // If user has profile data and onboarding is completed, redirect to main app
        // Only redirect if onboarding is actually completed, regardless of profile
if (onboardingCompleted === 'true') {
  console.log('🎯 ONBOARDING LAYOUT: Redirecting to main app - onboarding completed');
  router.replace('/(tabs)');
} else {
  console.log('🎯 ONBOARDING LAYOUT: Staying in onboarding - not completed yet');
}
      } catch (error) {
        console.error('Error checking onboarding status:', error);
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