import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Info, ChevronDown, ChevronUp, Plus, Minus, Activity } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { NutritionCalculator } from '@/services/nutritionCalculator';
import { Food, NutritionPer100 } from '@/types/api'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';
import { useDailyMealsContext } from '@/contexts/DailyMealsProvider';
export default function MealPlannerFoodDetailsScreen() {
  const { foodId, quantity: quantityParam, unit: unitParam, fromMealPlan, origin, planId } = useLocalSearchParams<{
    foodId: string;
    quantity: string;
    unit: string;
    fromMealPlan?: string;
    origin?: string;
    planId?: string;
  }>();  
   
  const { addFoodToDailyMeal } = useDailyMealsContext();
  const { foodCache } = useFirebaseData();  
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const [food, setFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(parseFloat(quantityParam || '0'));
  const [selectedUnit, setSelectedUnit] = useState(unitParam || 'g');
  const [showAllNutrition, setShowAllNutrition] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const getLocalizedFoodName = () => {
    if (!food) return '';
    if (i18n.language === 'ku' && food.kurdishName) return food.kurdishName;
    if (i18n.language === 'ar' && food.arabicName) return food.arabicName;
    return food.name;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#F8FAFC',
    },
    loadingText: {
      fontSize: 16,
      color: '#64748B',
      fontWeight: '500',
    },
    headerContainer: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    header: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0F172A',
      textAlign: getTextAlign(isRTL),
    },
    categoryBadge: {
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 6,
    },
    categoryText: {
      fontSize: 12,
      color: '#1E40AF',
      fontWeight: '600',
      textAlign: getTextAlign(isRTL),
    },
    infoCard: {
      backgroundColor: '#EEF2FF',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#C7D2FE',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    infoText: {
      fontSize: 14,
      color: '#4338CA',
      fontWeight: '500',
      flex: 1,
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
      textAlign: getTextAlign(isRTL),
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 100,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#0F172A',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    controlsContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    fixedQuantityContainer: {
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      alignItems: 'center',
    },
    fixedQuantityValue: {
      fontSize: 32,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 4,
    },
    fixedQuantityLabel: {
      fontSize: 14,
      color: '#64748B',
      fontWeight: '500',
      marginBottom: 8,
    },
    fixedQuantityNote: {
      fontSize: 12,
      color: '#6B7280',
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 8,
    },
    conversionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
    },
    conversionCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      alignItems: 'center',
      minWidth: 90,
      flex: 1,
      maxWidth: '48%',
    },
    conversionValue: {
      fontSize: 20,
      fontWeight: '700',
      color: '#0F172A',
      marginBottom: 4,
    },
    conversionUnit: {
      fontSize: 13,
      fontWeight: '500',
      color: '#64748B',
      textAlign: 'center',
    },
    quantityContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFC',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
    },
    quantityInput: {
      height: 44,
      backgroundColor: '#F1F5F9',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: '#64748B',
      paddingHorizontal: 16,
      minWidth: 100,
    },
    nutritionGrid: {
      gap: 12,
      marginTop: 8,
    },
    nutritionRow: {
      flexDirection: getFlexDirection(isRTL),
      gap: 12,
    },
    nutritionCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    nutritionValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    nutritionLabel: {
      fontSize: 13,
      color: '#64748B',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    addButton: {
      borderRadius: 12,
      overflow: 'hidden',
    },
    addButtonDisabled: {
      opacity: 0.6,
    },
    addButtonGradient: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
      backgroundColor: '#9CA3AF',
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    nutritionToggle: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    toggleHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      flex: 1,
    },
    completeNutritionContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    nutritionSection: {
      marginBottom: 20,
    },
    nutritionSectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#0F172A',
      marginBottom: 12,
      textAlign: getTextAlign(isRTL),
    },
    nutritionList: {
      gap: 8,
    },
    nutritionDetailRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#F8FAFC',
      borderRadius: 6,
    },
    nutritionRowLabel: {
      fontSize: 14,
      color: '#475569',
      fontWeight: '500',
      flex: 1,
      textAlign: getTextAlign(isRTL),
    },
    nutritionRowValue: {
      fontSize: 14,
      color: '#0F172A',
      fontWeight: '600',
      textAlign: getTextAlign(isRTL),
    },
    baseNutritionContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    baseNutritionRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: '#F8FAFC',
      borderRadius: 6,
      marginBottom: 6,
    },
    baseNutritionLabel: {
      fontSize: 14,
      color: '#475569',
      fontWeight: '500',
    },
    baseNutritionValue: {
      fontSize: 14,
      color: '#0F172A',
      fontWeight: '600',
    },
  });

  useEffect(() => {
    setFood(null);
    setQuantity(parseFloat(quantityParam || '0'));
    setSelectedUnit(unitParam || 'g');
    setShowAllNutrition(false);

    if (foodId && foodCache.foods.length > 0) {
      const foundFood = foodCache.foods.find(f => f.id === foodId);
      
      if (foundFood) {
        setFood(foundFood);
      } else {
        console.warn('MealPlannerFoodDetailsScreen: Food not found in cache for ID:', foodId);
      }
    }
  }, [foodId, quantityParam, unitParam, foodCache.foods]);
  
  const unitsForDisplay = [{ unit: selectedUnit, conversion: 1 }];

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Activity size={32} color="#3B82F6" style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>Loading food details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getNutritionForUnit = () => {
    const safeQuantity = quantity > 0 ? quantity : 1;
    
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    const multiplier = safeQuantity / 100;
    
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
    Alert.alert('Info', 'This is a read-only view from your meal plan.');
  };

  const getCompleteNutrition = () => {
    if (!food.nutritionPer100) return null;
    
    const baseNutrition = food.nutritionPer100;
    const multiplier = quantity / 100;
    
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

  const handleGoBack = () => {
    if (fromMealPlan === 'true' && planId) {
      // If we came from a meal plan, go back to meal plan details
      router.push({
        pathname: '/(tabs)/meal-plan-details',
        params: {
          planId: planId,
          origin: origin || 'saved-plans'
        }
      });
    } else {
      // If we came from meal planner, go back to meal planner
      router.replace('/(tabs)/meal-planner');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleGoBack}
          >
            <ArrowLeft size={20} color="#0F172A" />
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
      </View>



      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          <View style={styles.section}>
            <View style={styles.controlsContainer}>
              <Text style={styles.sectionTitle}>Fixed Portion</Text>
              <View style={styles.fixedQuantityContainer}>
                <Text style={styles.fixedQuantityLabel}>Amount</Text>
                <Text style={styles.fixedQuantityValue}>
                  {Math.round(quantity)}g
                </Text>
                <Text style={styles.fixedQuantityNote}>
                  Portion size is determined by your meal plan
                </Text>
              </View>

            </View>
          </View>

          {food.availableUnits && food.availableUnits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Serving Conversions</Text>
              <View style={styles.conversionsGrid}>
                {food.availableUnits.map((unit, index) => {
                  let gramsPerOneUnit = 0;
                  if (unit === 'g') {
                    gramsPerOneUnit = 1;
                  } else if (unit === '100g') {
                    gramsPerOneUnit = 100;
                  } else if (food.customConversions && food.customConversions[unit]) {
                    gramsPerOneUnit = food.customConversions[unit];
                  } else {
                    gramsPerOneUnit = 1;
                  }

                  const numberOfUnits = quantity / gramsPerOneUnit;
                  const formattedNumberOfUnits = numberOfUnits % 1 === 0 ? numberOfUnits.toString() : numberOfUnits.toFixed(1);

                  return (
                    <View key={unit} style={styles.conversionCard}>
                      <Text style={styles.conversionValue}>{formattedNumberOfUnits}</Text>
                      <Text style={styles.conversionUnit}>{unit}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nutrition for {`${Math.round(quantity)}g`}
            </Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#F59E0B' }]}>{nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>Calories</Text>
                </View>
                
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#3B82F6' }]}>{nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>Protein</Text>
                </View>
              </View>
              
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#10B981' }]}>{nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>Carbs</Text>
                </View>
                
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#EF4444' }]}>{nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>Fat</Text>
                </View>
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
                  <Text style={styles.sectionTitle}>Complete Nutrition Facts</Text>
                </View>
                {showAllNutrition ? (
                  <ChevronUp size={20} color="#64748B" />
                ) : (
                  <ChevronDown size={20} color="#64748B" />
                )}
              </TouchableOpacity>
              
              {showAllNutrition && (
                <View style={styles.completeNutritionContainer}>
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Macronutrients</Text>
                    <View style={styles.nutritionList}>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Calories</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.calories || 0)} kcal</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Protein</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.protein || 0)}g</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Carbs</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.carbs || 0)}g</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Fat</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.fat || 0)}g</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Fiber</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.fiber || 0)}g</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Sugar</Text>
                        <Text style={styles.nutritionRowValue}>{String(completeNutrition.sugar || 0)}g</Text>
                      </View>
                    </View>
                  </View>

                  {(completeNutrition.vitaminA || completeNutrition.vitaminC || completeNutrition.vitaminD || completeNutrition.vitaminB12) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>Vitamins</Text>
                      <View style={styles.nutritionList}>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin A</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.vitaminA || 0)} IU</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin C</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.vitaminC || 0)}mg</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin D</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.vitaminD || 0)} IU</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin B12</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.vitaminB12 || 0)}mcg</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {(completeNutrition.calcium || completeNutrition.iron || completeNutrition.potassium || completeNutrition.sodium) && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.nutritionSectionTitle}>Minerals</Text>
                      <View style={styles.nutritionList}>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Calcium</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.calcium || 0)}mg</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Iron</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.iron || 0)}mg</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Potassium</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.potassium || 0)}mg</Text>
                        </View>
                        <View style={styles.nutritionDetailRow}>
                          <Text style={styles.nutritionRowLabel}>Sodium</Text>
                          <Text style={styles.nutritionRowValue}>{String(completeNutrition.sodium || 0)}mg</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Nutrition (per 100g)</Text>
            <View style={styles.baseNutritionContainer}>
              {[
                { label: 'Calories', value: `${food.nutritionPer100?.calories ?? food.calories ?? 0} kcal` },
                { label: 'Protein', value: `${food.nutritionPer100?.protein ?? food.protein ?? 0}g` },
                { label: 'Carbs', value: `${food.nutritionPer100?.carbs ?? food.carbs ?? 0}g` },
                { label: 'Fat', value: `${food.nutritionPer100?.fat ?? food.fat ?? 0}g` }
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