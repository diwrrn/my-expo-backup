import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation } from 'react-i18next';

interface FoodItemProps {
  name: string;
  kurdishName?: string; 
  arabicName?: string;
  baseName?: string;
  category?: string;
  calories: number;
  serving: string;
  availableUnits?: string[];
  protein: number;
  carbs: number;
  fat: number;
  onAdd: () => void;
  onShowDetails?: () => void;
}

export function FoodItem({ 
  name, 
  kurdishName, 
  arabicName, 
  baseName,
  category,
  calories, 
  serving, 
  availableUnits,
  protein, 
  carbs, 
  fat, 
  onAdd,
  onShowDetails
}: FoodItemProps) {
const isRTL = useRTL();
  const { t, i18n } = useTranslation(); // Add i18n here
  const isKurdish = i18n.language === 'ku' || i18n.language === 'ckb'; // Check if Kurdish
  
  const getDisplayName = () => {
    const lang = i18n.language;
    
    // More robust display name selection
    if (lang === 'ku' && kurdishName && kurdishName !== 'N/A' && kurdishName !== '') {
      return kurdishName;
    }
    if (lang === 'ar' && arabicName && arabicName !== 'N/A' && arabicName !== '') {
      return arabicName;
    }
    
    // Fallback to English name
    if (name && name !== 'N/A' && name !== '') {
      return name;
    }
    
    return 'Unknown Food';
  };

  const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: getFlexDirection(isRTL), // Apply RTL logic here
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginEnd: 12, // Use marginEnd for RTL-aware spacing
  },
  name: {
    fontSize: 16,
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 4,
    textAlign:getTextAlign(isRTL), // Apply RTL logic here
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line
  },
  category: {
    fontSize: 15,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign:getTextAlign(isRTL), // Apply RTL logic here

  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutritionRow: {
    flexDirection: getFlexDirection(isRTL), // Apply RTL logic here
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macros: {
    flexDirection: getFlexDirection(isRTL), // Apply RTL logic here
    flex: 1,
    gap: 12, // Use gap for spacing between macro items
  },
  macro: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign:getTextAlign(isRTL),
  },
  caloriesContainer: {
    flexDirection: getFlexDirection(isRTL), // Apply RTL logic here
    alignItems: 'baseline',
    gap: 4, // Use gap for spacing between calories value and label
  },
  calories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomInfo: {
    marginTop: 4,
  },
  serving: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  units: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});
  // Ensure we have valid nutrition values
  const displayProtein = protein || 0;
  const displayCarbs = carbs || 0;
  const displayFat = fat || 0;
  const displayCalories = calories || 0;
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onShowDetails}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Header row with name and add buton */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {getDisplayName()}
            </Text>
            {category && (
              <Text style={styles.category}>
                {t(`common:${category}`)}
              </Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus size={20} color="#22C55E" />
          </TouchableOpacity>
        </View>
        
        {/* Nutrition info row */}
       <View style={styles.nutritionRow}>
          <View style={styles.macros}>
            <Text style={styles.macro}>F: {Math.round(displayFat * 10) / 10}g</Text>
            <Text style={styles.macro}>C: {Math.round(displayCarbs * 10) / 10}g</Text>
            <Text style={styles.macro}>P: {Math.round(displayProtein * 10) / 10}g</Text>
          </View>
          <View style={styles.caloriesContainer}>
            <Text style={styles.caloriesLabel}>kcal/100g</Text>
            <Text style={styles.calories}>{displayCalories}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}