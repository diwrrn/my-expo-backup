import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { WorkoutIcons, WorkoutIconName } from './WorkoutIcons';

const CARD_MARGIN = 12; // Consistent margin for grid spacing

interface WorkoutCategoryCardProps {
  category: {
    id: string;
    name: string;
    nameKurdish: string;
    nameArabic: string;
    iconName: WorkoutIconName;
    order: number;
  };
  onPress: (categoryId: string) => void;
  cardWidth: number;
  style?: ViewStyle;
}

export function WorkoutCategoryCard({ category, onPress, cardWidth, style }: WorkoutCategoryCardProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();

  const getLocalizedName = () => {
    if (i18n.language === 'ku' && category.nameKurdish) return category.nameKurdish;
    if (i18n.language === 'ar' && category.nameArabic) return category.nameArabic;
    return category.name;
  };

  const IconComponent = WorkoutIcons[category.iconName];

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
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
  });
 
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={() => onPress(category.id)}>
      <View style={styles.iconContainer}>
        {IconComponent ? <IconComponent width={164} height={164} /> : null}
      </View>
      <Text style={styles.categoryName}>{getLocalizedName()}</Text>
    </TouchableOpacity>
  );
}