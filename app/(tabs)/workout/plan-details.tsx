import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, LocationEdit as Edit3, Play, Dumbbell, Clock, Target, Plus, Trash2, X } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection, getMargin } from '@/hooks/useRTL';
import { EditExerciseSetsRepsModal } from '@/components/EditExerciseSetsRepsModal';

import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface WorkoutPlan {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }> | number; // Support both old and new format
    notes?: string;
    order: number;
  }>;
}

export default function PlanDetailsScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();
  
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<any>(null);
  const [showEditExerciseModal, setShowEditExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);

  useEffect(() => {
    if (planId && user?.id) {
      loadWorkoutPlan();
    }
  }, [planId, user?.id]);

 const loadWorkoutPlan = async () => {
  if (!planId || !user?.id) return;

  try {
    setLoading(true);
    setError(null);
    const plan = await FirebaseService.getWorkoutPlanById(user.id, planId);
    
    console.log('🔍 PlanDetails: Fetched workout plan:', plan); // ADD THIS LINE
    if (plan && plan.exercises) {
      console.log('🔍 PlanDetails: Exercises in plan:', plan.exercises); // ADD THIS LINE
      // Log details of the first exercise to check structure
      if (plan.exercises.length > 0) {
        console.log('🔍 PlanDetails: First exercise details:', plan.exercises[0]); // ADD THIS LINE
      }
    }
    
    setWorkoutPlan(plan);
  } catch (err) {
    console.error('Error loading workout plan:', err);
    setError('Failed to load workout plan');
  } finally {
    setLoading(false);
  }
 };

  const handleStartWorkout = () => {
    if (!workoutPlan) return;
    
    router.push({
      pathname: '/(tabs)/workout/session',
      params: { 
        planId: workoutPlan.id,
        planName: workoutPlan.name
      }
    });
  };

  const handleEditPlan = () => {
    if (!workoutPlan) return;
    
    router.push({
      pathname: '/(tabs)/workout/create-plan',
      params: { editPlanId: workoutPlan.id }
    });
  };

  const handleAddExercises = () => {
    if (!workoutPlan) return;
    
    router.push({
      pathname: '/(tabs)/workout',
      params: { targetPlanId: workoutPlan.id }
    });
  }; 

  const handleLongPressExercise = (exercise: any, exerciseIndex: number) => {
    setExerciseToDelete({ ...exercise, index: exerciseIndex });
    setShowDeleteModal(true);
  };

    const handleDeleteExercise = async () => {
    if (!exerciseToDelete || !workoutPlan || !user) return;

       try {
      // Optimistic UI update: Immediately remove the exercise from local state
      const originalExercises = workoutPlan.exercises; // Save current state for potential rollback
      const updatedExercises = workoutPlan.exercises.filter((_, index) => index !== exerciseToDelete.index);
      setWorkoutPlan({
        ...workoutPlan,
        exercises: updatedExercises
      });
      
      // Close the modal immediately
      setShowDeleteModal(false);
      setExerciseToDelete(null);

      // Remove exercise from Firebase in the background
      await FirebaseService.removeExerciseFromWorkoutPlan(user.id, workoutPlan.id, exerciseToDelete.exerciseId);
      
    } catch (error) {
      // Rollback UI if Firebase operation fails
      setWorkoutPlan({ ...workoutPlan, exercises: originalExercises });
      console.error('Error deleting exercise:', error);
      Alert.alert('Error', 'Failed to remove exercise from plan');
    }

  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setExerciseToDelete(null);
  };

  const handleEditExercise = (exercise: any, index: number) => {
    // Ensure reps is an array of objects for the modal
    const formattedReps = Array.isArray(exercise.reps) && typeof exercise.reps[0] === 'object'
      ? exercise.reps
      : Array(exercise.sets).fill(null).map(() => ({ reps: exercise.reps, weight: exercise.weight }));

    setEditingExercise({
      ...exercise,
      id: exercise.exerciseId,
      name: exercise.exerciseName,
      sets: exercise.sets,
      reps: formattedReps,
      notes: exercise.notes || '',
      originalIndex: index
    });
    setShowEditExerciseModal(true);
  };

  const handleUpdateExercise = async (updatedData: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }>;
    notes?: string;
  }) => {
    if (!workoutPlan || !user) {
      Alert.alert('Error', 'Workout plan or user not found.');
      return;
    }

    try {
      // Optimistic UI update
      const updatedExercises = workoutPlan.exercises.map((ex, idx) => {
        if (idx === editingExercise.originalIndex) {
          return {
            ...ex,
            sets: updatedData.sets,
            reps: updatedData.reps,
            notes: updatedData.notes,
            exerciseName: updatedData.exerciseName,
          };
        }
        return ex;
      });

      setWorkoutPlan({
        ...workoutPlan,
        exercises: updatedExercises
      });

      // Close modal immediately
      setShowEditExerciseModal(false);
      setEditingExercise(null);

      // Update in Firebase in the background
      await FirebaseService.updateExerciseInWorkoutPlan(
        user.id,
        workoutPlan.id,
        updatedData.exerciseId,
        {
          sets: updatedData.sets,
          reps: updatedData.reps,
          notes: updatedData.notes,
          exerciseName: updatedData.exerciseName,
        }
      );

    } catch (error) {
      console.error('Error updating exercise:', error);
      Alert.alert('Error', 'Failed to update exercise.');
      // Optionally revert optimistic update here
    }
  };

  const calculateTotalTime = () => {
    if (!workoutPlan) return 0;
    
    // Estimate: 45 seconds per set + 60 seconds rest between sets + 2 minutes between exercises
    const totalSets = workoutPlan.exercises.reduce((sum, ex) => sum + ex.sets, 0);
    const totalExercises = workoutPlan.exercises.length;
    
    const workTime = totalSets * 45; // 45 seconds per set
    const restTime = (totalSets - totalExercises) * 60; // 60 seconds rest between sets (not after last set of each exercise)
    const exerciseTransitions = (totalExercises - 1) * 120; // 2 minutes between exercises
    
    return Math.round((workTime + restTime + exerciseTransitions) / 60); // Return in minutes
  };

  const getExerciseImage = (exerciseName: string): string => {
    // Simple mapping for exercise images - you can expand this
    const imageMap: Record<string, string> = {
      'squat': 'https://images.pexels.com/photos/703012/pexels-photo-703012.jpeg?auto=compress&cs=tinysrgb&w=300',
      'deadlift': 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=300',
      'bench': 'https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=300',
      'pull': 'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=300',
      'push': 'https://images.pexels.com/photos/1552103/pexels-photo-1552103.jpeg?auto=compress&cs=tinysrgb&w=300',
    };

    const lowerName = exerciseName.toLowerCase();
    for (const [key, image] of Object.entries(imageMap)) {
      if (lowerName.includes(key)) {
        return image;
      }
    }

    return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=300';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
      exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
    },
    headerGradient: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
      padding: 24,
      paddingTop: 60,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    headerMeta: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    metaItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    metaText: {
      fontSize: 14,
      color: '#6B7280',
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
    },
    editButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 120,
    },
    statsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#22C55E',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: 'center',
    },
    exercisesSection: {
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
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
    exerciseImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
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
      marginBottom: 2,
      textAlign: getTextAlign(isRTL),
    },
    exerciseNotes: {
      fontSize: 12,
      color: '#9CA3AF',
      fontStyle: 'italic',
      textAlign: getTextAlign(isRTL),
    },
       exerciseOrder: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      ...getMargin(isRTL, 'end', 12), // Add space based on RTL/LTR direction
      gap: 8,
    },


    exerciseOrderText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#6B7280',
    },
    addExercisesButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 24,
      marginBottom: 16,
      borderWidth: 2,
      borderColor: '#22C55E',
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: getFlexDirection(isRTL),
    },
    addExercisesText: {
      color: '#22C55E',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    bottomActionsContainer: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      gap: 12,
    }, 
    smallActionButton: { // Renamed from actionButton
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      // The margin for these small buttons is now handled by their parent container (exerciseActions)
    },
    largeActionButton: { // New style for larger buttons
      flex: 1, // Allows the button to expand and fill available space
      // Other common styles for large buttons can go here if needed
    },
    actionButtonGradient: { 
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 8,
      borderRadius: 8, 
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    deleteButton: {
      backgroundColor: '#FEF2F2',
    },
    deleteModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    deleteModalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    deleteModalHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    deleteModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    deleteModalCloseButton: {
      padding: 4,
    },
    deleteModalExerciseName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#EF4444',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
    },
    deleteModalMessage: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 24,
      textAlign: getTextAlign(isRTL),
    },
    deleteModalActions: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'flex-end',
      gap: 12,
    },
    deleteModalCancelButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    deleteModalCancelText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#6B7280',
    },
    deleteModalConfirmButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: '#EF4444',
    },
    deleteModalConfirmText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    fab: {
      position: 'absolute',
      bottom: 100,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workoutPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Workout plan not found'}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSets = workoutPlan.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedTime = calculateTotalTime();

  return (
    <>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#F0FDF4', '#F9FAFB']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            {isRTL ? (
              <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={24} color="#111827" />
            )}
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{workoutPlan.name}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaItem}>
                <Dumbbell size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  {workoutPlan.exercises.length} {t("workoutScreen:exercises")}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.metaText}>
                  ~{estimatedTime} min
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.editButton} onPress={handleEditPlan}>
            <Edit3 size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workoutPlan.exercises.length}</Text>
              <Text style={styles.statLabel}>{t('workoutScreen:exercises')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSets}</Text>
              <Text style={styles.statLabel}>{t('workoutScreen:TotalSets')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{estimatedTime}</Text>
              <Text style={styles.statLabel}>{t('workoutScreen:eTime')}</Text>
            </View>
          </View>

          {/* Exercises List */}
          <View style={styles.exercisesSection}>
            <Text style={styles.sectionTitle}>{t('workoutScreen:exercises')}</Text>
            
            
            
{workoutPlan.exercises
  .sort((a, b) => a.order - b.order)
  .map((exercise, index) => (
    <Animated.View
      key={exercise.exerciseId}
      entering={FadeInDown.delay(index * 100)}
    >
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => router.push({
          pathname: '/(tabs)/workout/exercise-detail',
          params: {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            exerciseNameKurdish: exercise.nameKurdish || '',
            exerciseNameArabic: exercise.nameArabic || '',
          }
        })}
        onLongPress={() => handleLongPressExercise(exercise, index)}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseOrder}>
          <Text style={styles.exerciseOrderText}>{index + 1}</Text>
        </View>


        <View
          style={styles.exerciseInfo}
        >
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
          {exercise.notes && (
            <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
          )}
        </View>
        
         <View style={styles.exerciseActions}>
          <TouchableOpacity 
            style={styles.smallActionButton}
            onPress={() => handleEditExercise(exercise, index)}
          >
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
      </TouchableOpacity>
    </Animated.View>
  ))}

          {/* Add Exercises Button - moved to end of exercises list */}
          <TouchableOpacity
            style={styles.addExercisesButton}
            onPress={handleAddExercises}
          >
            <Plus size={20} color="#22C55E" />
            <Text style={styles.addExercisesText}>{t('workoutScreen:addExercises')}</Text>
          </TouchableOpacity>
          </View>

        {/* Bottom Actions Container - Start Workout and Show History buttons */}
        <View style={[styles.bottomActionsContainer, { flexDirection: getFlexDirection(isRTL) }]}>
          <TouchableOpacity
            style={[styles.largeActionButton, styles.startWorkoutButton]}
            onPress={handleStartWorkout}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.actionButtonGradient}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('workoutScreen:startWorkout')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.largeActionButton, styles.showHistoryButton]}
            onPress={() => router.push({
              pathname: '/(tabs)/workout/history',
              params: { planId: workoutPlan.id, planName: workoutPlan.name }
            })}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.actionButtonGradient}
            >
              <Clock size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('workoutScreen:showHistory')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>

      {/* Delete Exercise Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalHeader}>
              <Text style={styles.deleteModalTitle}>Delete Exercise</Text>
              <TouchableOpacity 
                style={styles.deleteModalCloseButton}
                onPress={handleCancelDelete}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {exerciseToDelete && (
              <>
                <Text style={styles.deleteModalExerciseName}>
                  {exerciseToDelete.exerciseName}
                </Text>
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to remove this exercise from your workout plan? This action cannot be undone.
                </Text>
              </>
            )}
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity 
                style={styles.deleteModalCancelButton}
                onPress={handleCancelDelete}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteModalConfirmButton}
                onPress={handleDeleteExercise}
              >
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

        {/* Edit Exercise Sets/Reps Modal */}
        {editingExercise && (
          <EditExerciseSetsRepsModal
            isVisible={showEditExerciseModal}
            onClose={() => {
              setShowEditExerciseModal(false);
              setEditingExercise(null);
            }}
            exercise={editingExercise}
            onUpdate={handleUpdateExercise}
          />
        )}
      </>
  );
}