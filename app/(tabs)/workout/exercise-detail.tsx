import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Minus, X } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/hooks/useAuth';
import { SelectWorkoutPlanModal } from '@/components/SelectWorkoutPlanModal';
import { AddExerciseSetsRepsModal } from '@/components/AddExerciseSetsRepsModal';
import { ChoosePlanActionModal } from '@/components/ChoosePlanActionModal';

interface Exercise {
  id: string;
  name: string;
  nameKurdish?: string;
  nameArabic?: string;
  description: string;
  videoUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
}

export default function ExerciseDetailScreen() {
    console.log('FirebaseService.getExerciseById exists?', typeof FirebaseService.getExerciseById);

    const {
    exerciseId,
    categoryId,
    subcategoryId,
    targetPlanId, // <-- UPDATED THIS LINE
    exerciseName: paramExerciseName, // <-- ADD THIS LINE
    exerciseNameKurdish: paramExerciseNameKurdish, // <-- ADD THIS LINE
    exerciseNameArabic: paramExerciseNameArabic, // <-- ADD THIS LINE
  } = useLocalSearchParams<{
    exerciseId: string;
    categoryId?: string;
    subcategoryId?: string;
    targetPlanId?: string; // <-- UPDATED THIS LINE
    exerciseName?: string; // <-- ADD THIS LINE
    exerciseNameKurdish?: string; // <-- ADD THIS LINE
    exerciseNameArabic?: string; // <-- ADD THIS LINE
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { user } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);

  // State for the new flow
  const [showSetsRepsModal, setShowSetsRepsModal] = useState(false);
  const [showChoosePlanActionModal, setShowChoosePlanActionModal] = useState(false);
  const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
  const [exerciseDataForPlan, setExerciseDataForPlan] = useState<any>(null);

  useEffect(() => {
    if (exerciseId) {
      fetchExerciseDetails();
    }
  }, [exerciseId]);

  const fetchExerciseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let exerciseData;
      
      if (categoryId && subcategoryId) {
        // We have the full path, use it directly
        exerciseData = await FirebaseService.getExerciseById(categoryId, subcategoryId, exerciseId);
      } else {
        // We only have exerciseId, need to find it by searching all categories/subcategories
        // This is a fallback for when navigating from plan-details
        exerciseData = await FirebaseService.findExerciseById(exerciseId);
      }

      setExercise(exerciseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise details');
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedName = () => {
    if (!exercise) return '';
    if (i18n.language === 'ku' && exercise.nameKurdish) return exercise.nameKurdish;
    if (i18n.language === 'ar' && exercise.nameArabic) return exercise.nameArabic;
    return exercise.name;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#22C55E'; // Green
      case 'intermediate':
        return '#F59E0B'; // Yellow
      case 'advanced':
        return '#EF4444'; // Red
      default:
        return '#6B7280';
    }
  };

  const getVimeoEmbedUrl = (videoUrl: string) => {
    // Extract video ID from various Vimeo URL formats
    const vimeoRegex = /(?:vimeo\.com\/(?:.*#|.*\/videos\/)?|player\.vimeo\.com\/video\/)([0-9]+)/;
    const match = videoUrl.match(vimeoRegex);
    
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}?autoplay=0&title=0&byline=0&portrait=0&responsive=1&badge=0`;
    }
    
    // If it's already an embed URL, return as is
    if (videoUrl.includes('player.vimeo.com')) {
      return videoUrl.includes('badge=0') ? videoUrl : `${videoUrl}&badge=0`;
    }
    
    // Fallback
    return videoUrl;
  };

  // --- NEW FLOW FUNCTIONS ---
  const handleAddToWorkoutPlan = () => {
    if (!exercise) {
      Alert.alert(t('common:error'), 'Exercise data not loaded.');
      return;
    }
    setShowSetsRepsModal(true); // Open the sets/reps input modal first
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
    setExerciseDataForPlan(data); // Store the confirmed data
    setShowSetsRepsModal(false); // Close sets/reps modal
    
    if (targetPlanId) {
      // If we have a target plan, add directly to it
      handleAddToTargetPlan(data);
    } else {
      // Otherwise, show the choose action modal
      setShowChoosePlanActionModal(true);
    }
  };

  const handleChoosePlanAction = (action: 'add_to_existing' | 'create_new') => {
    setShowChoosePlanActionModal(false); // Close the action modal

    if (action === 'add_to_existing') {
      // Open SelectWorkoutPlanModal, passing the exercise data
      setShowSelectPlanModal(true);
    } else if (action === 'create_new') {
      // Navigate to create-plan-name, passing the exercise data
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
      Alert.alert(t('common:error'), 'User not authenticated or target plan not found');
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
        t('common:success'),
        `${data.exerciseName} added to your workout plan!`,
        [
          { text: 'Add More', onPress: () => {} },
          { 
            text: 'Go to Plan', 
            onPress: () => {
              router.replace({
                pathname: '/(tabs)/workout/plan-details',
                params: { planId: targetPlanId }
              });
            }
          }
        ]
      );
    } catch (err) {
      Alert.alert(t('common:error'), 'Failed to add exercise to workout plan');
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
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 120, // Space for footer navigation and button
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
    videoContainer: {
      backgroundColor: '#000000',
      aspectRatio: 16 / 9,
      marginBottom: 24,
            width: '90%', // Add this line to set width
      alignSelf: 'center', // Add this line to center horizontally

    },
    videoLoadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000000',
    },
    webView: {
      flex: 1,
    },
    contentSection: {
      padding: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 12,
      textAlign: getTextAlign(isRTL),
    },
    description: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 24,
      textAlign: getTextAlign(isRTL),
    },
    infoGrid: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      marginBottom: 32,
    },
    infoCard: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 6,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
      marginBottom: 8,
      textAlign: 'center',
    },
    difficultyBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    difficultyText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    equipmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
    },
    addButton: {
  backgroundColor: '#FFFFFF',
  padding: 24,
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
},
    addButtonInner: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: getFlexDirection(isRTL),
    },
    addButtonText: {
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
      padding: 24,
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
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
      textAlign: getTextAlign(isRTL),
    },
    closeButton: {
      padding: 4,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 8,
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
    notesInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 80,
      textAlignVertical: 'top',
      textAlign: getTextAlign(isRTL),
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
    saveButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: '#22C55E',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
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

  if (error || !exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || 'Exercise not found'}
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>{t('common:back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{getLocalizedName()}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollViewContent}>
          

          {/* Exercise Content */}
          <View style={styles.contentSection}>
            {/* Description */}
            <Text style={styles.sectionTitle}>{t('exercisesListScreen:description', 'Description')}</Text>
            <Text style={styles.description}>{exercise.description}</Text>

            {/* Exercise Info */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t('exercisesListScreen:difficulty', 'Difficulty')}</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
                  <Text style={styles.difficultyText}>
                    {t(`difficulty:${exercise.difficulty}`)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>{t('exercisesListScreen:equipment', 'Equipment')}</Text>
                <Text style={styles.equipmentText}>
                  {exercise.equipment 
                    ? t(`equipment:${exercise.equipment}`)
                    : t('equipment:none')
                  }
                </Text>
              </View>
            </View>
          </View>
        {/* Video Player */}
          <View style={styles.videoContainer}>
            {videoLoading && (
              <View style={styles.videoLoadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            <WebView
              style={styles.webView}
              source={{ uri: getVimeoEmbedUrl(exercise.videoUrl) }}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => setVideoLoading(true)}
              onLoadEnd={() => setVideoLoading(false)}
              onError={() => {
                setVideoLoading(false);
                console.error('Video failed to load');
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
            />
          </View>
        </View>
      </ScrollView>

      {/* Add to Workout Plan Button (Fixed at bottom) */}
      <View style={styles.addButton}>
        <TouchableOpacity style={styles.addButtonInner} onPress={handleAddToWorkoutPlan}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            {t('exercisesListScreen:addToWorkoutPlan', 'Add to Workout Plan')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Exercise Sets/Reps Modal */}
      {exercise && (
        <AddExerciseSetsRepsModal
          isVisible={showSetsRepsModal}
          onClose={() => setShowSetsRepsModal(false)}
          exercise={exercise}
          onConfirm={handleSetsRepsConfirm}
        />
      )}

      {/* Choose Plan Action Modal */}
      {exerciseDataForPlan && (
        <ChoosePlanActionModal
          isVisible={showChoosePlanActionModal}
          onClose={() => setShowChoosePlanActionModal(false)}
          onSelectAction={handleChoosePlanAction}
        />
      )}

      {/* Select Workout Plan Modal (for adding to existing plan) */}
      {exerciseDataForPlan && (
        <SelectWorkoutPlanModal
          isVisible={showSelectPlanModal}
          onClose={() => setShowSelectPlanModal(false)}
          exerciseDetails={exerciseDataForPlan}
        />
      )}
    </SafeAreaView>
  );
}