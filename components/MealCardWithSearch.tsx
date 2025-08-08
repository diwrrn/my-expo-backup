import { View, Text, StyleSheet, TouchableOpacity, Alert, LayoutAnimation, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
} from 'react-native-reanimated';
import { FoodItem } from './FoodItem';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { Food } from '@/types/api';
import { router } from 'expo-router';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDailyMealsContext } from '@/contexts/DailyMealsProvider';
  
 interface MealCardWithSearchProps {
  title: string;
  calories: number;
  items: number;
  color: string;
  icon: React.ReactNode;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foods: any[];
  onRemoveFood: (foodKey: string) => void;
  currentViewDate?: string;
}

export function MealCardWithSearch({
  title, 
  calories, 
  items, 
  color, 
  icon, 
  mealType,
  foods,
  onRemoveFood,
  currentViewDate
}: MealCardWithSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRTL = useRTL(); // Add this line
  const { t, i18n } = useTranslation(); // Add i18n here
  const isKurdish = i18n.language === 'ku' || i18n.language === 'ckb'; // Check if Kurdish

  // Animation values
  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);
  
  const { addFoodToDailyMeal } = useDailyMealsContext();
  const { searchFoods, getPopularFoods } = useFirebaseData();
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
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
    maxWidth: '100%',
    paddingBottom: 10,
  },
  header: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flex: 1,
    minWidth: 0, // Allows text to truncate properly
  },
  titleRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
    textAlign: getTextAlign(isRTL),
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  statsRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'baseline',
  },
  caloriesValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: isRTL ? 0 : 4,
    marginRight: isRTL ? 4 : 0,
    fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  itemsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    fontWeight: '500',
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  chevronContainer: {
    padding: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
     marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
  },
  expandedContent: {
  },
  foodsList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  foodItem: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
    minWidth: 0,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: getTextAlign(isRTL),
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  
  foodDetails: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  foodCalories: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  macroInfo: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
    
  },
  macroText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
  },
  quickAddButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  quickAddButtonText: {
    fontSize: 14,
    fontWeight: '600',
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
});
  // Calculate the height needed for the expanded content
  const calculateContentHeight = () => {
    // Each food item is approximately 68px (60px minHeight + 8px marginBottom)
    // Each food item is approximately 92px (60px minHeight + 24px paddingVertical + 8px marginBottom)
    // Plus 16px for the foodsList paddingBottom
    return foods.length * 92 + 16;
  };
const extractUnit = (unitString) => {
  if (!unitString) return '';
  
  // Remove any numbers and spaces from the beginning
  // "100g" -> "g", "1 cup" -> "cup", "1 plate" -> "plate"
  return unitString.replace(/^\d+\s*/, '');
};
  // Animate expansion/collapse
  useEffect(() => {
    // Animate expansion/collapse based on isExpanded state
    if (isExpanded && foods.length > 0) {
      const targetHeight = calculateContentHeight();
      animatedHeight.value = withTiming(targetHeight, { duration: 300 });
      animatedOpacity.value = withTiming(1, { duration: 300 });
    } else {
      animatedHeight.value = withTiming(0, { duration: 300 });
      animatedOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isExpanded, foods.length]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Animated style for the expanded content
  const animatedExpandedContentStyle = useAnimatedStyle(() => {
    return {
      height: animatedHeight.value,
      opacity: animatedOpacity.value,
      overflow: 'hidden',
    };
  });

  const openSearchModal = () => {
    // Navigate to the meal food search screen
    router.push({
      pathname: '/(tabs)/add/meal-food-search',
      params: {
        mealType: mealType,
        mealTitle: title,
        currentViewDate: currentViewDate,
        fromHome: 'true'
      }
    });
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerContent}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            {/* First Row: Meal Title */}
            <View style={styles.titleRow}>
              {icon}
              <Text style={styles.title}>{title}</Text>
            </View>
            
            {/* Second Row: Stats and Chevron */}
            <View style={styles.statsRow}>
              <View style={styles.statsContainer}>
                <Text style={styles.caloriesValue}>{Math.round(calories)}</Text>
                <Text style={styles.caloriesLabel}>{t('homeScreen:kcal')}</Text>
                <Text style={styles.itemsText}> {items} {t('homeScreen:items')}</Text>
              </View>
              
              {foods.length > 0 && (
                <View style={styles.chevronContainer}>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#6B7280" />
                  ) : (
                    <ChevronDown size={20} color="#6B7280" />
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: color }]}
            onPress={openSearchModal}
          >
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Food Items List - Animated */}
        {foods.length > 0 && (
          <Animated.View style={[styles.expandedContent, animatedExpandedContentStyle]}>
            <View style={styles.foodsList}>
              {foods.map((food, index) => (
                <View key={`${food.foodKey}-${index}`} style={styles.foodItem}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>
                      {i18n.language === 'ku' && food.kurdishName && food.kurdishName !== 'N/A' && food.kurdishName !== ''
                        ? food.kurdishName
                        : i18n.language === 'ar' && food.arabicName && food.arabicName !== 'N/A' && food.arabicName !== ''
                          ? food.arabicName
                          : food.name || food.foodName || (food.foodId ? `Food ${food.foodId}` : 'Unknown Food')}
                    </Text>
                    <View style={styles.foodDetails}>
                      <Text style={styles.foodQuantity}>
                        {food.quantity} {t(`common:${extractUnit(food.unit)}`)}
                      </Text>
                      <Text style={styles.foodCalories}>
                        {Math.round(food.calories || 0)} {t('homeScreen:kcal')}
                      </Text>
                    </View>
                    <View style={styles.macroInfo}>
                      <Text style={styles.macroText}>
                        {t("common:p")}: {Math.round((food.protein || 0) * 10) / 10}g
                      </Text>
                      <Text style={styles.macroText}>
                        {t("common:c")}: {Math.round((food.carbs || 0) * 10) / 10}g
                      </Text>
                      <Text style={styles.macroText}>
                        {t("common:f")}: {Math.round((food.fat || 0) * 10) / 10}g
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveFood(food.foodKey)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Quick Add Button for Empty Meals */}
        {foods.length === 0 && (
          <TouchableOpacity 
            style={[styles.quickAddButton, { borderColor: color }]}
            onPress={openSearchModal}
          >
            <Plus size={16} color={color} />
            <Text style={[styles.quickAddButtonText, { color: color }]}>
              {t('homeScreen:addFood')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </>
  );
}