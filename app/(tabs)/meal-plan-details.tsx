import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, UtensilsCrossed, Check } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { SavedMealPlan, ProcessedFood } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { getTodayDateString } from '@/utils/dateUtils';
import { useFirebaseData } from '@/hooks/useFirebaseData'; // To add food to daily meal

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
  const { planId, origin } = useLocalSearchParams<{ planId: string; origin?: string }>(); // NEW: Get origin param

  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { addFoodToDailyMeal } = useFirebaseData();

  const [savedMealPlan, setSavedMealPlan] = useState<SavedMealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingAllMeals, setLoggingAllMeals] = useState(false);
  const [isLoggingFood, setIsLoggingFood] = useState<string | null>(null); // NEW: State to track individual food logging
    console.log('DEBUG: Plan ID received in details screen:', planId); // <--- ADD THIS LINE

  useEffect(() => {
    console.log('MealPlanDetailsScreen: useEffect triggered.');
    console.log('MealPlanDetailsScreen: Received planId from params:', planId); // ADD THIS LOG
    if (planId && user?.id) {
      loadMealPlanDetails();
    } else {
      setLoading(false); // If no planId or user, stop loading and show not found
    }
  }, [planId, user?.id]);

  const loadMealPlanDetails = async () => {
    if (!user?.id || !planId) {
      console.log('MealPlanDetailsScreen: Cannot load details, missing userId or planId.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`MealPlanDetailsScreen: Attempting to fetch plan with ID: ${planId} for user: ${user.id}`); // ADD THIS LOG
      const plan = await FirebaseService.getSavedMealPlanById(user.id, planId);
      
      if (plan) {
        console.log('MealPlanDetailsScreen: Successfully fetched plan:', plan.name); // ADD THIS LOG
        setSavedMealPlan(plan);
      } else {
        console.log('MealPlanDetailsScreen: FirebaseService returned null for plan.'); // ADD THIS LOG
        setSavedMealPlan(null); // Explicitly set to null if not found
      }
    } catch (error) {
      console.error('MealPlanDetailsScreen: Error loading meal plan details:', error);
      Alert.alert('Error', 'Failed to load meal plan details.');
      setSavedMealPlan(null); // Ensure state is null on error
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
                    await addFoodToDailyMeal(mealType as any, {
                      foodId: food.id,
                      foodName: food.name,
                      kurdishName: food.kurdishName || '',
                      arabicName: food.arabicName || '',
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat,
                      quantity: food.grams, // Use grams as quantity for logging
                      unit: 'g', // Indicate it's in grams
                      category: food.originalFood?.category || 'Unknown', // Assuming originalFood is available
                    });
                    loggedCount++;
                  }
                }
              }
              Alert.alert(t('common:success'), `${loggedCount} items logged for today!`);
            } catch (error) {
              console.error('Error logging all meals:', error);
              Alert.alert(t('common:error'), 'Failed to log all meals.');
            } finally {
              setLoggingAllMeals(false);
            }
          },
        },
      ]
    );
  };

  // NEW: Function to handle logging a single food item
  const handleLogFoodItem = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', food: ProcessedFood) => {
    if (!user) {
      Alert.alert(t('common:error'), 'User not authenticated.');
      return;
    }
    setIsLoggingFood(food.id); // Set logging state for this specific food
    try {
      await addFoodToDailyMeal(mealType, {
        foodId: food.id,
        foodName: food.name,
        kurdishName: food.kurdishName || '',
        arabicName: food.arabicName || '',
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        quantity: food.grams, // Use grams from ProcessedFood
        unit: 'g', // Unit is always 'g' for ProcessedFood grams
        category: food.originalFood?.category || 'Unknown', // Assuming originalFood is available
      });
      Alert.alert(t('common:success'), `${getDisplayName(food, i18n)} logged to ${mealType}!`);
    } catch (error) {
      console.error('Error logging food item:', error);
      Alert.alert(t('common:error'), `Failed to log ${getDisplayName(food, i18n)}.`);
    } finally {
      setIsLoggingFood(null); // Reset logging state
    }
  };

  const renderMealSection = (mealType: string, meals: ProcessedFood[], color: string) => (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIndicator, { backgroundColor: color }]} />
        <Text style={styles.mealTitle}>{t(`mealPlanner:${mealType}`)}</Text>
        <Text style={styles.mealCalories}>
          {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
        </Text>
      </View>

      {meals.map((meal) => (
        <TouchableOpacity
          key={meal.id}
          style={styles.mealItem}
          onPress={() => {
            // Navigate to the meal planner food details screen
            router.navigate({
              pathname: '/(tabs)/meal-planner-food-details',
              params: {
                foodId: meal.id,
                quantity: meal.grams.toString(),
                unit: 'g',
                fromMealPlan: 'true', // Pass this param to indicate origin
                origin: origin || 'saved-plans' // NEW: Pass origin to food details
              }
            });
          }}
          activeOpacity={0.7}
        >
          <Image source={{ uri: meal.image }} style={styles.mealImage} />
          <View style={styles.mealInfo}>
            <Text style={styles.mealItemName}>{getDisplayName(meal, i18n)}</Text>
            <Text style={styles.mealPortion}>{meal.displayPortion}</Text>
            <View style={styles.mealNutrition}>
              <Text style={styles.nutritionText}>P: {Math.round(meal.protein)}g</Text>
              <Text style={styles.nutritionText}>C: {Math.round(meal.carbs)}g</Text>
              <Text style={styles.nutritionText}>F: {Math.round(meal.fat)}g</Text>
            </View>
          </View>
          <View style={styles.mealCaloriesContainer}>
            <Text style={styles.mealItemCalories}>{Math.round(meal.calories)}</Text>
            <Text style={styles.caloriesLabel}>kcal</Text>
          </View>
          {/* NEW: Log Food Button */}
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
              <Check size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('mealPlanDetailsScreen:loadingPlan')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!savedMealPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <UtensilsCrossed size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>{t('mealPlanDetailsScreen:planNotFound')}</Text>
          <TouchableOpacity style={styles.createButton} onPress={() => router.back()}>
            <Text style={styles.createButtonText}>{t('common:back')}</Text>
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              {isRTL ? (
                <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
              ) : (
                <ArrowLeft size={24} color="#111827" />
              )}
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{savedMealPlan.name}</Text>
              <Text style={styles.headerSubtitle}>
                {t('mealPlanner:generatedAt')} {new Date(savedMealPlan.generatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Plan Stats */}
          <View style={styles.planStatsContainer}>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{generatedPlan.totalCalories}</Text>
              <Text style={styles.planStatLabel}>{t('mealPlanner:caloriesTotal')}</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{generatedPlan.totalProtein}g</Text>
              <Text style={styles.planStatLabel}>{t('mealPlanner:proteinTotal')}</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{generatedPlan.totalCarbs}g</Text>
              <Text style={styles.planStatLabel}>{t('mealPlanner:carbsTotal')}</Text>
            </View>
            <View style={styles.planStat}>
              <Text style={styles.planStatValue}>{generatedPlan.totalFat}g</Text>
              <Text style={styles.planStatLabel}>{t('mealPlanner:fatTotal')}</Text>
            </View>
          </View>

          {/* Meals */}
          {renderMealSection('breakfast', generatedPlan.meals.breakfast, '#F59E0B')}
          {renderMealSection('lunch', generatedPlan.meals.lunch, '#EF4444')}
          {renderMealSection('dinner', generatedPlan.meals.dinner, '#8B5CF6')}
          {generatedPlan.meals.snacks && generatedPlan.meals.snacks.length > 0 &&
            renderMealSection('snacks', generatedPlan.meals.snacks, '#06B6D4')}

          {/* Log All Meals Button */}
          <TouchableOpacity
            style={[styles.logAllMealsButton, loggingAllMeals && styles.logAllMealsButtonDisabled]}
            onPress={handleLogAllMeals}
            disabled={loggingAllMeals}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.logAllMealsButtonText}>
              {loggingAllMeals ? t('mealPlanDetailsScreen:addingAllMeals') : t('mealPlanDetailsScreen:logAllMeals')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  createButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90,
  },
  planStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planStat: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  mealSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  mealPortion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  mealNutrition: {
    flexDirection: 'row',
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  mealCaloriesContainer: {
    alignItems: 'center',
  },
  mealItemCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  logAllMealsButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logAllMealsButtonDisabled: {
    opacity: 0.6,
  },
  logAllMealsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // NEW: Styles for individual log food button
  logFoodButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981', // A nice green for logging
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12, // Space from calories
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logFoodButtonDisabled: {
    opacity: 0.6,
  },
});
