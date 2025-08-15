import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Minus,Save, X, LocationEdit as Edit3, Trash2, GripVertical } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import Animated, { 
  FadeInDown,
  FadeOutRight
} from 'react-native-reanimated';
import { useAppStore } from '@/store/appStore';

interface PlanExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number; // Number of sets
  reps: Array<{
    reps: number;
    weight?: number;
  }>; // Array of set data with reps and weight
  notes?: string;
  order: number;
}

interface ExerciseFormData {
  sets: number;
  reps: Array<{
    reps: number;
    weight?: number;
  }>;
  notes: string;
}

export default function CreatePlanScreen() {
  const { editPlanId } = useLocalSearchParams<{ editPlanId: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const user = useAppStore(state => state.user);
  
  const [planName, setPlanName] = useState('');
  const [exercises, setExercises] = useState<PlanExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [exerciseForm, setExerciseForm] = useState<ExerciseFormData>({
    sets: 3,
    reps: Array(3).fill(null).map(() => ({ reps: 10, weight: undefined })),
    notes: ''
  });

  useEffect(() => {
    if (editPlanId) {
      loadExistingPlan();
    }
  }, [user?.id]);

  const loadExistingPlan = async () => {
    if (!editPlanId || !user?.id) return;
    
    try {
      const plan = await FirebaseService.getWorkoutPlanById(user.id, editPlanId);
      if (plan) {
        setPlanName(plan.name);
        setExercises(plan.exercises);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout plan');
      router.back();
    }
  };

  const updateSetsCount = (newSets: number) => {
    const currentSetsData = [...exerciseForm.reps];
    if (newSets > currentSetsData.length) {
      // Add new sets with default 10 reps
      for (let i = currentSetsData.length; i < newSets; i++) {
        currentSetsData.push({ reps: 10, weight: undefined });
      }
    } else if (newSets < currentSetsData.length) {
      // Remove excess sets
      currentSetsData.splice(newSets);
    }
    
    setExerciseForm(prev => ({
      ...prev,
      sets: newSets,
      reps: currentSetsData
    }));
  };

  const updateRepsForSet = (setIndex: number, reps: number) => {
    const newSetsData = [...exerciseForm.reps];
    newSetsData[setIndex] = { ...newSetsData[setIndex], reps };
    setExerciseForm(prev => ({ ...prev, reps: newSetsData }));
  };

  const updateWeightForSet = (setIndex: number, weight: number | undefined) => {
    const newSetsData = [...exerciseForm.reps];
    newSetsData[setIndex] = { ...newSetsData[setIndex], weight };
    setExerciseForm(prev => ({ ...prev, reps: newSetsData }));
  };



  const handleSaveExercise = () => {
    if (!selectedExercise) return;

    const newExercise: PlanExercise = {
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      sets: exerciseForm.sets,
      reps: exerciseForm.reps,
      notes: exerciseForm.notes || undefined,
      order: editingExerciseIndex !== null ? editingExerciseIndex : exercises.length
    };

    if (editingExerciseIndex !== null) {
      const updatedExercises = [...exercises];
      updatedExercises[editingExerciseIndex] = newExercise;
      setExercises(updatedExercises);
    } else {
      setExercises(prev => [...prev, newExercise]);
    }

    setShowExerciseForm(false);
    setSelectedExercise(null);
    setEditingExerciseIndex(null);
    setExerciseForm({
      sets: 3,
      reps: Array(3).fill(null).map(() => ({ reps: 10, weight: undefined })),
      notes: ''
    });
  };

  const handleRemoveExercise = (index: number) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updatedExercises = exercises.filter((_, i) => i !== index);
            setExercises(updatedExercises);
          }
        }
      ]
    );
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }
    
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setSaving(true);
      
      const planData = {
        name: planName.trim(),
        exercises: exercises.map((ex, index) => ({ ...ex, order: index })),
        createdAt: new Date().toISOString(),
      };

      if (editPlanId) {
        await FirebaseService.updateWorkoutPlan(user.id, editPlanId, planData);
        Alert.alert('Success', 'Workout plan updated successfully!');
      } else {
        await FirebaseService.addWorkoutPlan(user.id, planData);
        Alert.alert('Success', 'Workout plan created successfully!');
      }
      
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout plan');
    } finally {
      setSaving(false);
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
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90,
    },
    section: {
      padding: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
    },
    planNameInput: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 16,
      fontSize: 16,
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    addExerciseButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 24,
    },
    addExerciseText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    exerciseCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    exerciseDetails: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
    },
    exerciseActions: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    saveButton: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      margin: 24,
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
    },
    closeButton: {
      padding: 4,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    formInput: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 12,
      fontSize: 16,
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    counterContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    counterButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    counterValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      minWidth: 60,
      textAlign: 'center',
    },
    repsContainer: {
      gap: 12,
    },
    setRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 12,
    },
    setLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      minWidth: 60,
      textAlign: getTextAlign(isRTL),
    },
    repsInput: {
      flex: 1,
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 12,
      fontSize: 16,
      color: '#111827',
      textAlign: 'center',
    },
    repsLabel: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      minWidth: 40,
    },
    modalActions: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
    },
    confirmButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: '#22C55E',
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      marginBottom: 12,
    },
    breadcrumb: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    breadcrumbText: {
      fontSize: 14,
      color: '#6B7280',
      marginHorizontal: 8,
    },
    breadcrumbSeparator: {
      fontSize: 14,
      color: '#D1D5DB',
    },
  });

  const renderExerciseForm = () => {
    return (
      <Modal
        visible={showExerciseForm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExerciseForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExerciseIndex !== null ? 'Edit Exercise' : 'Add Exercise'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowExerciseForm(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.exerciseName}>{selectedExercise?.name}</Text>

            {/* Sets */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Number of Sets</Text>
              <View style={styles.counterContainer}>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateSetsCount(Math.max(1, exerciseForm.sets - 1))}
                >
                  <Minus size={20} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.counterValue}>{exerciseForm.sets}</Text>
                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() => updateSetsCount(exerciseForm.sets + 1)}
                >
                  <Plus size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Reps per Set */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reps</Text>
              <View style={styles.repsContainer}>
                {exerciseForm.reps.map((reps, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={styles.setLabel}>{t('exercisesListScreen:sets', 'Set')} {index + 1}</Text>
                    <TextInput
                      style={styles.repsInput}
                      value={reps.toString()}
                      onChangeText={(text) => {
                        const newReps = parseInt(text) || 0;
                        updateRepsForSet(index, newReps);
                      }}
                      keyboardType="numeric"
                      placeholder="10"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.repsLabel}>{t('common:reps', 'reps')}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Weight */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Weight (kg) - Optional</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Enter weight"
                value={exerciseForm.weight}
                onChangeText={(text) => setExerciseForm(prev => ({ ...prev, weight: text }))}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Notes - Optional</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Add notes about this exercise..."
                value={exerciseForm.notes}
                onChangeText={(text) => setExerciseForm(prev => ({ ...prev, notes: text }))}
                multiline={true}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExerciseForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSaveExercise}
              >
                <Text style={styles.confirmButtonText}>
                  {editingExerciseIndex !== null ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
          <Text style={styles.headerTitle}>
            Edit Workout Plan
          </Text>
          <Text style={styles.headerSubtitle}>
            Modify your workout routine
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {/* Plan Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Name</Text>
            <TextInput
              style={styles.planNameInput}
              placeholder="Enter workout plan name"
              value={planName}
              onChangeText={setPlanName}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Exercises List */}
          {exercises.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
              {exercises.map((exercise, index) => (
                <Animated.View
                  key={`${exercise.exerciseId}-${index}`}
                  entering={FadeInDown.delay(index * 100)}
                  exiting={FadeOutRight}
                >
                  <View style={styles.exerciseCard}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                      <Text style={styles.exerciseDetails}>
                        {exercise.sets} sets × {Array.isArray(exercise.reps) 
                          ? exercise.reps.map(setData => 
                              typeof setData === 'object' 
                                ? `${setData.reps}${setData.weight ? `@${setData.weight}kg` : ''}` 
                                : setData
                            ).join(', ')
                          : exercise.reps} reps
                      </Text>
                    </View>
                    
                    <View style={styles.exerciseActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          // TODO: Implement inline editing or navigate to edit form
                          Alert.alert('Edit Exercise', 'Exercise editing will be implemented');
                        }}
                      >
                        <Edit3 size={16} color="#6B7280" />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleRemoveExercise(index)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSavePlan}
        disabled={saving}
      >
        <Save size={20} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Update Plan'}
        </Text>
      </TouchableOpacity>

      {renderExerciseForm()}
    </SafeAreaView>
  );
}