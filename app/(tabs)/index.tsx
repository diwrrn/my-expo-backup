import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native'; // Add Image
import { SafeAreaView } from 'react-native-safe-area-context';
import { Target, Flame, Zap, Plus, Trash2, ChevronDown, ChevronUp, TrendingUp, Award, Droplet, ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react-native';
import { ProgressRingSkeleton } from '@/components/ProgressRingSkeleton';
import { ProgressRing } from '@/components/ProgressRing';
import { QuickStatsSkeleton } from '@/components/QuickStatsSkeleton';
import { QuickStats } from '@/components/QuickStats';
import { MealCardSkeleton } from '@/components/MealCardSkeleton';
import { MealCardWithSearch } from '@/components/MealCardWithSearch';
import { WaterIntakeCardSkeleton } from '@/components/WaterIntakeCardSkeleton';
import { WaterIntakeCard } from '@/components/WaterIntakeCard';
import { HomeSkeleton } from '@/components/HomeSkeleton';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useProfile } from '@/hooks/useProfile';
import { useState, useEffect } from 'react';
import { getTodayDateString, addDays, formatDisplayDate, isToday, parseDateString, formatDateToString } from '@/utils/dateUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next'; 
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';


// Helper function to check if homepage data is ready
const isHomeDataReady = (
  authLoading: boolean,
  profileLoading: boolean,
  mealsLoading: boolean,
  user: any,
  dailyMeals: any
) => {
  // Check if any loading state is active
  if (authLoading || profileLoading || mealsLoading) {
    return false;
  }
  
  // Check if user and profile data is available
  if (!user || !user.profile) {
    return false;
  }
  
  // Check if daily meals data structure is initialized
  if (!dailyMeals || !dailyMeals.meals) {
    return false;
  }
  
  return true; 
};

export default function HomeScreen() {
  const { user, loading: authLoading, profileCache } = useAuth();
  const { updateProfile } = useProfile();


  const { t, i18n } = useTranslation(); // Add i18n here
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();
  const [currentViewDate, setCurrentViewDate] = useState(getTodayDateString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const { 
    dailyTotals, 
    mealTotals, 
    getFoodsFromMeal, 
    removeFoodFromDailyMeal, 
    updateWaterIntake, 
    loading, 
    dailyMeals,
    dailyMealsCache
  } = useFirebaseData(currentViewDate);
  const { currentStreak } = useStreak(user?.id);
  // Add this new useEffect hook
  useEffect(() => {

  }, [user]); // This useEffect will run whenever the profile object within profileCache changes

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 100, // Space for footer navigation
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '400',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined, // Add this line
  },
  headerDate: {
    textAlign: getTextAlign(isRTL),
    fontSize: 17,
    color: '#6B7280',
    fontWeight: '600',
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 4,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    position: 'relative',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  caloriesConsumed: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -1,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
        fontFamily: useKurdishFont ? 'rudawregular2' : undefined, // Add this line

  },
  caloriesRemaining: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 4,
        fontFamily: useKurdishFont ? 'rudawregular2' : undefined, // Add this line

  },
  progressPercentage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressPercentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
    marginLeft: 4,
  },
  mealsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavButtonDisabled: {
    opacity: 0.5,
  },
  dateSelector: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined, // Add this line

  },
  loadingContainer: {
    flex: 1,
  },
  skeletonTitle: {
    height: 32,
    width: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    height: 17,
    width: 150,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonBadge: {
    height: 32,
    width: 50,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  skeletonProgressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E5E7EB',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  skeletonStatItem: {
    flex: 1,
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
  },
  skeletonSectionTitle: {
    height: 22,
    width: 150,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonMealCard: {
    height: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginBottom: 16,
  },
  // Date Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  datePickerNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: getFlexDirection(isRTL),

    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
  // Combined loading state
  const isDataReady = isHomeDataReady(
    authLoading,
    profileCache.isLoading,
    dailyMealsCache.isLoading,
    user,
    dailyMealsCache.dailyMeals
  );
  
  // State to track which meals are expanded
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
  });
  
  // State to prevent flickers
  const [showContent, setShowContent] = useState(false);

  // Wait for initial data to be ready
  useEffect(() => {
    if (isDataReady) {
      setShowContent(true);
    }
  }, [isDataReady]);

  // Navigation functions for date
  const handlePreviousDay = () => {
    setCurrentViewDate(prevDate => addDays(prevDate, -1));
  };

  const handleNextDay = () => {
    // Only allow navigating up to today
    if (!isToday(currentViewDate)) {
      setCurrentViewDate(prevDate => addDays(prevDate, 1));
    }
  };

  const handleDateSelect = () => {
    setDateInput(currentViewDate);
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    try {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateInput)) {
        Alert.alert('Invalid Format', 'Please use YYYY-MM-DD format');
        return;
      }

      // Check if date is valid
      const date = parseDateString(dateInput);
      if (isNaN(date.getTime())) {
        Alert.alert('Invalid Date', 'Please enter a valid date');
        return;
      }

      // Check if date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        Alert.alert('Invalid Date', 'Cannot select future dates');
        return;
      }

      // Set the date and close the picker
      setCurrentViewDate(dateInput);
      setShowDatePicker(false);
    } catch (error) {
      Alert.alert('Error', 'Invalid date format. Please use YYYY-MM-DD');
    }
  };

  // Show skeleton while loading
  if (!showContent) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }


  const caloriesConsumed = dailyTotals.calories || 0;
  const caloriesGoal = user?.profile?.goals.calories || 2000; // <--- MODIFIED LINE
