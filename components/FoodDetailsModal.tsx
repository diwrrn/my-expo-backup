import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Plus, Minus } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Food, NutritionPer100 } from '@/types/api';

interface FoodDetailsModalProps {
  visible: boolean;
  food: Food | null;
  onClose: () => void;
  onAdd: (food: Food, quantity: number, unit: string) => void;
}

export function FoodDetailsModal({ visible, food, onClose, onAdd }: FoodDetailsModalProps) {
  const [selectedUnit, setSelectedUnit] = useState('100g');
  const [quantity, setQuantity] = useState(100);
  const [showAllNutrition, setShowAllNutrition] = useState(false);

  // Initialize selected unit when food changes
  useEffect(() => {
    if (food) {
      // Always default to 100g if available
      if (food.availableUnits && food.availableUnits.length > 0) {
        // Check if 100g is available, otherwise use first unit
        const has100g = food.availableUnits.includes('100g');
        if (has100g) {
          setSelectedUnit('100g');
          setQuantity(100);
        } else {
          setSelectedUnit(food.availableUnits[0]);
          // If first unit contains 'g' or is '100g', default to 100, otherwise 1
          const firstUnit = food.availableUnits[0];
          setQuantity(firstUnit.includes('100g') || firstUnit === '100g' ? 100 : 1);
        }
      } else {
        // Fallback to 100g
        setSelectedUnit('100g');
        setQuantity(100);
      }
      setShowAllNutrition(false);
    }
  }, [food]);

  if (!food) return null;

  // Get all available units (prioritize 100g, then availableUnits, then serving)
  const getAvailableUnits = (): string[] => {
    // Get available units without forcing 100g to be visible
    if (food.availableUnits && food.availableUnits.length > 0) {
      // Return available units as-is, filtering out 100g from display
      return food.availableUnits.filter(unit => unit !== '100g');
    }
    
    // Fallback: return empty array if no units available
    return [];
  };

  const availableUnits = getAvailableUnits();

  // Get nutrition values based on selected unit and quantity
  const getNutritionForUnit = () => {
    const safeQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    // Get base nutrition per 100g
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    let totalGrams = 0;
    
    // Calculate total grams based on selected unit
    if (selectedUnit === '100g') {
      // For 100g unit, quantity represents grams directly
      totalGrams = safeQuantity;
    } else if (food.customConversions && food.customConversions[selectedUnit]) {
      // For other units, multiply quantity by gram equivalent per unit
      const gramsPerUnit = food.customConversions[selectedUnit];
      totalGrams = gramsPerUnit * safeQuantity;
    } else {
      // Fallback: treat quantity as grams
      totalGrams = safeQuantity;
    }
    
    // Calculate nutrition based on total grams (nutritionPer100 * totalGrams/100)
    const multiplier = totalGrams / 100;
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier),
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
    };
  };

  const nutrition = getNutritionForUnit();

  const handleQuantityChange = (delta: number) => {
    // For 100g unit, use 10g increments (0.1 * 100g = 10g)
    // For other units, use 0.1 increments
    const increment = selectedUnit === '100g' ? 10 : 0.5;
    const newQuantity = Math.max(0.1, quantity + (delta > 0 ? increment : -increment));
    
    if (selectedUnit === '100g') {
      // For 100g, round to nearest 10g
      setQuantity(Math.round(newQuantity / 10) * 10);
    } else {
      // For other units, round to 1 decimal place
      setQuantity(Math.round(newQuantity * 10) / 10);
    }
  };

  // Get complete nutrition for selected unit and quantity
  const getCompleteNutrition = () => {
    if (!food.nutritionPer100) return null;
    
    const baseNutrition = food.nutritionPer100;
    const validQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    let totalGrams = validQuantity; // For 100g unit, quantity IS the grams
    
    // Calculate total grams based on selected unit
    if (selectedUnit === '100g') {
      // For 100g unit, the quantity directly represents grams
      totalGrams = validQuantity;
    } else if (food.customConversions && food.customConversions[selectedUnit]) {
      // For other units, multiply quantity by gram equivalent per unit
      const gramsPerUnit = food.customConversions[selectedUnit];
      totalGrams = gramsPerUnit * validQuantity;
    } else {
      // Fallback: treat as 100g
      totalGrams = validQuantity;
    }
    
    // Calculate multiplier based on total grams
    const multiplier = totalGrams / 100;
    
    // Calculate all nutrition values
    const result: NutritionPer100 = {} as NutritionPer100;
    
    Object.entries(baseNutrition).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const calculatedValue = value * multiplier;
        result[key as keyof NutritionPer100] = isNaN(calculatedValue) ? 0 : Math.round(calculatedValue * 100) / 100;
      }
    });
    
    return result;
  };

  const completeNutrition = getCompleteNutrition();

  const handleAdd = () => {
    onAdd(food, quantity, selectedUnit);
    onClose();
  };

  // Helper function to get unit display with gram equivalent
  const getUnitDisplayText = (unit: string) => {
    // Just return the unit name without gram equivalent display
    return unit;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
     presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{food.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {food.nameKurdish && (
            <Text style={styles.subtitle}>{food.nameKurdish}</Text>
          )}
          {food.nameArabic && (
            <Text style={styles.subtitle}>{food.nameArabic}</Text>
          )}
          {food.category && (
            <Text style={styles.category}>{food.category}</Text>
          )}
        </View>

        <ScrollView 
          style={styles.content}
        >
          <View style={styles.scrollViewContent}>
          {/* Unit Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serving Size</Text>
            <View style={styles.unitGrid}>
              {availableUnits.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitButton,
                    selectedUnit === unit && styles.unitButtonSelected,
                  ]}
                  onPress={() => setSelectedUnit(unit)}
                  onPressIn={() => {
                    // Set appropriate default quantity when unit is selected
                    if (unit === '100g') {
                      setQuantity(100);
                    } else {
                      setQuantity(1);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.unitButtonText,
                      selectedUnit === unit && styles.unitButtonTextSelected,
                    ]}
                  >
                    {getUnitDisplayText(unit)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedUnit === '100g' ? 'Amount (grams)' : 'Quantity'}
            </Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
              >
                <Minus size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.quantityInput}
                value={
                  selectedUnit === '100g' 
                    ? Math.round(quantity).toString() 
                    : (quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1))
                }
                onChangeText={(text) => {
                  const num = parseFloat(text);
                  if (!isNaN(num) && num > 0) {
                    if (selectedUnit === '100g') {
                      // For 100g, ensure it's a whole number
                      setQuantity(Math.round(num));
                    } else {
                      setQuantity(num);
                    }
                  }
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <Plus size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nutrition Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Nutrition for {
                selectedUnit === '100g' 
                  ? `${Math.round(quantity)}g` 
                  : `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${selectedUnit}`
              }
            </Text>
            
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.calories}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.protein}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.carbs}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              
              <View style={styles.nutritionCard}>
                <Text style={styles.nutritionValue}>{nutrition.fat}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Complete Nutrition Information */}
          {completeNutrition && (
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.nutritionToggle}
                onPress={() => setShowAllNutrition(!showAllNutrition)}
              >
                <Text style={styles.sectionTitle}>
                  Complete Nutrition Facts
                </Text>
                <Text style={styles.toggleText}>
                  {showAllNutrition ? 'Show Less' : 'Show All'}
                </Text>
              </TouchableOpacity>
              
              {showAllNutrition && (
                <View style={styles.completeNutritionContainer}>
                  {/* Macronutrients */}
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Macronutrients</Text>
                    <View style={styles.nutritionList}>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Calories</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.calories} kcal</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Protein</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.protein}g</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Carbohydrates</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.carbs}g</Text>
                      </View>
                      <View style={styles.nutritionRow}>
                        <Text style={styles.nutritionRowLabel}>Total Fat</Text>
                        <Text style={styles.nutritionRowValue}>{completeNutrition.fat}g</Text>
                      </View>
                      {completeNutrition.fiber && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Fiber</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.fiber}g</Text>
                        </View>
                      )}
                      {completeNutrition.sugar && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Sugar</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.sugar}g</Text>
                        </View>
                      )}
                      {completeNutrition.saturatedFat && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Saturated Fat</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.saturatedFat}g</Text>
                        </View>
                      )}
                      {completeNutrition.monounsaturatedFat && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Monounsaturated Fat</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.monounsaturatedFat}g</Text>
                        </View>
                      )}
                      {completeNutrition.polyunsaturatedFat && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Polyunsaturated Fat</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.polyunsaturatedFat}g</Text>
                        </View>
                      )}
                      {completeNutrition.omega3 && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Omega-3</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.omega3}g</Text>
                        </View>
                      )}
                      {completeNutrition.omega6 && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Omega-6</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.omega6}g</Text>
                        </View>
                      )}
                      {completeNutrition.cholesterol && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Cholesterol</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.cholesterol}mg</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Vitamins */}
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Vitamins</Text>
                    <View style={styles.nutritionList}>
                      {completeNutrition.vitaminA && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin A</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminA} IU</Text>
                        </View>
                      )}
                      {completeNutrition.vitaminC && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin C</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminC}mg</Text>
                        </View>
                      )}
                      {completeNutrition.vitaminD && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin D</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminD} IU</Text>
                        </View>
                      )}
                      {completeNutrition.vitaminE && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin E</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminE}mg</Text>
                        </View>
                      )}
                      {completeNutrition.vitaminK && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin K</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminK}mcg</Text>
                        </View>
                      )}
                      {completeNutrition.vitaminB12 && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Vitamin B12</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.vitaminB12}mcg</Text>
                        </View>
                      )}
                      {completeNutrition.folate && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Folate</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.folate}mcg</Text>
                        </View>
                      )}
                      {completeNutrition.niacin && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Niacin (B3)</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.niacin}mg</Text>
                        </View>
                      )}
                      {completeNutrition.riboflavin && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Riboflavin (B2)</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.riboflavin}mg</Text>
                        </View>
                      )}
                      {completeNutrition.thiamine && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Thiamine (B1)</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.thiamine}mg</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Minerals */}
                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionSectionTitle}>Minerals</Text>
                    <View style={styles.nutritionList}>
                      {completeNutrition.calcium && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Calcium</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.calcium}mg</Text>
                        </View>
                      )}
                      {completeNutrition.iron && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Iron</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.iron}mg</Text>
                        </View>
                      )}
                      {completeNutrition.magnesium && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Magnesium</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.magnesium}mg</Text>
                        </View>
                      )}
                      {completeNutrition.potassium && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Potassium</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.potassium}mg</Text>
                        </View>
                      )}
                      {completeNutrition.sodium && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Sodium</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.sodium}mg</Text>
                        </View>
                      )}
                      {completeNutrition.zinc && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Zinc</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.zinc}mg</Text>
                        </View>
                      )}
                      {completeNutrition.phosphorus && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Phosphorus</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.phosphorus}mg</Text>
                        </View>
                      )}
                      {completeNutrition.selenium && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Selenium</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.selenium}mcg</Text>
                        </View>
                      )}
                      {completeNutrition.copper && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Copper</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.copper}mg</Text>
                        </View>
                      )}
                      {completeNutrition.manganese && (
                        <View style={styles.nutritionRow}>
                          <Text style={styles.nutritionRowLabel}>Manganese</Text>
                          <Text style={styles.nutritionRowValue}>{completeNutrition.manganese}mg</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
          </View>

          {/* Base Nutrition (per 100g) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Base Nutrition (per 100g)</Text>
            <View style={styles.baseNutritionContainer}>
              <View style={styles.baseNutritionRow}>
                <Text style={styles.baseNutritionLabel}>Calories:</Text>
                <Text style={styles.baseNutritionValue}>{food.nutritionPer100?.calories || food.calories} kcal</Text>
              </View>
              <View style={styles.baseNutritionRow}>
                <Text style={styles.baseNutritionLabel}>Protein:</Text>
                <Text style={styles.baseNutritionValue}>{food.nutritionPer100?.protein || food.protein}g</Text>
              </View>
              <View style={styles.baseNutritionRow}>
                <Text style={styles.baseNutritionLabel}>Carbs:</Text>
                <Text style={styles.baseNutritionValue}>{food.nutritionPer100?.carbs || food.carbs}g</Text>
              </View>
              <View style={styles.baseNutritionRow}>
                <Text style={styles.baseNutritionLabel}>Fat:</Text>
                <Text style={styles.baseNutritionValue}>{food.nutritionPer100?.fat || food.fat}g</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>
              Add {
                selectedUnit === '100g' 
                  ? `${Math.round(quantity)}g` 
                  : `${quantity % 1 === 0 ? quantity : quantity.toFixed(1)} ${selectedUnit}`
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B5CF6',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  unitButtonSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  unitButtonTextSelected: {
    color: '#FFFFFF',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    width: 80,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  baseNutritionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  baseNutritionRow: {
    flexDirection: 'row',
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
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nutritionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  completeNutritionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionSection: {
    marginBottom: 20,
  },
  nutritionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  nutritionList: {
    gap: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  nutritionRowLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  nutritionRowValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 80,
  },
});