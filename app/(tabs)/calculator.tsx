import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Calculator, Target, Activity, User, Scale, Ruler, TrendingUp, Award, Zap, Heart, Plus, Minus } from 'lucide-react-native';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useAuth } from '@/hooks/useAuth';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/store/appStore';

export default function CalculatorScreen() {
  const { user } = useAppStore();  
  const { profile, profileLoading } = useAppStore();
  const { updateProfile } = useProfileContext();
    const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const isRTL = useRTL();
  
  // Add ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);

  const [goal, setGoal] = useState<'lose' | 'maintain' | 'gain'>('maintain');
  const [rate, setRate] = useState<'slow' | 'moderate' | 'aggressive'>('moderate');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [sex, setSex] = useState<'male' | 'female'>(profile?.gender || 'male');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'>(
    profile?.activityLevel === 'active' ? 'very_active' : (profile?.activityLevel || 'moderate')
  );
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
      backgroundColor: '#FAFBFC', // Much lighter background
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 100,
    },
    
    // Header
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    headerContent: {
      marginLeft: isRTL ? 0 : 16,
      marginRight: isRTL ? 16 : 0,
      flex: 1,
    },
    titleRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Main Content
    mainContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },

    // Step Container - Less green, more white
    stepContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0', // Gray border instead of green
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    stepHeader: {
      backgroundColor: '#F8FAFC', // Light gray instead of green
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#22C55E', // Keep green for number only
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    stepNumberText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    stepTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: '#374151', // Dark gray instead of white
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    stepContent: {
      padding: 16,
    },

    // Goal Cards - More neutral
    goalGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    goalCard: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#FAFBFC', // Light gray background
      borderWidth: 2,
      borderColor: '#E2E8F0',
      alignItems: 'center',
    },
    goalCardSelected: {
      backgroundColor: '#F0F9FF', // Light blue instead of green
      borderColor: '#22C55E', // Keep green border for selection
    },
    goalIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    goalText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#374151',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    goalTextSelected: {
      color: '#22C55E', // Green text only when selected
    },

    // Rate Selection - More neutral
    rateContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    rateChip: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: '#FAFBFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      alignItems: 'center',
    },
    rateChipSelected: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    rateText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    rateTextSelected: {
      color: '#FFFFFF',
    },

    // Personal Info - Clean and minimal
    personalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    inputHalf: {
      flex: 1,
      minWidth: '45%',
    },
    inputFull: {
      width: '100%',
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 6,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    inputWrapper: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#FFFFFF', // Pure white background
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D1D5DB', // Gray border
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    inputWrapperFocused: {
      borderColor: '#22C55E', // Green only on focus
      backgroundColor: '#FFFFFF',
    },
    inputIcon: {
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Sex Selection - Cleaner
    sexContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    sexOption: {
      flex: 1,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D1D5DB',
    },
    sexOptionSelected: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    sexText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#6B7280',
      marginLeft: isRTL ? 0 : 6,
      marginRight: isRTL ? 6 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    sexTextSelected: {
      color: '#FFFFFF',
    },

    // Activity Level - Much cleaner
    activityList: {
      gap: 8,
    },
    activityItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    activityItemSelected: {
      backgroundColor: '#F0F9FF', // Light blue background
      borderColor: '#22C55E', // Green border only
    },
    activityEmoji: {
      fontSize: 18,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    activityTitleSelected: {
      color: '#22C55E', // Green text only when selected
    },
    activityDesc: {
      fontSize: 12,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Calculate Button - Keep green for primary action
    calculateContainer: {
      paddingHorizontal: 20,
      marginTop: 8,
      marginBottom: 24,
    },
    calculateButton: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    calculateGradient: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    calculateText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Results Section - Clean and minimal
    resultsContainer: {
      paddingHorizontal: 20,
      gap: 16,
    },
    resultsTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Results Cards - Much less green
    resultCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: '#E2E8F0', // Gray border
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    resultHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    resultIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F0F9FF', // Light blue background
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isRTL ? 0 : 10,
      marginLeft: isRTL ? 10 : 0,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    resultRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    resultRowLast: {
      borderBottomWidth: 0,
      backgroundColor: '#F8FAFC', // Light gray highlight
      marginHorizontal: -16,
      paddingHorizontal: 16,
      marginBottom: -16,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      paddingVertical: 12,
    },
    resultLabel: {
      fontSize: 14,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    resultValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    resultLabelTarget: {
      color: '#22C55E', // Green only for target
      fontWeight: '600',
    },
    resultValueTarget: {
      color: '#22C55E', // Green only for target
      fontSize: 16,
      fontWeight: '700',
    },

    // Macros Grid - Clean
    macrosGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    macroCard: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#FAFBFC', // Light gray background
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E2E8F0',
    },
    macroValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 2,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    macroLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Action Buttons
    actionButtons: {
      paddingHorizontal: 20,
      gap: 12,
      marginTop: 8,
    },
    setGoalButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#22C55E', // Keep green for primary action
      borderRadius: 10,
      paddingVertical: 14,
      gap: 6,
    },
    setGoalText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    resetButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 10,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: '#D1D5DB', // Gray border
    },
    resetText: {
      color: '#6B7280',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FAFBFC',
    },
    loadingText: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      marginTop: 12,
    },
  })

  const goalOptions = [
    { 
      id: 'lose' as const, 
      label: t('calculator:loseWeight'), 
      icon: <Target size={18} color="#EF4444" />
    },
    { 
      id: 'maintain' as const, 
      label: t('calculator:maintainW'), 
      icon: <Scale size={18} color="#22C55E" />
    },
    { 
      id: 'gain' as const, 
      label: t('calculator:gainW'), 
      icon: <TrendingUp size={18} color="#3B82F6" />
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
    { id: 'sedentary' as const, label: t('calculator:sedentary'), description: t('calculator:sedLabel'), multiplier: 1.2, emoji: '🛋️' },
    { id: 'light' as const, label: t('calculator:light'), description: t('calculator:lightLabel'), multiplier: 1.375, emoji: '🚶' },
    { id: 'moderate' as const, label: t('calculator:moderateActivity'), description: t('calculator:modLabel'), multiplier: 1.55, emoji: '🏃' },
    { id: 'very_active' as const, label: t('calculator:veryActive'), description: t('calculator:veryActiveLabel'), multiplier: 1.725, emoji: '🏋️' },
    { id: 'extra_active' as const, label: t('calculator:extraActive'), description: t('calculator:extraActiveLabel'), multiplier: 1.9, emoji: '⚡' },
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

    // Auto-scroll to results section after calculation
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300); // Small delay to ensure results are rendered
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
      const currentGoal = profile?.goals?.calories;
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
                  console.log('✅ Calculator: Goal update completed. Current profile goals:', profile?.goals);
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
          console.log('✅ Calculator: Goal set completed. Current profile goals:', profile?.goals);
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

      console.log('🎯 Calculator: Updating profile with goals:', updatedGoals);
      
      await updateProfile({ goals: updatedGoals });

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
    if (profile) {
      setAge(profile.age?.toString() || '');
      setSex(profile.gender || 'male');
      setHeight(profile.height?.toString() || '');
      setWeight(profile.weight?.toString() || '');
      setActivityLevel(profile.activityLevel === 'active' ? 'very_active' : (profile.activityLevel || 'moderate'));
    }
  }, [profile]);

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Calculator size={32} color="#22C55E" />
          <Text style={styles.loadingText}>Loading calculator...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
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
                  <Calculator size={20} color="#22C55E" />
                  <Text style={styles.headerTitle}>{t('calculator:title')}</Text>
                </View>
                <Text style={styles.headerSubtitle}>{t('calculator:titleDesc')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.mainContent}>
            {/* Step 1: Goal Selection */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>{t('calculator:yourGoal')}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.goalGrid}>
                  {goalOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.goalCard,
                        goal === option.id && styles.goalCardSelected,
                      ]}
                      onPress={() => {
                        setGoal(option.id);
                        setRate('moderate');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.goalIcon}>
                        {option.icon}
                      </View>
                      <Text style={[
                        styles.goalText,
                        goal === option.id && styles.goalTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Step 2: Rate Selection */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>{t('calculator:rate')}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.rateContainer}>
                  {rateOptions[goal].map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.rateChip,
                        rate === option.id && styles.rateChipSelected,
                      ]}
                      onPress={() => setRate(option.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.rateText,
                        rate === option.id && styles.rateTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Step 3: Personal Information */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>{t('calculator:personalInfo')}</Text>
              </View>
              <View style={styles.stepContent}>
                {/* Sex Selection */}
                <View style={styles.inputFull}>
                  <Text style={styles.inputLabel}>{t('calculator:sex')}</Text>
                  <View style={styles.sexContainer}>
                    <TouchableOpacity
                      style={[
                        styles.sexOption,
                        sex === 'male' && styles.sexOptionSelected,
                      ]}
                      onPress={() => setSex('male')}
                      activeOpacity={0.8}
                    >
                      <User size={16} color={sex === 'male' ? '#FFFFFF' : '#6B7280'} />
                      <Text style={[
                        styles.sexText,
                        sex === 'male' && styles.sexTextSelected,
                      ]}>
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
                      <User size={16} color={sex === 'female' ? '#FFFFFF' : '#6B7280'} />
                      <Text style={[
                        styles.sexText,
                        sex === 'female' && styles.sexTextSelected,
                      ]}>
                        {t('calculator:female')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Personal Info Grid */}
                <View style={styles.personalGrid}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t('calculator:age')}</Text>
                    <View style={styles.inputWrapper}>
                      <User size={16} color="#22C55E" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="25"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t('calculator:height')} (cm)</Text>
                    <View style={styles.inputWrapper}>
                      <Ruler size={16} color="#22C55E" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="170"
                        value={height}
                        onChangeText={setHeight}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View style={styles.inputFull}>
                    <Text style={styles.inputLabel}>{t('calculator:weight')} (kg)</Text>
                    <View style={styles.inputWrapper}>
                      <Scale size={16} color="#22C55E" style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="70"
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Step 4: Activity Level */}
            <View style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <Text style={styles.stepTitle}>{t('calculator:activityLevel')}</Text>
              </View>
              <View style={styles.stepContent}>
                <View style={styles.activityList}>
                  {activityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.activityItem,
                        activityLevel === option.id && styles.activityItemSelected,
                      ]}
                      onPress={() => setActivityLevel(option.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.activityEmoji}>{option.emoji}</Text>
                      <View style={styles.activityContent}>
                        <Text style={[
                          styles.activityTitle,
                          activityLevel === option.id && styles.activityTitleSelected
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.activityDesc}>
                          {option.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Calculate Button */}
          <View style={styles.calculateContainer}>
            <TouchableOpacity 
              style={styles.calculateButton} 
              onPress={handleCalculate}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.calculateGradient}
              >
                <Calculator size={20} color="#FFFFFF" />
                <Text style={styles.calculateText}>{t('calculator:calculate')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          {results && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>{t('calculator:yourResults')}</Text>
              
              {/* Calorie Results */}
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <Zap size={20} color="#22C55E" />
                  </View>
                  <Text style={styles.resultTitle}>Daily Calories</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>BMR (Base Rate)</Text>
                  <Text style={styles.resultValue}>{results.bmr} kcal</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>TDEE (Total Daily)</Text>
                  <Text style={styles.resultValue}>{results.tdee} kcal</Text>
                </View>
                
                <View style={[styles.resultRow, styles.resultRowLast]}>
                  <Text style={[styles.resultLabel, styles.resultLabelTarget]}>Your Target</Text>
                  <Text style={[styles.resultValue, styles.resultValueTarget]}>{results.targetCalories} kcal</Text>
                </View>
              </View>

              {/* Macros Results */}
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultIcon}>
                    <Target size={20} color="#22C55E" />
                  </View>
                  <Text style={styles.resultTitle}>Daily Macros</Text>
                </View>
                
                <View style={styles.macrosGrid}>
                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{results.macros.protein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  
                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{results.macros.carbs}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  
                  <View style={styles.macroCard}>
                    <Text style={styles.macroValue}>{results.macros.fat}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.setGoalButton} 
                  onPress={handleSetAsGoal}
                  activeOpacity={0.8}
                >
                  <Target size={18} color="#FFFFFF" />
                  <Text style={styles.setGoalText}>{t('calculator:setAsYourGoal')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.resetButton} 
                  onPress={handleReset}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetText}>{t('calculator:reset')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}