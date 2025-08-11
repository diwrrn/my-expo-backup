import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
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
import { useDailyMealsContext } from '@/contexts/DailyMealsProvider';
import { useAuth } from '@/hooks/useAuth';
import { useStreak } from '@/hooks/useStreak';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useState, useEffect, useMemo } from 'react';
import { getTodayDateString, addDays, formatDisplayDate, isToday, parseDateString, formatDateToString } from '@/utils/dateUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next'; 
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useStreakGlobal } from '@/hooks/useStreakGlobal';
import { streakGlobal } from '@/contexts/StreakGlobal';
import { StreakService } from '@/services/streakService';
import { router } from 'expo-router';
// Simplified function to check if homepage data is ready
const isHomeDataReady = (
  authLoading: boolean,
  mealsLoading: boolean,
  user: any,
  dailyMeals: any
) => {
  if (authLoading || mealsLoading) {
    return false;
  }
  
  if (!user) {
    return false;
  }
  
  if (!dailyMeals || !dailyMeals.meals) {
    return false;
  }
  
  return true; 
};

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { updateProfile } = useProfileContext();
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();

  // Stable currentViewDate with useMemo
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const currentViewDate = useMemo(() => selectedDate, [selectedDate]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  
  const { 
    dailyTotals, 
    mealTotals, 
    getFoodsFromMeal, 
    removeFoodFromDailyMeal, 
    dailyMeals,
    changeDate,
    addFoodToDailyMeal, // Rename this

  } = useDailyMealsContext(); 
  const { 
    updateWaterIntake, 
    loading 
  } = useFirebaseData(currentViewDate);
  const { currentStreak, bestStreak, isLoading: streakLoading, error: streakError } = useStreakGlobal();
      const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({
    breakfast: false,
    lunch: false,  
    dinner: false,
    snacks: false,
  });
  
  const [showContent, setShowContent] = useState(false);

  // Simplified data ready check
  const dataReady = isHomeDataReady(
    authLoading, 
    loading, 
    user, 
    dailyMeals
  );
  useEffect(() => {
    changeDate(currentViewDate);
  }, [currentViewDate, changeDate]);
  // Wait for initial data to be ready
  useEffect(() => {
    if (dataReady) {
      setShowContent(true);
    }
  }, [dataReady]);
  // DEBUG: Check AsyncStorage contents
  // Navigation functions for date
  const handlePreviousDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  const handleNextDay = () => {
    // Only allow navigating up to today
    if (!isToday(currentViewDate)) {
      setSelectedDate(prevDate => addDays(prevDate, 1));
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
      setSelectedDate(dateInput);
      setShowDatePicker(false);
    } catch (error) {
      Alert.alert('Error', 'Invalid date format. Please use YYYY-MM-DD');
    }
  };

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
      // Silent error handling
    }
  };

const handleUpdateWaterIntake = async (glasses: number) => {
    try {
      await updateWaterIntake(glasses);
    } catch (error) {
      // Silent error handling
    }
  };

  const handleRefreshWaterCard = () => {
    // Refresh functionality if needed
  };

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
      paddingBottom: 100,
  },
  scrollViewContent: {
      paddingBottom: 90,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  caloriesRemaining: {
    fontSize: 13,
    color: '#22C55E',
    fontWeight: '600',
    marginTop: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
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
  dateAndStreakRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    gap: 8,
  },
    // Expandable Food List Styles
    foodListContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      marginTop: -8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderTopWidth: 0,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    expandButton: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    expandButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#6B7280',
    },
    foodList: {
      padding: 12,
      paddingTop: 0,
    },
    foodItem: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    foodInfo: {
      flex: 1,
    },
    foodName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 2,
      textAlign: getTextAlign(isRTL),
    },
    foodDetails: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
    },
    removeFoodButton: {
      padding: 4,
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  // Show skeleton while loading
  if (!showContent) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeSkeleton />
      </SafeAreaView>
    );
  }

  const caloriesConsumed = dailyTotals.calories || 0;
  const caloriesGoal = user?.profile?.goals.calories || 2000;
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
                  <View style={styles.dateAndStreakRow}>
                    <Text style={styles.headerDate}>
                      {new Date().toLocaleDateString('en-GB', { 
                        month: 'numeric',  
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                    <View style={styles.streakBadge}>
                    <Text style={{ fontSize: 16 }}>🔥</Text>
                    <Text style={styles.streakText}>{currentStreak}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Progress Ring */}
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

          {/* Quick Stats */}
            <QuickStats 
              protein={dailyTotals.protein || 0}
              carbs={dailyTotals.carbs || 0}
              fat={dailyTotals.fat || 0}
              water={dailyMeals?.waterIntake || 0}
            />

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
            
            {mealConfigs.map(mealConfig => (
              <View key={mealConfig.id}>
                {/* Meal Card with Search */}
                <MealCardWithSearch
                  title={mealConfig.title}
                  calories={mealTotals[mealConfig.id]?.calories || 0}
                  items={getFoodsFromMeal(mealConfig.id).length}
                                    color={mealConfig.color}
                  icon={mealConfig.icon}
                  mealType={mealConfig.id as 'breakfast' | 'lunch' | 'dinner' | 'snacks'}
                  foods={getFoodsFromMeal(mealConfig.id)}
                  onRemoveFood={(foodKey) => handleRemoveFood(mealConfig.id, foodKey)}
                  currentViewDate={currentViewDate}
                />
                              
              </View>
            ))} 
          </View>

          {/* Water Intake Card */}
            <WaterIntakeCard 
              currentWaterIntake={dailyMeals?.waterIntake || 0} 
  dailyGoal={user?.profile?.goalsWaterUpdate || 8} // This is missing!
              onUpdateWaterIntake={handleUpdateWaterIntake}
  onUpdateWaterGoal={updateProfile}
              onRefresh={handleRefreshWaterCard}
            />
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