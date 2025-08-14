import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Info, ChevronDown, ChevronUp, Plus, Minus, Zap, Target, Activity } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { NutritionCalculator } from '@/services/nutritionCalculator';
import { Food, NutritionPer100 } from '@/types/api'; 
import { LinearGradient } from 'expo-linear-gradient';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';
import { useAppStore } from '@/store/appStore';

export default function FoodEntryScreen() {
  const { foodId, fromMealFoodSearch, mealType, mealTitle, fromMealPlan } = useLocalSearchParams<{
    foodId: string; 
    fromMealFoodSearch?: string;
    mealType?: string;
    mealTitle?: string;
    fromMealPlan?: string;
  }>(); 
   
  const { addFoodToMeal } = useAppStore();
  const { foodCache } = useFirebaseData();  
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const [food, setFood] = useState<Food | null>(null);
  const [selectedUnit, setSelectedUnit] = useState('100g');
  const [quantity, setQuantity] = useState(100);
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
    controlsContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: '#0F172A',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    servingSizeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    servingSizeBox: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      minWidth: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    servingSizeBoxSelected: {
      backgroundColor: '#EFF6FF',
      borderColor: '#3B82F6',
      borderWidth: 2,
    },
    servingSizeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#64748B',
      textAlign: 'center',
    },
    servingSizeTextSelected: {
      color: '#3B82F6',
      fontWeight: '700',
    },
    unitListContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      overflow: 'hidden',
    },
    unitListItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      backgroundColor: '#FFFFFF',
    },
    unitListItemSelected: {
      backgroundColor: '#EFF6FF',
      borderLeftWidth: 3,
      borderLeftColor: '#3B82F6',
      paddingLeft: 13,
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
      fontWeight: '500',
      color: '#475569', 
      flex: 1,
      textAlign: getTextAlign(isRTL),
    },
    unitListItemTextSelected: {
      color: '#3B82F6',
      fontWeight: '600',
    },
    quantitySection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    quantityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#0F172A',
      marginBottom: 12,
    },
    quantityContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    quantityButton: {
      width: 44,
      height: 44,
      borderRadius: 8,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    quantityInput: {
      flex: 1,
      height: 44,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D1D5DB',
      borderRadius: 8,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: '#0F172A',
      marginHorizontal: 12,
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
      backgroundColor: '#3B82F6',
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
    if (foodId && foodCache.foods.length > 0) {
      const foundFood = foodCache.foods.find(f => f.id === foodId);
      
      if (foundFood) {
        setFood(foundFood);
        
        const actualDisplayUnits = (foundFood.availableUnits || []).filter(unit => unit !== '100g');
  
        if (actualDisplayUnits.length > 0) {
          const firstUnit = actualDisplayUnits[0];
          setSelectedUnit(firstUnit);
          
          // Check if the first unit is grams-related
          if (firstUnit.toLowerCase().includes('g') || firstUnit.toLowerCase().includes('gram')) {
            setQuantity(100); // Default to 100 for gram units
          } else {
            setQuantity(1); // Default to 1 for other units
          }
        } else {
          setSelectedUnit('');
          setQuantity(0);
        }
      }
    }
  }, [foodId, foodCache.foods]);
  
  const unitsForDisplay = food ? (food.availableUnits || []).filter(unit => unit !== '100g') : [];

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
      totalGrams = safeQuantity;
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
        await addFoodToMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', {
          foodId: food.id,
          foodName: food.name,
          kurdishName: food.kurdishName || '',
          arabicName: food.arabicName || '',
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          quantity: nutrition.totalGrams,
          unit: 'g',
          category: food.category,
        });

        Alert.alert(t('common:success'), `${getLocalizedFoodName()} added to ${mealTitle || mealType}!`, [
          { text: t('common:ok'), onPress: () => router.back() }
        ]);

      } else {
        router.push({
          pathname: '/(tabs)/add/meal-selection',
          params: {
            food: JSON.stringify(food),
            quantity: nutrition.totalGrams.toString(),
            unit: 'g',
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
    if (!food?.nutritionPer100) return null;
    

    
    const baseNutrition = food.nutritionPer100;
    const multiplier = nutrition.totalGrams / 100;
    
    // Extra safety for grains
    if (!multiplier || !isFinite(multiplier) || isNaN(multiplier)) {
      console.warn('Invalid multiplier for grains:', multiplier);
      return null;
    }
    
    // Only process the fields we actually display
    const fieldsToProcess = [
      'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar',
      'vitaminA', 'vitaminB12', 'vitaminC', 'vitaminD', 'vitaminE',
      'calcium', 'iron', 'potassium', 'sodium'
    ];
    
    const result: Partial<NutritionPer100> = {};
    
    fieldsToProcess.forEach(key => {
      const value = baseNutrition[key as keyof NutritionPer100];
      
      // Extra logging for grains
      if (food.category?.toLowerCase().includes('grain')) {
        console.log(`Processing ${key}:`, value, 'type:', typeof value);
      }
      
      if (value !== null && value !== undefined && typeof value === 'number' && !isNaN(value) && isFinite(value)) {
        const calculatedValue = value * multiplier;
        if (!isNaN(calculatedValue) && isFinite(calculatedValue)) {
          result[key as keyof NutritionPer100] = Math.round(calculatedValue * 100) / 100;
        } else {
          console.warn(`Invalid calculated value for ${key}:`, calculatedValue);
          result[key as keyof NutritionPer100] = 0;
        }
      } else {
        result[key as keyof NutritionPer100] = 0;
      }
    });
    
    return result;
  };

  // Enhanced helper function to safely format nutrition values
  const formatNutritionValue = (value: any, unit: string = ''): string => {
    // Extra safety checks for grains
    if (food.category?.toLowerCase().includes('grain')) {
      console.log('Formatting value for grains:', value, 'unit:', unit);
    }
    
    if (value === null || value === undefined || value === '' || 
        typeof value === 'string' || isNaN(Number(value)) || !isFinite(Number(value))) {
      return `0${unit}`;
    }
    
    const numValue = Number(value);
    const formatted = `${numValue.toFixed(1).replace(/\.0$/, '')}${unit}`;
    
    if (food.category?.toLowerCase().includes('grain')) {
      console.log('Formatted result:', formatted);
    }
    
    return formatted;
  };

  const completeNutrition = getCompleteNutrition();

  const handleQuantityChange = (text: string) => {
    const num = parseFloat(text);
    if (!isNaN(num) && num >= 0) {
      setQuantity(num);
    } else if (text === '') {
      setQuantity(0);
    }
  };

  const handleGoBack = () => {
    if (fromMealPlan === 'true') {
      router.replace('/(tabs)/meal-planner');
    } else if (fromMealFoodSearch === 'true') {
      router.back();
    } else {
      router.back();
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
              <Text style={styles.sectionTitle}>{t("foodDetailsScreen:servingSize")}</Text>
              <View style={styles.servingSizeGrid}>
                {unitsForDisplay.map((unit, index) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.servingSizeBox,
                      selectedUnit === unit && styles.servingSizeBoxSelected,
                    ]}
                    onPress={() => {
                      setSelectedUnit(unit);
                      if (unit === '100g') {
                        setQuantity(100);
                      } else {
                        setQuantity(1);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.servingSizeText,
                        selectedUnit === unit && styles.servingSizeTextSelected,
                      ]}
                    >
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                {selectedUnit === '100g' ? t("foodDetailsScreen:amountGrams") : t("foodDetailsScreen:quantity")}
              </Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(prev => Math.max(0, prev - (selectedUnit === '100g' ? 10 : 1)))}
                >
                  <Minus size={20} color="#64748B" />
                </TouchableOpacity>
                
                <TextInput
                  style={styles.quantityInput}
                  value={quantity.toString()}
                  onChangeText={handleQuantityChange}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
                
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(prev => prev + (selectedUnit === '100g' ? 10 : 1))}
                >
                  <Plus size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.addButton, isAdding && styles.addButtonDisabled, { marginTop: 24 }]} 
                onPress={handleAddToMeal}
                disabled={isAdding || quantity <= 0}
              >
                <View style={styles.addButtonGradient}>
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>
                    {isAdding ? t("foodDetailsScreen:adding") : t("foodDetailsScreen:addToMeal")}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t("foodDetailsScreen:nutritionFor")} {
                selectedUnit === '100g' ? `${Math.round(quantity)}g` : `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${selectedUnit}`
              }
            </Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#F59E0B' }]}>{nutrition.calories}</Text>
                  <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:calories")}</Text>
                </View>
                
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#3B82F6' }]}>{nutrition.protein}g</Text>
                  <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:protein")}</Text>
                </View>
              </View>
              
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#10B981' }]}>{nutrition.carbs}g</Text>
                  <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:carbs")}</Text>
                </View>
                
                <View style={styles.nutritionCard}>
                  <Text style={[styles.nutritionValue, { color: '#EF4444' }]}>{nutrition.fat}g</Text>
                  <Text style={styles.nutritionLabel}>{t("foodDetailsScreen:fat")}</Text>
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
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.calories, ' kcal')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Protein</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.protein, 'g')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Carbs</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.carbs, 'g')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Fat</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.fat, 'g')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Fiber</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.fiber, 'g')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Sugar</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.sugar, 'g')}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Vitamins</Text>
                    <View style={styles.nutritionList}>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Vitamin A</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.vitaminA, ' IU')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Vitamin C</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.vitaminC, 'mg')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Vitamin D</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.vitaminD, ' IU')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
      <Text style={styles.nutritionRowLabel}>Vitamin E</Text>
      <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.vitaminE, 'mg')}</Text>
    </View>

                      
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Vitamin B12</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.vitaminB12, 'mcg')}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Minerals</Text>
                    <View style={styles.nutritionList}>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Calcium</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.calcium, 'mg')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Iron</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.iron, 'mg')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Potassium</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.potassium, 'mg')}</Text>
                      </View>
                      <View style={styles.nutritionDetailRow}>
                        <Text style={styles.nutritionRowLabel}>Sodium</Text>
                        <Text style={styles.nutritionRowValue}>{formatNutritionValue(completeNutrition?.sodium, 'mg')}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("foodDetailsScreen:baseNutrition")}</Text>
            <View style={styles.baseNutritionContainer}>
              {[
                { label: t("foodDetailsScreen:calories"), value: `${food.nutritionPer100?.calories ?? food.calories ?? 0} kcal` },
                { label: t("foodDetailsScreen:protein"), value: `${food.nutritionPer100?.protein ?? food.protein ?? 0}g` },
                { label: t("foodDetailsScreen:carbs"), value: `${food.nutritionPer100?.carbs ?? food.carbs ?? 0}g` },
                { label: t("foodDetailsScreen:fat"), value: `${food.nutritionPer100?.fat ?? food.fat ?? 0}g` }
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