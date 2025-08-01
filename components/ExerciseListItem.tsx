import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

interface ExerciseListItemProps {
  exercise: {
    id: string;
    name: string;
    nameKurdish?: string;
    nameArabic?: string;
    thumbnailUrl?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    equipment: string;
  };
  onAddPress: (exerciseId: string) => void;
  onDetailPress: (exerciseId: string) => void;
}

export function ExerciseListItem({ exercise, onAddPress, onDetailPress }: ExerciseListItemProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();


  const getLocalizedName = () => {
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

  const styles = StyleSheet.create({
    card: {
      flexDirection: getFlexDirection(isRTL),
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
      alignItems: 'center',
    },
    thumbnail: {
      width: 80,
      height: 80,
      borderRadius: 8,
      backgroundColor: '#E5E7EB', // Placeholder background
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 10,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    details: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
      textAlign: getTextAlign(isRTL),
    },
    infoRow: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 4,
    },
    difficultyBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    equipmentText: {
      fontSize: 12,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
      flex: 1,
    },
    addButton: {
      backgroundColor: '#22C55E',
      borderRadius: 8,
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: isRTL ? 0 : 12,
      marginRight: isRTL ? 12 : 0,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onDetailPress(exercise.id)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnail}>
        {exercise.thumbnailUrl ? (
          <Image source={{ uri: exercise.thumbnailUrl }} style={styles.thumbnail} />
        ) : (
          <Text style={styles.placeholderText}>Exercise{'\n'}Thumbnail</Text>
        )}
      </View>
      
      <View style={styles.details}>
        <Text style={styles.name}>{getLocalizedName()}</Text>
        <View style={styles.infoRow}>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(exercise.difficulty) }]}>
            <Text style={styles.difficultyText}>{t(`difficulty:${exercise.difficulty}`)}</Text>
          </View>
          <Text style={styles.equipmentText}>
           {exercise.equipment 
  ? t(`equipment:${exercise.equipment}`)
  : t('equipment:none')
}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={(e) => {
          e.stopPropagation();
          onAddPress(exercise.id);
        }}
      >
        <Plus size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}