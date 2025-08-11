import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FooterNavigation } from '@/components/FooterNavigation';
import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { router, usePathname } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import { FoodCacheProvider } from '@/contexts/FoodCacheContext';
import i18n from '@/services/i18n';
import { useFonts } from 'expo-font';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import Purchases from 'react-native-purchases';
import { PremiumProvider } from '@/contexts/PremiumContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { DailyMealsProvider } from '@/contexts/DailyMealsProvider';
//import { useNotifications } from '@/hooks/useNotifications';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated'; 

import { revenueCatService } from '@/services/revenueCatService';

// Configure Reanimated logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  // Call ALL hooks first before any conditional logic
  useFrameworkReady();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  
  const footerOpacity = useSharedValue(0);
  //const { expoPushToken, notification } = useNotifications();
  const [i18nInitialized, setI18nInitialized] = useState(false);
  const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
  const hasNavigatedRef = useRef(false);
 // const { expoPushToken, notification, error: notificationError, isLoading: notificationLoading } = useNotifications();
  console.log('🔍 Debug - User data:', { 
    userId: user?.id, 
    onboardingCompleted: user?.onboardingCompleted,
    user: user 
  });
  // Add this debug log
  //console.log('🔍 Debug - notificationLoading:', notificationLoading, 'notificationError:', notificationError); 
   const [fontsLoaded, fontError] = useFonts({
    'rudawregular2': require('../assets/fonts/rudawregular2.ttf'),
  });

  // Simple auth-based navigation check
  const isAuthScreen = pathname?.includes('/(auth)') || 
                      pathname === '/login' || 
                      pathname === '/register' || 
                      pathname?.includes('/onboarding') || 
                      pathname?.includes('/workout') || 
                      pathname?.includes('/meal-selection');

  const footerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: footerOpacity.value,
      pointerEvents: footerOpacity.value === 1 ? 'auto' : 'none',
    };
  });

  // Footer visibility logic
  useEffect(() => {
    const shouldShowFooter = !isAuthScreen && user;
    footerOpacity.value = withTiming(shouldShowFooter ? 1 : 0, { duration: 300 });
  }, [isAuthScreen, user]);

  // Initialize i18n
  useEffect(() => {
    const timer = setTimeout(() => {
      setI18nInitialized(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Initialize RevenueCat
  useEffect(() => {
    if (i18nInitialized && fontsLoaded && !loading && !revenueCatInitialized) {
      const initRevenueCat = async () => {
        try {
          if (user?.id) {
            await revenueCatService.initialize(user.id);
          } else {
            await revenueCatService.initialize();
          }
          setRevenueCatInitialized(true);
        } catch (error) {
          setRevenueCatInitialized(true);
        }
      };
      
      initRevenueCat();
    }
  }, [user?.id, i18nInitialized, fontsLoaded, loading, revenueCatInitialized]);

  // Reset navigation flag on user change
  useEffect(() => {
    hasNavigatedRef.current = false;
  }, [user?.id]);

  // Simple navigation logic
  useEffect(() => {
    if (!i18nInitialized || !fontsLoaded || !revenueCatInitialized || loading) {
      console.log('🔍 Debug - Loading check:', { i18nInitialized, fontsLoaded, revenueCatInitialized, loading });
      return;
    }
    if (hasNavigatedRef.current) {
      return;
    }

    let targetPath: string | null = null;

    if (user) {
      if (user.onboardingCompleted === true) {
        targetPath = '/(tabs)';
      } else { 
        targetPath = '/onboarding/language'; 
      }   
    } else { 
      // Don't redirect if already on an auth screen
      if (!isAuthScreen) {
        targetPath = '/(auth)/register';
      }
    }
         
    if (targetPath && pathname !== targetPath) {
      router.replace(targetPath as any);
      hasNavigatedRef.current = true;
    }
  }, [user, i18nInitialized, fontsLoaded, pathname, revenueCatInitialized, loading, isAuthScreen]);

  // Loading state
  if (loading || !i18nInitialized || !fontsLoaded || !revenueCatInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading application resources...</Text>
      </View> 
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <FoodCacheProvider>
          <PremiumProvider>
            <ProfileProvider>
              <DailyMealsProvider>
                  {loading || !i18nInitialized || !fontsLoaded || !revenueCatInitialized ? (
                    <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
                      <Text>Loading application resources...</Text>
                    </View>
                  ) : (
                    <>
                      <Stack>
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      {!isAuthScreen && user && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          zIndex: 9999,
                        }}>
                          <FooterNavigation />
                        </View>
                      )}
                    </>
                  )}
              </DailyMealsProvider>

            </ProfileProvider>
          </PremiumProvider>
        </FoodCacheProvider>
      </LanguageProvider>
    </I18nextProvider>
  );
}