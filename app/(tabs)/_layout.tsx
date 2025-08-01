// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useFonts } from 'expo-font';

export default function TabLayout() {
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();

  return (
    <Tabs
      key={i18n.language}
      screenOptions={{
  headerShown: false,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '400',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  tabBarItemStyle: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
  },
  tabBar: () => null,
  tabBarStyle: { display: 'none', height: 0 }
}}
    >
      <Tabs.Screen name="index" options={{ title: t('common:home') }} />
      <Tabs.Screen name="add" options={{ title: t('common:add') }} />
      <Tabs.Screen name="calculator" options={{ title: t('common:calculator') }} />
      <Tabs.Screen name="daily-goals" /> 
      <Tabs.Screen name="meal-planner" options={{ title: t('common:mealPlanner'), unmountOnBlur: false,  }} />
      <Tabs.Screen name="settings" options={{ title: t('common:settings') }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="add/meal-selection"  />
      <Tabs.Screen name="food-details"  />
      <Tabs.Screen name="saved-meal-plans" />
      <Tabs.Screen name="meal-plan-details"  />
      <Tabs.Screen name="meal-planner-food-details" />
      <Tabs.Screen name="profile" options={{ title: t('common:profile') }} />
      <Tabs.Screen name="faqs" options={{ headerShown: false }} /> {/* NEW: Add this line */}
      {/* NEW: Add this line for the food request feature */}
      <Tabs.Screen name="food-request" options={{ headerShown: false }} />
    </Tabs>
  );
}