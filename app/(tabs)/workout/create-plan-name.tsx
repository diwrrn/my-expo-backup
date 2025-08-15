import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Save } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAppStore } from '@/store/appStore';
import { FirebaseService } from '@/services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreatePlanNameScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const user = useAppStore(state => state.user);
  
  // Get initial exercise data from params if available
  const { initialExerciseData } = useLocalSearchParams<{ initialExerciseData?: string }>();
  const parsedInitialExerciseData = initialExerciseData ? JSON.parse(initialExerciseData) : null;

  const [planName, setPlanName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreatePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setCreating(true);
      
      const planData = {
        name: planName.trim(),
        exercises: parsedInitialExerciseData ? [parsedInitialExerciseData] : [],
        createdAt: new Date().toISOString(),
      };

      const newPlanId = await FirebaseService.addWorkoutPlan(user.id, planData);
      
      // Navigate to the newly created plan details
      router.replace({
        pathname: '/(tabs)/workout/plan-details',
        params: { planId: newPlanId }
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to create workout plan');
    } finally {
      setCreating(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    header: {
      backgroundColor: '#FFFFFF',
      padding: 24,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    formContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: 32,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    formTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: 'center',
    },
    formSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 32,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    planNameInput: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 16,
      fontSize: 16,
      color: '#111827',
      textAlign: getTextAlign(isRTL),
      marginBottom: 32,
    },
    createButton: {
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonGradient: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Workout Plan</Text>
          <Text style={styles.headerSubtitle}>Start building your custom routine</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Name Your Plan</Text>
          <Text style={styles.formSubtitle}>
            Give your workout plan a memorable name
          </Text>
          
          <Text style={styles.inputLabel}>Plan Name</Text>
          <TextInput
            style={styles.planNameInput}
            placeholder="e.g., Upper Body Strength, Morning Cardio..."
            value={planName}
            onChangeText={setPlanName}
            placeholderTextColor="#9CA3AF"
            autoFocus
          />

          <TouchableOpacity
            style={[styles.createButton, creating && styles.createButtonDisabled]}
            onPress={handleCreatePlan}
            disabled={creating || !planName.trim()}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.createButtonGradient}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>
                {creating ? 'Creating...' : 'Create Plan'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}