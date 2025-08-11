import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Dumbbell, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';

interface WorkoutPlan {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    notes?: string;
    order: number;
  }>;
}

interface SelectWorkoutPlanModalProps {
  isVisible: boolean;
  onClose: () => void;
  exerciseDetails: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }>;
    notes?: string;
  };
}

export function SelectWorkoutPlanModal({
  isVisible,
  onClose,
  exerciseDetails,
}: SelectWorkoutPlanModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();

  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);

  useEffect(() => {
    if (isVisible && user?.id) {
      loadWorkoutPlans();
    }
  }, [isVisible, user?.id]);

  const loadWorkoutPlans = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const plans = await FirebaseService.getWorkoutPlans(user.id);
      setWorkoutPlans(plans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user?.id) {
      Alert.alert(t('common:error'), 'User not authenticated.');
      return;
    }

    try {
      setAddingExercise(true);
      await FirebaseService.addExerciseToWorkoutPlan(user.id, planId, {
        exerciseId: exerciseDetails.exerciseId,
        exerciseName: exerciseDetails.exerciseName,
        sets: exerciseDetails.sets,
        reps: exerciseDetails.reps,
        ...(exerciseDetails.notes !== undefined && { notes: exerciseDetails.notes }),
        order: 0, // Order will be handled by FirebaseService
      });

      Alert.alert(
        t('common:success'),
        `${exerciseDetails.exerciseName} added to workout plan successfully!`,
        [{ text: t('common:ok'), onPress: onClose }]
      );
    } catch (err) {
      Alert.alert(t('common:error'), 'Failed to add exercise to plan.');
      console.error('Error adding exercise to plan:', err);
    } finally {
      setAddingExercise(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
      backgroundColor: '#F9FAFB',
      borderRadius: 16,
      flex: 1, // Make it take full height
      // width: '90%', // Remove this
      // maxHeight: '80%', // Remove this
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      backgroundColor: '#FFFFFF',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    closeButton: {
      padding: 4,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 150,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 150,
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 150,
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
    planCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    planStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    statItem: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    statText: {
      fontSize: 12,
      color: '#6B7280',
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
    },
    selectButton: {
      backgroundColor: '#22C55E',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginLeft: isRTL ? 0 : 16,
      marginRight: isRTL ? 16 : 0,
    },
    selectButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    selectButtonDisabled: {
      opacity: 0.6,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('exercisesListScreen:addToWorkoutPlan')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
                <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
              </View>
            ) : workoutPlans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('workoutScreen:noWorkoutPlansYet')}</Text>
                <Text style={styles.emptyText}>{t('workoutScreen:createYour')}</Text>
              </View>
            ) : (
              workoutPlans.map((plan) => (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => handleSelectPlan(plan.id)}
                  disabled={addingExercise}
                >
                  <View style={styles.planInfo}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planStats}>
                      <View style={styles.statItem}>
                        <Dumbbell size={14} color="#6B7280" />
                        <Text style={styles.statText}>
                          {plan.exercises.length} {t('workoutScreen:exercises')}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Calendar size={14} color="#6B7280" />
                        <Text style={styles.statText}>
                          {t('workoutScreen:created')} {formatDate(plan.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.selectButton, addingExercise && styles.selectButtonDisabled]}
                    onPress={() => handleSelectPlan(plan.id)}
                    disabled={addingExercise}
                  >
                    <Text style={styles.selectButtonText}>
                      {addingExercise ? t('common:adding') : t('common:add')}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}