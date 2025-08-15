import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Menu, X, Chrome as Home, Plus, Calculator, User, UtensilsCrossed, Target, Settings, LogOut, Dumbbell, MessageSquarePlus } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  interpolate,
  runOnJS,
  Easing,
  FadeIn,
  SlideInLeft,
  SlideInRight
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useSession } from '@/ctx';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface HamburgerMenuProps {
  currentRoute?: string;
}

export function HamburgerMenu({ currentRoute }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useSession();
  const isRTL = useRTL();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    hamburgerButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 0.5,
      borderColor: 'rgba(0,0,0,0.06)',
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    overlayTouchable: {
      flex: 1,
    },
    menuPanel: {
      position: 'absolute',
      left: isRTL ? undefined : 0,
      right: isRTL ? 0 : undefined,
      top: 0,
      bottom: 0,
      width: Math.min(screenWidth * 0.82, 320),
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: isRTL ? -8 : 8, height: 0 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 20,
    },
    menuContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    menuHeader: {
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: '#FAFBFC',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.04)',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.04)',
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    userSection: {
      marginTop: 8,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      borderRadius: 12,
      padding: 8,
      backgroundColor: 'transparent',
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    userSectionPressable: {
      //backgroundColor: 'rgba(34, 197, 94, 0.05)',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 2,
      textAlign: getTextAlign(isRTL),
      letterSpacing: -0.3,
    },
    userPhone: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      opacity: 0.8,
    },
    menuItems: {
      flex: 1,
    },
    menuItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 20,
      marginVertical: 1,
      marginHorizontal: 16,
      borderRadius: 14,
      backgroundColor: 'transparent',
      position: 'relative',
      overflow: 'hidden',
    },
    menuItemActive: {
      backgroundColor: '#F0FDF4',
      borderWidth: 1,
      borderColor: '#BBF7D0',
    },
    menuItemIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 14,
      marginLeft: isRTL ? 14 : 0,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.04)',
    },
    menuItemIconActive: {
      backgroundColor: '#DCFCE7',
      borderColor: '#BBF7D0',
      transform: [{ scale: 1.05 }],
    },
    menuItemContent: {
      flex: 1,
      paddingRight: isRTL ? 0 : 8,
      paddingLeft: isRTL ? 8 : 0,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1E293B',
      marginBottom: 2,
      letterSpacing: -0.2,
    },
    menuItemTitleActive: {
      color: '#059669',
      fontWeight: '700',
    },
    menuItemDescription: {
      fontSize: 13,
      color: '#94A3B8',
      fontWeight: '500',
      lineHeight: 16,
    },
    menuItemDescriptionActive: {
      color: '#10B981',
    },
    signOutItem: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
      borderWidth: 1,
    },
    signOutIcon: {
      backgroundColor: '#FEE2E2',
      borderColor: '#FECACA',
    },
    signOutText: {
      color: '#DC2626',
    },
    activeIndicator: {
      position: 'absolute',
      width: 4,
      height: 28,
      borderRadius: 2,
      backgroundColor: '#22C55E',
      right: isRTL ? 'auto' : 8,
      left: isRTL ? 8 : 'auto',
      top: '50%',
      marginTop: -14,
    },
    appInfo: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: '#FAFBFC',
      borderTopWidth: 1,
      borderTopColor: 'rgba(0,0,0,0.04)',
    },
    appName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#22C55E',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    appVersion: {
      fontSize: 12,
      color: '#94A3B8',
      fontWeight: '500',
    },
  });

  const mainAnimation = useSharedValue(0);

  const menuItems = [
    {
      id: 'workout',
      title: t('hamburgerMenu:workout'),
      icon: <Dumbbell size={24} color="#374151" />,
      route: '/workout',
      description: t('hamburgerMenu:workoutDescription')
    },
    {
      id: 'calculator',
      title: t('hamburgerMenu:calculator'),
      icon: <Calculator size={24} color="#374151" />,
      route: '/(tabs)/calculator',
      description: t('hamburgerMenu:calculatorDescription')
    },
    {
      id: 'daily-goals',
      title: t('hamburgerMenu:dailyGoals'),
      icon: <Target size={24} color="#374151" />,
      route: '/(tabs)/daily-goals',
      description: t('hamburgerMenu:dailyGoalsDescription')
    },
    { 
      id: 'food-request',
      title: t('hamburgerMenu:requestFood'),
      icon: <MessageSquarePlus size={24} color="#374151" />,
      route: '/(tabs)/food-request/submit',
      description: t('hamburgerMenu:requestFoodDescription')
    },
    {
      id: 'settings',
      title: t('hamburgerMenu:settings'),
      icon: <Settings size={24} color="#374151" />,
      route: '/(tabs)/settings',
      description: t('hamburgerMenu:settingsDescription')
    },
    {
      id: 'stats',
      title: t('hamburgerMenu:statsTitle'),
      icon: <User size={24} color="#374151" />,
      route: '/(tabs)/stats',
      description: t('hamburgerMenu:stats')
    },
    {
      id: 'sign-out',
      title: t('hamburgerMenu:signOut'),
      icon: <LogOut size={24} color="#DC2626" />,
      route: 'sign-out',
      description: t('hamburgerMenu:signOutDescription')
    },
  ];

  const openMenu = () => {
    setIsOpen(true);
    
    mainAnimation.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  };

  const closeMenu = () => {
    mainAnimation.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    
    setTimeout(() => {
      runOnJS(setIsOpen)(false);
    }, 250);
  };

  const handleMenuItemPress = (route: string) => {
    if (route === 'sign-out') {
      closeMenu();
      setTimeout(() => handleSignOut(), 350);
    } else {
      closeMenu();
      setTimeout(() => router.push(route as any), 200);
    }
  };

  const handleUserSectionPress = () => {
    closeMenu();
    setTimeout(() => {
      router.push('/settings/personal-info' as any);
    }, 200);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: mainAnimation.value,
  }));

  const menuStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      mainAnimation.value,
      [0, 1],
      isRTL ? [screenWidth * 0.82, 0] : [-screenWidth * 0.82, 0]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(mainAnimation.value, [0, 0.5, 1], [0, 0, 1]);
    
    return {
      opacity,
    };
  });

  const MenuItemComponent = ({ item, index }: { item: any; index: number }) => {
    const isActive = currentRoute === item.route;
    const isSignOut = item.id === 'sign-out';
    
    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          isActive && styles.menuItemActive,
          isSignOut && styles.signOutItem,
        ]}
        onPress={() => handleMenuItemPress(item.route)}
        activeOpacity={0.8}
      >
        <View style={[
          styles.menuItemIcon,
          isActive && styles.menuItemIconActive,
          isSignOut && styles.signOutIcon,
        ]}>
          {item.icon}
        </View>
        
        <View style={styles.menuItemContent}>
          <Text style={[
            styles.menuItemTitle,
            isActive && styles.menuItemTitleActive,
            isSignOut && styles.signOutText,
            { textAlign: getTextAlign(isRTL) }
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.menuItemDescription,
            isActive && styles.menuItemDescriptionActive,
            isSignOut && styles.signOutText,
            { textAlign: getTextAlign(isRTL) }
          ]}>
            {item.description}
          </Text>
        </View>
        
        {isActive && !isSignOut && (
          <View style={styles.activeIndicator} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openMenu}
        activeOpacity={0.8}
      >
        <Menu size={26} color="#1F2937" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <TouchableOpacity
              style={styles.overlayTouchable}
              onPress={closeMenu}
              activeOpacity={1}
            />
          </Animated.View>

          <Animated.View style={[styles.menuPanel, menuStyle]}>
            <SafeAreaView style={styles.menuContent} edges={['top']}>
              <Animated.View style={[styles.menuHeader, headerStyle]}>
                <TouchableOpacity 
                  style={[styles.userSection, styles.userSectionPressable]}
                  onPress={handleUserSectionPress}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatar}>
                    <User size={24} color="#FFFFFF" strokeWidth={2} />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {user?.name || 'Welcome'}
                    </Text>
                    <Text style={styles.userPhone}>
                      {user?.phoneNumber || 'Guest User'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeMenu}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#64748B" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>

              <ScrollView 
                style={styles.menuItems}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                bounces={true}
              >
                {menuItems.map((item, index) => (
                  <MenuItemComponent 
                    key={item.id} 
                    item={item} 
                    index={index} 
                  />
                ))}
              </ScrollView>

              <Animated.View style={[styles.appInfo, headerStyle]}>
                <Text style={styles.appName}>FitTracker Pro</Text>
                <Text style={styles.appVersion}>Version 2.1.0</Text>
              </Animated.View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}