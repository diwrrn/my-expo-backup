// Type definitions for API responses and data structures

export interface User {
  id: string;
  phoneNumber: string;
  name: string;
  createdAt?: string;
  onboardingCompleted?: boolean;
  profile?: UserProfile; // Add this line
}

export interface UserProfile {
  id: string;
  userId: string;
  weight: number;
  height: number;
  age: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goals: NutritionGoals;
  microNutrientGoals?: MicroNutrientGoals;
  createdAt: string;
  updatedAt: string;
  goalsWaterUpdate?: number;
    gender?: 'male' | 'female'; // Add this line
      // ADD THESE PREMIUM FIELDS
  isPremium?: boolean;
  premiumUpdatedAt?: string;
  revenueCatUserId?: string; // Optional: track RevenueCat user ID

}

export interface FoodRequest {
  id: string;
  userId: string;
  foodName: string;
  description?: string;
  status: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MicroNutrientGoals {
  fiber?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  sodium?: number;
  potassium?: number;
  sugar?: number;
}

export interface Food {
  id: string;
  name: string;
  kurdishName: string;
  arabicName: string;
  baseName: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  availableUnits: string[];
  customConversions: Record<string, number>; // Maps unit to gram equivalent
  brand?: string;
  barcode?: string;
  popularity?: number;
  nutritionPer100?: NutritionPer100;
  mealPlanner?: boolean; // Whether this food can be used in meal planning
  mealTiming?: string[]; // Array of meal timings: 'morning', 'lunch', 'dinner', 'snack'
  minPortion?: number; // Minimum portion size in grams
  maxPortion?: number; // Maximum portion size in grams
  allowDuplication?: boolean; // Whether this food can appear multiple times in the same meal plan
  vegan?: boolean; // Whether the food is suitable for vegans
  vegetarian?: boolean; // Whether the food is suitable for vegetarians
  glutenFree?: boolean; // Whether this food is gluten-free
  dairyFree?: boolean; // Whether this food is dairy-free
  calorieAdjustment?: boolean; // Whether this food is suitable for calorie-focused adjustments (high-calorie, low-protein foods)
  lowCalorie?: boolean; // Whether this food is high-protein but low-calorie (ideal for protein adjustments without calorie overshoot)
  // Add these properties for multilingual support and popularity
  name_ar?: string;
  name_ku?: string;
  popular?: boolean;
}

export interface NutritionPer100 {
  calcium?: number;
  calories: number;
  carbs: number;
  fat: number;
  fiber?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  protein: number;
  sodium?: number;
  sugar?: number;
  vitaminA?: number;
  vitaminB12?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  zinc?: number;
  folate?: number;
  niacin?: number;
  riboflavin?: number;
  thiamine?: number;
  phosphorus?: number;
  selenium?: number;
  copper?: number;
  manganese?: number;
  cholesterol?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  omega3?: number;
}

export interface ProcessedFood {
  id: string;
  name: string;
  kurdishName?: string | undefined;
  arabicName?: string | undefined;
  grams: number;
  displayPortion: string; // e.g., "1 piece", "150g", "1 cup"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
}

export interface SavedMealPlan {
  id: string;
  userId: string;
  name: string;
  mealPlanData: GeneratedMealPlan;
  generatedAt: string;
  mealNumber: number;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  foodId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  quantity: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  date: string;
  createdAt: string;
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: number;
}

export interface MealTemplate {
  id: string;
  name: string;
  mealType: string[]; // Array of meal timings: 'breakfast', 'lunch', 'dinner' 
  tags?: string[]; // Array of dietary tags: 'glutenFree', 'dairyFree', 'keto', 'vegan'
  foods: {
    foodId: string;
    allowedPortions: number[]; // Array of allowed portion sizes in grams
  }[];
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number; // in minutes
}

export interface DailyTotals {
  breakfast: MealTotals;
  lunch: MealTotals;
}
