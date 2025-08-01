/**
 * Nutrition Calculator Service
 * Utility for calculating nutrition values
 */

import { Food } from '@/types/api';

export interface ProcessedFood {
  id: string;
  name: string;
  nameKurdish?: string;
  nameArabic?: string;
  grams: number;
  displayPortion: string; // e.g., "1 piece", "150g", "1 cup"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  originalFood: Food;
}

export class NutritionCalculator {
  /**
   * Calculate nutrition for a food based on portion size
   * @param food - Food item
   * @param grams - Portion size in grams
   * @returns Calculated nutrition values
   */
  static calculateFoodNutrition(food: Food, grams: number): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    // Get nutrition per 100g (prefer nutritionPer100, fallback to legacy fields)
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };

    // Calculate using formula: (grams / 100) * nutritionPer100.value
    const multiplier = grams / 100;

    return {
      calories: nutritionPer100.calories * multiplier,
      protein: nutritionPer100.protein * multiplier,
      carbs: nutritionPer100.carbs * multiplier,
      fat: nutritionPer100.fat * multiplier,
    };
  }

  /**
   * Convert grams to display units using customConversions and availableUnits
   */
  static convertToDisplayUnits(food: Food, grams: number): string {
    // If no available units, just return grams
    if (!food.availableUnits || food.availableUnits.length === 0) {
      return `${Math.round(grams)}g`;
    }

    // Try to find the best unit conversion
    const bestUnit = this.findBestDisplayUnit(food, grams);
    
    if (bestUnit.unit === '100g') {
      return `${Math.round(grams)}g`;
    }

    if (bestUnit.conversionValue) {
      // Calculate how many units this represents
      const unitCount = grams / bestUnit.conversionValue;
      
      // Format nicely
      if (unitCount % 1 === 0) {
        return `${unitCount} ${bestUnit.unit}`;
      } else if (unitCount < 1) {
        return `${Math.round(grams)}g`; // Fall back to grams for small amounts
      } else {
        return `${unitCount.toFixed(1)} ${bestUnit.unit}`;
      }
    }

    // Fallback to grams
    return `${Math.round(grams)}g`;
  }

  /**
   * Find the best display unit for a given gram amount
   */
  static findBestDisplayUnit(food: Food | null, grams: number): {
    unit: string;
    conversionValue?: number;
  } {
    if (!food || !food.availableUnits || !food.customConversions) {
      return { unit: '100g' };
    }

    // Find units that would result in reasonable numbers (0.5 to 5.0 range preferred)
    const unitOptions = food.availableUnits
      .filter(unit => unit !== '100g') // Skip 100g as it's handled separately
      .map((unit) => {
        const conversionValue = food.customConversions![unit];
        if (!conversionValue) return null;

        const unitCount = grams / conversionValue;
        const reasonableness = this.calculateReasonableness(unitCount);

        return {
          unit,
          conversionValue,
          unitCount,
          reasonableness
        };
      })
      .filter((option): option is NonNullable<typeof option> => option !== null)
      .sort((a, b) => b!.reasonableness - a!.reasonableness);

    if (unitOptions.length > 0 && unitOptions[0]!.reasonableness > 0.5) {
      return {
        unit: unitOptions[0]!.unit,
        conversionValue: unitOptions[0]!.conversionValue
      };
    } 

    // Fallback to 100g (grams)
    return { unit: '100g' };
  }

  /**
   * Calculate how "reasonable" a unit count is for display
   * Returns 0-1 score, where 1 is most reasonable
   */
  static calculateReasonableness(unitCount: number): number {
    // Prefer counts between 0.5 and 5.0
    if (unitCount >= 0.5 && unitCount <= 5.0) {
      return 1.0;
    }
    
    // Acceptable range 0.25 to 10
    if (unitCount >= 0.25 && unitCount <= 10) {
      return 0.7;
    }
    
    // Less ideal but usable
    if (unitCount >= 0.1 && unitCount <= 20) {
      return 0.3;
    }
    
    // Not reasonable
    return 0;
  }
}

export default NutritionCalculator;