import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Crown, Lock } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import { ExerciseListItem } from '@/components/ExerciseListItem';
import { useAuth } from '@/hooks/useAuth';
import { AddExerciseSetsRepsModal } from '@/components/AddExerciseSetsRepsModal';
import { ChoosePlanActionModal } from '@/components/ChoosePlanActionModal';
import { SelectWorkoutPlanModal } from '@/components/SelectWorkoutPlanModal';
import { usePurchases } from '@/hooks/usePurchases';
import { CustomPaywall } from '@/components/CustomPaywall';

export default function ExercisesListScreen() {
  const { categoryId, subcategoryId, subcategoryName, targetPlanId } = useLocalSearchParams<{
    categoryId: string;
    subcategoryId: string;
    subcategoryName: string;
    targetPlanId?: string;
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();
  const { hasPremium } = usePurchases();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  
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
          setExercises(cleanedExercises);

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
    // Check premium access first
    if (!hasPremium) {
      setShowPaywall(true);
      return;
    }

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
    const exercise = exercises.find(ex => ex.id === exerciseId);

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
        targetPlanId: targetPlanId,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFD700',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginTop: 8,
    },
    premiumBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#333',
      marginLeft: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    // Premium Feature Gate
    premiumGate: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginHorizontal: 24,
      marginTop: 20,
      marginBottom: 24,
      borderWidth: 2,
      borderColor: '#3B82F6',
      alignItems: 'center',
    },
    premiumGateIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    premiumGateTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    premiumGateDescription: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    premiumGateButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      paddingHorizontal: 32,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    premiumGateButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    // Free user overlay for exercises
    exerciseOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      zIndex: 10,
    },
    overlayContent: {
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    overlayIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    overlayTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    overlayDescription: {
      fontSize: 14,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  // Show premium gate if user is not premium
  const showPremiumGate = !hasPremium && exercises.length > 3; // Show after 3 free exercises

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
          {hasPremium && (
            <View style={styles.premiumBadge}>
              <Crown size={16} color="#333" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
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
              <Text style={{ color: '#6B7280', marginTop: 10, fontFamily: useKurdishFont ? 'rudawregular2' : undefined }}>
                {t('common:loading')}
              </Text>
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
            <>
              <View style={styles.exercisesList}>
                {exercises.map((exercise, index) => {
                  const isFreeExercise = index < 3; // First 3 exercises are free
                  const showOverlay = !hasPremium && !isFreeExercise;

                  return (
                    <View key={exercise.id} style={{ position: 'relative' }}>
                      <ExerciseListItem
                        exercise={exercise}
                        onAddPress={handleAddExerciseToPlan}
                        onDetailPress={handleExerciseDetailPress}
                        disabled={showOverlay}
                      />
                      {showOverlay && (
                        <TouchableOpacity 
                          style={styles.exerciseOverlay}
                          onPress={() => setShowPaywall(true)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.overlayContent}>
                            <View style={styles.overlayIcon}>
                              <Lock size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.overlayTitle}>
                              {t('exercisesListScreen:premiumRequired')}
                            </Text>
                            <Text style={styles.overlayDescription}>
                              {t('exercisesListScreen:unlockAllExercises')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Premium Gate at bottom for non-premium users */}
              {showPremiumGate && (
                <View style={styles.premiumGate}>
                  <View style={styles.premiumGateIcon}>
                    <Crown size={40} color="#FFFFFF" />
                  </View>
                  <Text style={styles.premiumGateTitle}>
                    {t('exercisesListScreen:unlockAllExercises')}
                  </Text>
                  <Text style={styles.premiumGateDescription}>
                    {t('exercisesListScreen:premiumExercisesBenefits')}
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumGateButton}
                    onPress={() => setShowPaywall(true)}
                  >
                    <Crown size={20} color="#FFFFFF" />
                    <Text style={styles.premiumGateButtonText}>
                      {t('exercisesListScreen:upgradeToPremium')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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

      {/* Custom Paywall Modal */}
      <CustomPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}