import { useEffect, useState, useRef } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FooterNavigation } from '@/components/FooterNavigation';
import React, { createContext, useContext } from 'react';
import { SessionProvider, useSession } from '../ctx';
import { SplashScreenController } from '../splash';
import { View, Text, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/services/i18n';
import { useFonts } from 'expo-font';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
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
import { useAppStore } from '@/store/appStore';

// Configure Reanimated logger
configureReanimatedLogger({
 level: ReanimatedLogLevel.warn,
 strict: false,
});

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SessionProvider>
      <SplashScreenController />
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  useEffect(() => {
    console.log('🚨 ROOT LAYOUT RE-RENDERED');
  });

 // Call ALL hooks first before any conditional logic
 useFrameworkReady();
 const { session, user, isLoading: authLoading } = useSession();
 const pathname = usePathname();
 
 const footerOpacity = useSharedValue(0);
 const [i18nInitialized, setI18nInitialized] = useState(false);
 const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
 const [showAppAnyway, setShowAppAnyway] = useState(false);
 const hasNavigatedRef = useRef(false);

 console.log('🔍 Debug - User data:', { 
   userId: user?.id, 
   onboardingCompleted: user?.onboardingCompleted,
   session: !!session
 });

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

useEffect(() => {
  console.log('🔍 ROOT LAYOUT - session changed:', !!session);
}, [session]);

useEffect(() => {
  console.log('🔍 ROOT LAYOUT - authLoading changed:', authLoading);
}, [authLoading]);

useEffect(() => {
  console.log('🔍 ROOT LAYOUT - pathname changed:', pathname);
}, [pathname]);

 // Footer visibility logic
 useEffect(() => {
   const shouldShowFooter = !isAuthScreen && session;
   footerOpacity.value = withTiming(shouldShowFooter ? 1 : 0, { duration: 300 });
 }, [isAuthScreen, session]);

 // Force show app after 2 seconds max
 useEffect(() => {
   const timeout = setTimeout(() => {
     setShowAppAnyway(true);
   }, 2000);
   
   return () => clearTimeout(timeout);
 }, []);

 // Initialize i18n
 useEffect(() => {
   const timer = setTimeout(() => {
     setI18nInitialized(true);
   }, 100);
   
   return () => clearTimeout(timer);
 }, []);

// Initialize premium status from AsyncStorage
useEffect(() => {
  useAppStore.getState().initializePremiumStatus();
}, []);

 // Background initialization - don't block app
 useEffect(() => {
   if (i18nInitialized && fontsLoaded && !authLoading) {
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
     
     setTimeout(initRevenueCat, 100);
   }
 }, [user?.id, i18nInitialized, fontsLoaded, authLoading]);

 useEffect(() => {
  if (user?.id) {
    useAppStore.getState().loadDailyMeals();
  }
}, [user?.id]);  

 // Reset navigation flag on user change
 useEffect(() => {
   hasNavigatedRef.current = false;
 }, [user?.id]);

// Simple navigation logic
useEffect(() => {
  if ((!i18nInitialized || !fontsLoaded || authLoading) && !showAppAnyway) {
    return;
  }
  if (hasNavigatedRef.current) {
    return;
  }

  setTimeout(() => {
    let targetPath: string | null = null;

    if (session && user) {
      if (user.onboardingCompleted === true) {
        targetPath = '/(tabs)';
      } else { 
        targetPath = '/onboarding/language'; 
      }   
    } else { 
      if (!isAuthScreen) {
        targetPath = '/(auth)/register';
      }
    }
         
    if (targetPath && pathname !== targetPath) {
      router.replace(targetPath as any);
      hasNavigatedRef.current = true;
    }
  }, 0);
}, [session, user, i18nInitialized, fontsLoaded, pathname, authLoading, isAuthScreen, showAppAnyway]); 

 // Loading state with timeout
 if ((!i18nInitialized || !fontsLoaded || authLoading) && !showAppAnyway) {
   return (
     <View style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
       <Text>Loading application resources...</Text>
     </View> 
   );
 }

 return (
   <I18nextProvider i18n={i18n}>
     <>
     <Stack 
        screenOptions={{
          headerShown: false,  // Global header disable
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
          </>
        ) : (
          <>
            <Stack.Screen name="(auth)" />
          </>
        )}
        
        <Stack.Screen name="+not-found" />
      </Stack>
       {!isAuthScreen && session && (
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
   </I18nextProvider>
 );
}