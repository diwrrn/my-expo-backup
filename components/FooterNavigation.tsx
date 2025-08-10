import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { Plus, Calculator, ChartBar as BarChart3, Chrome as Home, User, UtensilsCrossed } from 'lucide-react-native';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation } from 'react-i18next';

import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolateColor 
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

interface NavItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  isHome?: boolean;
}

export function FooterNavigation() {
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState(pathname);

  // Animation values for each button
  const addPressAnimation = useSharedValue(0);
  const calculatorPressAnimation = useSharedValue(0);
  const homePressAnimation = useSharedValue(0);
  const mealPlannerPressAnimation = useSharedValue(0);
  const profilePressAnimation = useSharedValue(0);
  
  const { t } = useTranslation();
  const isRTL = useRTL();

  // Double-tap prevention
  const lastPressTime = useRef<number>(0);
  const DOUBLE_TAP_DELAY = 500; // 500ms cooldown

  const navItems: NavItem[] = [
    {
      id: 'add',
      title: t('common:add'),
      icon: <Plus size={22} color="#6B7280" />,
      route: '/(tabs)/add',
    },
    {
      id: 'calculator',
      title: t('common:calculator'),
      icon: <Calculator size={22} color="#6B7280" />,
      route: '/(tabs)/calculator',
    },
    {
      id: 'home',
      title: t('common:home'),
      icon: <Home size={26} color="#FFFFFF" />,
      route: '/(tabs)/',
      isHome: true,
    },
    {
      id: 'meal-planner',
      title: t('common:mealPlanner'),
      icon: <UtensilsCrossed size={22} color="#6B7280" />,
      route: '/(tabs)/meal-planner',
    },
    {
      id: 'profile',
      title: t('common:profile'),
      icon: <User size={22} color="#6B7280" />,
      route: '/(tabs)/profile',
    },
  ];

  // Update active route when pathname changes
  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  const handleNavPress = useCallback((route: string, itemId: string) => {
    const now = Date.now();
    if (now - lastPressTime.current < DOUBLE_TAP_DELAY) {
      return; // Prevent double-tap
    }
    lastPressTime.current = now;
    
    router.push(route as any);
  }, []);

  const getAnimationValue = (itemId: string) => {
    switch (itemId) {
      case 'add': return addPressAnimation;
      case 'calculator': return calculatorPressAnimation;
      case 'home': return homePressAnimation;
      case 'meal-planner': return mealPlannerPressAnimation;
      case 'profile': return profilePressAnimation;
      default: return addPressAnimation;
    }
  };

  const handlePressIn = useCallback((itemId: string) => {
    const animation = getAnimationValue(itemId);
    animation.value = withTiming(1, { duration: 150 });
  }, []);

  const handlePressOut = useCallback((itemId: string) => {
    const animation = getAnimationValue(itemId);
    animation.value = withTiming(0, { duration: 200 });
  }, []);

  const isActive = useCallback((route: string) => {
    if (route === '/(tabs)/') {
      return activeRoute === '/(tabs)/' || activeRoute === '/';
    }
    return activeRoute === route;
  }, [activeRoute]);

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background} />
      
      {/* Top border */}
      <View style={styles.topBorder} />
      
      {/* Navigation items */}
      <View style={styles.navContainer}>
        {navItems.map((item, index) => {
          const active = isActive(item.route);
          const animationValue = getAnimationValue(item.id);
          
          if (item.isHome) {
            // Home button with special press animation (keep as-is)
            const homeAnimatedStyle = useAnimatedStyle(() => {
              const scale = withSpring(1 - homePressAnimation.value * 0.1);
              const shadowOpacity = 0.3 + (homePressAnimation.value * 0.2);
              
              return {
                transform: [{ scale }],
                shadowOpacity,
              };
            });

            return (
              <View key={item.id} style={styles.homeContainer}>
                {/* Home button */}
                <Animated.View style={[styles.homeButtonWrapper, homeAnimatedStyle]}>
                  <TouchableOpacity
                    style={[styles.homeButton, active && styles.homeButtonActive]}
                    onPress={() => handleNavPress(item.route, item.id)}
                    onPressIn={() => handlePressIn(item.id)}
                    onPressOut={() => handlePressOut(item.id)}
                    activeOpacity={1}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, {
                      color: '#FFFFFF',
                      size: 24,
                    })}
                  </TouchableOpacity>
                </Animated.View>
                
                <Text style={[styles.homeLabel, active && styles.homeLabelActive]}>
                  {item.title}
                </Text>
              </View>
            );
          }

          // Create animated background style
          const animatedBackgroundStyle = useAnimatedStyle(() => {
            const backgroundColor = interpolateColor(
              animationValue.value,
              [0, 1],
              ['transparent', active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.1)']
            );
            
            const scale = withSpring(1 - animationValue.value * 0.02);
            
            return {
              backgroundColor,
              transform: [{ scale }],
            };
          });

          return (
            <View key={item.id} style={styles.navItem}>
              {/* Animated background layer - fills entire nav item */}
              <Animated.View style={[styles.animatedBackground, animatedBackgroundStyle]} />
              
              {/* Touch layer on top */}
              <TouchableOpacity
                style={styles.fullTouchArea}
                onPress={() => handleNavPress(item.route, item.id)}
                onPressIn={() => handlePressIn(item.id)}
                onPressOut={() => handlePressOut(item.id)}
                activeOpacity={1}
              >
                <View style={styles.navIconContainer}>
                  {React.cloneElement(item.icon as React.ReactElement, {
                    color: active ? '#22C55E' : '#6B7280',
                    size: 20,
                  })}
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    height: Platform.OS === 'ios' ? 92 : 76,
  },
  
  // NEW: Nav item with relative positioning for absolute children
  navItem: {
    flex: 1,
    height: '100%',
    position: 'relative', // Allow absolute positioned children
    marginHorizontal: 2,
  },
  
  // NEW: Absolute positioned animated background that bleeds into padding
  animatedBackground: {
    position: 'absolute',
    top: -16,    // Extend up into nav container's paddingTop
    left: -8,    // Extend left into horizontal spacing
    right: -8,   // Extend right into horizontal spacing  
    bottom: Platform.OS === 'ios' ? -34 : -16, // Extend down into paddingBottom
    borderRadius: 12,
    zIndex: 1, // Behind touch layer
  },
  
  // NEW: Full touch area on top of background
  fullTouchArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Above background
  },
  
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 13,
  },
  navLabelActive: {
    color: '#22C55E',
    fontWeight: '700',
  },
  
  // Home button specific styles (unchanged)
  homeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.3,
    paddingVertical: 6,
    position: 'relative',
  },
  homeButtonWrapper: {
    marginBottom: 6,
  },
  homeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonActive: {
    backgroundColor: '#15803D',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  homeLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#22C55E',
    textAlign: 'center',
    lineHeight: 15,
  },
  homeLabelActive: {
    color: '#15803D',
  },
}); 