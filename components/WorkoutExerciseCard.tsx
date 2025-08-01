import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface WorkoutExerciseCardProps {
  exercise: any;
  exerciseIndex: number;
  onToggleSetCompletion?: (exerciseIndex: number, setIndex: number) => void;
  onNotesChange?: (exerciseIndex: number, notes: string) => void;
  disabled?: boolean; // New prop to disable interactions
  onExerciseNamePress?: (exerciseId: string) => void; // ADD THIS LINE
}

// Helper function to get exercise images
const getExerciseImage = (exerciseName: string): string => {
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

export function WorkoutExerciseCard({
  exercise,
  exerciseIndex,
  onToggleSetCompletion,
  onNotesChange,
  disabled = false,
  onExerciseNamePress, // ADD THIS LINE
}: WorkoutExerciseCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();


  const styles = StyleSheet.create({
    exerciseCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      padding: 16,
    },
    exerciseCardHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 16,
    },
    exerciseOrder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    exerciseOrderText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
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
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    exerciseSets: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
    },
    setRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F9FAFB',
    },
    setCheckButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
      borderWidth: 2,
      borderColor: '#E5E7EB',
    },
    setCheckButtonCompleted: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    setCheckButtonDisabled: {
      opacity: 0.6,
    },
    emptyCheck: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: '#D1D5DB',
    },
    setDetailsText: {
      flex: 1,
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    setCompletedText: {
      textDecorationLine: 'line-through',
      color: '#9CA3AF',
    },
    exerciseNotesInput: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 12,
      fontSize: 14,
      color: '#111827',
      minHeight: 60,
      textAlignVertical: 'top',
      marginTop: 12,
      textAlign: getTextAlign(isRTL),
    },
    exerciseNotesInputDisabled: {
      backgroundColor: '#F3F4F6',
      color: '#9CA3AF',
    },
  });

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View style={styles.exerciseOrder}>
          <Text style={styles.exerciseOrderText}>{exerciseIndex + 1}</Text>
        </View>
        {/* WRAP exerciseInfo with TouchableOpacity */}
        <TouchableOpacity
          style={styles.exerciseInfo}
          onPress={() => onExerciseNamePress?.(exercise.exerciseId)} // ADD THIS LINE
          disabled={disabled || !onExerciseNamePress} // ADD THIS LINE (disable if card is disabled or no handler)
          activeOpacity={0.7} // ADD THIS LINE for visual feedback
        >
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseSets}>
            {exercise.sets.length} {t('exercisesListScreen:sets', 'sets')}
          </Text>
        </TouchableOpacity>
      </View>

      {exercise.sets.map((set: any, setIndex: number) => (
        <View key={setIndex} style={styles.setRow}>
          <TouchableOpacity
            style={[
              styles.setCheckButton,
              set.completed && styles.setCheckButtonCompleted,
              disabled && styles.setCheckButtonDisabled
            ]}
            onPress={() => {
              if (!disabled && onToggleSetCompletion) {
                onToggleSetCompletion(exerciseIndex, setIndex);
              }
            }}
            disabled={disabled}
          >
            {set.completed ? (
              <Check size={20} color="#FFFFFF" />
            ) : (
              <View style={styles.emptyCheck} />
            )}
          </TouchableOpacity>
          <Text style={[styles.setDetailsText, set.completed && styles.setCompletedText]}>
            {t('exercisesListScreen:sets', 'Set')} {setIndex + 1}: {set.reps} {t('common:reps', 'reps')}
            {set.weight && ` @ ${set.weight}kg`}
          </Text>
        </View>
      ))}
      <TextInput
        style={[
          styles.exerciseNotesInput,
          disabled && styles.exerciseNotesInputDisabled
        ]}
        placeholder={disabled ? '' : t('exercisesListScreen:notesPlaceholder', 'Add notes for this exercise...')}
        value={exercise.exerciseNotes || exercise.notes || ''}
        onChangeText={(text) => !disabled && onNotesChange?.(exerciseIndex, text)}
        multiline={true}
        placeholderTextColor="#9CA3AF"
        editable={!disabled}
      />
    </View>
  );
}
