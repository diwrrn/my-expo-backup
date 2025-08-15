import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Play, Target, Zap, Wrench, Clock, Award } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useExerciseCache } from '@/hooks/useExerciseCache';
import { FirebaseService } from '@/services/firebaseService';
import { WebView } from 'react-native-webview';
import { SelectWorkoutPlanModal } from '@/components/SelectWorkoutPlanModal';
import { AddExerciseSetsRepsModal } from '@/components/AddExerciseSetsRepsModal';
import { ChoosePlanActionModal } from '@/components/ChoosePlanActionModal';
import { useAppStore } from '@/store/appStore';

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
const {
exerciseId,
categoryId,
subcategoryId,
targetPlanId,
exerciseName: paramExerciseName,
exerciseNameKurdish: paramExerciseNameKurdish,
exerciseNameArabic: paramExerciseNameArabic,
} = useLocalSearchParams<{
exerciseId: string;
categoryId?: string;
subcategoryId?: string;
targetPlanId?: string;
exerciseName?: string;
exerciseNameKurdish?: string;
exerciseNameArabic?: string;
}>();

const { t, i18n } = useTranslation();
const isRTL = useRTL();
const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
const user = useAppStore(state => state.user);

// Use the cached hook instead of direct Firebase calls
const { exercise, isLoading, error, refreshExercise } = useExerciseCache(exerciseId || '', categoryId, subcategoryId);

const [videoLoading, setVideoLoading] = useState(true);

// State for the new flow
const [showSetsRepsModal, setShowSetsRepsModal] = useState(false);
const [showChoosePlanActionModal, setShowChoosePlanActionModal] = useState(false);
const [showSelectPlanModal, setShowSelectPlanModal] = useState(false);
const [exerciseDataForPlan, setExerciseDataForPlan] = useState<any>(null);

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

const getDifficultyIcon = (difficulty: string) => {
switch (difficulty) {
  case 'beginner':
    return <Target size={14} color="#FFFFFF" />;
  case 'intermediate':
    return <Zap size={14} color="#FFFFFF" />;
  case 'advanced':
    return <Award size={14} color="#FFFFFF" />;
  default:
    return <Target size={14} color="#FFFFFF" />;
}
};

const getDifficultyText = (difficulty: string) => {
switch (difficulty) {
  case 'beginner':
    return t('exerciseDetailScreen:beginner');
  case 'intermediate':
    return t('exerciseDetailScreen:intermediate');
  case 'advanced':
    return t('exerciseDetailScreen:advanced');
  default:
    return difficulty;
}
};

const getVimeoEmbedUrl = (videoUrl: string) => {
if (!videoUrl) return '';

// If it's already an embed URL, return as is
if (videoUrl.includes('player.vimeo.com/video')) {
  return videoUrl;
}

// Extract video ID from various Vimeo URL formats
const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
const match = videoUrl.match(vimeoRegex);

if (match) {
  const videoId = match[1];
  return `https://player.vimeo.com/video/${videoId}?h=1234567890abcdef&autoplay=0&title=0&byline=0&portrait=0`;
}

return videoUrl;
};

const handleAddToWorkoutPlan = () => {
if (!exercise) return;

setShowSetsRepsModal(true);
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

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: '#FAFAFA',
},

// Loading & Error States
centerContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 40,
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
  marginBottom: 24,
},
// Quick Stats
statsRow: {
  flexDirection: getFlexDirection(isRTL),
  justifyContent: 'space-around',
  paddingTop: 16,
  borderTopWidth: 1,
  borderTopColor: '#F3F4F6',
  marginTop: 16,
},
statItem: {
  alignItems: 'center',
},
statValue: {
  fontSize: 18,
  fontWeight: '700',
  color: '#1F2937',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},
statLabel: {
  fontSize: 12,
  color: '#6B7280',
  fontWeight: '500',
  marginTop: 4,
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
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

// Content Styles
scrollView: {
  flex: 1,
},
contentContainer: {
  paddingBottom: 120,
},

// Exercise Info Section
infoSection: {
  backgroundColor: '#FFFFFF',
  marginHorizontal: 16,
  marginTop: 12,
  borderRadius: 16,
  padding: 20,
  borderWidth: 1,
  borderColor: '#F0F0F0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
},
infoHeader: {
  marginBottom: 16,
},
exerciseName: {
  fontSize: 24,
  fontWeight: '700',
  color: '#1F2937',
  marginBottom: 12,
  textAlign: getTextAlign(isRTL),
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
  lineHeight: 30,
},
metaRow: {
  flexDirection: getFlexDirection(isRTL),
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
},
metaItem: {
  flexDirection: getFlexDirection(isRTL),
  alignItems: 'center',
  backgroundColor: '#F8FAFC',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 12,
  gap: 6,
},
difficultyBadge: {
  flexDirection: getFlexDirection(isRTL),
  alignItems: 'center',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 12,
  gap: 6,
},
difficultyText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#FFFFFF',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},
equipmentText: {
  fontSize: 14,
  color: '#6B7280',
  fontWeight: '500',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},

// Video Section
videoSection: {
  marginHorizontal: 16,
  marginTop: 16,
  borderRadius: 16,
  overflow: 'hidden',
  backgroundColor: '#000',
},
videoContainer: {
  height: 220,
  borderRadius: 16,
  overflow: 'hidden',
},
videoLoadingContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#000',
},
videoLoadingText: {
  color: '#FFFFFF',
  fontSize: 16,
  marginTop: 12,
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},
videoOverlay: {
  position: 'absolute',
  top: 16,
  left: isRTL ? undefined : 16,
  right: isRTL ? 16 : undefined,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
  flexDirection: getFlexDirection(isRTL),
  alignItems: 'center',
  gap: 6,
},
videoOverlayText: {
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: '600',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},

