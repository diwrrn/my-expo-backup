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
 const [i18nInitialized, setI18nInitialized] = useState(false);
 const [revenueCatInitialized, setRevenueCatInitialized] = useState(false);
 const [showAppAnyway, setShowAppAnyway] = useState(false);
 const hasNavigatedRef = useRef(false);

 console.log('🔍 Debug - User data:', { 
   userId: user?.id, 
   onboardingCompleted: user?.onboardingCompleted,
   user: user 
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

 // Footer visibility logic
 useEffect(() => {
   const shouldShowFooter = !isAuthScreen && user;
   footerOpacity.value = withTiming(shouldShowFooter ? 1 : 0, { duration: 300 });
 }, [isAuthScreen, user]);

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

 // Background initialization - don't block app
 useEffect(() => {
   if (i18nInitialized && fontsLoaded && !loading) {
     const initRevenueCat = async () => {
       try {
         if (user?.id) {
           await revenueCatService.initialize(user.id);
         } else {
           await revenueCatService.initialize();
         }
         setRevenueCatInitialized(true);
       } catch (error) {
         // Fail silently, retry later
         setRevenueCatInitialized(true);
       }
     };
     
     // Initialize in background after app shows
     setTimeout(initRevenueCat, 100);
   }
 }, [user?.id, i18nInitialized, fontsLoaded, loading]);

 // Reset navigation flag on user change
 useEffect(() => {
   hasNavigatedRef.current = false;
 }, [user?.id]);

// Simple navigation logic
useEffect(() => {
  if ((!i18nInitialized || !fontsLoaded || loading) && !showAppAnyway) {
    return;
  }
  if (hasNavigatedRef.current) {
    return;
  }

  // Wait one frame to ensure router is ready
  setTimeout(() => {
    let targetPath: string | null = null;

    if (user) {
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
}, [user, i18nInitialized, fontsLoaded, pathname, loading, isAuthScreen, showAppAnyway]); 
 // Loading state with timeout
 if ((!i18nInitialized || !fontsLoaded || loading) && !showAppAnyway) {
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
             </DailyMealsProvider>
           </ProfileProvider>
         </PremiumProvider>
       </FoodCacheProvider>
     </LanguageProvider>
   </I18nextProvider>
 );
}