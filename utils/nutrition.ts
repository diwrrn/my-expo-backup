// Utility functions for nutrition calculations and validations

import { NutritionGoals, UserProfile } from '@/types/api';

export class NutritionCalculator {
  /**
   * Calculate daily calorie needs based on user profile
   * Uses Mifflin-St Jeor Equation
   */
  static calculateDailyCalories(profile: UserProfile): number {
    const { weight, height, age, activityLevel } = profile;
    
    // Base Metabolic Rate (BMR) calculation
    // For simplicity, using average between male and female formulas
    const bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.55;
    
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate macro distribution based on calories
   */
  static calculateMacros(calories: number, proteinRatio = 0.25, fatRatio = 0.25): NutritionGoals {
    const proteinCalories = calories * proteinRatio;
    const fatCalories = calories * fatRatio;
    const carbCalories = calories - proteinCalories - fatCalories;
    
    return {
      calories,
      protein: Math.round(proteinCalories / 4), // 4 calories per gram
      carbs: Math.round(carbCalories / 4), // 4 calories per gram
      fat: Math.round(fatCalories / 9), // 9 calories per gram
      water: 2.5, // Default 2.5L per day
    };
  }

  /**
   * Calculate water needs based on weight and activity level
   */
  static calculateWaterNeeds(weight: number, activityLevel: string): number {
    const baseWater = weight * 0.035; // 35ml per kg
    
    const activityBonus = {
      sedentary: 0,
      light: 0.2,
      moderate: 0.4,
      active: 0.6,
      very_active: 0.8,
    };
    
    const bonus = activityBonus[activityLevel as keyof typeof activityBonus] || 0.4;
    
    return Math.round((baseWater + bonus) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Validate nutrition goals
   */
  static validateGoals(goals: Partial<NutritionGoals>): string[] {
    const errors: string[] = [];
    
    if (goals.calories && (goals.calories < 800 || goals.calories > 5000)) {
      errors.push('Calories must be between 800 and 5000');
    }
    
    if (goals.protein && (goals.protein < 0 || goals.protein > 500)) {
      errors.push('Protein must be between 0 and 500g');
    }
    
    if (goals.carbs && (goals.carbs < 0 || goals.carbs > 1000)) {
      errors.push('Carbs must be between 0 and 1000g');
    }
    
    if (goals.fat && (goals.fat < 0 || goals.fat > 300)) {
      errors.push('Fat must be between 0 and 300g');
    }
    
    if (goals.water && (goals.water < 0 || goals.water > 10)) {
      errors.push('Water must be between 0 and 10L');
    }
    
    return errors;
  }

  /**
   * Calculate percentage of goal achieved
   */
  static calculateProgress(current: number, goal: number): number {
    if (goal === 0) return 0;
    return Math.round((current / goal) * 100);
  }

  /**
   * Determine if nutrition goal is met (within 10% tolerance)
   */
  static isGoalMet(current: number, goal: number, tolerance = 0.1): boolean {
    const lowerBound = goal * (1 - tolerance);
    const upperBound = goal * (1 + tolerance);
    return current >= lowerBound && current <= upperBound;
  }

  /**
   * Calculate calories from macros
   */
  static calculateCaloriesFromMacros(protein: number, carbs: number, fat: number): number {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  }

  /**
   * Format nutrition value for display
   */
  static formatNutritionValue(value: number, unit: string): string {
    if (unit === 'kcal') {
      return `${Math.round(value)} ${unit}`;
    }
    
    if (unit === 'L') {
      return `${value.toFixed(1)} ${unit}`;
    }
    
    return `${Math.round(value)}${unit}`;
  }
}

export default NutritionCalculator;