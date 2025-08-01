import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coffee, Sun, Moon, Cookie } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { getTodayDateString, formatDisplayDate } from '@/utils/dateUtils';
import { Food } from '@/types/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

// Helper function to get display name based on language
const getDisplayName = (food: any, language: string) => {
  if (language === 'ku' && food.kurdishName) {
    return food.kurdishName;
  } else if (language === 'ar' && food.arabicName) {
    return food.arabicName;
  }
  return food.name || 'Unknown Food';
};

export default function MealSelectionScreen() {
  const { food: foodParam, quantity: quantityParam, unit: unitParam, fromFoodEntry } = useLocalSearchParams<{
    food: string;
    quantity: string;
    unit: string;
    fromFoodEntry?: string;
    currentViewDate?: string;
  }>();

  const currentViewDate = useLocalSearchParams().currentViewDate || getTodayDateString();
  const { user, loading: authLoading } = useAuth();
  const { addFoodToDailyMeal } = useFirebaseData(currentViewDate);
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const [isAdding, setIsAdding] = useState<string | null>(null);
  // Parse the food object from the route parameters
  const food: Food = foodParam ? JSON.parse(foodParam) : null;
  const quantity = quantityParam ? parseFloat(quantityParam) : 100;
  const unit = unitParam || '100g';

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign:getTextAlign(isRTL),
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 12,
    textAlign:getTextAlign(isRTL),

  },
  foodInfo: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    
  },
  foodQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 12,
    
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  mealsContainer: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  mealOption: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  marginRight: isRTL ? 0 : 20,
  marginLeft: isRTL ? 20 : 0,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
        textAlign:getTextAlign(isRTL),

  },
  mealDescription: {
    fontSize: 16,
    color: '#6B7280',
        textAlign:getTextAlign(isRTL),

  },
  arrow: {
  marginLeft: isRTL ? 0 : 16,
  marginRight: isRTL ? 16 : 0,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 24,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
});
  const meals = [
    {
      id: 'breakfast' as const,
      name: t("mealSelectionScreen:breakfast"),
      icon: <Coffee size={28} color="#F59E0B" />,
      color: '#F59E0B',
      description: 'Start your day right'
    },
    {
      id: 'lunch' as const,
      name: t("mealSelectionScreen:lunch"),
      icon: <Sun size={28} color="#EF4444" />,
      color: '#EF4444',
      description: 'Midday fuel'
    },
    {
      id: 'dinner' as const,
      name: t("mealSelectionScreen:dinner"),
      icon: <Moon size={28} color="#8B5CF6" />,
      color: '#8B5CF6',
      description: 'Evening nourishment'
    },
    {
      id: 'snacks' as const,
      name: t("mealSelectionScreen:snacks"),
      icon: <Cookie size={28} color="#06B6D4" />,
      color: '#06B6D4',
      description: 'Quick bites'
    }
  ];

  const calculateNutritionForFood = (food: Food, quantity: number, unit: string) => {
    const safeQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    let totalGrams = 0;
    
    if (unit === '100g') {
      totalGrams = safeQuantity;
    } else if (food.customConversions && food.customConversions[unit]) {
      const gramsPerUnit = food.customConversions[unit];
      totalGrams = gramsPerUnit * safeQuantity;
    } else {
      totalGrams = safeQuantity;
    }
    
    const multiplier = totalGrams / 100;
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier * 10) / 10,
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
    };
  };

const handleMealSelect = async (mealId: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
  if (!food) {
    Alert.alert('Error', 'Food data not found');
    return;
  }

  if (!user || authLoading) {
    Alert.alert('Authentication Required', 'Please wait while we verify your login, or sign in again.');
    return;
  }

  const displayQuantity = unit === '100g' ? `${Math.round(quantity)}g` : `${quantity} ${unit}`;
  const foodDisplayName = getDisplayName(food, i18n.language);

  Alert.alert(
    t('mealSelectionScreen:confirmAddTitle'), // New translation key for title
    t('mealSelectionScreen:confirmAddMessage', { // New translation key for message
      foodName: foodDisplayName,
      quantity: displayQuantity,
      mealType: mealId, // Pass mealId directly for translation
    }),
    [
      {
        text: t('common:cancel'),
        style: 'cancel',
        onPress: () => console.log('Add to meal cancelled'),
      },
      {
        text: t('common:confirm'),
        onPress: () => { // Changed to non-async as we are not awaiting the DB call here
          setIsAdding(mealId); // Set loading state immediately

          const nutrition = calculateNutritionForFood(food, quantity, unit);

          console.log(`🔍 meal-selection handleMealSelect - Adding food: ${food.name}, Kurdish: ${food.kurdishName || 'N/A'}, Arabic: ${food.arabicName || 'N/A'}`);

          // Fire and forget the database operation
          addFoodToDailyMeal(mealId, {
            foodId: food.id,
            foodName: food.name,
            kurdishName: food.kurdishName || '',
            arabicName: food.arabicName || '',
            calories: nutrition.calories,
            protein: nutrition.protein,
            carbs: nutrition.carbs,
            fat: nutrition.fat,
            quantity,
            unit,
            category: food.category,
          })
            .then(() => {
              console.log('Food added to DB successfully in background.');
              // No success alert needed, user has already navigated away
            })
            .catch((error) => {
              console.error('Error adding food to DB in background:', error);
              // Log the error, avoid disruptive alerts on the new screen
            })
            .finally(() => {
              setIsAdding(null); // Reset loading state once background task finishes
            });

          router.back();  // Navigate back immediately
        },
      },
    ],
    { cancelable: false }
  );
};


  const handleGoBack = () => {
    router.back();
  };

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Food data not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('mealSelectionScreen:headerTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('mealSelectionScreen:headerSubtitle1')} "{getDisplayName(food, i18n.language)}" {t('mealSelectionScreen:headerSubtitle2')}
          </Text>
          <View style={styles.foodInfo}>
            <Text style={styles.foodQuantity}>
              {unit === '100g' ? `${Math.round(quantity)}g` : `${quantity} ${unit}`}
            </Text>
            <Text style={styles.foodCalories}>
              {Math.round(calculateNutritionForFood(food, quantity, unit).calories)} kcal
            </Text>
          </View>
        </View>
      </View>

      {/* Meal Options */}
      <View style={styles.mealsContainer}>
        {meals.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.mealOption, { borderColor: meal.color }]}
            onPress={() => handleMealSelect(meal.id)} // Pass meal.id directly
            disabled={isAdding !== null || authLoading} // Disable all buttons if one is being added or auth is loading
            activeOpacity={0.7}
          >
            <View style={[styles.mealIcon, { backgroundColor: `${meal.color}15` }]}>
              {meal.icon}
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{isAdding === meal.id ? t('mealPlanDetailsScreen:adding') : meal.name}</Text>
             
            </View>
            <View style={styles.arrow}>
              <Text style={[styles.arrowText, { color: meal.color }]}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

