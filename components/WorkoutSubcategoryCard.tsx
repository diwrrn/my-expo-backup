import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { WorkoutIcons, WorkoutIconName } from './WorkoutIcons';

const CARD_MARGIN = 12; // Consistent margin for grid spacing

interface WorkoutSubcategoryCardProps {
  subcategory: {
    id: string;
    name: string;
    nameKurdish: string;
    nameArabic: string;
    iconName: WorkoutIconName;
    order: number;
    numberOfExercises?: number; // Optional field for subcategories
  };
  onPress: (subcategoryId: string) => void;
  cardWidth: number;
  style?: ViewStyle;
}

export function WorkoutSubcategoryCard({ subcategory, onPress, cardWidth, style }: WorkoutSubcategoryCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();

  const getLocalizedName = () => {
    if (i18n.language === 'ku' && subcategory.nameKurdish) return subcategory.nameKurdish;
    if (i18n.language === 'ar' && subcategory.nameArabic) return subcategory.nameArabic;
    return subcategory.name;
  };

  const IconComponent = WorkoutIcons[subcategory.iconName];

  const styles = StyleSheet.create({
    card: {
      width: cardWidth,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: CARD_MARGIN, // Vertical spacing between rows
    },
    iconContainer: {
      marginBottom: 12,
    },
    subcategoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
      marginBottom: 4,
    },
    exerciseCount: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: getTextAlign(isRTL),
    },
  });

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={() => onPress(subcategory.id)}>
      <View style={styles.iconContainer}>
        {IconComponent ? <IconComponent width={164} height={164} /> : null}
      </View>
      <Text style={styles.subcategoryName}>{getLocalizedName()}</Text>
      {subcategory.numberOfExercises !== undefined && (
        <Text style={styles.exerciseCount}>
          {subcategory.numberOfExercises} {t('workoutSubcategoriesScreen:exercisesCount')}
        </Text>
      )}
    </TouchableOpacity>
  );
}