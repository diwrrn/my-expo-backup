import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Calculator, Target, Activity, User, Scale, Ruler } from 'lucide-react-native';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

export default function CalculatorScreen() {
  const { user, updateProfile, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL(); // Add this line

const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
const [rate, setRate] = useState<'slow' | 'moderate' | 'aggressive'>('moderate');
const [age, setAge] = useState(user?.profile?.age?.toString() || '');
const [sex, setSex] = useState<'male' | 'female'>(user?.profile?.gender || 'male'); // Assuming 'gender' exists in profile
const [height, setHeight] = useState(user?.profile?.height?.toString() || '');
const [weight, setWeight] = useState(user?.profile?.weight?.toString() || '');
const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'>(user?.profile?.activityLevel || 'moderate');
  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
  } | null>(null);
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
  header: {
    padding: 24,
    paddingBottom: 16,
    
  },
  headerTop: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    marginLeft: isRTL ? 0 : 16,
    marginRight: isRTL ? 16 : 0,

  },
  titleRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
          fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: getTextAlign(isRTL),
          fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '450',
    color: '#111827',
    marginBottom: 16,
        textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

    
  },
  rateOptions: {
    gap: 8,
  },
  rateOption: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    
  },
  rateOptionSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  rateOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
        textAlign: getTextAlign(isRTL),
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,


  },
  rateOptionTextSelected: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
        textAlign: getTextAlign(isRTL),
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,


  },
  inputContainer: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
  },
  sexOptions: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
  },
  sexOption: {
    flex: 1,
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sexOptionSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  sexOptionText: {
    fontSize: 14,
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

    fontWeight: '500',
    color: '#6B7280',
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
        textAlign: getTextAlign(isRTL),

  },
  sexOptionTextSelected: {
    color: '#FFFFFF',
  },
  activityOptions: {
    gap: 8,
  },
  activityOption: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityOptionSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  activityOptionContent: {
    gap: 4,
  },
  activityOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
        textAlign: getTextAlign(isRTL),
             fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  activityOptionLabelSelected: {
    color: '#FFFFFF',
  },
  activityOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
        textAlign: getTextAlign(isRTL),
             fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

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
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  activityOptionDescriptionSelected: {
    color: '#E5E7EB',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  calculateButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  setGoalButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  setGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  resultsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultCardTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 16,
        textAlign: getTextAlign(isRTL),
             fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  resultRow: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  resultValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  targetRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  targetLabel: {
    fontSize: 16,
    color: '#22C55E',
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  targetValue: {
    fontSize: 18,
    color: '#22C55E',
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  macroGrid: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  macroPercentage: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
                 fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#92400E',
    marginBottom: 12,
        textAlign: getTextAlign(isRTL),
             fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 8,
        textAlign: getTextAlign(isRTL),
             fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
});
  const goalOptions = [
    { id: 'lose' as const, label: t('calculator:loseWeight'), color: '#EF4444', icon: <Target size={20} color="#EF4444" /> },
    { id: 'maintain' as const, label: t('calculator:maintainW'), color: '#22C55E', icon: <Scale size={20} color="#22C55E" /> },
    { id: 'gain' as const, label: t('calculator:gainW'), color: '#3B82F6', icon: <Activity size={20} color="#3B82F6" /> },
  ];

  const rateOptions = {
    lose: [
      { id: 'slow' as const, label: t('calculator:slow'), calories: -250 },
      { id: 'moderate' as const, label: t('calculator:moderate'), calories: -500 },
      { id: 'aggressive' as const, label: t('calculator:aggressive'), calories: -750 },
    ],
    maintain: [
      { id: 'moderate' as const, label: t('calculator:maintain'), calories: 0 },
    ],
    gain: [
      { id: 'slow' as const, label: t('calculator:slow'), calories: 250 },
      { id: 'moderate' as const, label: t('calculator:moderate'), calories: 500 },
      { id: 'aggressive' as const, label: t('calculator:aggressive'), calories: 750 },
    ],
  };

  const activityOptions = [
    { id: 'sedentary' as const, label: t('calculator:sedentary'), description: t('calculator:sedLabel'), multiplier: 1.2 },
    { id: 'light' as const, label: t('calculator:light'), description: t('calculator:lightLabel'), multiplier: 1.375 },
    { id: 'moderate' as const, label: t('calculator:moderateActivity'), description: t('calculator:modLabel'), multiplier: 1.55 },
    { id: 'very_active' as const, label: t('calculator:veryActive'), description: t('calculator:veryActiveLabel'), multiplier: 1.725 },
    { id: 'extra_active' as const, label: t('calculator:extraActive'), description: t('calculator:extraActiveLabel'), multiplier: 1.9 },
  ];

  const calculateBMR = (weight: number, height: number, age: number, sex: 'male' | 'female'): number => {
    if (sex === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateMacros = (calories: number) => {
    // Standard macro distribution: 25% protein, 45% carbs, 30% fat
    const proteinCalories = calories * 0.25;
    const carbCalories = calories * 0.45;
    const fatCalories = calories * 0.30;

    return {
      protein: Math.round(proteinCalories / 4), // 4 calories per gram
      carbs: Math.round(carbCalories / 4), // 4 calories per gram
      fat: Math.round(fatCalories / 9), // 9 calories per gram
    };
  };

  const handleCalculate = () => {
    // Validation
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    // Convert string inputs to numbers
    const ageNum = parseInt(age);
    const heightNum = parseInt(height);
    const weightNum = parseInt(weight);
    
    // Calculate BMR
    const bmr = calculateBMR(weightNum, heightNum, ageNum, sex);

    // Calculate TDEE
    const activityMultiplier = activityOptions.find(opt => opt.id === activityLevel)?.multiplier || 1.55;
    const tdee = bmr * activityMultiplier;

    // Calculate target calories based on goal and rate
    const rateCalories = rateOptions[goal].find(opt => opt.id === rate)?.calories || 0;
    const targetCalories = tdee + rateCalories;

    // Calculate macros
    const macros = {
      protein: Math.round(targetCalories * 0.25 / 4), // 25% protein (4 calories per gram)
      carbs: Math.round(targetCalories * 0.45 / 4),   // 45% carbs (4 calories per gram)
      fat: Math.round(targetCalories * 0.30 / 9)      // 30% fat (9 calories per gram)
    };

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      macros,
    });
  };

  const handleSetAsGoal = async () => {
    // Add immediate feedback to confirm button is working
    console.log('🎯 Set as Goal button pressed!');
    console.log('🎯 Setting goal - User:', user?.id);
    console.log('🎯 Setting goal - Results:', results);
    
    if (!results || !user) {
      console.log('❌ Missing results or user:', { hasResults: !!results, hasUser: !!user });
      Alert.alert('Error', 'No calculation results or user not authenticated');
      return;
    }

    try {
      // Check if user already has a calorie goal
      const currentGoal = user.profile?.goals?.calories;
      const targetCaloriesNum = Number(results.targetCalories);
      const currentGoalNum = Number(currentGoal);
      
      console.log('🎯 Current goal:', currentGoal, typeof currentGoal);
      console.log('🎯 Target calories:', results.targetCalories, typeof results.targetCalories);
      console.log('🎯 Current goal (number):', currentGoalNum);
      console.log('🎯 Target calories (number):', targetCaloriesNum);
      
      // Check if there's an existing goal
      if (currentGoalNum && currentGoalNum > 0) {
        console.log('🎯 User has existing goal, checking if same...');
        
        if (currentGoalNum === targetCaloriesNum) {
          console.log('ℹ️ Goals are the same, showing info alert');
          Alert.alert('Info', 'This goal is already set as your current target!');
          return;
        }
        
        console.log('🔄 Goals are different, showing confirmation dialog');
        Alert.alert(
          'Update Goal',
          `This will change your current goal from ${Math.round(currentGoalNum)} to ${targetCaloriesNum} calories. Are you sure you want to set this as your goal?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Yes, Update Goal',
              style: 'default',
              onPress: async () => {
                console.log('✅ User confirmed goal update');
                try {
                  await updateGoal();
                  console.log('✅ Calculator: Goal update completed. Current user profile goals:', user?.profile?.goals);
                  Alert.alert('Success', 'Goal updated successfully!');
                } catch (error) {
                  console.error('❌ Error in confirmation dialog:', error);
                  Alert.alert('Error', 'Failed to update goal. Please try again.');
                }
              },
            },
          ]
        );
      } else {
        console.log('🆕 No existing goal, updating directly');
        try {
          await updateGoal();
          console.log('✅ Calculator: Goal set completed. Current user profile goals:', user?.profile?.goals);
          Alert.alert('Success', 'Goal set successfully!');
        } catch (error) {
          console.error('❌ Error in direct update:', error);
          Alert.alert('Error', 'Failed to set goal. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Error setting goal:', error);
      Alert.alert('Error', 'Failed to set goal. Please try again.');
    }
  };

  const updateGoal = async () => {
    if (!results || !user) return;

    try {
      // Update the user's goals with calculated values
      const updatedGoals = {
        calories: results.targetCalories,
        protein: results.macros.protein,
        carbs: results.macros.carbs,
        fat: results.macros.fat,
      };

      console.log('🎯 Calculator: Updating user profile with goals:', updatedGoals);
      
      // Use the updateProfile method from useAuth which handles profile cache updates and UI synchronization
      await updateProfile({ profile: { goals: updatedGoals } });

      console.log('🎯 Calculator: Goal update successful');
    } catch (error) {
      console.error('❌ Calculator: Error updating goal - Full error:', error);
      console.error('❌ Calculator: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Calculator: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to update goal: ${errorMessage}`);
      
      // Re-throw the error so the calling function can handle it
      throw error;
    }
  };

  const handleReset = () => {
    setAge('');
    setHeight('');
    setWeight('');
    setResults(null);
  };
useEffect(() => {
  if (user?.profile) {
    setAge(user.profile.age?.toString() || '');
    setSex(user.profile.gender || 'male'); // Assuming 'gender' exists in profile
    setHeight(user.profile.height?.toString() || '');
    setWeight(user.profile.weight?.toString() || '');
    setActivityLevel(user.profile.activityLevel || 'moderate');
  }
}, [user?.profile]);
  // Show loading state while user data is being loaded
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <HamburgerMenu currentRoute="/(tabs)/calculator" />
            <View style={styles.headerContent}>
              <View style={styles.titleRow}>
                <Calculator size={28} color="#22C55E" />
                <Text style={styles.headerTitle}>{t('calculator:title')}</Text>
              </View>
              <Text style={styles.headerSubtitle}>{t('calculator:titleDesc')}</Text>
            </View>
          </View>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('calculator:yourGoal')}</Text>
          <View style={styles.goalOptions}>
            {goalOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.goalOption,
                  goal === option.id && { backgroundColor: option.color, borderColor: option.color },
                ]}
                onPress={() => {
                  setGoal(option.id);
                  setRate('moderate'); // Reset rate when goal changes
                }}
              >
                {option.icon}
                <Text
                  style={[
                    styles.goalOptionText,
                    goal === option.id && { color: '#FFFFFF' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rate Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('calculator:rate')}</Text>
          <View style={styles.rateOptions}>
            {rateOptions[goal].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.rateOption,
                  rate === option.id && styles.rateOptionSelected,
                ]}
                onPress={() => setRate(option.id)}
              >
                <Text
                  style={[
                    styles.rateOptionText,
                    rate === option.id && styles.rateOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('calculator:personalInfo')}</Text>
          
          {/* Sex Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('calculator:sex')}</Text>
            <View style={styles.sexOptions}>
              <TouchableOpacity
                style={[
                  styles.sexOption,
                  sex === 'male' && styles.sexOptionSelected,
                ]}
                onPress={() => setSex('male')}
              >
                <User size={16} color={sex === 'male' ? '#FFFFFF' : '#6B7280'} />
                <Text
                  style={[
                    styles.sexOptionText,
                    sex === 'male' && styles.sexOptionTextSelected,
                  ]}
                >
                  {t('calculator:male')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sexOption,
                  sex === 'female' && styles.sexOptionSelected,
                ]}
                onPress={() => setSex('female')}
              >
                <User size={16} color={sex === 'female' ? '#FFFFFF' : '#6B7280'} />
                <Text
                  style={[
                    styles.sexOptionText,
                    sex === 'female' && styles.sexOptionTextSelected,
                  ]}
                >
                  {t('calculator:female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Age Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('calculator:age')}</Text>
            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="25"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Height Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('calculator:height')}</Text>
            <View style={styles.inputContainer}>
              <Ruler size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="170"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Weight Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('calculator:weight')}</Text>
            <View style={styles.inputContainer}>
              <Scale size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="70"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        </View>

        {/* Activity Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('calculator:activityLevel')}</Text>
          <View style={styles.activityOptions}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.activityOption,
                  activityLevel === option.id && styles.activityOptionSelected,
                ]}
                onPress={() => setActivityLevel(option.id)}
              >
                <View style={styles.activityOptionContent}>
                  <Text
                    style={[
                      styles.activityOptionLabel,
                      activityLevel === option.id && styles.activityOptionLabelSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.activityOptionDescription,
                      activityLevel === option.id && styles.activityOptionDescriptionSelected,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculate Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
            <Calculator size={20} color="#FFFFFF" />
            <Text style={styles.calculateButtonText}>{t('calculator:calculate')}</Text>
          </TouchableOpacity>
          
          {results && (
            <TouchableOpacity 
              style={styles.setGoalButton} 
              onPress={handleSetAsGoal}
              activeOpacity={0.7}
            >
              <Target size={20} color="#FFFFFF" />
              <Text style={styles.setGoalButtonText}>{t('calculator:setAsYourGoal')}</Text>
            </TouchableOpacity>
          )}
          
          {results && (
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>{t('calculator:reset')}</Text>
            </TouchableOpacity>
          )}
        </View>
        </View>

        {/* Results */}
        {results && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>{t('calculator:yourResults')}</Text>
            
            {/* Calorie Results */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>{t('calculator:dailyCalories')}</Text>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('calculator:bmr')}</Text>
                <Text style={styles.resultValue}>{results.bmr} kcal</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('calculator:tdee')}</Text>
                <Text style={styles.resultValue}>{results.tdee} kcal</Text>
              </View>
              <View style={[styles.resultRow, styles.targetRow]}>
                <Text style={styles.targetLabel}>{t('calculator:targetCalories')}</Text>
                <Text style={styles.targetValue}>{results.targetCalories} kcal</Text>
              </View>
            </View>

            {/* Macro Results */}
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>{t('calculator:recommendedMacros')}</Text>
              <View style={styles.macroGrid}>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{results.macros.protein}g</Text>
                  <Text style={styles.macroLabel}>{t('calculator:protein')}</Text>
                  <Text style={styles.macroPercentage}>25%</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{results.macros.carbs}g</Text>
                  <Text style={styles.macroLabel}>{t('calculator:carbs')}</Text>
                  <Text style={styles.macroPercentage}>45%</Text>
                </View>
                <View style={styles.macroCard}>
                  <Text style={styles.macroValue}>{results.macros.fat}g</Text>
                  <Text style={styles.macroLabel}>{t('calculator:fat')}</Text>
                  <Text style={styles.macroPercentage}>30%</Text>
                </View>
              </View>
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>{t('calculator:tips')}</Text>
              <Text style={styles.tipText}>
                {t('calculator:tipsList0')}
              </Text>
              <Text style={styles.tipText}>
                 {t('calculator:tipsList1')}
              </Text>
              <Text style={styles.tipText}>
                 {t('calculator:tipsList2')}
              </Text>
              <Text style={styles.tipText}>
                 {t('calculator:tipsList3')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

