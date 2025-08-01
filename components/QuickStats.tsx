import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useRTL, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation } from 'react-i18next';

interface QuickStatsProps {
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export function QuickStats({ protein, carbs, fat, water }: QuickStatsProps) {
  const isRTL = useRTL();
  const { t, i18n } = useTranslation(); // Add i18n here
  const isKurdish = i18n.language === 'ku' || i18n.language === 'ckb'; // Check if Kurdish
  const [isVisible, setIsVisible] = useState(false);
  const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
    opacity: 0,
    transform: [{ scale: 0.8 }],
  },
  containerVisible: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  statIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
        fontFamily: isKurdish ? 'rudawregular2' : undefined, // Add this line

  },
});
  useEffect(() => {
    // Simple animation delay for web compatibility
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: t('foodDetailsScreen:protein'), value: Math.round(protein || 0), unit: 'g', color: '#16A34A', bgColor: 'transparent' },
    { label: t('foodDetailsScreen:carbs'), value: Math.round(carbs || 0), unit: 'g', color: '#2563EB', bgColor: 'transparent' },
    { label: t('foodDetailsScreen:fat'), value: Math.round(fat || 0), unit: 'g', color: '#D97706', bgColor: 'transparent' },
    { label: t('foodDetailsScreen:water'), value: water, unit: t('foodDetailsScreen:glasses'), color: '#0891B2', bgColor: 'transparent' },
  ];

  return (
    <View style={[styles.container, isVisible && styles.containerVisible, { flexDirection: getFlexDirection(isRTL) }]}>
      {stats.map((stat, index) => (
        <View key={index} style={[styles.statItem, { backgroundColor: stat.bgColor }]}>
          <View style={[styles.statIndicator, { backgroundColor: stat.color }]} />
          <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          <Text style={styles.statUnit}>{stat.unit}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );
}

