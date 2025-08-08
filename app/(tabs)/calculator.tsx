import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Calculator, Target, Activity, User, Scale, Ruler, TrendingUp, Award } from 'lucide-react-native';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

export default function CalculatorScreen() {
  const { user, updateProfile, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();

  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [rate, setRate] = useState<'slow' | 'moderate' | 'aggressive'>('moderate');
  const [age, setAge] = useState(user?.profile?.age?.toString() || '');
  const [sex, setSex] = useState<'male' | 'female'>(user?.profile?.gender || 'male');
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
    backgroundColor: '#F8FDF9',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  
  // Header Styles
  header: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    flex: 1,
  },
  headerContent: {
    marginLeft: isRTL ? 0 : 16,
    marginRight: isRTL ? 16 : 0,
  },
  titleRow: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    marginTop: 2,
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  firstSection: {
    paddingHorizontal: 20,
    marginBottom: 28,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    letterSpacing: -0.3,
  },

  // Goal Selection Styles
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  goalOptionSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    shadowColor: '#22C55E',
    shadowOpacity: 0.15,
  },
  goalOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginLeft: isRTL ? 0 : 14,
    marginRight: isRTL ? 14 : 0,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  goalOptionTextSelected: {
    color: '#16A34A',
  },

  // Rate Selection Styles
  rateOptions: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
    flexWrap: 'wrap',
  },
  rateOption: {
    flex: 1,
    minWidth: '30%',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  rateOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
    borderWidth: 2,
    shadowColor: '#22C55E',
    shadowOpacity: 0.1,
  },
  rateOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  rateOptionTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },

  // Input Styles
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  inputContainer: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Sex Options Styles
  sexOptions: {
    flexDirection: getFlexDirection(isRTL),
    gap: 12,
  },
  sexOption: {
    flex: 1,
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sexOptionSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  sexOptionText: {
    fontSize: 15,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
    textAlign: getTextAlign(isRTL),
  },
  sexOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Activity Options Styles
  activityOptions: {
    gap: 10,
  },
  activityOption: {
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  activityOptionSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  activityOptionContent: {
    gap: 6,
  },
  activityOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  activityOptionLabelSelected: {
    color: '#16A34A',
  },
  activityOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    lineHeight: 20,
  },
  activityOptionDescriptionSelected: {
    color: '#059669',
  },

  // Button Styles
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 14,
  },
  calculateButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 18,
    gap: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    letterSpacing: -0.2,
  },
  setGoalButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  setGoalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  resetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Results Styles
  resultsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    letterSpacing: -0.5,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  resultCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    letterSpacing: -0.3,
  },
  resultRow: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultLabel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  resultValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  targetRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 12,
    paddingTop: 20,
    backgroundColor: '#F0FDF4',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: -24,
  },
  targetLabel: {
    fontSize: 17,
    color: '#16A34A',
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  targetValue: {
    fontSize: 20,
    color: '#16A34A',
    fontWeight: '700',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Macro Styles
  macroGrid: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#F8FDF9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  macroValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },
  macroLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  macroPercentage: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '600',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Tips Styles
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 14,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: getTextAlign(isRTL),
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FDF9',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  },

  // Enhanced Visual Elements
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconSelected: {
    backgroundColor: '#DCFCE7',
  },
  
  // Floating Action Style
  floatingCalculate: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    left: 20,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});

  const goalOptions = [
    { 
      id: 'lose' as const, 
      label: t('calculator:loseWeight'), 
      color: '#EF4444', 
      icon: <Target size={20} color="#EF4444" />,
      bgColor: '#FEF2F2'
    },
    { 
      id: 'maintain' as const, 
      label: t('calculator:maintainW'), 
      color: '#22C55E', 
      icon: <Scale size={20} color="#22C55E" />,
      bgColor: '#F0FDF4'
    },
    { 
      id: 'gain' as const, 
      label: t('calculator:gainW'), 
      color: '#3B82F6', 
      icon: <TrendingUp size={20} color="#3B82F6" />,
      bgColor: '#EFF6FF'
    },
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
    { id: 'sedentary' as const, label: t('calculator:sedentary'), description: t('calculator:sedLabel'), multiplier: 1.2, icon: '🛋️' },
    { id: 'light' as const, label: t('calculator:light'), description: t('calculator:lightLabel'), multiplier: 1.375, icon: '🚶' },
    { id: 'moderate' as const, label: t('calculator:moderateActivity'), description: t('calculator:modLabel'), multiplier: 1.55, icon: '🏃' },
    { id: 'very_active' as const, label: t('calculator:veryActive'), description: t('calculator:veryActiveLabel'), multiplier: 1.725, icon: '🏋️' },
    { id: 'extra_active' as const, label: t('calculator:extraActive'), description: t('calculator:extraActiveLabel'), multiplier: 1.9, icon: '⚡' },
  ];

  const calculateBMR = (weight: number, height: number, age: number, sex: 'male' | 'female'): number => {
    if (sex === 'male') {
      return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  };

  const calculateMacros = (calories: number) => {
    const proteinCalories = calories * 0.25;
    const carbCalories = calories * 0.45;
    const fatCalories = calories * 0.30;

    return {
      protein: Math.round(proteinCalories / 4),
      carbs: Math.round(carbCalories / 4),
      fat: Math.round(fatCalories / 9),
    };
  };

  const handleCalculate = () => {
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    const ageNum = parseInt(age);
    const heightNum = parseInt(height);
    const weightNum = parseInt(weight);
    
    const bmr = calculateBMR(weightNum, heightNum, ageNum, sex);
    const activityMultiplier = activityOptions.find(opt => opt.id === activityLevel)?.multiplier || 1.55;
    const tdee = bmr * activityMultiplier;
    const rateCalories = rateOptions[goal].find(opt => opt.id === rate)?.calories || 0;
    const targetCalories = tdee + rateCalories;

    const macros = {
      protein: Math.round(targetCalories * 0.25 / 4),
      carbs: Math.round(targetCalories * 0.45 / 4),
      fat: Math.round(targetCalories * 0.30 / 9)
    };

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      macros,
    });
  };

  const handleSetAsGoal = async () => {
    console.log('🎯 Set as Goal button pressed!');
    console.log('🎯 Setting goal - User:', user?.id);
    console.log('🎯 Setting goal - Results:', results);
    
    if (!results || !user) {
      console.log('❌ Missing results or user:', { hasResults: !!results, hasUser: !!user });
      Alert.alert('Error', 'No calculation results or user not authenticated');
      return;
    }

    try {
      const currentGoal = user.profile?.goals?.calories;
      const targetCaloriesNum = Number(results.targetCalories);
      const currentGoalNum = Number(currentGoal);
      
      console.log('🎯 Current goal:', currentGoal, typeof currentGoal);
      console.log('🎯 Target calories:', results.targetCalories, typeof results.targetCalories);
      console.log('🎯 Current goal (number):', currentGoalNum);
      console.log('🎯 Target calories (number):', targetCaloriesNum);
      
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
      const updatedGoals = {
        calories: results.targetCalories,
        protein: results.macros.protein,
        carbs: results.macros.carbs,
        fat: results.macros.fat,
      };

      console.log('🎯 Calculator: Updating user profile with goals:', updatedGoals);
      
      await updateProfile({ profile: { goals: updatedGoals } });

      console.log('🎯 Calculator: Goal update successful');
    } catch (error) {
      console.error('❌ Calculator: Error updating goal - Full error:', error);
      console.error('❌ Calculator: Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Calculator: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to update goal: ${errorMessage}`);
      
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
      setSex(user.profile.gender || 'male');
      setHeight(user.profile.height?.toString() || '');
      setWeight(user.profile.weight?.toString() || '');
      setActivityLevel(user.profile.activityLevel || 'moderate');
    }
  }, [user?.profile]);

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
          {/* Clean White Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <HamburgerMenu currentRoute="/(tabs)/calculator" />
              <View style={styles.headerContent}>
                <View style={styles.titleRow}>
                  <Calculator size={20} color="#22C55E" />
                  <Text style={styles.headerTitle}>{t('calculator:title')}</Text>
                </View>
                <Text style={styles.headerSubtitle}>{t('calculator:titleDesc')}</Text>
              </View>
            </View>
          </View>

          {/* Enhanced Goal Selection */}
          <View style={styles.firstSection}>
            <Text style={styles.sectionTitle}>{t('calculator:yourGoal')}</Text>
            <View style={styles.goalOptions}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.goalOption,
                    goal === option.id && styles.goalOptionSelected,
                  ]}
                  onPress={() => {
                    setGoal(option.id);
                    setRate('moderate');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.goalIcon,
                    goal === option.id && { backgroundColor: option.bgColor }
                  ]}>
                    {option.icon}
                  </View>
                  <Text
                    style={[
                      styles.goalOptionText,
                      goal === option.id && styles.goalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Enhanced Rate Selection */}
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
                  activeOpacity={0.8}
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

          {/* Enhanced Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('calculator:personalInfo')}</Text>
            
            {/* Enhanced Sex Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('calculator:sex')}</Text>
              <View style={styles.sexOptions}>
                <TouchableOpacity
                  style={[
                    styles.sexOption,
                    sex === 'male' && styles.sexOptionSelected,
                  ]}
                  onPress={() => setSex('male')}
                  activeOpacity={0.8}
                >
                  <User size={18} color={sex === 'male' ? '#FFFFFF' : '#6B7280'} />
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
                  activeOpacity={0.8}
                >
                  <User size={18} color={sex === 'female' ? '#FFFFFF' : '#6B7280'} />
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

            {/* Enhanced Input Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('calculator:age')}</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#22C55E" />
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('calculator:height')} (cm)</Text>
              <View style={styles.inputContainer}>
                <Ruler size={20} color="#22C55E" />
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('calculator:weight')} (kg)</Text>
              <View style={styles.inputContainer}>
                <Scale size={20} color="#22C55E" />
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

          {/* Enhanced Activity Level */}
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
                  activeOpacity={0.8}
                >
                  <View style={styles.activityOptionContent}>
                    <View style={{ flexDirection: getFlexDirection(isRTL), alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 20 }}>{option.icon}</Text>
                      <Text
                        style={[
                          styles.activityOptionLabel,
                          activityLevel === option.id && styles.activityOptionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
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

          {/* Enhanced Calculate Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.calculateButton} 
              onPress={handleCalculate}
              activeOpacity={0.8}
            >
              <Calculator size={22} color="#FFFFFF" />
              <Text style={styles.calculateButtonText}>{t('calculator:calculate')}</Text>
            </TouchableOpacity>
            
            {results && (
              <TouchableOpacity 
                style={styles.setGoalButton} 
                onPress={handleSetAsGoal}
                activeOpacity={0.8}
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

          {/* Results Display */}
          {results && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>{t('calculator:yourResults')}</Text>
              
              {/* Enhanced Calorie Results Card */}
              <View style={styles.resultCard}>
                <Text style={styles.resultCardTitle}>📊 {t('calculator:dailyCalories')}</Text>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>🔥 {t('calculator:bmr')}</Text>
                  <Text style={styles.resultValue}>{results.bmr} kcal</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>⚡ {t('calculator:tdee')}</Text>
                  <Text style={styles.resultValue}>{results.tdee} kcal</Text>
                </View>
                <View style={[styles.resultRow, styles.targetRow]}>
                  <Text style={styles.targetLabel}>🎯 {t('calculator:targetCalories')}</Text>
                  <Text style={styles.targetValue}>{results.targetCalories} kcal</Text>
                </View>
              </View>

              {/* Enhanced Tips Card */}
              <View style={styles.tipsCard}>
                <View style={{ flexDirection: getFlexDirection(isRTL), alignItems: 'center', marginBottom: 14 }}>
                  <Award size={18} color="#92400E" />
                  <Text style={[styles.tipsTitle, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0, marginBottom: 0 }]}>
                    💡 {t('calculator:tips')}
                  </Text>
                </View>
                <Text style={styles.tipText}>
                  • {t('calculator:tipsList0')}
                </Text>
                <Text style={styles.tipText}>
                  • {t('calculator:tipsList1')}
                </Text>
                <Text style={styles.tipText}>
                  • {t('calculator:tipsList2')}
                </Text>
                <Text style={styles.tipText}>
                  • {t('calculator:tipsList3')}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}