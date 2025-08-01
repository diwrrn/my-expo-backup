import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image, ScrollView, Dimensions  } from 'react-native'; // Added ScrollView
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { User, Scale } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { RulerPicker } from 'react-native-ruler-picker'; // Corrected import

// Import gender icons
import manAvatar from '@/assets/icons/gender/man.png';
import womanAvatar from '@/assets/icons/gender/woman.png';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  
  // Form state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('150'); // Default starting height
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Form validation
  const [errors, setErrors] = useState<{
    age?: string;
    weight?: string;
    height?: string;
  }>({});
  
  // Animation values
  const formOpacity = useSharedValue(0);
  const ageTranslateX = useSharedValue(isRTL ? -50 : 50);
  const weightTranslateX = useSharedValue(isRTL ? -50 : 50);
  const heightTranslateX = useSharedValue(isRTL ? -50 : 50);
  
  useEffect(() => {
    // Animate form elements with staggered timing
    formOpacity.value = withTiming(1, { duration: 800 });
    
    ageTranslateX.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    
    weightTranslateX.value = withDelay(
      400,
      withTiming(0, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    
    heightTranslateX.value = withDelay(
      600,
      withTiming(0, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
    
  }, []);
  
  // Animated styles
  const ageInputStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateX: ageTranslateX.value }],
    };
  });
  
  const weightInputStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateX: weightTranslateX.value }],
    };
  });
  
  const heightInputStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateX: heightTranslateX.value }],
    };
  });
  
  const validateForm = () => {
    const newErrors: {
      age?: string;
      weight?: string;
      height?: string;
    } = {};
    
    if (!age) {
      newErrors.age = t('onboarding:ageRequired', 'Age is required');
    } else if (parseInt(age) < 13 || parseInt(age) > 120) {
      newErrors.age = t('onboarding:ageRange', 'Age must be between 13 and 120');
    }
    
    if (!weight) {
      newErrors.weight = t('onboarding:weightRequired', 'Weight is required');
    } else if (parseInt(weight) < 20 || parseInt(weight) > 500) {
      newErrors.weight = t('onboarding:weightRange', 'Weight must be between 20 and 500 kg');
    }
    
    if (!height) {
      newErrors.height = t('onboarding:heightRequired', 'Height is required');
    } else if (parseInt(height) < 100 || parseInt(height) > 250) {
      newErrors.height = t('onboarding:heightRange', 'Height must be between 100 and 250 cm');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContinue = () => {
    if (validateForm()) {
      // Store the personal info in AsyncStorage or context for later use
      const personalInfo = {
        age: parseInt(age),
        weight: parseInt(weight),
        height: parseInt(height),
        gender,
      };
      
      // Store in AsyncStorage
      try {
        AsyncStorage.setItem('onboardingPersonalInfo', JSON.stringify(personalInfo));
        router.push('/onboarding/activity-level');
      } catch (error) {
        console.error('Error saving personal info:', error);
        Alert.alert('Error', 'Failed to save your information. Please try again.');
      }
    }
  };

  return (
    <OnboardingLayout
      title={t('onboarding:personalInfoTitle', 'Personal Information')}
      //subtitle={t('onboarding:personalInfoSubtitle', 'Help us customize your experience')}
      progress={2}
      onBack={() => router.back()}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Improves keyboard dismissal behavior
      >
        <View style={styles.formContainer}>
          {/* Age and Weight in one row */}
          <View style={[styles.rowContainer, { flexDirection: getFlexDirection(isRTL) }]}>
            {/* Age Input */}
            <Animated.View style={[styles.inputGroup, styles.halfWidthInput, ageInputStyle]}>
              <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>
                {t('onboarding:age', 'Age')}
              </Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <User size={20} color="#6B7280" />
                <AnimatedTextInput
                  style={[
                    styles.input, 
                    { 
                      marginLeft: isRTL ? 0 : 12, 
                      marginRight: isRTL ? 12 : 0,
                      textAlign: getTextAlign(isRTL)
                    }
                  ]}
                  //placeholder={t('onboarding:agePlaceholder', 'Enter your age')}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputUnit}>{t('onboarding:years', 'years')}</Text>
              </View>
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </Animated.View>
            
            {/* Weight Input */}
            <Animated.View style={[styles.inputGroup, styles.halfWidthInput, weightInputStyle]}>
              <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>
                {t('onboarding:weight', 'Weight')}
              </Text>
              <View style={[styles.inputContainer, { flexDirection: getFlexDirection(isRTL) }]}>
                <Scale size={20} color="#6B7280" />
                <AnimatedTextInput
                  style={[
                    styles.input, 
                    { 
                      marginLeft: isRTL ? 0 : 12, 
                      marginRight: isRTL ? 12 : 0,
                      textAlign: getTextAlign(isRTL)
                    }
                  ]}
                  //placeholder={t('onboarding:weightPlaceholder', 'Enter your weight')}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputUnit}>{t('onboarding:kg', 'kg')}</Text>
              </View>
              {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
            </Animated.View>
          </View>
          
          {/* Height Input - full width with RulerPicker */}
          <Animated.View style={[styles.inputGroup, heightInputStyle]}>
            <Text style={[styles.inputLabel, { textAlign: getTextAlign(isRTL) }]}>
              {t('onboarding:height', 'Height')}
            </Text>
            <View style={styles.rulerPickerContainer}>
              <RulerPicker
                  min={100}
                  max={250}
                  step={1}
                  initialValue={parseInt(height) || 150}
                  unit="cm"
                  height={200} // Increase height
                  width={Dimensions.get('window').width - 48} // Full width minus padding
                  indicatorColor="#22C55E"
                  indicatorWidth={3} // Slightly thicker
                  indicatorHeight={60} // Taller indicator
                  shortIndicatorHeight={25} // Taller short ticks
                  longIndicatorHeight={40} // Taller long ticks
                  labelColor="#111827"
                  labelTextStyle={{ fontSize: 18, fontWeight: '700' }} // Bigger, bolder
                  unitColor="#111827"
                  unitTextStyle={{ fontSize: 18, fontWeight: '700' }} // Match label
                  showValueIndicator={true} // Make sure value is displayed prominently
                  onValueChange={(value) => setHeight(value.toString())}
                  onRelease={(value) => setHeight(value.toString())}
                />
            </View>
            {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
          </Animated.View>
          
          {/* Gender Selection */}
          <View style={styles.genderSection}>
            <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('onboarding:gender', 'Gender')}
            </Text>
            
            <View style={[styles.genderOptions, { flexDirection: getFlexDirection(isRTL) }]}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonSelected,
                ]}
                onPress={() => setGender('male')}
              >
                <Image source={manAvatar} style={styles.genderIcon} />
                <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>
                  {t('onboarding:male', 'Male')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonSelected,
                ]}
                onPress={() => setGender('female')}
              >
                <Image source={womanAvatar} style={styles.genderIcon} />
                <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>
                  {t('onboarding:female', 'Female')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {t('onboarding:continue', 'Continue')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1, // Allows content to grow and push button to bottom
    justifyContent: 'space-between', // Distributes space between form and button
  },
  formContainer: {
    // flex: 1, // Removed flex:1 from here, it's now on scrollViewContent
  },
  rowContainer: {
    marginBottom: 20,
    gap: 12, // Space between age and weight inputs
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfWidthInput: {
    flex: 1, // Takes half width in a row
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
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
  },
  inputUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 4,
  },
  genderSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  genderButtonSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  genderIcon: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  continueButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    // Removed marginTop: 'auto' as it's now inside ScrollView with flexGrow
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rulerPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden', // Ensures ruler doesn't overflow rounded corners
    alignItems: 'center', // Center the ruler horizontally
    paddingVertical: 8, // Add some vertical padding
  },
});
