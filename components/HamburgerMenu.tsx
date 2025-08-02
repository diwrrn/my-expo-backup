import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Menu, X, Chrome as Home, Plus, Calculator, User, UtensilsCrossed, Target, Settings, LogOut, Dumbbell, MessageSquarePlus } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

const { width: screenWidth } = Dimensions.get('window');

interface HamburgerMenuProps {
  currentRoute?: string;
}

export function HamburgerMenu({ currentRoute }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isRTL = useRTL();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    hamburgerButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    modalContainer: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
      width: screenWidth * 0.85,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    menuContent: {
      flex: 1,
    },
    menuHeader: {
      backgroundColor: '#F8FAFC',
      paddingVertical: 24,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    headerContent: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    userInfo: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      flex: 1,
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
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 2,
      textAlign: getTextAlign(isRTL),
    },
    userPhone: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuItems: {
      flex: 1,
      paddingTop: 20,
    },
    menuItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginHorizontal: 12,
      borderRadius: 12,
      position: 'relative',
    },
    menuItemActive: {
      backgroundColor: '#F0FDF4',
    },
    menuItemIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F8FAFC',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    menuItemIconActive: {
    },
    menuItemContent: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 2,
    },
    menuItemTitleActive: {
      color: '#059669',
    },
    menuItemDescription: {
      fontSize: 13,
      color: '#9CA3AF',
      fontWeight: '500',
    },
    menuItemDescriptionActive: {
      color: '#10B981',
    },
    signOutText: {
      color: '#EF4444',
    },
    activeIndicator: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#22C55E',
    },
    appInfo: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 20,
    },
    appName: {
      fontSize: 16,
      fontWeight: '700',
      color: '#22C55E',
      marginBottom: 4,
    },
    appVersion: {
      fontSize: 12,
      color: '#9CA3AF',
      fontWeight: '500',
    },
  });

  // FIX: Use single animation value for coordinated timing
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
      id: 'food-request', // NEW: Add this item
      title: t('hamburgerMenu:requestFood'), // NEW: Translation key
      icon: <MessageSquarePlus size={24} color="#374151" />, // NEW: Icon
      route: '/(tabs)/food-request/submit', // NEW: Route to the submit screen
      description: t('hamburgerMenu:requestFoodDescription') // NEW: Translation key
    },
    {
      id: 'settings',
      title: t('hamburgerMenu:settings'),
      icon: <Settings size={24} color="#374151" />,
      route: '/(tabs)/settings',
      description: t('hamburgerMenu:settingsDescription')
    },
    {
      id: 'profile',
      title: t('hamburgerMenu:profile'),
      icon: <User size={24} color="#374151" />,
      route: '/(tabs)/profile',
      description: t('hamburgerMenu:profileDescription')
    },
    {
      id: 'test',
      title: 'test',
      icon: <User size={24} color="#374151" />,
      route: '/(tabs)/subscription',
      description: t('hamburgerMenu:profileDescription')
    },
    {
      id: 'sign-out',
      title: t('hamburgerMenu:signOut'),
      icon: <LogOut size={24} color="#EF4444" />,
      route: 'sign-out',
      description: t('hamburgerMenu:signOutDescription')
    },
  ];

  const openMenu = () => {
    setIsOpen(true);
    
    // FIX: Single smooth animation with consistent timing
    mainAnimation.value = withTiming(1, {
      duration: 550,
      easing: Easing.out(Easing.cubic), // Smooth cubic easing
    });
  };

  const closeMenu = () => {
    // FIX: Single smooth close animation
    mainAnimation.value = withTiming(0, {
      duration: 450,
      easing: Easing.in(Easing.cubic),
    });
    
    // Close modal after animation completes
    setTimeout(() => {
      runOnJS(setIsOpen)(false);
    }, 450);
  };

  const handleMenuItemPress = (route: string) => {
    closeMenu();
    
    if (route === 'sign-out') {
      setTimeout(() => {
        handleSignOut();
      }, 450);
    } else {
      setTimeout(() => {
        router.push(route as any);
      }, 250);
    }
  };

  const handleSignOut = async () => {
    closeMenu();
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // FIX: All animations driven by single shared value
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: mainAnimation.value,
  }));

  const menuStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      mainAnimation.value,
      [0, 1],
      isRTL ? [screenWidth * 0.85, 0] : [-screenWidth * 0.85, 0]
    );
    
    return {
      transform: [{ translateX }],
    };
  });

  const menuItemsStyle = useAnimatedStyle(() => {
    // FIX: Delayed fade-in for menu items
    const opacity = interpolate(
      mainAnimation.value,
      [0, 0.8, 1],
  [0, 0, 1]
    );
    
    const translateY = interpolate(
      mainAnimation.value,
      [0, 0.8, 1],
  [30, 15, 0]
    );
    
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <>
      {/* Hamburger Button */}
      <TouchableOpacity
        style={styles.hamburgerButton}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <Menu size={24} color="#111827" />
      </TouchableOpacity>

      {/* Menu Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <TouchableOpacity
              style={styles.overlayTouchable}
              onPress={closeMenu}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Menu Panel */}
          <Animated.View style={[styles.menuPanel, menuStyle]}>
            <SafeAreaView style={styles.menuContent}>
              {/* Header */}
              <View style={styles.menuHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <User size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>{user?.name || 'User'}</Text>
                      <Text style={styles.userPhone}>{user?.phoneNumber || 'Welcome'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeMenu}
                  >
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Items - FIX: Removed individual item transforms */}
              <Animated.View style={[styles.menuItems, menuItemsStyle]}>
                {menuItems.map((item, index) => {
                  const isActive = currentRoute === item.route;
                  
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.menuItem, 
                        isActive && styles.menuItemActive,
                        { flexDirection: getFlexDirection(isRTL) }
                      ]}
                      onPress={() => handleMenuItemPress(item.route)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.menuItemIcon, 
                        isActive && styles.menuItemIconActive,
                        { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }
                      ]}>
                        {item.icon}
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text style={[
                          styles.menuItemTitle, 
                          isActive && styles.menuItemTitleActive,
                          { textAlign: getTextAlign(isRTL) }
                        ]}>
                          <Text style={item.id === 'sign-out' ? styles.signOutText : undefined}>
                            {item.title}
                          </Text>
                        </Text>
                        <Text style={[
                          styles.menuItemDescription, 
                          isActive && styles.menuItemDescriptionActive,
                          { textAlign: getTextAlign(isRTL) }
                        ]}>
                          {item.description}
                        </Text>
                        
                      </View>
                      {isActive && <View style={[styles.activeIndicator, { right: isRTL ? 'auto' : 20, left: isRTL ? 20 : 'auto' }]} />}
                    </TouchableOpacity>
                  );
                })}
              </Animated.View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}