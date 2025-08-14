import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, UtensilsCrossed, Check, CalendarDays, TrendingUp } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { SavedMealPlan, ProcessedFood } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { getTodayDateString } from '@/utils/dateUtils';
import { useAppStore } from '@/store/appStore';

// Helper function to get display name based on language
const getDisplayName = (food: any, i18n: any) => {
  const lang = i18n.language;
  if (lang === 'ku' && food.kurdishName) {
    return food.kurdishName;
  } else if (lang === 'ar' && food.arabicName) {
    return food.arabicName;
  }
  return food.name || 'Unknown Food';
};

export default function MealPlanDetailsScreen() {

  const { planId, origin } = useLocalSearchParams<{ planId: string; origin?: string }>();
  console.log('�� Origin received:', origin);

  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { addFoodToMeal } = useAppStore();
  const [savedMealPlan, setSavedMealPlan] = useState<SavedMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingAllMeals, setLoggingAllMeals] = useState(false);
  const [isLoggingFood, setIsLoggingFood] = useState<string | null>(null);
  

  useEffect(() => {
    if (planId && user?.id) {
      loadMealPlanDetails();
    } else {
      setLoading(false);
    }
  }, [planId, user?.id]);

  const loadMealPlanDetails = async () => {
    if (!user?.id || !planId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const plan = await FirebaseService.getSavedMealPlanById(user.id, planId);
      
      if (plan) {
        setSavedMealPlan(plan);
      } else {
        setSavedMealPlan(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plan details.');
      setSavedMealPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogAllMeals = () => {
    if (!savedMealPlan) return;

    Alert.alert(
      t('mealPlanDetailsScreen:logAllMealsConfirmTitle'),
      t('mealPlanDetailsScreen:logAllMealsConfirmMessage'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('mealPlanDetailsScreen:log'),
          onPress: async () => {
            setLoggingAllMeals(true);
            try {
              const today = getTodayDateString();
              const mealsToLog = savedMealPlan.mealPlanData.meals;
              let loggedCount = 0;

              for (const mealType of ['breakfast', 'lunch', 'dinner', 'snacks']) {
                const foodsInMeal = mealsToLog[mealType as keyof typeof mealsToLog];
                if (foodsInMeal && foodsInMeal.length > 0) {
                  for (const food of foodsInMeal) {
                    await addFoodToMeal(mealType as any, {
                      foodId: food.id,
                      foodName: food.name,
                      kurdishName: food.kurdishName || '',
                      arabicName: food.arabicName || '',
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat,
                      quantity: food.grams,
                      unit: 'g',
                      category: food.originalFood?.category || 'Unknown',
                    });
                    loggedCount++;
                  }
                }
              }
              Alert.alert(t('common:success'), `${loggedCount} items logged for today!`);
            } catch (error) {
              Alert.alert(t('common:error'), 'Failed to log all meals.');
            } finally {
              setLoggingAllMeals(false);
            }
          },
        },
      ]
    );
  };

  const handleLogFoodItem = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', food: ProcessedFood) => {
    if (!user) {
      Alert.alert(t('common:error'), 'User not authenticated.');
      return;
    }
    
    // Prevent multiple simultaneous calls for the same food
    if (isLoggingFood === food.id) {
      return;
    }
    
    setIsLoggingFood(food.id);
    
    try {
      // Add a small delay to prevent race conditions when clicking multiple checkmarks quickly
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await addFoodToMeal(mealType, {
        foodId: food.id,
        foodName: food.name, 
        kurdishName: food.kurdishName || '',
        arabicName: food.arabicName || '',
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat, 
        quantity: food.grams,
        unit: 'g',
        category: food.originalFood?.category || 'Unknown',
      });
      
      Alert.alert(t('common:success'), `${getDisplayName(food, i18n)} logged to ${mealType}!`);
    } catch (error) {
      console.error('Error logging food item:', error);
      Alert.alert(t('common:error'), `Failed to log ${getDisplayName(food, i18n)}.`);
    } finally {
      setIsLoggingFood(null);
    }
  };

  const renderMealSection = (mealType: string, meals: ProcessedFood[], color: string) => (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIndicator, { backgroundColor: color }]} />
        <Text style={styles.mealTitle}>{t(`mealPlanner:${mealType}`)}</Text>
        <View style={styles.mealCaloriesBadge}>
          <Text style={styles.mealCalories}>
            {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
          </Text>
        </View>
      </View>

      <View style={styles.mealItemsContainer}>
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealItem}
            onPress={() => {
              router.navigate({
                pathname: '/(tabs)/meal-planner-food-details',
                params: {
                  foodId: meal.id,
                  quantity: meal.grams.toString(),
                  unit: 'g',
                  fromMealPlan: 'true',
                  origin: origin || 'saved-plans',
                  planId: planId // Add this line
                }
              });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.mealInfo}>
              <Text style={styles.mealItemName}>{getDisplayName(meal, i18n)}</Text>
              <Text style={styles.mealPortion}>{meal.displayPortion}</Text>
              <View style={styles.mealNutrition}>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>P</Text>
                  <Text style={styles.nutritionValue}>{Math.round(meal.protein)}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>C</Text>
                  <Text style={styles.nutritionValue}>{Math.round(meal.carbs)}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Text style={styles.nutritionLabel}>F</Text>
                  <Text style={styles.nutritionValue}>{Math.round(meal.fat)}g</Text>
                </View>
              </View>
            </View>
            <View style={styles.rightSection}>
              <View style={styles.mealCaloriesContainer}>
                <Text style={styles.mealItemCalories}>{Math.round(meal.calories)}</Text>
                <Text style={styles.caloriesLabel}>kcal</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.logFoodButton,
                  isLoggingFood === meal.id && styles.logFoodButtonDisabled
                ]}
                onPress={() => handleLogFoodItem(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', meal)}
                disabled={isLoggingFood === meal.id}
              >
                {isLoggingFood === meal.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Check size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
          <Text style={styles.loadingText}>Loading meal plan...</Text>
          <Text style={styles.loadingSubtext}>Preparing your nutrition details</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!savedMealPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <UtensilsCrossed size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Meal Plan Not Found</Text>
          <Text style={styles.emptySubtext}>This meal plan may have been deleted or doesn't exist</Text>
          <TouchableOpacity 
            style={styles.backButtonEmpty} 
            onPress={() => {
              if (origin === 'saved-plans') {
                router.push('/(tabs)/saved-meal-plans');
              } else {
                router.back();
              }
            }}
          >
            <Text style={styles.backButtonEmptyText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  const generatedPlan = savedMealPlan.mealPlanData;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => {
                  // Check if we came from saved plans, if so go back to saved plans
                  if (origin === 'saved-plans') {
                    router.push('/(tabs)/saved-meal-plans');
                  } else {
                    router.back();
                  }
                }}
              >
                <ArrowLeft size={20} color="#64748B" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{savedMealPlan.name}</Text>
                <View style={styles.headerMeta}>
                  <CalendarDays size={14} color="#64748B" />
                  <Text style={styles.headerSubtitle}>
                    {new Date(savedMealPlan.generatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </View>

          {/* Plan Stats */}
          <View style={styles.planStatsContainer}>
            <View style={styles.statsHeader}>
              <View style={styles.statsHeaderIcon}>
                <TrendingUp size={18} color="#10B981" />
              </View>
              <Text style={styles.statsHeaderText}>Nutrition Overview</Text>
            </View>
            <View style={styles.planStatsGrid}>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{generatedPlan.totalCalories}</Text>
                <Text style={styles.planStatLabel}>Calories</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{generatedPlan.totalProtein}g</Text>
                <Text style={styles.planStatLabel}>Protein</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{generatedPlan.totalCarbs}g</Text>
                <Text style={styles.planStatLabel}>Carbs</Text>
              </View>
              <View style={styles.planStat}>
                <Text style={styles.planStatValue}>{generatedPlan.totalFat}g</Text>
                <Text style={styles.planStatLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Meals */}
          {renderMealSection('breakfast', generatedPlan.meals.breakfast, '#F59E0B')}
          {renderMealSection('lunch', generatedPlan.meals.lunch, '#EF4444')}
          {renderMealSection('dinner', generatedPlan.meals.dinner, '#8B5CF6')}
          {generatedPlan.meals.snacks && generatedPlan.meals.snacks.length > 0 &&
            renderMealSection('snacks', generatedPlan.meals.snacks, '#06B6D4')}

          {/* Log All Meals Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.logAllMealsButton, loggingAllMeals && styles.logAllMealsButtonDisabled]}
              onPress={handleLogAllMeals}
              disabled={loggingAllMeals}
            >
              {loggingAllMeals ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.logAllMealsButtonText}>Adding to diary...</Text>
                </>
              ) : (
                <>
                  <Check size={20} color="#FFFFFF" />
                  <Text style={styles.logAllMealsButtonText}>Add All to Today's Diary</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  backButtonEmpty: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  backButtonEmptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Plan Stats
  planStatsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  statsHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  planStatsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  planStat: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Meal Section
  mealSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mealIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  mealCaloriesBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  mealItemsContainer: {
    padding: 20,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  mealImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F8FAFC',
  },
  mealInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mealPortion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  mealNutrition: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nutritionValue: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
  },
  mealCaloriesContainer: {
    alignItems: 'center',
  },
  mealItemCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  logFoodButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  logFoodButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  
  // Action Section
  actionSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logAllMealsButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logAllMealsButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  logAllMealsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});