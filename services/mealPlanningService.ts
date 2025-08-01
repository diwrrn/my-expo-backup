/**
 * Algorithmic Meal Planning Service
 * Cached meal planning using mathematical optimization
 */

import { Food, MealTemplate } from '@/types/api';
import { FirebaseService } from './firebaseService';

export interface MealPlanningTargets {
  calories: number;
  protein?: number;
  preferences?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
    quickMeals?: boolean;
    highProtein?: boolean;
    lowCarb?: boolean;
    balanced?: boolean;
  };
}

export interface ProcessedFood {
  id: string;
  name: string;
  kurdishName?: string;
  arabicName?: string;
  grams: number;
  displayPortion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  originalFood: Food;
}

export interface GeneratedMealPlan {
  id: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    breakfast: ProcessedFood[];
    lunch: ProcessedFood[];
    dinner: ProcessedFood[];
    snacks: ProcessedFood[];
  };
  generatedAt: string;
  accuracy?: {
    calories: number;
    protein: number;
  };
}

interface MealResult {
  mealName: string;
  foods: { foodId: string; portion: number }[];
  nutrition: { calories: number; protein: number };
  score: number;
}

interface FoodCombination {
  foodId: string;
  portion: number;
}

export class MealPlanningService {
  /**
   * Main entry point: Generate meal plan using cached food data
   */
   static async generateMealPlan(
    userCalories: number,
    userProtein?: number,
    cachedFoods?: Food[],
    dietaryPreferences?: string[],
    excludedFoodBaseNames?: string[]
  ): Promise<GeneratedMealPlan> {
    console.log('\n🚀 ALGORITHMIC MEAL PLANNER STARTING');
    console.log(`   🎯 Targets: ${userCalories} kcal, ${userProtein || 'auto'}g protein`);
    if (dietaryPreferences && dietaryPreferences.length > 0) {
      console.log(`   🥗 Dietary Preferences: ${dietaryPreferences.join(', ')}`);
    }
    if (excludedFoodBaseNames && excludedFoodBaseNames.length > 0) {
      console.log(`   ❌ Excluded Foods: ${excludedFoodBaseNames.join(', ')}`);
    }

    // Create food lookup map for O(1) access
    const foodLookup = new Map<string, Food>();

    if (cachedFoods && cachedFoods.length > 0) {
      cachedFoods.forEach(food => foodLookup.set(food.id, food));
    }

    // Step 1: Calculate protein target if not provided
    const targetProtein = userProtein || Math.round(userCalories * 0.25 / 4);

    // Step 2: Calculate meal targets
    const targets = {
      breakfast: {
        calories: Math.round(userCalories * 0.25),
        protein: Math.round(targetProtein * 0.20)
      },
      lunch: {
        calories: Math.round(userCalories * 0.40),
        protein: Math.round(targetProtein * 0.40)
      },
      dinner: {
        calories: Math.round(userCalories * 0.35),
        protein: Math.round(targetProtein * 0.40)
      }
    };

    console.log('   📊 Meal Targets:');
    console.log(`      Breakfast: ${targets.breakfast.calories} kcal, ${targets.breakfast.protein}g protein`);
    console.log(`      Lunch: ${targets.lunch.calories} kcal, ${targets.lunch.protein}g protein`);
    console.log(`      Dinner: ${targets.dinner.calories} kcal, ${targets.dinner.protein}g protein`);

    const results: { [key: string]: MealResult | null } = {};

    // Step 3: Process each meal
    for (const mealType of ['breakfast', 'lunch', 'dinner']) {
      const target = targets[mealType as keyof typeof targets];

      console.log(`\n🍽️ Processing ${mealType.toUpperCase()}:`);
      console.log(`   🎯 Target: ${target.calories} kcal, ${target.protein}g protein`);

      // Step 4: Get eligible meals from database
      const eligibleMeals = await FirebaseService.getMealsFromFirebase(mealType, dietaryPreferences);
      console.log(`   📋 Found ${eligibleMeals.length} eligible meal templates`);

      // Filter out meals containing excluded foods
      let filteredMeals = eligibleMeals;
      if (excludedFoodBaseNames && excludedFoodBaseNames.length > 0) {
        filteredMeals = eligibleMeals.filter(meal => {
          // Check each food in the meal
          for (const mealFood of meal.foods) {
            // Get the food data from cache or Firebase
            const foodData = foodLookup.get(mealFood.foodId);
            if (foodData && foodData.baseName) {
              // Check if this food's baseName is in the excluded list
              if (excludedFoodBaseNames.includes(foodData.baseName)) {
                return false; // Exclude this meal
              }
            }
          }
          return true; // Include this meal
        });

        console.log(`   ❌ Filtered out ${eligibleMeals.length - filteredMeals.length} meals containing excluded foods`);
      }

      // Step 4.5: Add meal template protein density analysis
      if (filteredMeals.length > 0) {
        console.log(`   📊 MEAL PROTEIN ANALYSIS:`);
        for (const meal of filteredMeals.slice(0, 3)) {
          // Calculate base nutrition using first allowed portion for each food
          let baseCalories = 0;
          let baseProtein = 0;

          for (const mealFood of meal.foods) {
            const foodData = foodLookup.get(mealFood.foodId) || await FirebaseService.getFoodFromFirebase(mealFood.foodId);
            if (foodData) {
              const nutrition = this.getSafeNutrition(foodData);
              const firstPortion = mealFood.allowedPortions[0];
              const multiplier = firstPortion / 100;
              baseCalories += nutrition.calories * multiplier;
              baseProtein += nutrition.protein * multiplier;
            }
          }

          const proteinDensity = baseCalories > 0 ? (baseProtein / baseCalories) * 100 : 0;
          console.log(`      ${meal.name}: ${proteinDensity.toFixed(1)}% protein density`);
        }
      }

      if (filteredMeals.length === 0) {
        console.log(`   ⚠️ No meal templates found for ${mealType}`);
        results[mealType] = null;
        continue;
      }

      let bestMeal: MealResult | null = null;
      let bestScore = Infinity;

      // Step 5.5: Collect all meal results with their accuracy scores for variety logic
      const allMealResults: Array<{
        meal: MealResult,
        calorieAccuracy: number,
        proteinAccuracy: number
      }> = [];

      // Step 5: Test each meal template
      for (const meal of filteredMeals) {
        console.log(`   🔍 Testing meal template: ${meal.name}`);

        // Step 6: Generate all portion combinations
        const combinations = this.generateCombinations(meal.foods);
        console.log(`      📊 Generated ${combinations.length} combinations`);

        // Step 7: Test each combination
        let combinationCount = 0;
        for (const combination of combinations) {
          combinationCount++;

          if (combinationCount % 10 === 0) {
            console.log(`      🔄 Processed ${combinationCount}/${combinations.length} combinations`);
          }

          // Step 8: Calculate nutrition for this combination
          let totalCalories = 0;
          let totalProtein = 0;
          let validCombination = true;

          for (const food of combination) {
            // Use cached food data if available, otherwise fall back to Firebase
            let foodData: Food | null = null;

            if (foodLookup.has(food.foodId)) {
              foodData = foodLookup.get(food.foodId)!;
            } else {
              // Fallback to Firebase request (this should be rare with proper caching)
              foodData = await FirebaseService.getFoodFromFirebase(food.foodId);
              if (foodData) {
                // Add to lookup for future use
                foodLookup.set(food.foodId, foodData);
              }
            }

            if (!foodData) {
              validCombination = false;
              break;
            }

            const nutrition = this.getSafeNutrition(foodData);
            totalCalories += (nutrition.calories * food.portion) / 100;
            totalProtein += (nutrition.protein * food.portion) / 100;
          }

          if (!validCombination) continue;

          // Step 8.5: Add combination-level protein logging for top 3 combinations
          if (combinationCount <= 3) {
            const proteinRatio = (totalProtein / target.protein) * 100;
            const calorieRatio = (totalCalories / target.calories) * 100;

            console.log(`      🧪 Combination ${combinationCount}:`);
            console.log(`         Portions: ${combination.map(f => `${f.portion}g`).join(', ')}`);
            console.log(`         Nutrition: ${Math.round(totalCalories)}cal (${calorieRatio.toFixed(1)}%), ${Math.round(totalProtein)}g protein (${proteinRatio.toFixed(1)}%)`);
            console.log(`         Score: ${(Math.abs(target.calories - totalCalories) + (Math.abs(target.protein - totalProtein) * 2)).toFixed(1)}`);
          }

          // Step 9: Score this combination
          const calorieError = Math.abs(target.calories - totalCalories);
          const proteinError = Math.abs(target.protein - totalProtein);
          const score = calorieError + (proteinError * 2); // Prioritize protein accuracy

          // Calculate accuracy percentages for variety logic
          const calorieAccuracy = (totalCalories / target.calories) * 100;
          const proteinAccuracy = (totalProtein / target.protein) * 100;

          // Store this combination for variety analysis
          allMealResults.push({
            meal: {
              mealName: meal.id, // <--- MODIFIED: Use MealTemplate ID for grouping
              foods: combination,
              nutrition: { calories: totalCalories, protein: totalProtein },
              score: score
            },
            calorieAccuracy,
            proteinAccuracy
          });

          // Step 10: Check if this is the best so far (for fallback)
          if (score < bestScore) {
            bestScore = score;
            bestMeal = {
              mealName: meal.id, // <--- MODIFIED: Use MealTemplate ID for grouping
              foods: combination,
              nutrition: { calories: totalCalories, protein: totalProtein },
              score: score
            };
          }
        }
      }

      // Step 10.5: Implement variety logic with 97% accuracy filter
      let finalSelectedMeal: MealResult | null = null;

      // Filter combinations that meet 97% accuracy standard (97-103% range)
      const highQualityCombinations = allMealResults.filter(result => {
        return result.calorieAccuracy >= 97 && result.calorieAccuracy <= 103 &&
               result.proteinAccuracy >= 97 && result.proteinAccuracy <= 103;
      });

      // NEW: Group high-quality combinations by meal template ID
      const groupedHighQualityMeals = new Map<string, Array<{ meal: MealResult, calorieAccuracy: number, proteinAccuracy: number }>>();
      highQualityCombinations.forEach(item => {
        const mealTemplateId = item.meal.mealName; // This now holds the MealTemplate.id
        if (!groupedHighQualityMeals.has(mealTemplateId)) {
          groupedHighQualityMeals.set(mealTemplateId, []);
        }
        groupedHighQualityMeals.get(mealTemplateId)?.push(item);
      });

      const uniqueMealTemplateIds = Array.from(groupedHighQualityMeals.keys());

      console.log(`   🎲 VARIETY: Found ${highQualityCombinations.length} combinations meeting 97% accuracy standard.`);
      console.log(`   🎲 These combinations belong to ${uniqueMealTemplateIds.length} unique meal templates.`);

      if (uniqueMealTemplateIds.length > 0) {
        // Randomly select one unique meal template ID
        const selectedTemplateId = uniqueMealTemplateIds[Math.floor(Math.random() * uniqueMealTemplateIds.length)];
        const combinationsForSelectedTemplate = groupedHighQualityMeals.get(selectedTemplateId);

        console.log(`   🎲 Randomly selected meal template ID: ${selectedTemplateId}`);
        console.log(`   🎲 It has ${combinationsForSelectedTemplate?.length} high-quality combinations.`);

        // Randomly select one combination from the chosen template's combinations
        if (combinationsForSelectedTemplate && combinationsForSelectedTemplate.length > 0) {
          finalSelectedMeal = combinationsForSelectedTemplate[Math.floor(Math.random() * combinationsForSelectedTemplate.length)].meal;
          console.log(`   ✅ Selected combination from template ${selectedTemplateId}: ${finalSelectedMeal.mealName}`);
        } else {
          // Fallback if somehow no combinations for selected template (shouldn't happen if grouped correctly)
          console.log(`   ⚠️ No combinations found for selected template ${selectedTemplateId}. Falling back to overall best.`);
          finalSelectedMeal = bestMeal;
        }
      } else {
        console.log(`   ⚠️ No meals meet 97% standard. Falling back to overall best.`);
        finalSelectedMeal = bestMeal; // Fallback to original best meal if no high-quality meals at all
      }

      // Log final selection details
      if (finalSelectedMeal) {
        const finalCalorieAccuracy = (finalSelectedMeal.nutrition.calories / target.calories) * 100;
        const finalProteinAccuracy = (finalSelectedMeal.nutrition.protein / target.protein) * 100;

        console.log(`   🎯 FINAL SELECTION:`);
        console.log(`      Meal: ${finalSelectedMeal.mealName}`);
        console.log(`      Accuracy: ${finalCalorieAccuracy.toFixed(1)}% calories, ${finalProteinAccuracy.toFixed(1)}% protein`);
      }

      // Use finalSelectedMeal instead of bestMeal for the rest of the logic
      bestMeal = finalSelectedMeal;

      // Step 11: Apply light scaling if needed
      if (bestMeal && bestScore > 50) { // Only scale if accuracy is poor
        console.log(`   🔧 SCALING ANALYSIS:`);
        console.log(`      Current accuracy too low (score: ${bestScore.toFixed(1)})`);

        const calorieScaleFactor = target.calories / bestMeal.nutrition.calories;
        const proteinScaleFactor = target.protein / bestMeal.nutrition.protein;

        console.log(`      Calorie scale needed: ${calorieScaleFactor.toFixed(2)}x`);
        console.log(`      Protein scale needed: ${proteinScaleFactor.toFixed(2)}x`);

        const scaleFactor = Math.min(
          target.calories / bestMeal.nutrition.calories,
          1.3 // Max scale factor
        );

        console.log(`      Using calorie scale: ${scaleFactor.toFixed(2)}x`);

        if (proteinScaleFactor > 1.3) {
          console.log(`      ⚠️ PROTEIN SCALING LIMITED - Need higher protein density meals`);
        }

        if (scaleFactor >= 0.8 && scaleFactor <= 1.3) {
          // Apply scaling to all food portions
          bestMeal.foods = bestMeal.foods.map(food => ({
            ...food,
            portion: Math.round(food.portion * scaleFactor)
          }));

          // Recalculate nutrition after scaling
          bestMeal.nutrition.calories *= scaleFactor;
          bestMeal.nutrition.protein *= scaleFactor;

          console.log(`      📈 Scaled by ${scaleFactor.toFixed(2)}x`);
        }
      }

      if (bestMeal) {
        // Step 12: Add protein gap analysis after each meal
        const proteinGap = target.protein - bestMeal.nutrition.protein;
        const proteinAccuracy = (bestMeal.nutrition.protein / target.protein) * 100;

        console.log(`   🥩 PROTEIN ANALYSIS:`);
        console.log(`      Target: ${target.protein}g`);
        console.log(`      Achieved: ${Math.round(bestMeal.nutrition.protein)}g`);
        console.log(`      Gap: ${proteinGap > 0 ? '+' : ''}${Math.round(proteinGap)}g`);
        console.log(`      Accuracy: ${proteinAccuracy.toFixed(1)}%`);

        if (proteinAccuracy < 90) {
          console.log(`      ⚠️ LOW PROTEIN - Need better meal templates or scaling`);
        }
      } else {
        console.log(`   ❌ No suitable meal found for ${mealType}`);
      }

      results[mealType] = bestMeal;
    }

    // Convert results to GeneratedMealPlan format
    return await this.convertToGeneratedMealPlan(results, userCalories, targetProtein, foodLookup);
  }
  
