import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, User, Target, Bell, Circle as CircleHelp, LogOut, Flame, Calendar, TrendingUp } from 'lucide-react-native';
import { ProfileCard } from '@/components/ProfileCard';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import { SettingsItem } from '@/components/SettingsItem';
import { DailyGoalsSkeleton } from '@/components/DailyGoalsSkeleton';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useStreak } from '@/hooks/useStreak';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useState, useEffect } from 'react';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { WeightChart } from '@/components/WeightChart';
import { Scale, Plus } from 'lucide-react-native';
import { StreakCalendar } from '@/components/StreakCalendar';

// Import the new gender images
import manAvatar from '@/assets/icons/gender/man.png';
import womanAvatar from '@/assets/icons/gender/woman.png';

export default function ProfileScreen() {
  const { user, loading, signOut, profileCache } = useAuth();
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();
  console.log('🔍 DEBUG: isRTL value:', isRTL);

  // Early exit if user is null and not in a loading state
  // This prevents any subsequent logic from trying to access properties of a null user object
  if (!user && !loading) {
    return null; // Returning null will cause the component to unmount or render nothing
  }

  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const { currentStreak, bestStreak, isLoading: streakLoading } = useStreak(user?.id);
  const { weightLogs, isLoading: weightLoading, logWeight } = useWeightHistory(user?.id);
  // Calculate the latest weight from weightLogs
const latestWeight = weightLogs.length > 0 
  ? weightLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].weight
  : user?.profile?.weight || 0; // Fallback to profile weight if no logs

  const [weightInput, setWeightInput] = useState('');

  // Determine the default avatar based on gender
  const defaultAvatar = user?.profile?.gender === 'female' ? womanAvatar : manAvatar;

  // Simulate loading state for goals
  useEffect(() => {
    if (user?.profile?.goals) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsGoalsLoading(false);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user?.profile?.goals]);

  // Check if profile data is fully loaded
  const isProfileComplete = user && 
    user.profile && 
    user.profile.goals && 
    typeof user.profile.weight === 'number' && 
    typeof user.profile.height === 'number' && 
    typeof user.profile.age === 'number';

  //styles
  const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
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
    fontWeight: '750',
    color: '#111827',
    marginBottom: 2,
      //fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

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
  if (loading || profileCache.isLoading || !isProfileComplete) {
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <HamburgerMenu currentRoute="/(tabs)/profile" />
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('profileScreen:headerTitle')}
              </Text>
             
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>{t('profileScreen:editButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <ProfileCard
          name={user.name}
          phoneNumber={user.phoneNumber}
          avatar={defaultAvatar} // Use the conditionally set avatar
          stats={{
            weight: latestWeight,
            height: user.profile?.height || 0,
            age: user.profile?.age || 0,
          }}
        />

        {/* Quick Stats */}
        <View style={styles.quickStatsCard}>
          <View style={styles.quickStatsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Flame size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>1985</Text>
              <Text style={styles.statLabel}>{t('profileScreen:avgCalories')}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Calendar size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{bestStreak || 0}</Text>
              <Text style={styles.statLabel}>{t('profileScreen:totalDays')}</Text>
            </View>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color="#22C55E" />
              </View>
              <Text style={styles.statValue}>{currentStreak || 0}</Text>
              <Text style={styles.statLabel}>{t('profileScreen:dayStreak')}</Text>
            </View>
          </View>
        </View>

        {/* Goals Section */}
        {isGoalsLoading ? (
          <DailyGoalsSkeleton />
        ) : (
          <View style={styles.goalsSection}>
            <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('profileScreen:dailyGoalsTitle')}
            </Text>
            <View style={styles.goalCard}>
  {/* Calories Row */}
  <View style={styles.goalRow}>
    {isRTL ? (
      <>
        <Text style={styles.goalValue}>{user.profile?.goals.calories || 0} kcal</Text>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:calories')}</Text>
      </>
    ) : (
      <>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:calories')}</Text>
        <Text style={styles.goalValue}>{user.profile?.goals.calories || 0} kcal</Text>
      </>
    )}
  </View>

  {/* Protein Row */}
  <View style={styles.goalRow}>
    {isRTL ? (
      <>
        <Text style={styles.goalValue}>{user.profile?.goals.protein || 0} g</Text>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:protein')}</Text>
      </>
    ) : (
      <>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:protein')}</Text>
        <Text style={styles.goalValue}>{user.profile?.goals.protein || 0} g</Text>
      </>
    )}
  </View>

  {/* Carbs Row */}
  <View style={styles.goalRow}>
    {isRTL ? (
      <>
        <Text style={styles.goalValue}>{user.profile?.goals.carbs || 0} g</Text>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:carbs')}</Text>
      </>
    ) : (
      <>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:carbs')}</Text>
        <Text style={styles.goalValue}>{user.profile?.goals.carbs || 0} g</Text>
      </>
    )}
  </View>

  {/* Fat Row */}
  <View style={styles.goalRow}>
    {isRTL ? (
      <>
        <Text style={styles.goalValue}>{user.profile?.goals.fat || 0} g</Text>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:fat')}</Text>
      </>
    ) : (
      <>
        <Text style={styles.goalLabel}>{t('foodDetailsScreen:fat')}</Text>
        <Text style={styles.goalValue}>{user.profile?.goals.fat || 0} g</Text>
      </>
    )}
  </View>
</View>
          </View>
        )}

        {/* Weight History Section */}
        <View style={styles.weightSection}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('profileScreen:weightHistory')}
          </Text>
          
          {/* Weight Input */}
          <View style={styles.weightInputContainer}>
            <View style={[styles.weightInputRow, { flexDirection: getFlexDirection(isRTL) }]}>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Scale size={20} color="#6B7280" />
                <TextInput
                  style={[styles.weightInput, { 
                    marginLeft: isRTL ? 0 : 12, 
                    marginRight: isRTL ? 12 : 0,
                    textAlign: getTextAlign(isRTL)
                  }]}
                  placeholder={t('profileScreen:enterWeight')}
                  value={weightInput}
                  onChangeText={setWeightInput}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.weightUnit}>kg</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.logWeightButton, { 
                  marginLeft: isRTL ? 0 : 12, 
                  marginRight: isRTL ? 12 : 0 
                }]}
                onPress={async () => {
                  const weight = parseFloat(weightInput);
                  if (isNaN(weight) || weight <= 0 || weight > 500) {
                    Alert.alert(t('common:error'), t('profileScreen:invalidWeight'));
                    return;
                  }
                  
                  try {
                    await logWeight(weight);
                    setWeightInput('');
                    Alert.alert(t('common:success'), t('profileScreen:weightLogged'));
                  } catch (error) {
                    Alert.alert(t('common:error'), t('profileScreen:weightLogError'));
                  }
                }}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.logWeightButtonText}>{t('profileScreen:logWeight')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Weight Chart */}
          {weightLoading ? (
            <View style={styles.weightChartLoading}>
              <Text style={styles.loadingText}>{t('profileScreen:loadingWeightHistory')}</Text>
            </View>
          ) : (
            <WeightChart data={weightLogs} />
          )}
        </View>
        {/* Language Selector */}

        {/* Streak Calendar Section */}
        <View style={styles.goalsSection}>
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
            Food Logging Streak
          </Text>
          {user.id ? (
            <StreakCalendar userId={user.id} />
          ) : (
            <Text style={styles.loadingText}>Sign in to view streak calendar</Text>
          )}
        </View>
        
        {/* Language Selector */}

        
        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#EF4444" style={{ 
          marginRight: isRTL ? 0 : 8, 
          marginLeft: isRTL ? 8 : 0 
            }} />
          <Text style={styles.logoutText}>{t('profileScreen:signOut')}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
    
  );
  
}
 