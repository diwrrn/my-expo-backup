import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { Target } from 'lucide-react-native';

interface DailyGoalsCardProps {
  goals?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  isLoading?: boolean;
}

export function DailyGoalsCard({ goals, isLoading = false }: DailyGoalsCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Target size={20} color="#10B981" />
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('profileScreen:dailyGoalsTitle')}
          </Text>
        </View>
        <View style={styles.goalCard}>
          <View style={styles.loadingRow}>
            <Text style={styles.loadingText}>Loading goals...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!goals) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Target size={20} color="#64748B" />
          <Text style={[styles.sectionTitle, { textAlign: getTextAlign(isRTL) }]}>
            {t('profileScreen:dailyGoalsTitle')}
          </Text>
        </View>
        <View style={styles.goalCard}>
          <View style={styles.noDataRow}>
            <Text style={styles.noDataText}>No goals set</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.goalCard}>
        <Text style={styles.cardTitle}>Daily Goals</Text>
        {/* Calories Row */}
        <View style={styles.goalRow}>
          {isRTL ? (
            <>
              <Text style={styles.goalValue}>{goals.calories || 0} kcal</Text>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:calories')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:calories')}</Text>
              <Text style={styles.goalValue}>{goals.calories || 0} kcal</Text>
            </>
          )}
        </View>

        {/* Protein Row */}
        <View style={styles.goalRow}>
          {isRTL ? (
            <>
              <Text style={styles.goalValue}>{goals.protein || 0} g</Text>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:protein')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:protein')}</Text>
              <Text style={styles.goalValue}>{goals.protein || 0} g</Text>
            </>
          )}
        </View>

        {/* Carbs Row */}
        <View style={styles.goalRow}>
          {isRTL ? (
            <>
              <Text style={styles.goalValue}>{goals.carbs || 0} g</Text>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:carbs')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:carbs')}</Text>
              <Text style={styles.goalValue}>{goals.carbs || 0} g</Text>
            </>
          )}
        </View>

        {/* Fat Row */}
        <View style={styles.goalRow}>
          {isRTL ? (
            <>
              <Text style={styles.goalValue}>{goals.fat || 0} g</Text>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:fat')}</Text>
            </>
          ) : (
            <>
              <Text style={styles.goalLabel}>{t('foodDetailsScreen:fat')}</Text>
              <Text style={styles.goalValue}>{goals.fat || 0} g</Text>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  goalLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  goalValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '700',
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  noDataRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});