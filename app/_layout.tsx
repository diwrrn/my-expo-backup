import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FooterNavigation } from '@/components/FooterNavigation';
import { useAuth } from '@/hooks/useAuth';
import { router, usePathname } from 'expo-router';
import { View, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/services/i18n';
import { useFonts } from 'expo-font';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useNotifications } from '@/hooks/useNotifications';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS
} from 'react-native-reanimated';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated'; 

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();
  

export default function RootLayout() {
  
  useFrameworkReady();   

  const { expoPushToken, notification, error: notificationError } = useNotifications();
  
  const { user, loading, profileCache, profileLoaded } = useAuth(); 

  const pathname = usePathname();
  const footerOpacity = useSharedValue(0);

  const [i18nInitialized, setI18nInitialized] = useState(false);

  const hasNavigatedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'rudawregular2': require('../assets/fonts/rudawregular2.ttf'),
  });

  // Define isAuthScreen early
const isAuthScreen = pathname?.includes('/(auth)') || pathname === '/login' || pathname === '/register' || pathname?.includes('/onboarding') || pathname?.includes('/workout') || pathname?.includes('/meal-selection');


  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
      pointerEvents: footerOpacity.value === 1 ? 'auto' : 'none',
    };
  });

  useEffect(() => {
    // This logic determines when the footer should be visible
    // It should be visible if not an auth/onboarding/workout screen AND a user is logged in
    const shouldShowFooter = !isAuthScreen && user;
    footerOpacity.value = withTiming(shouldShowFooter ? 1 : 0, { duration: 300 });
  }, [isAuthScreen, user]);

  useEffect(() => {
    // Set i18n as initialized after a short delay to ensure it's ready
    const timer = setTimeout(() => {
      setI18nInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Reset navigation flag if user changes
    if (user?.id !== lastUserIdRef.current) {
      hasNavigatedRef.current = false;
      lastUserIdRef.current = user?.id || null;
    }

    const handleNavigation = async () => {
      // Only proceed if core resources are loaded AND auth state is settled
      if (!i18nInitialized || !fontsLoaded || loading || !profileLoaded) {
        return;
      }

      // 🔧 ADD THIS: Wait for profile cache to finish loading if user exists
      if (user && profileCache.isLoading) {
        console.log('⏳ Waiting for profile to load...');
        return;
      }

      // If already navigated for this user session, prevent re-navigation
      if (hasNavigatedRef.current) {
        return;
      }

      let targetPath: string | null = null;

      if (user) {
        console.log('🔍 Profile check:', {
          hasProfile: !!profileCache.profile,
          onboardingCompleted: user.onboardingCompleted,
          pathname: pathname,
          profileIsLoading: profileCache.isLoading  // Add this to debug
        });
       
        // Now we know profile loading is complete
        if (user.onboardingCompleted === true) {
          targetPath = '/(tabs)';              // ✅ Completed → go to tabs
        } else { 
          targetPath = '/onboarding/language'; 
        }   
      } else { 
        // No user logged in and auth check is complete
        if (pathname?.includes('/login') || pathname?.includes('/register') || pathname?.includes('/forgot-password')) {
          targetPath = pathname; // Stay on the current auth screen
        } else { 
          targetPath = '/(auth)/register'; // Default entry point for unauthenticated users
        } 
      }
         
      // Perform navigation if a target path is determined and it's different from current
      if (targetPath && pathname !== targetPath) {
        console.log(`🎯 NAVIGATING: From ${pathname} to ${targetPath}`);
        router.replace(targetPath);
        hasNavigatedRef.current = true;
      }
    };

    handleNavigation();
  }, [user, loading, profileCache.profile, profileCache.isLoading, i18nInitialized, fontsLoaded, pathname, profileLoaded]);

  useEffect(() => {
    if (!loading && i18nInitialized && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loading, i18nInitialized, fontsLoaded]);

  if (loading || !i18nInitialized || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading application resources...</Text>
      </View> 
    );
  }
 
  return ( 
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} /> 
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="food-details" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />    
        </Stack>
        {!isAuthScreen && user && <FooterNavigation />}
        <StatusBar style="auto" />
      </LanguageProvider>
    </I18nextProvider> 
  );
}