import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { UtensilsCrossed, Target, Zap, Clock, ChefHat, Sparkles, RefreshCw, ChevronDown, ChevronUp, ListFilter as Filter, Crown } from 'lucide-react-native';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { router, usePathname } from 'expo-router';
import { MealPlanningService, GeneratedMealPlan, ProcessedFood } from '@/services/mealPlanningService';
import { getTodayDateString } from '@/utils/dateUtils';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';
import { usePurchases } from '@/hooks/usePurchases';
import { CustomPaywall } from '@/components/CustomPaywall';
import { useAppStore } from '@/store/appStore';
import { FirebaseService } from '@/services/firebaseService';
import i18n from '@/services/i18n';

// Helper function to get display name based on language
const getDisplayName = (food: any, i18n: any) => {
  const lang = i18n.language;
  if (lang === 'ku' && food.kurdishName) {
    return food.kurdishName;
  } else if (lang === 'ar' && food.arabicName) {
    return food.arabicName;
  }
  return food.name || 'Unknown Food';
};
 
export default function MealPlannerScreen() {
  console.log('MealPlannerScreen rendering');
  
  const saveMealPlan = async (mealPlanData: any, name: string) => {
    if (!user?.id) throw new Error('User not authenticated');
    await FirebaseService.saveMealPlan(user.id, mealPlanData, name);
  };
  const user = useAppStore(state => state.user);
  const hasPremium = useAppStore(state => state.hasPremium);
  const profile = useAppStore(state => state.profile);
  const foods = useAppStore(state => state.foods);
  const [calorieTarget, setCalorieTarget] = useState('');
  const [proteinTarget, setProteinTarget] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isDairyFree, setIsDairyFree] = useState(false);
  const [isKeto, setIsKeto] = useState(false);
  const [isVegan, setIsVegan] = useState(false);
  const [excludedFoodBaseNames, setExcludedFoodBaseNames] = useState<string[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

 // const isRTL = useRTL();
 // const { t, i18n } = useTranslation();
  //const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  //const currentPathname = usePathname();
  
  const isRTL = useAppStore(state => state.isRTL);
  const currentLanguage = useAppStore(state => state.currentLanguage);
  const { t } = useTranslation(); // Keep only for translation function
  const useKurdishFont = useMemo(() => 
    currentLanguage === 'ku' || currentLanguage === 'ckb' || currentLanguage === 'ar',
    [currentLanguage]
  );
  
  const toggleExcludedFood = (baseName: string) => { 
    setExcludedFoodBaseNames(prev => 
      prev.includes(baseName) 
        ? prev.filter(name => name !== baseName) 
        : [...prev, baseName]
    );
  };

  const handleGeneratePlan = async () => {
    // Check if user has premium access
    if (!hasPremium) {
      setShowPaywall(true);
      return;
    }

    // Validation
    if (!calorieTarget || parseInt(calorieTarget) < 800 || parseInt(calorieTarget) > 5000) {
      Alert.alert('Invalid Input', 'Please enter a calorie target between 800 and 5000');
      return;
    }

    if (proteinTarget && (parseInt(proteinTarget) < 0 || parseInt(proteinTarget) > 500)) {
      Alert.alert('Invalid Input', 'Protein target should be between 0 and 500g');
      return;
    }

    setIsGenerating(true);

    try {
      const calories = parseInt(calorieTarget);
      const protein = proteinTarget ? parseInt(proteinTarget) : undefined;
      const dietaryPreferences: string[] = [];
      
      if (isGlutenFree) dietaryPreferences.push('glutenFree');
      if (isDairyFree) dietaryPreferences.push('dairyFree');
      if (isKeto) dietaryPreferences.push('keto');
      if (isVegan) dietaryPreferences.push('vegan');
      
      console.log('Generating meal plan with:', { 
        calories, 
        protein, 
        dietaryPreferences, 
        excludedFoodBaseNames 
      });
      
      // Pass cached foods to the meal planning service
      const plan = await MealPlanningService.generateMealPlan(
        calories, 
        protein, 
        foods,
        dietaryPreferences,
        excludedFoodBaseNames
      );
      setGeneratedPlan(plan);
      
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegeneratePlan = () => {
    setGeneratedPlan(null);
  };

  const handleSavePlan = async () => {
    if (!generatedPlan || !user) {
      Alert.alert('Error', 'No meal plan to save or user not logged in');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Get today's date in YYYY-MM-DD format
      const today = getTodayDateString();
      
      // Create default name based on date and meal number
      const defaultName = `Meal Plan ${today}`;
      
      console.log(`[MealPlanner] Attempting to save meal plan for user ID: ${user.id}`);
      
      // Save the meal plan
      await saveMealPlan(generatedPlan, defaultName);
      
      console.log(`[MealPlanner] Meal plan save initiated successfully for user ID: ${user.id}`);
      
      Alert.alert('Success', 'Meal plan saved successfully');
      router.push('/(tabs)/saved-meal-plans');
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Error', 'Failed to save meal plan');
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToSavedPlans = () => {
    router.push('/(tabs)/saved-meal-plans');
  };

  const renderMealSection = (mealName: string, meals: ProcessedFood[], color: string) => (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={[styles.mealIndicator, { backgroundColor: color }]} />
        <Text style={styles.mealTitle}>{mealName}</Text>
        <Text style={styles.mealCalories}>
          {meals.reduce((sum, meal) => sum + meal.calories, 0)} kcal
        </Text>
      </View>
      {meals.map((meal) => (
        <TouchableOpacity
          key={meal.id}
          style={styles.mealItem}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/meal-planner-food-details',
              params: {
                foodId: meal.id,
                quantity: meal.grams.toString(),
                unit: 'g',
                fromMealPlan: 'true',
                origin: 'meal-planner'
              }
            });
          }}
          activeOpacity={0.7}
        >
          <View style={styles.mealInfo}>
            <Text style={styles.mealItemName}>{getDisplayName(meal, i18n)}</Text>
            <Text style={styles.mealPortion}>{meal.displayPortion}</Text>
            <View style={styles.mealNutrition}>
              <Text style={styles.nutritionText}>P: {Math.round(meal.protein)}g</Text>
              <Text style={styles.nutritionText}>C: {Math.round(meal.carbs)}g</Text>
              <Text style={styles.nutritionText}>F: {Math.round(meal.fat)}g</Text>
            </View>
          </View>
          <View style={styles.mealCaloriesContainer}>
            <Text style={styles.mealItemCalories}>{Math.round(meal.calories)}</Text>
            <Text style={styles.caloriesLabel}>kcal</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <HamburgerMenu currentRoute="/(tabs)/meal-planner" />
              <View style={styles.headerContent}>
                <View style={styles.titleRow}>
                  <View style={styles.iconContainer}>
                    <UtensilsCrossed size={24} color="#10B981" />
                  </View>
                  <Text style={styles.headerTitle}>{t('mealPlanner:headerTitle')}</Text>
                </View>
                <Text style={styles.headerSubtitle}>Create personalized meal plans</Text>
              </View>
              {hasPremium && (
                <View style={styles.premiumBadge}>
                  <Crown size={14} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeText}>PRO</Text>
                </View>
              )}
            </View>
          </View>

          {!generatedPlan ? (
            <>
              {/* Premium Feature Gate for Non-Premium Users */}
              {!hasPremium && (
                <View style={styles.premiumGate}>
                  <View style={styles.premiumGateHeader}>
                    <View style={styles.premiumGateIcon}>
                      <Crown size={32} color="#FFFFFF" />
                    </View>
                    <Text style={styles.premiumGateTitle}>Premium Feature</Text>
                    <Text style={styles.premiumGateDescription}>
                      Unlock AI-powered meal planning with personalized nutrition targets
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.premiumGateButton}
                    onPress={() => setShowPaywall(true)}
                  >
                    <Crown size={18} color="#FFFFFF" />
                    <Text style={styles.premiumGateButtonText}>Upgrade to Premium</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nutrition Targets</Text>
                </View>
                
                {/* Main Targets Card */}
                <View style={[styles.targetsCard, !hasPremium && styles.disabledCard]}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>
                      Daily Calories <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.inputContainer}>
                      <View style={styles.inputIcon}>
                        <Target size={18} color="#10B981" />
                      </View>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 2000"
                        value={calorieTarget}
                        onChangeText={setCalorieTarget}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                        editable={hasPremium}
                      />
                      <Text style={styles.inputUnit}>kcal</Text>
                    </View>
                  </View>
                  
                  {/* Advanced Options Toggle */}
                  <TouchableOpacity 
                    style={styles.advancedToggle}
                    onPress={() => hasPremium && setShowAdvancedOptions(!showAdvancedOptions)}
                    disabled={!hasPremium}
                  >
                    <View style={styles.advancedToggleContent}>
                      <Filter size={16} color="#64748B" />
                      <Text style={styles.advancedToggleText}>Advanced Options</Text>
                    </View>
                    {showAdvancedOptions ? (
                      <ChevronUp size={18} color="#64748B" />
                    ) : (
                      <ChevronDown size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Advanced Options Section */}
                {showAdvancedOptions && hasPremium && (
                  <View style={styles.advancedSection}>
                    {/* Protein Target */}
                    <View style={styles.advancedCard}>
                      <Text style={styles.cardTitle}>Protein Target</Text>
                      <View style={styles.inputContainer}>
                        <View style={styles.inputIcon}>
                          <Zap size={18} color="#EF4444" />
                        </View>
                        <TextInput
                          style={styles.input}
                          placeholder="e.g. 150"
                          value={proteinTarget}
                          onChangeText={setProteinTarget}
                          keyboardType="numeric"
                          placeholderTextColor="#9CA3AF"
                        />
                        <Text style={styles.inputUnit}>g</Text>
                      </View>
                    </View>
                    
                    {/* Dietary Preferences */}
                    <View style={styles.advancedCard}>
                      <Text style={styles.cardTitle}>Dietary Preferences</Text>
                      <View style={styles.optionsGrid}>
                        <TouchableOpacity 
                          style={[
                            styles.optionChip,
                            isGlutenFree && styles.optionChipSelected
                          ]}
                          onPress={() => setIsGlutenFree(!isGlutenFree)}
                        >
                          <Text 
                            style={[
                              styles.optionChipText,
                              isGlutenFree && styles.optionChipTextSelected
                            ]}
                          >
                            Gluten Free
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.optionChip,
                            isDairyFree && styles.optionChipSelected
                          ]}
                          onPress={() => setIsDairyFree(!isDairyFree)}
                        >
                          <Text 
                            style={[
                              styles.optionChipText,
                              isDairyFree && styles.optionChipTextSelected
                            ]}
                          >
                            Dairy Free
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.optionChip,
                            isKeto && styles.optionChipSelected
                          ]}
                          onPress={() => setIsKeto(!isKeto)}
                        >
                          <Text 
                            style={[
                              styles.optionChipText,
                              isKeto && styles.optionChipTextSelected
                            ]}
                          >
                            Keto
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.optionChip,
                            isVegan && styles.optionChipSelected
                          ]}
                          onPress={() => setIsVegan(!isVegan)}
                        >
                          <Text 
                            style={[
                              styles.optionChipText,
                              isVegan && styles.optionChipTextSelected
                            ]}
                          >
                            Vegan
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Food Exclusions */}
                    <View style={styles.advancedCard}>
                      <Text style={styles.cardTitle}>Exclude Foods</Text>
                      <View style={styles.optionsGrid}>
                        <TouchableOpacity 
                          style={[
                            styles.exclusionChip,
                            excludedFoodBaseNames.includes('chicken') && styles.exclusionChipSelected
                          ]}
                          onPress={() => toggleExcludedFood('chicken')}
                        >
                          <Text 
                            style={[
                              styles.exclusionChipText,
                              excludedFoodBaseNames.includes('chicken') && styles.exclusionChipTextSelected
                            ]}
                          >
                            Chicken
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.exclusionChip,
                            excludedFoodBaseNames.includes('beef') && styles.exclusionChipSelected
                          ]}
                          onPress={() => toggleExcludedFood('beef')}
                        >
                          <Text 
                            style={[
                              styles.exclusionChipText,
                              excludedFoodBaseNames.includes('beef') && styles.exclusionChipTextSelected
                            ]}
                          >
                            Beef
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.exclusionChip,
                            excludedFoodBaseNames.includes('samun') && styles.exclusionChipSelected
                          ]}
                          onPress={() => toggleExcludedFood('samun')}
                        >
                          <Text 
                            style={[
                              styles.exclusionChipText,
                              excludedFoodBaseNames.includes('samun') && styles.exclusionChipTextSelected
                            ]}
                          >
                            Samun
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[
                            styles.exclusionChip,
                            excludedFoodBaseNames.includes('rice') && styles.exclusionChipSelected
                          ]}
                          onPress={() => toggleExcludedFood('rice')}
                        >
                          <Text 
                            style={[
                              styles.exclusionChipText,
                              excludedFoodBaseNames.includes('rice') && styles.exclusionChipTextSelected
                            ]}
                          >
                            Rice
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                  <TouchableOpacity
                    style={[styles.generateButton, (!hasPremium || isGenerating) && styles.generateButtonDisabled]}
                    onPress={handleGeneratePlan}
                    disabled={isGenerating || !hasPremium}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={20} color="#FFFFFF" />
                        <Text style={styles.generateButtonText}>Generating...</Text>
                      </>
                    ) : (
                      <>
                        <ChefHat size={20} color="#FFFFFF" />
                        <Text style={styles.generateButtonText}>
                          {hasPremium ? 'Generate Meal Plan' : 'Premium Required'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.savedPlansButton}
                    onPress={navigateToSavedPlans}
                  >
                    <UtensilsCrossed size={18} color="#64748B" />
                    <Text style={styles.savedPlansButtonText}>My Saved Plans</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            /* Generated Plan Display */
            <View style={styles.planSection}>
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View style={styles.planTitleRow}>
                  <Text style={styles.planTitle}>{generatedPlan.name}</Text>
                  <TouchableOpacity
                    style={styles.regenerateButton}
                    onPress={handleRegeneratePlan}
                  >
                    <RefreshCw size={16} color="#10B981" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.planStats}>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>{generatedPlan.totalCalories}</Text>
                    <Text style={styles.planStatLabel}>Calories</Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>{generatedPlan.totalProtein}g</Text>
                    <Text style={styles.planStatLabel}>Protein</Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>{generatedPlan.totalCarbs}g</Text>
                    <Text style={styles.planStatLabel}>Carbs</Text>
                  </View>
                  <View style={styles.planStat}>
                    <Text style={styles.planStatValue}>{generatedPlan.totalFat}g</Text>
                    <Text style={styles.planStatLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Meals */}
              {renderMealSection('Breakfast', generatedPlan.meals.breakfast, '#F59E0B')}
              {renderMealSection('Lunch', generatedPlan.meals.lunch, '#EF4444')}
              {renderMealSection('Dinner', generatedPlan.meals.dinner, '#8B5CF6')}

              {/* Action Buttons */}
              <View style={styles.planActionButtons}>
                <TouchableOpacity 
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSavePlan}
                  disabled={isSaving}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save Plan'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.newPlanButton}
                  onPress={() => setGeneratedPlan(null)}
                >
                  <Text style={styles.newPlanButtonText}>Create New Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Paywall Modal */}
      <CustomPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Premium Gate Styles
  premiumGate: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  premiumGateHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumGateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumGateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumGateDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  premiumGateButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  premiumGateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Input Section Styles
  inputSection: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
  },
  targetsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  inputUnit: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  
  // Advanced Options
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advancedToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 8,
  },
  
  // Advanced Section
  advancedSection: {
    gap: 16,
  },
  advancedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  
  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionChipSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  exclusionChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exclusionChipSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  exclusionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  exclusionChipTextSelected: {
    color: '#FFFFFF',
  },
  
  // Action Section
  actionSection: {
    marginTop: 24,
    gap: 12,
  },
  generateButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  savedPlansButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  savedPlansButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Plan Section
  planSection: {
    padding: 20,
  },
  planHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  regenerateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planStat: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  planStatLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // Meal Section
  mealSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#F8FAFC',
  },
  mealInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  mealPortion: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  mealNutrition: {
    flexDirection: 'row',
    gap: 16,
  },
  nutritionText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  mealCaloriesContainer: {
    alignItems: 'center',
    marginLeft: 12,
  },
  mealItemCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Plan Action Buttons
  planActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  newPlanButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newPlanButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});