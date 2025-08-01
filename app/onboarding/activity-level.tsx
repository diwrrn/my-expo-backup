// app/onboarding/activity-level.tsx
import React, { useState, useEffect } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { getTodayDateString } from '@/utils/dateUtils';

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { AnimatedButton } from '@/components/onboarding/AnimatedButton';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Dumbbell, Heart, Zap } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withDelay, 
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

export default function ActivityLevelScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { updateProfile, user } = useAuth();
  
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Animation values
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  
  useEffect(() => {
    // Animate content on mount
    contentOpacity.value = withTiming(1, { duration: 800 });
    contentTranslateY.value = withTiming(0, { duration: 800 });
  }, []);
  
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    };
  });
  
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });
  
  const activityOptions = [
    {
      id: 'sedentary',
      label: t('onboarding:notActive', 'Not Active'),
      description: t('onboarding:notActiveDesc', 'Little to no exercise'),
      icon: <Heart size={24} color="#EF4444" />,
      color: '#EF4444',
    },
    {
      id: 'moderate',
      label: t('onboarding:active', 'Active'),
      description: t('onboarding:activeDesc', 'Moderate exercise 3-5 days/week'),
      icon: <Activity size={24} color="#22C55E" />,
      color: '#22C55E',
    },
    {
      id: 'active',
      label: t('onboarding:athlete', 'Athlete'),
      description: t('onboarding:athleteDesc', 'Hard exercise 6-7 days/week'),
      icon: <Zap size={24} color="#3B82F6" />,
      color: '#3B82F6',
    },
    {
      id: 'very_active',
      label: t('onboarding:bodybuilder', 'Bodybuilder'),
      description: t('onboarding:bodybuilderDesc', 'Very intense training daily'),
      icon: <Dumbbell size={24} color="#8B5CF6" />,
      color: '#8B5CF6',
    },
  ];
  
  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      
      // Animate button press
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      // Get stored personal info
      const personalInfoStr = await AsyncStorage.getItem('onboardingPersonalInfo');
      if (!personalInfoStr) {
        Alert.alert('Error', 'Personal information not found. Please go back and try again.');
        setIsSubmitting(false);
        return;
      }
      
      const personalInfo = JSON.parse(personalInfoStr);
      
      // Calculate default goals based on personal info
      const { age, weight, height, gender } = personalInfo;
      
      // Basic BMR calculation (Mifflin-St Jeor Equation)
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      // Activity multipliers
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9,
      };
      
      const multiplier = activityMultipliers[activityLevel] || 1.55;
      const dailyCalories = Math.round(bmr * multiplier);
      
      // Calculate macros (protein: 25%, carbs: 45%, fat: 30%)
      const protein = Math.round((dailyCalories * 0.25) / 4); // 4 calories per gram
      const carbs = Math.round((dailyCalories * 0.45) / 4); // 4 calories per gram
      const fat = Math.round((dailyCalories * 0.30) / 9); // 9 calories per gram
      
     await updateProfile({
  profile: {
    age,
    weight,
    height,
    gender: personalInfo.gender,
    activityLevel,
    goals: {
      calories: dailyCalories,
      protein,
      carbs,
      fat,
      water: 2.5,
    }
  },
  onboardingCompleted: true  // Move this to top level
});
      // Save the initial weight to weightLogs
      if (user?.id && personalInfo.weight) {
        await FirebaseService.addWeightLog(user.id, personalInfo.weight, getTodayDateString());
      }

      // Show success animation before navigating
      setShowSuccessAnimation(true);
      contentOpacity.value = withTiming(0, { duration: 500 });
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingLayout
      title={t('onboarding:activityLevelTitle', 'Activity Level')}
      subtitle={t('onboarding:activityLevelSubtitle', 'Help us understand your lifestyle')}
      progress={3}
      onBack={() => router.back()}
      hideProgressBar={showSuccessAnimation}
      hideHeaderContent={showSuccessAnimation}
    >
      <Animated.View style={[styles.container, contentStyle]}>
        <Text style={[styles.description, { textAlign: getTextAlign(isRTL) }]}>
          {t('onboarding:activityLevelDescription', 'Select the option that best describes your typical activity level:')}
        </Text>
        
        <View style={styles.optionsContainer}>
          {activityOptions.map((option, index) => (
            <AnimatedButton
              key={option.id}
              label={option.label}
              description={option.description}
              icon={option.icon}
              selected={activityLevel === option.id}
              onPress={() => setActivityLevel(option.id)}
              color={option.color}
              index={index}
            />
          ))}
        </View>
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <TouchableOpacity
            style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]}
            onPress={handleComplete}
            disabled={isSubmitting}
          >
            <Text style={styles.completeButtonText}>
              {isSubmitting 
                ? t('onboarding:completing', 'Completing...') 
                : t('onboarding:completeSetup', 'Complete Setup')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {showSuccessAnimation && (
        <LottieView
          source={require('../../assets/lottie/success.json')}
          autoPlay
          loop={false}
          onAnimationFinish={() => {
            // Lottie animation finished, navigate directly
              router.replace('/(tabs)');
          }}
          style={[StyleSheet.absoluteFillObject, { transform: [{ scale: 0.5 }] }]}
          resizeMode="cover"
        />
      )}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  completeButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
