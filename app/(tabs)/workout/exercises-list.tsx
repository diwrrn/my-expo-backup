import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Crown, Lock, Plus, Info, Dumbbell, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useWorkoutCache } from '@/hooks/useWorkoutCache';
import { ExerciseListItem } from '@/components/ExerciseListItem';  
import { useAuth } from '@/hooks/useAuth';
import { AddExerciseSetsRepsModal } from '@/components/AddExerciseSetsRepsModal';
import { ChoosePlanActionModal } from '@/components/ChoosePlanActionModal';
import { SelectWorkoutPlanModal } from '@/components/SelectWorkoutPlanModal';
import { CustomPaywall } from '@/components/CustomPaywall';
import { FirebaseService } from '@/services/firebaseService'; 
import { useAppStore } from '@/store/appStore';
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
  const { hasPremium } = useAppStore();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  
  const { exercises, exercisesLoading, exercisesError, loadExercises } = useWorkoutCache();
  
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSetsRepsModal, setShowSetsRepsModal] = useState(false);
  const [showChoosePlanActionModal, setShowChoosePlanActionModal] = useState(false);
  const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseDataForPlan, setExerciseDataForPlan] = useState<any>(null);

  useEffect(() => {
    if (categoryId && subcategoryId) {
      loadExercises(categoryId, subcategoryId);
    }
  }, [categoryId, subcategoryId]);

  const handleAddExerciseToPlan = async (exerciseId: string) => {
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
      setSelectedExercise(exercise);
      setShowSetsRepsModal(true);
    } else {
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
      handleAddToTargetPlan(data);
    } else {
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

    router.push({
      pathname: '/(tabs)/workout/exercise-detail',
      params: {
        exerciseId,
        categoryId,
        subcategoryId,
        targetPlanId: targetPlanId,
        exerciseName: exercise?.name || '',
        exerciseNameKurdish: exercise?.nameKurdish || '',
        exerciseNameArabic: exercise?.nameArabic || '',
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },
    
    // Header Styles
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 28,
    },
    headerStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginTop: 8,
    },
    exerciseCount: {
      fontSize: 15,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    premiumBadge: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    premiumBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#92400E',
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Content Styles
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    exercisesList: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    // Exercise Item Styles (New Clean Design)
    exerciseItem: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#F0F0F0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1,
      overflow: 'hidden',
    },
    exerciseContent: {
      flexDirection: getFlexDirection(isRTL),
      padding: 16,
      alignItems: 'center',
    },
    exerciseImageContainer: {
      width: 60,
      height: 60,
      borderRadius: 10,
      backgroundColor: '#F8FAFC',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    exerciseImage: {
      width: 60,
      height: 60,
      borderRadius: 10,
    },
    exerciseInfoContainer: {
      flex: 1,
      paddingRight: isRTL ? 0 : 12,
      paddingLeft: isRTL ? 12 : 0,
    },
    exerciseTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 4,
      lineHeight: 20,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    exerciseDesc: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 18,
      marginBottom: 6,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    exerciseMetaRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
    },
    difficultyBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: '#F0FDF4',
      borderWidth: 1,
      borderColor: '#BBF7D0',
    },
    difficultyBadgeIntermediate: {
      backgroundColor: '#FFFBEB',
      borderColor: '#FDE68A',
    },
    difficultyBadgeAdvanced: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
    },
    difficultyBadgeText: {
      fontSize: 11,
      fontWeight: '500',
      color: '#16A34A',
      textTransform: 'capitalize',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    difficultyBadgeTextIntermediate: {
      color: '#D97706',
    },
    difficultyBadgeTextAdvanced: {
      color: '#DC2626',
    },
    muscleGroupText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '400',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    exerciseActions: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      gap: 8,
    },
    exerciseActionButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exerciseDetailButton: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    exerciseAddButton: {
      backgroundColor: '#22C55E',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    exerciseButtonDisabled: {
      opacity: 0.5,
    },

    // Inline Free Badge
    freeBadgeInline: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: '#22C55E',
    },
    freeBadgeInlineText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    
    // Loading & Error States
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: 300,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: 16,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 24,
    },
    emptyText: {
      fontSize: 18,
      color: '#9CA3AF',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 26,
    },
    emptySubtext: {
      fontSize: 15,
      color: '#D1D5DB',
      textAlign: 'center',
      marginTop: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Premium Overlay
    exerciseOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
      zIndex: 10,
    },
    overlayContent: {
      alignItems: 'center',
      paddingHorizontal: 24,
      flexDirection: getFlexDirection(isRTL),
      gap: 12,
    },
    overlayIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    overlayTextContainer: {
      flex: 1,
      alignItems: getTextAlign(isRTL) === 'right' ? 'flex-end' : 'flex-start',
    },
    overlayTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    overlayDescription: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 20,
      textAlign: getTextAlign(isRTL),
    },

    // Premium CTA Section
    premiumSection: {
      backgroundColor: '#FFFFFF',
      marginHorizontal: 16,
      marginTop: 20,
      marginBottom: 24,
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    premiumHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    premiumIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    premiumTextContainer: {
      flex: 1,
    },
    premiumTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    premiumSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    premiumFeatures: {
      marginBottom: 20,
    },
    premiumFeature: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 8,
    },
    featureIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    featureText: {
      fontSize: 15,
      color: '#374151',
      flex: 1,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: getTextAlign(isRTL),
    },
    premiumButton: {
      backgroundColor: '#F59E0B',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    premiumButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Free exercises indicator
    freeLabel: {
      position: 'absolute',
      top: 12,
      right: isRTL ? undefined : 12,
      left: isRTL ? 12 : undefined,
      backgroundColor: '#22C55E',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      zIndex: 5,
    },
    freeLabelText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  // Premium features list
  const premiumFeatures = [
    t('exercisesListScreen:unlimitedExercises'),
    t('exercisesListScreen:detailedInstructions'),
    t('exercisesListScreen:videoGuides'),
    t('exercisesListScreen:customWorkouts'),
  ];

  const freeExerciseLimit = 1;
  const showPremiumSection = !hasPremium && exercises.length > freeExerciseLimit;

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            {isRTL ? (
              <ArrowLeft size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="#374151" />
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{subcategoryName}</Text>
          </View>
        </View>
        
        <View style={styles.headerStats}>
          <Text style={styles.exerciseCount}>
            {exercises.length} {exercises.length === 1 ? t('common:exercise') : t('common:exercises')}
          </Text>
          {hasPremium && (
            <View style={styles.premiumBadge}>
              <Crown size={14} color="#92400E" />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {exercisesLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>{t('common:loading')}</Text>
          </View>
        ) : exercisesError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              {t('common:errorLoadingExercises')}
            </Text>
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{t('exercisesListScreen:noExercises')}</Text>
            <Text style={styles.emptySubtext}>{t('exercisesListScreen:tryDifferentCategory')}</Text>
          </View>
        ) : (
          <>
            {/* Exercise List */}
            <View style={styles.exercisesList}>
              {exercises.map((exercise, index) => {
                const isFreeExercise = index < freeExerciseLimit;
                const showOverlay = !hasPremium && !isFreeExercise;

                // Get difficulty styling
                const getDifficultyStyle = (difficulty) => {
                  switch (difficulty?.toLowerCase()) {
                    case 'intermediate':
                      return { 
                        badge: styles.difficultyBadgeIntermediate, 
                        text: styles.difficultyBadgeTextIntermediate 
                      };
                    case 'advanced':
                      return { 
                        badge: styles.difficultyBadgeAdvanced, 
                        text: styles.difficultyBadgeTextAdvanced 
                      };
                    default:
                      return { badge: {}, text: {} };
                  }
                };

                const difficultyStyle = getDifficultyStyle(exercise.difficulty);

                return (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    {/* New Clean Exercise Item Design */}
                    <View style={styles.exerciseContent}>
                        {/* Exercise Image */}
                        <View style={styles.exerciseImageContainer}>
                          <Dumbbell size={24} color="#9CA3AF" />
                        </View>
                      {/* Exercise Information */}
                      <View style={styles.exerciseInfoContainer}>
                        <Text style={styles.exerciseTitle} numberOfLines={2}>
                          {exercise.name || 'Exercise Name'}
                        </Text>
                        
                        {exercise.description && (
                          <Text style={styles.exerciseDesc} numberOfLines={1}>
                            {exercise.description}
                          </Text>
                        )}

                        <View style={styles.exerciseMetaRow}>
                          {exercise.difficulty && (
                            <View style={[styles.difficultyBadge, difficultyStyle.badge]}>
                              <Text style={[styles.difficultyBadgeText, difficultyStyle.text]}>
                                {exercise.difficulty}
                              </Text>
                            </View>
                          )}

                          {!hasPremium && isFreeExercise && (
                            <View style={styles.freeBadgeInline}>
                              <Text style={styles.freeBadgeInlineText}>FREE</Text>
                            </View>
                          )}
                          
                          {exercise.targetMuscles && exercise.targetMuscles.length > 0 && (
                            <Text style={styles.muscleGroupText}>
                              {exercise.targetMuscles.slice(0, 2).join(', ')}
                              {exercise.targetMuscles.length > 2 && ` +${exercise.targetMuscles.length - 2}`}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.exerciseActions}>
                        <TouchableOpacity
                          style={[
                            styles.exerciseActionButton, 
                            styles.exerciseDetailButton, 
                            showOverlay && styles.exerciseButtonDisabled
                          ]}
                          onPress={() => !showOverlay && handleExerciseDetailPress(exercise.id)}
                          disabled={showOverlay}
                          activeOpacity={0.7}
                        >
                          <ChevronRight size={18} color="#6B7280" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.exerciseActionButton, 
                            styles.exerciseAddButton, 
                            showOverlay && styles.exerciseButtonDisabled
                          ]}
                          onPress={() => !showOverlay && handleAddExerciseToPlan(exercise.id)}
                          disabled={showOverlay}
                          activeOpacity={0.8}
                        >
                          <Plus size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {showOverlay && (
                      <TouchableOpacity 
                        style={styles.exerciseOverlay}
                        onPress={() => setShowPaywall(true)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.overlayContent}>
                          <View style={styles.overlayIcon}>
                            <Lock size={20} color="#F59E0B" />
                          </View>
                          <View style={styles.overlayTextContainer}>
                            <Text style={styles.overlayTitle}>Premium Required</Text>
                            <Text style={styles.overlayDescription}>
                              Upgrade to access all exercises
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Premium CTA Section */}
            {showPremiumSection && (
              <View style={styles.premiumSection}>
                <View style={styles.premiumHeader}>
                  <View style={styles.premiumIconContainer}>
                    <Crown size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Unlock All Exercises</Text>
                    <Text style={styles.premiumSubtitle}>
                      Get access to {exercises.length - freeExerciseLimit}+ more exercises
                    </Text>
                  </View>
                </View>

                <View style={styles.premiumFeatures}>
                  {premiumFeatures.map((feature, index) => (
                    <View key={index} style={styles.premiumFeature}>
                      <View style={styles.featureIcon}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.premiumButton}
                  onPress={() => setShowPaywall(true)}
                  activeOpacity={0.8}
                >
                  <Crown size={20} color="#FFFFFF" />
                  <Text style={styles.premiumButtonText}>
                    {t('exercisesListScreen:upgradeToPremium')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
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

      <CustomPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}