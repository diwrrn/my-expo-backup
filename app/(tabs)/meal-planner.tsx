import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react'; // Import useEffect
import { UtensilsCrossed, Target, Zap, Clock, ChefHat, Sparkles, RefreshCw, ChevronDown, ChevronUp, ListFilter as Filter } from 'lucide-react-native';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { router, usePathname } from 'expo-router'; // Import usePathname
import { LinearGradient } from 'expo-linear-gradient';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { MealPlanningService, GeneratedMealPlan, ProcessedFood } from '@/services/mealPlanningService';
import { useAuth } from '@/hooks/useAuth';
import { getTodayDateString } from '@/utils/dateUtils';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';

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
  const { user } = useAuth();
  const { foodCache, getMealPlanCountForDate, saveMealPlan } = useFirebaseData();
  
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
  const isRTL = useRTL(); // Add this line
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const currentPathname = usePathname(); // Get current pathname

  // --- ADDED LOGGING ---
  useEffect(() => {
    console.log('MealPlannerScreen: Mounted');
    return () => {
      console.log('MealPlannerScreen: Unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('MealPlannerScreen: generatedPlan state changed:', generatedPlan ? 'Plan exists' : 'Plan is null');
  }, [generatedPlan]);
  // --- END ADDED LOGGING ---

  const toggleExcludedFood = (baseName: string) => {
    setExcludedFoodBaseNames(prev => 
      prev.includes(baseName) 
        ? prev.filter(name => name !== baseName) 
        : [...prev, baseName]
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 90, // Space for footer navigation
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  titleRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,

  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
        fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  headerIcon: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  
  // Input Section
  inputSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
        fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  sectionHeader: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    textAlign: isRTL ? 'right' : 'left',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},
  inputUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500'
    
  },
  
  // Advanced Options Toggle
  advancedToggle: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  advancedToggleContent: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
  },
  advancedToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  
  // Advanced Section
  advancedSection: {
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  // Dietary Preferences
  dietarySection: {
    marginTop: 20,
  },
  dietarySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
        textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  dietaryDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
        textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  dietaryGrid: {
    flexDirection: getFlexDirection(isRTL),
    flexWrap: 'wrap',
    gap: 12,
  },
  dietaryOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
  },
  dietaryOptionSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  dietaryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  dietaryOptionTextSelected: {
    color: '#FFFFFF',
  },
  
  // Food Exclusions
  exclusionSection: {
    marginTop: 24,
  },
  exclusionSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
        textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  exclusionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
        textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  exclusionOptions: {
    flexDirection: getFlexDirection(isRTL),
    flexWrap: 'wrap',
    gap: 12,
  },
  exclusionOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: '45%',
  },
  exclusionOptionSelected: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  exclusionOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  exclusionOptionTextSelected: {
    color: '#FFFFFF',
  },
  
  // Generate Section
  generateSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  generateButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonGradient: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  generateHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  savedPlansButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  savedPlansButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  
  // Info Section
  infoSection: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4338CA',
    marginBottom: 8,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  infoText: {
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  
  cacheStatus: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
  },
  cacheStatusText: {
    fontSize: 12,
    color: '#4338CA',
    fontWeight: '600',
  },
  cacheWarning: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Plan Section
  planSection: {
    padding: 24,
  },
  planHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  regenerateButton: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  planStats: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  planStat: {
    alignItems: 'center',
    flex: 1,
  },
  planStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  planStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  
  
  
  // Meal Section
  mealSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealHeader: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 16,
  },
  mealIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
        marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,

  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  mealItem: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
        marginRight: isRTL ? 0 : 12,
    marginLeft: isRTL ? 12 : 0,
  },
  mealInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
        textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  mealPortion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
        textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  mealNutrition: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    
  },
  mealCaloriesContainer: {
    alignItems: 'center',
  },
  mealItemCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  newPlanButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newPlanButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
});
  const handleGeneratePlan = async () => {
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
        foodCache.foods,
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
      router.push('/(tabs)/saved-meal-plans'); // ADD THIS LINE: Navigate to saved meals screen
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
            // Navigate to the meal planner food details screen
            router.push({
              pathname: '/(tabs)/meal-planner-food-details',
              params: {
                foodId: meal.id,
                quantity: meal.grams.toString(),
                unit: 'g',
                fromMealPlan: 'true', // Keep this if it's used for other logic
                origin: 'meal-planner' // NEW: Indicate origin
              }
            });
          }}
          activeOpacity={0.7}
        >
          <Image source={{ uri: meal.image }} style={styles.mealImage} />
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
        <LinearGradient
          colors={['#F0FDF4', '#F9FAFB']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <HamburgerMenu currentRoute="/(tabs)/meal-planner" />
              <View style={styles.headerContent}>
                <View style={styles.titleRow}>
                  <UtensilsCrossed size={28} color="#22C55E" />
                  <Text style={styles.headerTitle}>{t('mealPlanner:headerTitle')}</Text>
                </View>
              </View>
            
            </View>
          </View>
        </LinearGradient>

        {!generatedPlan ? (
          <>
            

            {/* Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('mealPlanner:targetsTitle')}</Text>
              </View>
              
              {/* Calorie Target */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {t('mealPlanner:dailyCalories')} <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <Target size={20} color="#22C55E" />
                  <TextInput
                    style={styles.input}
                    placeholder="2000"
                    value={calorieTarget}
                    onChangeText={setCalorieTarget}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                  <Text style={styles.inputUnit}>kcal</Text>
                </View>
              </View>
              
              {/* Advanced Options Toggle */}
              <TouchableOpacity 
                style={styles.advancedToggle}
                onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <View style={styles.advancedToggleContent}>
                  <Filter size={18} color="#22C55E" />
                  <Text style={styles.advancedToggleText}>{t('mealPlanner:advancedOptions')}</Text>
                </View>
                {showAdvancedOptions ? (
                  <ChevronUp size={20} color="#6B7280" />
                ) : (
                  <ChevronDown size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
              
              {/* Advanced Options Section */}
              {showAdvancedOptions && (
                <View style={styles.advancedSection}>
                  {/* Protein Target */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>{t('mealPlanner:proteinTarget')}</Text>
                    <View style={styles.inputContainer}>
                      <Zap size={20} color="#3B82F6" />
                      <TextInput
                        style={styles.input}
                        placeholder="150"
                        value={proteinTarget}
                        onChangeText={setProteinTarget}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                      <Text style={styles.inputUnit}>g</Text>
                    </View>
                  </View>
                  
                  {/* Dietary Preferences */}
                  <View style={styles.dietarySection}>
                    <Text style={styles.dietarySectionTitle}>{t('mealPlanner:dietaryPreferences')}</Text>
                    <Text style={styles.dietaryDescription}>
                      {t('mealPlanner:dietaryDescription')}
                    </Text>
                    
                    <View style={styles.dietaryGrid}>
                      <TouchableOpacity 
                        style={[
                          styles.dietaryOption,
                          isGlutenFree && styles.dietaryOptionSelected
                        ]}
                        onPress={() => setIsGlutenFree(!isGlutenFree)}
                      >
                        <Text 
                          style={[
                            styles.dietaryOptionText,
                            isGlutenFree && styles.dietaryOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:glutenFree')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.dietaryOption,
                          isDairyFree && styles.dietaryOptionSelected
                        ]}
                        onPress={() => setIsDairyFree(!isDairyFree)}
                      >
                        <Text 
                          style={[
                            styles.dietaryOptionText,
                            isDairyFree && styles.dietaryOptionTextSelected
                          ]}
                        >
                         {t('mealPlanner:dairyFree')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.dietaryOption,
                          isKeto && styles.dietaryOptionSelected
                        ]}
                        onPress={() => setIsKeto(!isKeto)}
                      >
                        <Text 
                          style={[
                            styles.dietaryOptionText,
                            isKeto && styles.dietaryOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:ketoDiet')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.dietaryOption,
                          isVegan && styles.dietaryOptionSelected
                        ]}
                        onPress={() => setIsVegan(!isVegan)}
                      >
                        <Text 
                          style={[
                            styles.dietaryOptionText,
                            isVegan && styles.dietaryOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:veganDiet')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Food Exclusions */}
                  <View style={styles.exclusionSection}>
                    <Text style={styles.exclusionSectionTitle}>{t('mealPlanner:excludeFoods')}</Text>
                    <Text style={styles.exclusionDescription}>
                      {t('mealPlanner:exclusionDescription')}
                    </Text>
                    
                    <View style={styles.exclusionOptions}>
                      <TouchableOpacity 
                        style={[
                          styles.exclusionOption,
                          excludedFoodBaseNames.includes('chicken') && styles.exclusionOptionSelected
                        ]}
                        onPress={() => toggleExcludedFood('chicken')}
                      >
                        <Text 
                          style={[
                            styles.exclusionOptionText,
                            excludedFoodBaseNames.includes('chicken') && styles.exclusionOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:chicken')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.exclusionOption,
                          excludedFoodBaseNames.includes('beef') && styles.exclusionOptionSelected
                        ]}
                        onPress={() => toggleExcludedFood('beef')}
                      >
                        <Text 
                          style={[
                            styles.exclusionOptionText,
                            excludedFoodBaseNames.includes('beef') && styles.exclusionOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:beef')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.exclusionOption,
                          excludedFoodBaseNames.includes('samun') && styles.exclusionOptionSelected
                        ]}
                        onPress={() => toggleExcludedFood('samun')}
                      >
                        <Text 
                          style={[
                            styles.exclusionOptionText,
                            excludedFoodBaseNames.includes('samun') && styles.exclusionOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:samun')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.exclusionOption,
                          excludedFoodBaseNames.includes('rice') && styles.exclusionOptionSelected
                        ]}
                        onPress={() => toggleExcludedFood('rice')}
                      >
                        <Text 
                          style={[
                            styles.exclusionOptionText,
                            excludedFoodBaseNames.includes('rice') && styles.exclusionOptionTextSelected
                          ]}
                        >
                          {t('mealPlanner:rice')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Generate Button */}
            <View style={styles.generateSection}>
              <TouchableOpacity
                style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                onPress={handleGeneratePlan}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.generateButtonGradient}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>{t('mealPlanner:calculating')}</Text>
                    </>
                  ) : (
                    <>
                      <ChefHat size={20} color="#FFFFFF" />
                      <Text style={styles.generateButtonText}>{t('mealPlanner:generatePlan')}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
             
              <TouchableOpacity 
                style={styles.savedPlansButton}
                onPress={navigateToSavedPlans}
              >
                <UtensilsCrossed size={20} color="#374151" />
                <Text style={styles.savedPlansButtonText}>{t('mealPlanner:mySavedPlans')}</Text>
              </TouchableOpacity>
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
                  <RefreshCw size={16} color="#22C55E" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.planStats}>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{generatedPlan.totalCalories}</Text>
                  <Text style={styles.planStatLabel}>{t('mealPlanner:caloriesTotal')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{generatedPlan.totalProtein}g</Text>
                  <Text style={styles.planStatLabel}>{t('mealPlanner:proteinTotal')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{generatedPlan.totalCarbs}g</Text>
                  <Text style={styles.planStatLabel}>{t('mealPlanner:carbsTotal')}</Text>
                </View>
                <View style={styles.planStat}>
                  <Text style={styles.planStatValue}>{generatedPlan.totalFat}g</Text>
                  <Text style={styles.planStatLabel}>{t('mealPlanner:fatTotal')}</Text>
                </View>
              </View>

              {/* Accuracy Display */}
             
            </View>

            {/* Meals */}
            {renderMealSection(t('mealPlanner:breakFast'), generatedPlan.meals.breakfast, '#F59E0B')}
            {renderMealSection(t('mealPlanner:lunch'), generatedPlan.meals.lunch, '#EF4444')}
            {renderMealSection(t('mealPlanner:dinner'), generatedPlan.meals.dinner, '#8B5CF6')}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSavePlan}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : t('mealPlanner:savePlan')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.newPlanButton}
                onPress={() => setGeneratedPlan(null)}
              >
                <Text style={styles.newPlanButtonText}>{t('mealPlanner:createNewPlan')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