const progressPercentage = (caloriesConsumed / caloriesGoal) * 100;

  // Meal configurations
  const mealConfigs = [
    {
      id: 'breakfast',
      title: t('mealPlanner:breakFast'),
      color: '#F59E0B',
      icon: <Flame size={20} color="#F59E0B" />,
    },
    {
      id: 'lunch',
      title: t('mealPlanner:lunch'),
      color: '#EF4444',
      icon: <Target size={20} color="#EF4444" />,
    },
    {
      id: 'dinner',
      title: t('mealPlanner:dinner'),
      color: '#8B5CF6',
      icon: <Zap size={20} color="#8B5CF6" />,
    },
    {
      id: 'snacks',
      title: t('mealSelectionScreen:snacks'),
      color: '#06B6D4',
      icon: <Droplet size={20} color="#06B6D4" />,
    },
  ];

  const toggleMealExpansion = (mealId: string) => {
    setExpandedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  const handleRemoveFood = async (mealType: string, foodKey: string) => {
    try {
      await removeFoodFromDailyMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', foodKey);
    } catch (error) {
      console.error('Error removing food:', error);
    }
  };

  const handleUpdateWaterIntake = async (glasses: number) => {
    try {
      await updateWaterIntake(glasses);
    } catch (error) {
      console.error('Error updating water intake:', error);
    }
  };

  // ADD THIS FUNCTION
  const handleRefreshWaterCard = () => {
    console.log('Refreshing WaterIntakeCard data...');
    profileCache.refreshCache(); // Refresh user profile data
  };


  const renderMealCard = (mealConfig: typeof mealConfigs[0]) => {
    const mealData = mealTotals[mealConfig.id] || { calories: 0, items: 0 };
    const foods = getFoodsFromMeal(mealConfig.id);

    return (
      <MealCardWithSearch
        key={mealConfig.id}
        title={mealConfig.title}
        calories={mealData.calories}
        items={mealData.items}
        color={mealConfig.color}
        icon={mealConfig.icon}
        mealType={mealConfig.id as 'breakfast' | 'lunch' | 'dinner' | 'snacks'}
        foods={foods}
        onRemoveFood={(foodKey) => handleRemoveFood(mealConfig.id, foodKey)}
      />
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
          <LinearGradient
            colors={['#F0FDF4', '#F9FAFB']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <HamburgerMenu currentRoute="/(tabs)/" />
                <View style={styles.headerContent}>
                  <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                    {t('homeScreen:title')}
                  </Text>
                  <Text style={styles.headerDate}>
{new Date().toLocaleDateString('en-GB', { 
  month: 'numeric',  
  day: 'numeric',
  year: 'numeric'
})}
                  </Text>
                </View>
               
              </View>
            </View>
          </LinearGradient>

          {/* Progress Ring */}
          {!showContent ? (
            <ProgressRingSkeleton />
          ) : (
            <View style={styles.progressSection}>
              <ProgressRing
                progress={progressPercentage}
                size={200}
                strokeWidth={12}
                color="#22C55E"
                backgroundColor="#FFFFFF"
              />
              <View style={styles.progressCenter}>
                <Text style={styles.caloriesConsumed}>{Math.round(caloriesConsumed)}</Text>
                <Text style={styles.caloriesLabel}>{t('homeScreen:caloriesLabel')}</Text>
                <Text style={styles.caloriesRemaining}>
                  {Math.round(Math.max(0, caloriesGoal - caloriesConsumed))} {t('homeScreen:left')}
                </Text>
               
              </View>
            </View>
          )}

          {/* Quick Stats */}
          {!showContent ? (
            <QuickStatsSkeleton />
          ) : (
            <QuickStats 
              protein={dailyTotals.protein || 0}
              carbs={dailyTotals.carbs || 0}
              fat={dailyTotals.fat || 0}
              water={dailyMeals?.waterIntake || 0}
            />
          )}


          {/* Meals Section */}
          <View style={styles.mealsSection}>
            <View style={[styles.sectionHeader, { flexDirection: getFlexDirection(isRTL) }]}>
              <TouchableOpacity 
                style={styles.dateNavButton}
                onPress={handlePreviousDay}
              >
                {isRTL ? <ChevronRight size={20} color="#6B7280" /> : <ChevronLeft size={20} color="#6B7280" />}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateSelector}
                onPress={handleDateSelect}
              >
                <Calendar size={16} color="#6B7280" />
<Text style={styles.sectionTitle} numberOfLines={1}>
   {isRTL 
    ? `${t('homeScreen:mealsTitle')} ${t(`common:${formatDisplayDate(currentViewDate)}`)}`
    : `${t(`common:${formatDisplayDate(currentViewDate)}`)} ${t('homeScreen:mealsTitle')}`
  }
</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.dateNavButton,
                  isToday(currentViewDate) && styles.dateNavButtonDisabled
                ]}
                onPress={handleNextDay}
                disabled={isToday(currentViewDate)}
              >
                {isRTL ? <ChevronLeft size={20} color={isToday(currentViewDate) ? "#D1D5DB" : "#6B7280"} /> : <ChevronRight size={20} color={isToday(currentViewDate) ? "#D1D5DB" : "#6B7280"} />}
              </TouchableOpacity>
            </View>
            
            {!showContent ? (
              <MealCardSkeleton />
            ) : (
              mealConfigs.map(mealConfig => (
                <MealCardWithSearch
                  key={mealConfig.id}
                  title={mealConfig.title}
                  calories={mealTotals[mealConfig.id]?.calories || 0}
                  items={mealTotals[mealConfig.id]?.items || 0}
                  color={mealConfig.color}
                  icon={mealConfig.icon}
                  mealType={mealConfig.id as 'breakfast' | 'lunch' | 'dinner' | 'snacks'}
                  foods={getFoodsFromMeal(mealConfig.id)}
                  onRemoveFood={(foodKey) => handleRemoveFood(mealConfig.id, foodKey)}
                  currentViewDate={currentViewDate}
                />
              ))
            )} 
          </View>

          {/* Water Intake Card */}
          {!showContent ? (
            <WaterIntakeCardSkeleton />
          ) : (
            <WaterIntakeCard 
              currentWaterIntake={dailyMeals?.waterIntake || 0} 
              onUpdateWaterIntake={handleUpdateWaterIntake}
dailyGoal={profileCache.profile?.goalsWaterUpdate || 22} // Force read the newest value
  onUpdateWaterGoal={updateProfile}
              onRefresh={handleRefreshWaterCard}
            />
          )}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('common:selectDate')}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.dateInputLabel, { textAlign: getTextAlign(isRTL) }]}>
              {t('common:enterDateFormat')}
            </Text>
            <TextInput 
              style={[styles.dateInput, { textAlign: getTextAlign(isRTL) }]}
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
            />
            
            <Text style={[styles.datePickerNote, { textAlign: getTextAlign(isRTL) }]}>
              {t('common:datePickerNote')}
            </Text>
            
            <View style={[styles.modalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.cancelButtonText}>{t('common:cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleDateConfirm}
              >
                <Text style={styles.confirmButtonText}>{t('common:confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}