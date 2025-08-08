import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, User, Target, Bell, Circle as CircleHelp, LogOut, Flame, Calendar, TrendingUp, Crown } from 'lucide-react-native';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { SettingsItem } from '@/components/SettingsItem';
import { DailyGoalsSkeleton } from '@/components/DailyGoalsSkeleton';
import { DailyGoalsCard } from '@/components/DailyGoalsCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useStreak } from '@/hooks/useStreak';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useState, useEffect, useMemo } from 'react';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { WeightChart } from '@/components/WeightChart';
import { Scale, Plus } from 'lucide-react-native';
import { StreakCalendar } from '@/components/StreakCalendar';
import { useProfileContext } from '@/contexts/ProfileContext';
import { usePremiumContext } from '@/contexts/PremiumContext';
import { useStreakGlobal } from '@/hooks/useStreakGlobal';
import { WeightInputModal } from '@/components/WeightInputModal';

// Import the new gender images
import manAvatar from '@/assets/icons/gender/man.png';
import womanAvatar from '@/assets/icons/gender/woman.png';

export default function ProfileScreen() { 

  const { user, loading, signOut } = useAuth();
  const { hasPremium } = usePremiumContext();
  const { t, i18n } = useTranslation();

  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();
  const [showWeightModal, setShowWeightModal] = useState(false);
  const { profile, isLoading, error, updateProfile } = useProfileContext();
  
  // Early exit if user is null and not in a loading state
  if (!user && !loading) {
    return null;
  }

  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const { currentStreak, bestStreak, isLoading: streakLoading } = useStreakGlobal();
  const { weightLogs, isLoading: weightLoading, logWeight, clearCache } = useWeightHistory(user?.id);
  
  // Calculate the latest weight from weightLogs
  const latestWeight = weightLogs.length > 0 
    ? weightLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
    : user?.profile?.weight || 0;
  
  const [weightInput, setWeightInput] = useState('');

  // Determine the default avatar based on gender
  const defaultAvatar = user?.profile?.gender === 'female' ? womanAvatar : manAvatar;

  // Simulate loading state for goals
  useEffect(() => {
    if (profile?.goals) {
      const timer = setTimeout(() => {
        setIsGoalsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [profile?.goals]);
  
  // Check if profile data is fully loaded
  const isProfileComplete = profile && 
    profile.goals && 
    typeof profile.weight === 'number' && 
    typeof profile.height === 'number' && 
    typeof profile.age === 'number';

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
  const shouldShowSkeleton = (loading || isLoading || !isProfileComplete) && !profile;

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
          {user.id ? (
            <StreakCalendar userId={user.id} />
          ) : (
            <Text style={styles.loadingText}>Sign in to view streak calendar</Text>
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
          await updateProfile({ weight });
          await logWeight(weight);
          await clearCache();
          setShowWeightModal(false);
        }}
      />
    </SafeAreaView>
  );
}