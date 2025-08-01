import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Info, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { NutritionCalculator } from '@/services/nutritionCalculator';
import { Food, NutritionPer100 } from '@/types/api'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';

export default function FoodEntryScreen() {
  const { foodId, fromMealFoodSearch, mealType, mealTitle, fromMealPlan } = useLocalSearchParams<{ // MODIFIED: Added 'fromMealPlan' here
    foodId: string; 
    fromMealFoodSearch?: string;
    mealType?: string; // New param
    mealTitle?: string; // New param
    fromMealPlan?: string; // MODIFIED: Added this line
  }>(); 
   
  const { foodCache, addFoodToDailyMeal } = useFirebaseData(); // Import addFoodToDailyMeal
  
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const [food, setFood] = useState<Food | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('100g');
  const [quantity, setQuantity] = useState(100);
  const [showAllNutrition, setShowAllNutrition] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
    // NEW: Helper function to get localized food name
  const getLocalizedFoodName = () => {
    if (!food) return '';
    if (i18n.language === 'ku' && food.kurdishName) return food.kurdishName;
    if (i18n.language === 'ar' && food.arabicName) return food.arabicName;
    return food.name;
  };

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
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerGradient: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: isRTL ? 0 : 16,
    marginLeft: isRTL ? 16 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: getTextAlign(isRTL),
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 4,
    textAlign: getTextAlign(isRTL),
  },
  categoryBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    //paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: getTextAlign(isRTL),
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: getTextAlign(isRTL),
  },
  unitListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  unitListItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unitListItemSelected: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
    paddingLeft: 12,
  },
  unitListItemLast: {
    borderBottomWidth: 0,
  },
  unitListItemContent: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unitListItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151', 
    flex: 1,
    textAlign: getTextAlign(isRTL),
  },
  unitListItemTextSelected: {
    color: '#22C55E',
  },
  unitListItemConversion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: getTextAlign(isRTL),
  },
  quantityContainer: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    borderWidth: 1,
   borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 80,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  nutritionGrid: {
    flexDirection: getFlexDirection(isRTL),
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nutritionValue: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: getTextAlign(isRTL),
  },
  nutritionToggle: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleHeader: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    flex: 1,
  },
  completeNutritionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionSection: {
    marginBottom: 24,
  },
  nutritionSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    textAlign: getTextAlign(isRTL),
  },
  nutritionList: {
    gap: 8,
  },
  nutritionRow: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  nutritionRowLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    textAlign: getTextAlign(isRTL),
  },
  nutritionRowValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
    textAlign: getTextAlign(isRTL),
    minWidth: 80,
  },
  baseNutritionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  baseNutritionRow: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  baseNutritionLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  baseNutritionValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
  useEffect(() => {
    if (foodId && foodCache.foods.length > 0) {
      const foundFood = foodCache.foods.find(f => f.id === foodId);
      
      if (foundFood) {
        setFood(foundFood);
        
        // Filter out '100g' from available units for display
        const actualDisplayUnits = (foundFood.availableUnits || []).filter(unit => unit !== '100g');

        // Initialize with the first available unit if any, otherwise set to empty
        if (actualDisplayUnits.length > 0) {
          const firstUnit = actualDisplayUnits[0];
          setSelectedUnit(firstUnit);
          // Default to 1 for non-gram units. You might need more complex logic
          // here if you have other units that imply a different starting quantity.
          setQuantity(1); 
        } else {
          // If no other units are available (e.g., only '100g' was present),
          // set to an empty state as per your request.
          setSelectedUnit('');
          setQuantity(0);
        }
      }
    }
  }, [foodId, foodCache.foods]);
  
  // Create a list of units for display, including 100g
  const unitsForDisplay = food ? (food.availableUnits || []).filter(unit => unit !== '100g') : [];

  
  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading food details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate nutrition for current selection
  const getNutritionForUnit = () => {
    const safeQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    let totalGrams = 0;
    
    if (selectedUnit === '100g') {
      totalGrams = safeQuantity;
    } else if (food.customConversions && food.customConversions[selectedUnit]) {
      const gramsPerUnit = food.customConversions[selectedUnit];
      totalGrams = gramsPerUnit * safeQuantity;
    } else {
      totalGrams = safeQuantity; // Fallback to treating quantity as grams
    }
    
    const multiplier = totalGrams / 100;
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier * 10) / 10,
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
      totalGrams,
    };
  };

  const nutrition = getNutritionForUnit();

  const handleAddToMeal = async () => {
    try {
      setIsAdding(true);
      
      if (fromMealFoodSearch === 'true' && mealType) {
        // If coming from meal-food-search, directly add to the meal
        await addFoodToDailyMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', {
          foodId: food.id,
          foodName: food.name,
          kurdishName: food.kurdishName || '',
          arabicName: food.arabicName || '',
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          quantity: nutrition.totalGrams,
          unit: 'g', // Indicate that quantity is in grams
          category: food.category,
        });

        Alert.alert(t('common:success'), `${getLocalizedFoodName()} added to ${mealTitle || mealType}!`, [
          { text: t('common:ok'), onPress: () => router.back() }
        ]);

      } else {
        // Otherwise, navigate to meal selection screen
        router.push({
          pathname: '/(tabs)/add/meal-selection',
          params: {
            food: JSON.stringify(food),
            quantity: nutrition.totalGrams.toString(), // Pass total grams to meal-selection
            unit: 'g', // Indicate that quantity is in grams
            fromFoodEntry: 'true'
          }
        });
      }
    } catch (error) {
      console.error('Error preparing food for meal selection:', error);
      Alert.alert('Error', 'Failed to prepare food');
    } finally {
      setIsAdding(false);
    }
  };

  const getCompleteNutrition = () => {
    if (!food.nutritionPer100) return null;
    
    const baseNutrition = food.nutritionPer100;
    const multiplier = nutrition.totalGrams / 100;
    
    const result: Partial<NutritionPer100> = {};
    
    Object.entries(baseNutrition).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const calculatedValue = value * multiplier;
        result[key as keyof NutritionPer100] = Math.round(calculatedValue * 100) / 100;
      }
    });
    
    return result;
  };

  const completeNutrition = getCompleteNutrition();

  const handleQuantityChange = (text: string) => {
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0) { // Allow 0 temporarily, validation will catch it later
      setQuantity(num);
    } else if (text === '') {
      setQuantity(0); // Allow clearing the input
    }
  };

  // MODIFIED: New handleGoBack function
  const handleGoBack = () => {
    if (fromMealPlan === 'true') {
      // If came from Meal Planner, replace current screen with the Meal Planner screen
      // This effectively dismisses the food-entry screen and ensures we land back on the main meal planner view.
      router.replace('/(tabs)/meal-planner');
    } else if (fromMealFoodSearch === 'true') {
      // If came from Meal Food Search, go back to that screen
      router.back();
    } else {
      // Default behavior: go back in the stack
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F0FDF4', '#F9FAFB']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack} // MODIFIED: Use the new handler
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {/* MODIFIED: Display localized food name */}
            <Text style={styles.headerTitle}>{getLocalizedFoodName()}</Text>
            {/* REMOVED: Separate Text components for Kurdish and Arabic names */}
            
            {food.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{food.category}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>


      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("foodDetailsScreen:servingSize")}</Text>
          <View style={styles.unitListContainer}>
            {unitsForDisplay.map((unit, index) => {
              const isLast = index === unitsForDisplay.length - 1;
              
              return (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitListItem,
                    selectedUnit === unit && styles.unitListItemSelected,
                    isLast && styles.unitListItemLast
                  ]}
                  onPress={() => {
                    setSelectedUnit(unit);
                    // Set a reasonable default quantity when unit changes
                    if (unit === '100g') {
                      setQuantity(100);
                    } else {
                      setQuantity(1);
                    }
                  }}
                >
                  <View style={styles.unitListItemContent}>
                    <Text
                      style={[
                        styles.unitListItemText,
                        selectedUnit === unit && styles.unitListItemTextSelected,
                      ]}
                    >
                      {unit} 
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quantity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
             {selectedUnit === '100g' ? t("foodDetailsScreen:amountGrams") : t("foodDetailsScreen:quantity")}
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(prev => Math.max(0, prev - (selectedUnit === '100g' ? 10 : 1)))}
              >
                <Minus size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={quantity.toString()}
                onChangeText={handleQuantityChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#9CA3AF"
              />
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(prev => prev + (selectedUnit === '100g' ? 10 : 1))}
              >
                <Plus size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* NEW LOCATION FOR ADD TO MEAL BUTTON */}
          <TouchableOpacity 
            style={[styles.addButton, isAdding && styles.addButtonDisabled, { marginBottom: 32, marginHorizontal: 24 }]} // Added margin and horizontal padding
            onPress={handleAddToMeal}
            disabled={isAdding || quantity <= 0}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.addButtonGradient}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {isAdding ? t("foodDetailsScreen:adding") : t("foodDetailsScreen:addToMeal")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          {/* END NEW LOCATION */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
           {t("foodDetailsScreen:nutritionFor")} {
              selectedUnit === '100g' ? `${Math.round(quantity)}g` : `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${selectedUnit}`
            }
          </Text>
          
          <View style={styles.nutritionGrid}>
            <View style={[styles.nutritionCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.nutritionValue, { color: '#92400E' }]}>{nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:calories")}</Text>
            </View>
            
            <View style={[styles.nutritionCard, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.nutritionValue, { color: '#1E40AF' }]}>{nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:protein")}</Text>
            </View>
            
            <View style={[styles.nutritionCard, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.nutritionValue, { color: '#166534' }]}>{nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:carbs")}</Text>
            </View>
            
            <View style={[styles.nutritionCard, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.nutritionValue, { color: '#991B1B' }]}>{nutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:fat")}</Text>
            </View>
          </View>
        </View>

       {completeNutrition && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.nutritionToggle}
                onPress={() => setShowAllNutrition(!showAllNutrition)}
              >
                <View style={styles.toggleHeader}>
                  <Text style={styles.sectionTitle}>{t("foodDetailsScreen:completeNutritionFacts")}</Text>
                </View>
                {showAllNutrition ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
              
              {showAllNutrition && (
                <View style={styles.completeNutritionContainer}>
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>{t("foodDetailsScreen:macronutrients")}</Text>
                    <View style={styles.nutritionList}>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:calories')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.calories} kcal</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:protein')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.protein}g</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:carb')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.carbs}g</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:fat')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.fat}g</Text>
                      </View>
                      {/* MODIFIED: Removed conditional rendering for fiber and sugar */}
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:fiber')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.fiber ?? 0}g</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>{t('common:sugar')}</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.sugar ?? 0}g</Text>
                      </View>
                    </View>
                  </View>

                  {/* PRESERVED OUTER CONDITIONAL for Vitamins section */}
                  {(completeNutrition.vitaminA || completeNutrition.vitaminC || completeNutrition.vitaminD || completeNutrition.vitaminB12) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>{t("foodDetailsScreen:vitamins")}</Text>
                      <View style={styles.nutritionList}>
                        {/* MODIFIED: Removed conditional rendering for each vitamin */}
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:vita')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminA ?? 0} IU</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:vitc')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminC ?? 0}mg</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:vitd')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminD ?? 0} IU</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:vitb12')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminB12 ?? 0}mcg</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* PRESERVED OUTER CONDITIONAL for Minerals section */}
                  {(completeNutrition.calcium || completeNutrition.iron || completeNutrition.potassium || completeNutrition.sodium) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>{t("foodDetailsScreen:minerals")}</Text>
                      <View style={styles.nutritionList}>
                        {/* MODIFIED: Removed conditional rendering for each mineral */}
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:calcium')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.calcium ?? 0}mg</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:iron')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.iron ?? 0}mg</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:potassium')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.potassium ?? 0}mg</Text>
                        </View>
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>{t('common:sodium')}</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.sodium ?? 0}mg</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
         <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("foodDetailsScreen:baseNutrition")}</Text>
            <View style={styles.baseNutritionContainer}>
              {[
                { label: t("foodDetailsScreen:calories") + ':', value: `${food.nutritionPer100?.calories ?? food.calories ?? 0} kcal` },
                { label: t("foodDetailsScreen:protein") + ':', value: `${food.nutritionPer100?.protein ?? food.protein ?? 0}g` },
                { label: t("foodDetailsScreen:carbs") + ':', value: `${food.nutritionPer100?.carbs ?? food.carbs ?? 0}g` },
                { label: t("foodDetailsScreen:fat") + ':', value: `${food.nutritionPer100?.fat ?? food.fat ?? 0}g` }
              ].map((item, index) => (
                <View key={index} style={styles.baseNutritionRow}>
                  <Text style={styles.baseNutritionLabel}>{item.label}</Text>
                  <Text style={styles.baseNutritionValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* REMOVED: The old footer View */}
      {/* <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.addButton, isAdding && styles.addButtonDisabled]} 
          onPress={handleAddToMeal}
          disabled={isAdding || quantity <= 0}
        >
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.addButtonGradient}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>
              {isAdding ? t("foodDetailsScreen:adding") : t("foodDetailsScreen:addToMeal")}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}
