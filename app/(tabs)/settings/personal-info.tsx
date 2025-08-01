import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Ruler, Scale, Target, Activity, Save } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useProfile } from '@/hooks/useProfile';

export default function PersonalInfoScreen() {
  const { profile, updateProfile } = useProfile();
  
  // Form state
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel || 'moderate');
  const [calorieGoal, setCalorieGoal] = useState(profile.goals.calories?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile.goals.protein?.toString() || '');
  const [carbGoal, setCarbGoal] = useState(profile.goals.carbs?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile.goals.fat?.toString() || '');
  const [waterGoal, setWaterGoal] = useState(profile.goals.water?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  // Update form when profile changes
  useEffect(() => {
    setAge(profile.age?.toString() || '');
    setHeight(profile.height?.toString() || '');
    setWeight(profile.weight?.toString() || '');
    setActivityLevel(profile.activityLevel || 'moderate');
    setCalorieGoal(profile.goals.calories?.toString() || '');
    setProteinGoal(profile.goals.protein?.toString() || '');
    setCarbGoal(profile.goals.carbs?.toString() || '');
    setFatGoal(profile.goals.fat?.toString() || '');
    setWaterGoal(profile.goalsWaterUpdate?.toString() || '');
  }, [profile]);

  const activityOptions = [
    { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise' },
    { id: 'light', label: 'Light', description: 'Light exercise 1-3 days/week' },
    { id: 'moderate', label: 'Moderate', description: 'Moderate exercise 3-5 days/week' },
    { id: 'active', label: 'Active', description: 'Hard exercise 6-7 days/week' },
    { id: 'very_active', label: 'Very Active', description: 'Very hard exercise, physical job' },
  ];

  const validateForm = () => {
    const errors: string[] = [];

    if (age && (parseInt(age) < 13 || parseInt(age) > 120)) {
      errors.push('Age must be between 13 and 120 years');
    }

    if (height && (parseInt(height) < 100 || parseInt(height) > 250)) {
      errors.push('Height must be between 100 and 250 cm');
    }

    if (weight && (parseInt(weight) < 20 || parseInt(weight) > 500)) {
      errors.push('Weight must be between 20 and 500 kg');
    }

    if (calorieGoal && (parseInt(calorieGoal) < 800 || parseInt(calorieGoal) > 5000)) {
      errors.push('Calorie goal must be between 800 and 5000');
    }

    if (proteinGoal && (parseInt(proteinGoal) < 0 || parseInt(proteinGoal) > 500)) {
      errors.push('Protein goal must be between 0 and 500g');
    }

    if (carbGoal && (parseInt(carbGoal) < 0 || parseInt(carbGoal) > 1000)) {
      errors.push('Carb goal must be between 0 and 1000g');
    }

    if (fatGoal && (parseInt(fatGoal) < 0 || parseInt(fatGoal) > 300)) {
      errors.push('Fat goal must be between 0 and 300g');
    }

    if (waterGoal && (parseFloat(waterGoal) < 0 || parseFloat(waterGoal) > 10)) {
      errors.push('Water goal must be between 0 and 10 Liters');
    }

    return errors;
  };

  const handleUpdate = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      setIsLoading(true);

      const updates = {
        age: age ? parseInt(age) : profile.age,
        height: height ? parseInt(height) : profile.height,
        weight: weight ? parseInt(weight) : profile.weight,
        activityLevel: activityLevel as any,
        goalsWaterUpdate: waterGoal ? parseFloat(waterGoal) : profile.goalsWaterUpdate,
        goals: {
          calories: calorieGoal ? parseInt(calorieGoal) : profile.goals.calories,
          protein: proteinGoal ? parseInt(proteinGoal) : profile.goals.protein,
          carbs: carbGoal ? parseInt(carbGoal) : profile.goals.carbs,
          fat: fatGoal ? parseInt(fatGoal) : profile.goals.fat,
        },
      };

      await updateProfile(updates);
      Alert.alert('Success', 'Personal information updated successfully!');
    } catch (error) {
      console.error('Error updating personal info:', error);
      Alert.alert('Error', 'Failed to update personal information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Personal Info</Text>
            <Text style={styles.headerSubtitle}>Update your physical stats and goals</Text>
          </View>
        </View>

        {/* Personal Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Physical Stats</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age (years)</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
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

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
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

        {/* Activity Level Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Level</Text>
          <View style={styles.activityOptions}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.activityOption,
                  activityLevel === option.id && styles.activityOptionSelected,
                ]}
                onPress={() => setActivityLevel(option.id as any)}
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

        {/* Nutrition Goals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition Goals</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Daily Calories</Text>
            <View style={styles.inputContainer}>
              <Target size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="2000"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>kcal</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Protein Goal</Text>
            <View style={styles.inputContainer}>
              <Activity size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="150"
                value={proteinGoal}
                onChangeText={setProteinGoal}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Carb Goal</Text>
            <View style={styles.inputContainer}>
              <Activity size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="250"
                value={carbGoal}
                onChangeText={setCarbGoal}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fat Goal</Text>
            <View style={styles.inputContainer}>
              <Activity size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="65"
                value={fatGoal}
                onChangeText={setFatGoal}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>g</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Water Goal</Text>
            <View style={styles.inputContainer}>
              <Activity size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="2.5"
                value={waterGoal}
                onChangeText={setWaterGoal}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputUnit}>L</Text>
            </View>
          </View>
        </View>

        {/* Update Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>
              {isLoading ? 'Updating...' : 'Update Information'}
            </Text>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
    paddingVertical: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  inputUnit: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
    fontWeight: '600',
    color: '#374151',
  },
  activityOptionLabelSelected: {
    color: '#FFFFFF',
  },
  activityOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  activityOptionDescriptionSelected: {
    color: '#E5E7EB',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});