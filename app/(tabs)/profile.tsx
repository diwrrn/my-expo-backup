import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, User, Target, Bell, Circle as CircleHelp, LogOut, Flame, Calendar, TrendingUp, Crown } from 'lucide-react-native';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { DailyGoalsCard } from '@/components/DailyGoalsCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { WeightChart } from '@/components/WeightChart';
import { StreakCalendar } from '@/components/StreakCalendar';
import { WeightInputModal } from '@/components/WeightInputModal';
import { useAppStore } from '@/store/appStore';
import { useStreakManager } from '@/contexts/StreakGlobal';
import { useSession } from '@/ctx';

// Import the new gender images
import manAvatar from '@/assets/icons/gender/man.png';
import womanAvatar from '@/assets/icons/gender/woman.png';

const ProfileScreen = React.memo(function ProfileScreen() {
const user = useAppStore(state => state.user);
const userLoading = useAppStore(state => state.userLoading);
const profile = useAppStore(state => state.profile);
const hasPremium = useAppStore(state => state.hasPremium);
const isRTL = useAppStore(state => state.isRTL);
const currentLanguage = useAppStore(state => state.currentLanguage);
const profileLoading = useAppStore(state => state.profileLoading);
const updateProfileData = useAppStore(state => state.updateProfileData);
const { signOut } = useSession();
const { isLoading: streakLoading, initializeUser, cleanup } = useStreakManager();
const { t } = useTranslation(); // Keep only for translation function
const useKurdishFont = currentLanguage === 'ku' || currentLanguage === 'ckb' || currentLanguage === 'ar';
const [showWeightModal, setShowWeightModal] = useState(false);
const [isGoalsLoading, setIsGoalsLoading] = useState(true);
const { weightLogs, isLoading: weightLoading, logWeight, clearCache } = useWeightHistory(user?.id);
const latestWeight = weightLogs.length > 0 
? weightLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
: 0;  // ← Just use 0 if no weight logs
// Determine the default avatar based on gender
const defaultAvatar = user?.profile?.gender === 'female' ? womanAvatar : manAvatar;
// Initialize streak tracking
const streakInitializedRef = useRef(false);



  // Simulate loading state for goals
  useEffect(() => {
    if (profile?.goals) {
      const timer = setTimeout(() => {
        setIsGoalsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [profile?.goals]);

// With this stable version:
useEffect(() => {
  if (user?.id && !streakInitializedRef.current) {
    console.log('🔥 Initializing streak for user:', user.id);
    initializeUser(user.id);
    streakInitializedRef.current = true;
  } else if (!user?.id && streakInitializedRef.current) {
    console.log('�� Cleaning up streak - no user');
    cleanup();
    streakInitializedRef.current = false;
  }
  
  // Only cleanup on component unmount, not on every render
  return () => {
    if (streakInitializedRef.current) {
      console.log('�� Cleaning up streak - component unmount');
      cleanup();
      streakInitializedRef.current = false;
    }
  };
}, [user?.id]);

useEffect(() => {
  if (user?.id && !profile) {
    // Load profile if user exists but profile is not loaded
    useAppStore.getState().loadProfile();
  }
}, [user?.id, profile]); 

  // Check if profile data is fully loaded
  const isProfileComplete = profile && 
    profile.goals && 
    typeof profile.weight === 'number' && 
    typeof profile.height === 'number' && 
    typeof profile.age === 'number';
  // Early exit if user is null and not in a loading state
  if (!user && !userLoading) {
    return null;
  }
 
  const styles = StyleSheet.create({
    container: {
      flex: 1, 
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flexGrow: 1,
    },
    scrollViewContent: {
      paddingBottom: 90,
      flexGrow: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
      marginLeft: isRTL ? 0 : 16,
      marginRight: isRTL ? 16 : 0,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      color: '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
    },
    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#22C55E',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#22C55E',
    },
    editButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    quickStatsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    quickStatsGrid: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statIcon: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    goalsSection: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 16,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    goalCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    goalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    goalLabel: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    goalValue: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    settingsSection: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    logoutButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      marginHorizontal: 24,
      marginBottom: 32,
      paddingVertical: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#EF4444',
    },
    logoutText: {
      color: '#EF4444',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    weightSection: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    weightInputContainer: {
      marginBottom: 20,
    },
    weightInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    weightInput: {
      flex: 1,
      fontSize: 16,
      color: '#111827',
    },
    weightUnit: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    logWeightButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 6,
    },
    logWeightButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    weightChartLoading: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 150,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  // Show skeleton while loading auth, profile data, or if profile is incomplete
  const shouldShowSkeleton = userLoading || (!profile && profileLoading);
    if (shouldShowSkeleton) {
    return (
      <SafeAreaView style={styles.container}>
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }
  
  // Return null if no user after loading
  if (!user) return null;

  const handleSignOut = async () => {
    Alert.alert(
      t('profileScreen:signOutConfirmTitle'),
      t('profileScreen:signOutConfirmMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        { 
          text: t('profileScreen:signOut'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert(t('common:error'), 'Failed to sign out');
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <HamburgerMenu currentRoute="/(tabs)/profile" />
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('profileScreen:headerTitle')}
              </Text> 
            </View>
          </View>
        </View>

        {/* Profile Card */}
        <ProfileCard
          name={profile?.name || user?.name || 'User'}
          phoneNumber={user?.phoneNumber || '+1234567890'}
          avatar={profile?.gender === 'female' ? womanAvatar : manAvatar}
          stats={{
            weight: profile?.weight || 0,
            height: profile?.height || 0,
            age: profile?.age || 0,
            activityLevel: profile?.activityLevel || 'moderate'
          }}
          isPremium={hasPremium}
          onWeightPress={() => setShowWeightModal(true)}
        />

        {/* Goals Section */}
        <DailyGoalsCard 
          goals={profile?.goals}
          isLoading={isGoalsLoading} 
        />

        {/* Weight History Section */}
        <View style={styles.weightSection}>
          {weightLoading ? (
            <View style={styles.weightChartLoading}>
              <Text style={styles.loadingText}>{t('profileScreen:loadingWeightHistory')}</Text>
            </View>
          ) : (
            <WeightChart data={weightLogs} />
          )}
        </View>

        {/* Streak Calendar Section */}
        <View style={styles.goalsSection}>
          {user?.id && user.id.length > 0 ? (
            <StreakCalendar userId={user.id} />
          ) : (
            <Text style={styles.loadingText}>
              {user ? 'Loading streak calendar...' : 'Sign in to view streak calendar'}
            </Text>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" style={{ 
            marginRight: isRTL ? 0 : 8, 
            marginLeft: isRTL ? 8 : 0 
          }} />
          <Text style={styles.logoutText}>{t('profileScreen:signOut')}</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <WeightInputModal
  visible={showWeightModal}
  onClose={() => setShowWeightModal(false)}
  onSave={async (weight) => {
    try {
      // Update weight history first
      await logWeight(weight);
      // Clear cache
      await clearCache();
      // Close modal
      setShowWeightModal(false);
    } catch (error) {
      console.error('Error updating weight:', error);
    }
  }} 
/>  
    </SafeAreaView>
  );
});

export default ProfileScreen;