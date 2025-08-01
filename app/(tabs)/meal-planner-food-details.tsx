import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Info, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { NutritionCalculator } from '@/services/nutritionCalculator'; // Ensure this is imported
import { Food, NutritionPer100 } from '@/types/api'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';

export default function MealPlannerFoodDetailsScreen() {
  const { foodId, quantity: quantityParam, unit: unitParam } = useLocalSearchParams<{
    foodId: string;
    quantity: string; // The pre-generated quantity from meal plan
    unit: string;     // The unit, expected to be 'g'
  }>(); 
   
  const { foodCache, addFoodToDailyMeal } = useFirebaseData();
  
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const [food, setFood] = useState<Food | null>(null);
  
  // Initialize quantity and unit from params, and make them non-editable
  const [quantity, setQuantity] = useState(parseFloat(quantityParam || '0'));
  const [selectedUnit, setSelectedUnit] = useState(unitParam || 'g');
  
  const [showAllNutrition, setShowAllNutrition] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Helper function to get localized food name
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
  fixedQuantityNote: { // NEW STYLE
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: getTextAlign(isRTL),
    marginTop: 4,
  },
  infoCard: { // NEW STYLE
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
  },
  infoText: { // NEW STYLE
    fontSize: 14,
    color: '#4338CA',
    fontWeight: '500',
    flex: 1,
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    textAlign: getTextAlign(isRTL),
  },
});

  // Removed the unused calculateNutritionForDisplayUnit function

  useEffect(() => {
    // Reset all relevant states when foodId (or its associated params) changes
    setFood(null);
    setQuantity(parseFloat(quantityParam || '0')); // Re-initialize quantity from param
    setSelectedUnit(unitParam || 'g'); // Re-initialize selectedUnit from param
    setShowAllNutrition(false); // Reset this too for consistency

    if (foodId && foodCache.foods.length > 0) {
      const foundFood = foodCache.foods.find(f => f.id === foodId);
      
      if (foundFood) {
        setFood(foundFood);
      } else {
        console.warn('MealPlannerFoodDetailsScreen: Food not found in cache for ID:', foodId);
      }
    }
  }, [foodId, quantityParam, unitParam, foodCache.foods]); // Add quantityParam and unitParam to dependencies
  
  // Create a list of units for display, but it will be fixed to 'g'
  const unitsForDisplay = [{ unit: selectedUnit, conversion: 1 }]; // Only 'g' is relevant here

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading food details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate nutrition for current selection (using the fixed quantity)
  const getNutritionForUnit = () => {
    const safeQuantity = quantity > 0 ? quantity : 1; // Ensure quantity is positive
    
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    const multiplier = safeQuantity / 100; // Always calculate based on grams
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier * 10) / 10,
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
      totalGrams: safeQuantity,
    };
  };

  const nutrition = getNutritionForUnit();

  const handleAddToMeal = async () => {
    // This screen is for viewing, not for adding to current meal.
    // If adding is desired, it should be a separate action or button.
    // For now, this button will be disabled or repurposed.
    Alert.alert('Info', 'This is a read-only view from your meal plan.');
  };

  const getCompleteNutrition = () => {
    if (!food.nutritionPer100) return null;
    
    const baseNutrition = food.nutritionPer100;
    const multiplier = quantity / 100; // Always calculate based on the fixed quantity
    
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

  // Back button goes back to previous screen
  const handleGoBack = () => {
    router.replace('/(tabs)/meal-planner');
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
            onPress={handleGoBack}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{getLocalizedFoodName()}</Text>
            {food.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{food.category}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Info size={20} color="#4338CA" />
        <Text style={styles.infoText}>
          {t("foodDetailsScreen:fixedQuantityNote")}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {/* Fixed Quantity Display */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("foodDetailsScreen:servingSize")}</Text>
            <View style={styles.fixedQuantityContainer}>
              <Text style={styles.fixedQuantityLabel}>
                {t("foodDetailsScreen:amountGrams")}
              </Text>
              <Text style={styles.fixedQuantityValue}>
                {Math.round(quantity)}g
              </Text>
              <Text style={styles.fixedQuantityNote}>
                {t("foodDetailsScreen:fixedQuantityNote")}
              </Text>
            </View>
          </View>

          {/* NEW SECTION: Available Servings */}
          {food.availableUnits && food.availableUnits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t("foodDetailsScreen:availableServings")}</Text>
              <View style={styles.unitListContainer}>
                {food.availableUnits.map((unit, index) => {
                  const isLast = index === food.availableUnits.length - 1;
                  
                  let gramsPerOneUnit = 0;
                  if (unit === 'g') {
                    gramsPerOneUnit = 1;
                  } else if (unit === '100g') {
                    gramsPerOneUnit = 100;
                  } else if (food.customConversions && food.customConversions[unit]) {
                    gramsPerOneUnit = food.customConversions[unit];
                  } else {
                    // Fallback if unit is not recognized, assume 1g per unit
                    gramsPerOneUnit = 1;
                  }

                  const numberOfUnits = quantity / gramsPerOneUnit;
                  const formattedNumberOfUnits = numberOfUnits % 1 === 0 ? numberOfUnits.toString() : numberOfUnits.toFixed(1);

                  return (
                    <View
                      key={unit}
                      style={[
                        styles.unitListItem,
                        isLast && styles.unitListItemLast
                      ]}
                    >
                      <View style={styles.unitListItemContent}>
  <Text style={styles.unitListItemText}>
    {t(`common:${unit}`)}
  </Text>
  <Text style={styles.unitListItemConversion}>
    {formattedNumberOfUnits}
  </Text>
</View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Quantity Section - Non-editable */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("foodDetailsScreen:amountGrams")}
            </Text>
            <View style={styles.quantityContainer}>
              {/* Disable buttons */}
              <TouchableOpacity style={styles.quantityButton} disabled={true}>
                <Minus size={20} color="#D1D5DB" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={quantity.toString()}
                editable={false} // Make non-editable
                placeholderTextColor="#9CA3AF"
              />
              
              {/* Disable buttons */}
              <TouchableOpacity style={styles.quantityButton} disabled={true}>
                <Plus size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Meal Button - Repurpose or remove if not needed */}
          <TouchableOpacity 
            style={[styles.addButton, styles.addButtonDisabled, { marginBottom: 32, marginHorizontal: 24 }]}
            onPress={handleAddToMeal} // This will show the info alert
            disabled={true} // Always disabled for this view
          >
            <LinearGradient
              colors={['#9CA3AF', '#6B7280']} // Greyed out colors
              style={styles.addButtonGradient}
            >
              <Info size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>
                {t("foodDetailsScreen:fixedQuantityNote")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("foodDetailsScreen:nutritionFor")} {`${Math.round(quantity)}g`}
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

                  {(completeNutrition.vitaminA || completeNutrition.vitaminC || completeNutrition.vitaminD || completeNutrition.vitaminB12) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>{t("foodDetailsScreen:vitamins")}</Text>
                      <View style={styles.nutritionList}>
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

                  {(completeNutrition.calcium || completeNutrition.iron || completeNutrition.potassium || completeNutrition.sodium) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>{t("foodDetailsScreen:minerals")}</Text>
                      <View style={styles.nutritionList}>
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
    </SafeAreaView>
  );
}