// Tips Section
tipsSection: {
  backgroundColor: '#F0FDF4',
  marginHorizontal: 16,
  marginTop: 16,
  borderRadius: 16,
  padding: 20,
  borderWidth: 1,
  borderColor: '#BBF7D0',
},
tipsHeader: {
  flexDirection: getFlexDirection(isRTL),
  alignItems: 'center',
  marginBottom: 12,
  gap: 8,
},
tipsTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#16A34A',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},
tipsText: {
  fontSize: 14,
  color: '#15803D',
  lineHeight: 20,
  textAlign: getTextAlign(isRTL),
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
},

// Bottom Action Bar
bottomActions: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '#FFFFFF',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderTopWidth: 1,
  borderTopColor: '#E5E5E5',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 8,
},
actionButton: {
  backgroundColor: '#22C55E',
  borderRadius: 16,
  paddingVertical: 18,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: getFlexDirection(isRTL),
  gap: 10,
  shadowColor: '#22C55E',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 12,
  elevation: 6,
},
actionButtonText: {
  color: '#FFFFFF',
  fontSize: 17,
  fontWeight: '700',
  fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
}
});

if (isLoading) {
return (
  <SafeAreaView style={styles.container}>
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#22C55E" />
      <Text style={styles.loadingText}>{t('common:loading')}</Text>
    </View>
  </SafeAreaView>
);
}

if (error || !exercise) {
return (
  <SafeAreaView style={styles.container}>
    <View style={styles.centerContainer}>
      <Text style={styles.errorText}>{error || 'Exercise not found'}</Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={20} color="#374151" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);
}

return (
<>
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
          <Text style={styles.headerTitle}>{t('exerciseDetailScreen:exerciseDetails')}</Text>
        </View>
      </View>
    </View>

    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Exercise Info Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Text style={styles.exerciseName}>
            {getLocalizedName()}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
              {getDifficultyIcon(exercise.difficulty)}
              <Text style={styles.difficultyText}>
                {getDifficultyText(exercise.difficulty)}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Wrench size={14} color="#6B7280" />
              <Text style={styles.equipmentText}>
                {exercise.equipment}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Video Section */}
      {exercise.videoUrl && (
        <View style={styles.videoSection}>
          <View style={styles.videoOverlay}>
            <Play size={12} color="#FFFFFF" />
            <Text style={styles.videoOverlayText}>Exercise Demo</Text>
          </View>
          
          <View style={styles.videoContainer}>
            {videoLoading && (
              <View style={styles.videoLoadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.videoLoadingText}>{t('exerciseDetailScreen:loadingVideo')}</Text>
              </View>
            )}
            <WebView
              source={{ uri: getVimeoEmbedUrl(exercise.videoUrl) }}
              style={{ flex: 1 }}
              onLoad={() => setVideoLoading(false)}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <View style={styles.tipsHeader}>
          <Target size={16} color="#16A34A" />
          <Text style={styles.tipsTitle}>
            Pro Tips
          </Text>
        </View>
        <Text style={styles.tipsText}>
          • Focus on proper form over heavy weight{'\n'}
          • Control the movement throughout the full range{'\n'}
          • Breathe consistently during the exercise{'\n'}
          • Start with lighter weight to master the technique
        </Text>
      </View>
    </ScrollView>

    {/* Bottom Action Bar */}
    <View style={styles.bottomActions}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleAddToWorkoutPlan}
        activeOpacity={0.8}
      >
        <Plus size={22} color="#FFFFFF" />
        <Text style={styles.actionButtonText}>
          {t('exerciseDetailScreen:addToPlan')}
        </Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>

  {/* All Modals - Logic Unchanged */}
  {exercise && (
    <AddExerciseSetsRepsModal
      isVisible={showSetsRepsModal}
      onClose={() => setShowSetsRepsModal(false)}
      exercise={exercise}
      onConfirm={handleSetsRepsConfirm}
    />
  )}

  {exerciseDataForPlan && (
    <ChoosePlanActionModal
      isVisible={showChoosePlanActionModal}
      onClose={() => setShowChoosePlanActionModal(false)}
      onSelectAction={handleChoosePlanAction}
    />
  )}

  {exerciseDataForPlan && (
    <SelectWorkoutPlanModal
      isVisible={showSelectPlanModal}
      onClose={() => setShowSelectPlanModal(false)}
      exerciseDetails={exerciseDataForPlan}
    />
  )}
</>
);
}