  /**
   * Generate all portion combinations for a meal template
   */
  private static generateCombinations(foods: MealTemplate['foods']): FoodCombination[][] {
    const combinations: FoodCombination[][] = [];
    
    const generateRecursive = (index: number, currentCombination: FoodCombination[]) => {
      if (index === foods.length) {
        combinations.push([...currentCombination]);
        return;
      }
      
      const food = foods[index];
      for (const portion of food.allowedPortions) {
        currentCombination.push({ foodId: food.foodId, portion: portion });
        generateRecursive(index + 1, currentCombination);
        currentCombination.pop();
      }
    };
    
    generateRecursive(0, []);
    return combinations;
  }
  
  /**
   * Convert meal results to GeneratedMealPlan format
   */
  private static async convertToGeneratedMealPlan(
    results: { [key: string]: MealResult | null },
    targetCalories: number,
    targetProtein: number, 
    foodLookup?: Map<string, Food>
  ): Promise<GeneratedMealPlan> {
    const meals = {
      breakfast: await this.convertMealToProcessedFoods(results.breakfast, foodLookup),
      lunch: await this.convertMealToProcessedFoods(results.lunch, foodLookup),
      dinner: await this.convertMealToProcessedFoods(results.dinner, foodLookup),
      snacks: [] as ProcessedFood[]
    };
    
    const totals = this.calculateTotals(meals);
    
    const plan: GeneratedMealPlan = {
      id: Date.now().toString(),
      // Add timestamp to name to ensure uniqueness
      name: `Meal Plan ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`,
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein),
      totalCarbs: Math.round(totals.carbs),
      totalFat: Math.round(totals.fat),
      meals,
      generatedAt: new Date().toISOString(),
      accuracy: {
        calories: (totals.calories / targetCalories) * 100,
        protein: (totals.protein / targetProtein) * 100
      }
    };
    
