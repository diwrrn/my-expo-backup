import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import { ExerciseListItem } from '@/components/ExerciseListItem';
import { useAuth } from '@/hooks/useAuth';
import { AddExerciseSetsRepsModal } from '@/components/AddExerciseSetsRepsModal';
import { ChoosePlanActionModal } from '@/components/ChoosePlanActionModal';
import { SelectWorkoutPlanModal } from '@/components/SelectWorkoutPlanModal';

export default function ExercisesListScreen() {
  const { categoryId, subcategoryId, subcategoryName, targetPlanId } = useLocalSearchParams<{
    categoryId: string;
    subcategoryId: string;
    subcategoryName: string;
    targetPlanId?: string;
  }>();
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states for the new flow
  const [showSetsRepsModal, setShowSetsRepsModal] = useState(false);
  const [showChoosePlanActionModal, setShowChoosePlanActionModal] = useState(false);
  const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseDataForPlan, setExerciseDataForPlan] = useState<any>(null);

  useEffect(() => {
  if (categoryId && subcategoryId) {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedExercises = await FirebaseService.getExercises(categoryId, subcategoryId);

        // Clean the fetched data to ensure string properties are never 'undefined' literal
        const cleanedExercises = fetchedExercises.map(ex => ({
          ...ex,
          id: ex.id || '', // Ensure ID is a string, not 'undefined' literal
          name: ex.name || '',
          nameKurdish: ex.nameKurdish || '',
          nameArabic: ex.nameArabic || '',
        }));
        setExercises(cleanedExercises); // <--- MODIFIED LINE

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load exercises');
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }
}, [categoryId, subcategoryId]);

  const handleAddExerciseToPlan = async (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    
    if (!exercise) {
      Alert.alert('Error', 'Exercise not found');
      return;
    }

    if (targetPlanId && exercise && user?.id) {
      // If we have a target plan, open sets/reps modal first
      setSelectedExercise(exercise);
      setShowSetsRepsModal(true);
    } else {
      // No target plan, open sets/reps modal then show plan selection
      setSelectedExercise(exercise);
      setShowSetsRepsModal(true);
    }
  };

  const handleSetsRepsConfirm = (data: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }>;
    notes?: string;
  }) => {
    setExerciseDataForPlan(data);
    setShowSetsRepsModal(false);
    
    if (targetPlanId) {
      // If we have a target plan, add directly to it
      handleAddToTargetPlan(data);
    } else {
      // Otherwise, show the choose action modal
      setShowChoosePlanActionModal(true);
    }
  };

  const handleChoosePlanAction = (action: 'add_to_existing' | 'create_new') => {
    setShowChoosePlanActionModal(false);

    if (action === 'add_to_existing') {
      setShowSelectPlanModal(true);
    } else if (action === 'create_new') {
      router.push({
        pathname: '/(tabs)/workout/create-plan-name',
        params: {
          initialExerciseData: JSON.stringify(exerciseDataForPlan),
        },
      });
    }
  };

  const handleAddToTargetPlan = async (data: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{
      reps: number;
      weight?: number;
    }>;
    notes?: string;
  }) => {
    if (!user || !targetPlanId) {
      Alert.alert('Error', 'User not authenticated or target plan not found');
      return;
    }

    try {
      await FirebaseService.addExerciseToWorkoutPlan(user.id, targetPlanId, {
        exerciseId: data.exerciseId,
        exerciseName: data.exerciseName,
        sets: data.sets,
        reps: data.reps,
        ...(data.notes !== undefined && { notes: data.notes }),
        order: 0
      });

      Alert.alert(
        'Exercise Added!',
        `${data.exerciseName} has been added to your workout plan.`,
        [
          { text: 'Add More', style: 'default' },
          { 
            text: 'Go to Plan', 
            onPress: () => router.replace({
              pathname: '/(tabs)/workout/plan-details',
              params: { planId: targetPlanId }
            })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add exercise to plan');
    }
  };

  const handleExerciseDetailPress = (exerciseId: string) => {
      const exercise = exercises.find(ex => ex.id === exerciseId); // <--- ADD THIS LINE

          console.log('Navigating to exercise detail with:');
  console.log('exerciseId:', exerciseId);
  console.log('categoryId:', categoryId);
  console.log('subcategoryId:', subcategoryId);

   router.push({
    pathname: '/(tabs)/workout/exercise-detail',
    params: {
      exerciseId,
      categoryId,
      subcategoryId,
      targetPlanId: targetPlanId, // Pass the parameter here
      // Pass exercise details for pre-population if needed
      exerciseName: exercise?.name || '',
      exerciseNameKurdish: exercise?.nameKurdish || '',
      exerciseNameArabic: exercise?.nameArabic || '',
    }
  });
};

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
      paddingTop: 40,
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
    exercisesList: {
      padding: 24,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 24,
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
      minHeight: 200,
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{subcategoryName}</Text>
          <Text style={styles.headerSubtitle}>{t('exercisesListScreen:headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
            </View>
          ) : exercises.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('exercisesListScreen:noExercises')}</Text>
            </View>
          ) : (
            <View style={styles.exercisesList}>
              {exercises.map((exercise) => (
                <ExerciseListItem
                  key={exercise.id}
                  exercise={exercise}
                  onAddPress={handleAddExerciseToPlan}
                  onDetailPress={handleExerciseDetailPress}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Exercise Sets/Reps Modal */}
      {selectedExercise && (
        <AddExerciseSetsRepsModal
          isVisible={showSetsRepsModal}
          onClose={() => {
            setShowSetsRepsModal(false);
            setSelectedExercise(null);
          }}
          exercise={selectedExercise}
          onConfirm={handleSetsRepsConfirm}
        />
      )}

      {/* Choose Plan Action Modal */}
      {exerciseDataForPlan && (
        <ChoosePlanActionModal
          isVisible={showChoosePlanActionModal}
          onClose={() => {
            setShowChoosePlanActionModal(false);
            setExerciseDataForPlan(null);
          }}
          onSelectAction={handleChoosePlanAction}
        />
      )}

      {/* Select Workout Plan Modal */}
      {exerciseDataForPlan && (
        <SelectWorkoutPlanModal
          isVisible={showSelectPlanModal}
          onClose={() => {
            setShowSelectPlanModal(false);
            setExerciseDataForPlan(null);
          }}
          exerciseDetails={exerciseDataForPlan}
        />
      )}
    </SafeAreaView>
  );
}