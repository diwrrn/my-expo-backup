import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Ruler, Scale, Target, Activity, Save, Droplets } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';

export default function PersonalInfoScreen() {
  const { profile: contextProfile, updateProfile } = useProfileContext();
  const { user } = useAuth();

  // Combine context profile with user data
  const profile = contextProfile || user?.profile;

  // Add safety check
  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
    
  // Form state
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel || 'moderate');
  const [calorieGoal, setCalorieGoal] = useState(profile.goals.calories?.toString() || '');
  const [proteinGoal, setProteinGoal] = useState(profile.goals.protein?.toString() || '');
  const [carbGoal, setCarbGoal] = useState(profile.goals.carbs?.toString() || '');
  const [fatGoal, setFatGoal] = useState(profile.goals.fat?.toString() || '');
  const [waterGoal, setWaterGoal] = useState(profile.goalsWaterUpdate?.toString() || '');
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
    { 
      id: 'sedentary', 
      label: 'Sedentary', 
      description: 'Little to no exercise',
      emoji: '🛋️'
    },
    { 
      id: 'light', 
      label: 'Light', 
      description: 'Light exercise 1-3 days/week',
      emoji: '🚶'
    },
    { 
      id: 'moderate', 
      label: 'Moderate', 
      description: 'Moderate exercise 3-5 days/week',
      emoji: '🏃'
    },
    { 
      id: 'active', 
      label: 'Active', 
      description: 'Hard exercise 6-7 days/week',
      emoji: '💪'
    },
    { 
      id: 'very_active', 
      label: 'Very Active', 
      description: 'Very hard exercise, physical job',
      emoji: '🏋️'
    },
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
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Personal Information</Text>
          <Text style={styles.headerSubtitle}>Update your profile details</Text>
        </View>
        <TouchableOpacity 
          onPress={handleUpdate} 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          <Save size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <User size={22} color="#10B981" />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            <Text style={styles.cardSubtitle}>Your physical measurements</Text>
          </View>
          
          <View style={styles.inputGrid}>
            <View style={styles.inputRow}>
              <InputField
                icon={<User size={18} color="#64748B" />}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                unit="years"
              />
            </View>
            
            <View style={styles.inputRow}>
              <InputField
                icon={<Ruler size={18} color="#64748B" />}
                placeholder="Height"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                unit="cm"
              />
            </View>

            <View style={styles.inputRow}>
              <InputField
                icon={<Scale size={18} color="#64748B" />}
                placeholder="Weight"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                unit="kg"
              />
            </View>
          </View>
        </View>

        {/* Activity Level Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Activity size={22} color="#10B981" />
              <Text style={styles.cardTitle}>Activity Level</Text>
            </View>
            <Text style={styles.cardSubtitle}>How active are you?</Text>
          </View>
          
          <View style={styles.activityGrid}>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.activityOption,
                  activityLevel === option.id && styles.activityOptionSelected
                ]}
                onPress={() => setActivityLevel(option.id)}
              >
                <View style={styles.activityHeader}>
                  <Text style={styles.activityEmoji}>{option.emoji}</Text>
                  <View style={styles.activityTextContainer}>
                    <Text style={[
                      styles.activityLabel,
                      activityLevel === option.id && styles.activityLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={[
                      styles.activityDescription,
                      activityLevel === option.id && styles.activityDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                  </View>
                </View>
                {activityLevel === option.id && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrition Goals Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Target size={22} color="#10B981" />
              <Text style={styles.cardTitle}>Nutrition Goals</Text>
            </View>
            <Text style={styles.cardSubtitle}>Set your daily targets</Text>
          </View>
          
          <View style={styles.inputGrid}>
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Daily Energy</Text>
              </View>
              <InputField
                icon={<Target size={18} color="#F59E0B" />}
                placeholder="e.g. 2000"
                value={calorieGoal}
                onChangeText={setCalorieGoal}
                keyboardType="numeric"
                unit="cal"
              />
            </View>

            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>Macronutrients</Text>
              </View>
              
              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <View style={styles.macroLabelContainer}>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <InputField
                    icon={<Target size={18} color="#EF4444" />}
                    placeholder="e.g. 120"
                    value={proteinGoal}
                    onChangeText={setProteinGoal}
                    keyboardType="numeric"
                    unit="g"
                    compact
                  />
                </View>
                <View style={styles.macroInput}>
                  <View style={styles.macroLabelContainer}>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <InputField
                    icon={<Target size={18} color="#3B82F6" />}
                    placeholder="e.g. 250"
                    value={carbGoal}
                    onChangeText={setCarbGoal}
                    keyboardType="numeric"
                    unit="g"
                    compact
                  />
                </View>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <View style={styles.macroLabelContainer}>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                  <InputField
                    icon={<Target size={18} color="#8B5CF6" />}
                    placeholder="e.g. 70"
                    value={fatGoal}
                    onChangeText={setFatGoal}
                    keyboardType="numeric"
                    unit="g"
                    compact
                  />
                </View>
                <View style={styles.macroInput}>
                  <View style={styles.macroLabelContainer}>
                    <Text style={styles.macroLabel}>Water</Text>
                  </View>
                  <InputField
                    icon={<Droplets size={18} color="#06B6D4" />}
                    placeholder="e.g. 2.5"
                    value={waterGoal}
                    onChangeText={setWaterGoal}
                    keyboardType="numeric"
                    unit="C"
                    compact
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
            
        {/* Save Button */}
        <TouchableOpacity 
          onPress={handleUpdate} 
          style={[styles.saveButtonLarge, isLoading && styles.saveButtonLargeDisabled]}
          disabled={isLoading}
        >
          <Save size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Input Field Component
const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType, 
  unit,
  compact = false 
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: any;
  unit?: string;
  compact?: boolean;
}) => (
  <View style={[styles.inputContainer, compact && styles.inputContainerCompact]}>
    <View style={styles.inputIconContainer}>
      {icon}
    </View>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#9CA3AF"
    />
    {unit && (
      <View style={styles.unitContainer}>
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  inputGrid: {
    padding: 20,
    gap: 16,
  },
  inputRow: {
    width: '100%',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  inputContainerCompact: {
    paddingVertical: 12,
    minHeight: 48,
  },
  inputIconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  unitContainer: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  unitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  activityGrid: {
    padding: 20,
    gap: 12,
  },
  activityOption: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  activityOptionSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  activityTextContainer: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  activityLabelSelected: {
    color: '#065F46',
  },
  activityDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  activityDescriptionSelected: {
    color: '#047857',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  saveButtonLarge: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonLargeDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonIcon: {
    marginRight: 8,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  goalSection: {
    marginBottom: 24,
  },
  goalHeader: {
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
});