    console.log('\n🏁 MEAL PLAN GENERATED:');
    console.log(`   📊 Total: ${plan.totalCalories} kcal, ${plan.totalProtein}g protein`);
    console.log(`   🎯 Accuracy: ${plan.accuracy.calories.toFixed(1)}% calories, ${plan.accuracy.protein.toFixed(1)}% protein`);
    
    return plan;
  }
  
  /**
   * Convert MealResult to ProcessedFood array
   */
  private static async convertMealToProcessedFoods(
    mealResult: MealResult | null,
    foodLookup?: Map<string, Food>
  ): Promise<ProcessedFood[]> {
    if (!mealResult) return [];
    
    const processedFoods: ProcessedFood[] = [];
    
    for (const food of mealResult.foods) {
      // Use cached food data if available
      let foodData: Food | null = null;
      
      if (foodLookup && foodLookup.has(food.foodId)) {
        foodData = foodLookup.get(food.foodId)!;
      } else {
        // Fallback to Firebase request
        foodData = await FirebaseService.getFoodFromFirebase(food.foodId);
      }
      
      if (!foodData) continue;
      
      const nutrition = this.getSafeNutrition(foodData);
      const multiplier = food.portion / 100;
      
      processedFoods.push({
        id: foodData.id || '',
        name: foodData.name || 'Unknown Food',
        kurdishName: foodData.kurdishName || undefined,
        arabicName: foodData.arabicName || undefined,
        grams: food.portion,
        displayPortion: `${food.portion}g`,
        calories: this.safeRound(nutrition.calories * multiplier),
        protein: this.safeRound(nutrition.protein * multiplier, 1),
        carbs: this.safeRound(nutrition.carbs * multiplier, 1),
        fat: this.safeRound(nutrition.fat * multiplier, 1),
        image: this.getFoodImage(foodData.name),
      });
    }
    
    return processedFoods;
  }
  
  /**
   * Calculate totals for all meals
   */
  static calculateTotals(meals: { [key: string]: ProcessedFood[] }) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    Object.values(meals).forEach(mealFoods => {
      mealFoods.forEach(food => {
        totalCalories += food.calories;
        totalProtein += food.protein;
        totalCarbs += food.carbs;
        totalFat += food.fat;
      });
    });

    return {
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fat: totalFat
    };
  }
  
  /**
   * Get food image URL
   */
  static getFoodImage(foodName: string): string {
    const imageMap: Record<string, string> = {
      'chicken': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=300',
      'rice': 'https://images.pexels.com/photos/7469452/pexels-photo-7469452.jpeg?auto=compress&cs=tinysrgb&w=300',
      'bread': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300',
      'egg': 'https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=compress&cs=tinysrgb&w=300',
      'yogurt': 'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=300',
      'vegetable': 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=300',
      'fruit': 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=300',
      'nuts': 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=300',
      'fish': 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=300',
      'meat': 'https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg?auto=compress&cs=tinysrgb&w=300'
    };

    const lowerName = foodName.toLowerCase();
    for (const [key, image] of Object.entries(imageMap)) {
      if (lowerName.includes(key)) {
        return image;
      }
    }

    return 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=300';
  }

  /**
   * Get safe nutrition values, ensuring no undefined/null values
   */
  static getSafeNutrition(food: Food) {
    const nutrition = food.nutritionPer100 || food;
    
    return {
      calories: this.safeNumber(nutrition.calories),
      protein: this.safeNumber(nutrition.protein),
      carbs: this.safeNumber(nutrition.carbs),
      fat: this.safeNumber(nutrition.fat),
    };
  }

  /**
   * Ensure a number is valid, return 0 if not
   */
  static safeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? 0 : num;
  }

  /**
   * Safe rounding that handles NaN values
   */
  static safeRound(value: number, decimals: number = 0): number {
    if (isNaN(value) || !isFinite(value)) return 0;
    
    if (decimals === 0) {
      return Math.round(value);
    } else {
      const multiplier = Math.pow(10, decimals);
      return Math.round(value * multiplier) / multiplier;
    }
  }
}