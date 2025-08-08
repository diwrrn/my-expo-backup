import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Calendar, Award, BarChart3, Users, Target } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';

const { width } = Dimensions.get('window');

interface WeeklyReportDisplayProps {
  reportData: any;
  userName: string;
  dailyCalorieGoal?: number;
}

export const WeeklyReportDisplay: React.FC<WeeklyReportDisplayProps> = ({ 
  reportData, 
  userName,
  dailyCalorieGoal 
}) => {
  const { t, i18n } = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  
  const isRTL = useRTL();

  // Add debugging
  console.log('🔍 WeeklyReportDisplay - reportData:', reportData);
  console.log('🔍 WeeklyReportDisplay - userName:', userName);
  console.log('🔍 WeeklyReportDisplay - dailyCalorieGoal:', dailyCalorieGoal);

  // Demo data for artifact preview - remove in production
  const demoData = {
    weekStart: "Jan 15",
    weekEnd: "Jan 21", 
    overallAverageCaloriesPerDay: 2150,
    daysWithData: 6,
    foodCountsPerCategory: {
      proteins: 24,
      vegetables: 18,
      grains: 15,
      fruits: 12,
      dairy: 8
    },
    averageCaloriesPerCategory: {
      proteins: 850,
      vegetables: 320,
      grains: 480,
      fruits: 280,
      dairy: 220
    },
    dailyCalories: {
      "Monday": 2280,
      "Tuesday": 2050,
      "Wednesday": 2340,
      "Thursday": 1980,
      "Friday": 2190,
      "Saturday": 2450
    }
  };

  // Use passed props or demo data for preview
  const data = reportData || demoData;
  console.log('🔍 WeeklyReportDisplay - final data:', data);
  console.log('🔍 WeeklyReportDisplay - data.foodCountsPerCategory:', data.foodCountsPerCategory);
  console.log('🔍 WeeklyReportDisplay - data.dailyCalories:', data.dailyCalories);

  const name = userName || "Alex";
  const calorieGoal = dailyCalorieGoal || 2200;

  const categories = Object.entries(data.foodCountsPerCategory || {});
  const dailyEntries = Object.entries(data.dailyCalories || {});

  console.log('🔍 WeeklyReportDisplay - categories:', categories);
  console.log('🔍 WeeklyReportDisplay - dailyEntries:', dailyEntries);

  // Get actual start and end dates from dailyEntries
  const getWeekDateRange = () => {
    if (dailyEntries.length === 0) {
      return { startDate: '27/01', endDate: '02/02', year: '2025' };
    }

    try {
      // Sort dates to get actual start and end
      const sortedDates = dailyEntries
        .map(([dateStr]) => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());

      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];

      const formatDate = (date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      };

      return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        year: startDate.getFullYear().toString()
      };
    } catch (error) {
      console.log('Error formatting week dates:', error);
      return { startDate: '27/01', endDate: '02/02', year: '2025' };
    }
  };

  const { startDate, endDate, year } = getWeekDateRange();

  // Dynamic styles based on RTL and font
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F8FAFC',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 40,
      backgroundColor: '#0F2027',
      position: 'relative',
      overflow: 'hidden',
    },
    title: {
      fontSize: 36,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: 8,
      letterSpacing: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    subtitle: {
      fontSize: 16,
      color: '#E2E8F0',
      fontWeight: '500',
      marginBottom: 20,
      lineHeight: 22,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerInfo: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerInfoRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerInfoItem: {
      fontSize: 15,
      color: '#F8FAFC',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#203A43',
      opacity: 0.4,
    },
    headerPattern: {
      position: 'absolute',
      top: -50,
      right: isRTL ? undefined : -50,
      left: isRTL ? -50 : undefined,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    statsSection: {
      backgroundColor: '#FFFFFF',
      paddingVertical: 24,
      paddingHorizontal: 24,
      marginTop: 8,
    },
    statsGrid: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 20,
      marginHorizontal: 4,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    statLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#374151',
      marginBottom: 2,
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    statSubtitle: {
      fontSize: 11,
      color: '#9CA3AF',
      fontWeight: '500',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    section: {
      backgroundColor: '#FFFFFF',
      marginTop: 8,
      paddingVertical: 24,
    },
    sectionHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    targetInfo: {
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    targetText: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined, // Add this line
    },
    categoriesContainer: {
      paddingHorizontal: 24,
    },
    categoryCard: {
      paddingVertical: 20,
      paddingHorizontal: 20,
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    categoryContent: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
    },
    categoryIcon: {
      fontSize: 32,
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    categoryLeft: {
      flex: 1,
    },
    categoryDescription: {
      fontSize: 14,
      color: '#111827',
      fontWeight: '500',
      lineHeight: 18,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    categoryRight: {
      alignItems: isRTL ? 'flex-start' : 'flex-end',
    },
    categoryCalories: {
      fontSize: 18,
      fontWeight: '700',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    categoryCaloriesLabel: {
      fontSize: 12,
      color: '#9CA3AF',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

    },
    dailyGrid: {
      paddingHorizontal: 24,
      gap: 8,
    },
    dayCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    dayHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    daySecondLine: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    dayName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    dayCalories: {
      fontSize: 13,
      fontWeight: '500',
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    dayValue: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    dayPercentage: {
      fontSize: 12,
      fontWeight: '600',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    dayProgressContainer: {
      width: '100%',
    },
    dayProgressTrack: {
      height: 4,
      backgroundColor: '#E5E7EB',
      borderRadius: 2,
      overflow: 'hidden',
    },
    dayProgressFill: {
      height: '100%',
      borderRadius: 2,
    },
    summarySection: {
      paddingHorizontal: 24,
      paddingVertical: 24,
    },
    summaryCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    summaryHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 12,
    },
    summaryTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    summaryText: {
      fontSize: 14,
      color: '#6B7280',
      lineHeight: 20,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    insightCard: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    insightText: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '500',
      lineHeight: 22,
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    progressContainer: {
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      transition: 'width 0.3s ease',
    },
    progressText: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    bottomPadding: {
      paddingBottom: 100,
    },
  });

  const StatCard = ({ icon: Icon, value, label, subtitle }) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Icon size={20} color="#1F2937" strokeWidth={2} />
      </View>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );

  const CategoryCard = ({ category, count, avgCalories }) => {
    // Add null check for weeklyTotals
    const weeklyTotal = data.weeklyTotals?.[category]?.totalCalories || 0;

    // Category icons mapping
    const categoryIcons = {
      proteins: '🥩',
      vegetables: '🥕', 
      grains: '🌾',
      fruits: '🍎',
      dairy: '🥛'
    };

    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryContent}>
          <Text style={styles.categoryIcon}>{categoryIcons[category] || '🍽️'}</Text>
          <View style={styles.categoryLeft}>
            <Text style={styles.categoryDescription}>
              {t('weeklyReport:categoryDescription', { 
                category: t(`foodCategories:${category}`), 
                count 
              })}
            </Text>
          </View>
          <View style={styles.categoryRight}>
            <Text style={styles.categoryCalories}>{weeklyTotal || 0}</Text>
            <Text style={styles.categoryCaloriesLabel}>
              {t('weeklyReport:totalCalories')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const DayCard = ({ day, calories }) => {
    // Add null checks
    const safeCalories = calories || 0;
    const percentage = Math.round((safeCalories / calorieGoal) * 100);
    const isOverGoal = safeCalories > calorieGoal;

    // Convert date string to day name and format date
    const getDayInfo = (dateString) => {
      try {
        const date = new Date(dateString);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[date.getDay()];
        
        // Format date as DD/MM
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        return { dayName, formattedDate };
      } catch (error) {
        console.log('Error converting date to day info:', error);
        return { dayName: 'unknown', formattedDate: day };
      }
    };

    const { dayName, formattedDate } = getDayInfo(day);

    return (
      <View style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayName}>
            {t(`common:days.${dayName}`)} {formattedDate}
          </Text>
          <Text style={[styles.dayPercentage, { color: isOverGoal ? '#DC2626' : '#1F2937' }]}>
            {percentage}%
          </Text>
        </View>
        <View style={styles.daySecondLine}>
          <Text style={styles.dayCalories}>
            {t('weeklyReport:caloriesConsumed')}
          </Text>
          <Text style={styles.dayValue}>{(safeCalories || 0).toLocaleString()}</Text>
        </View>
        <View style={styles.dayProgressContainer}>
          <View style={styles.dayProgressTrack}>
            <View style={[
              styles.dayProgressFill, 
              { 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverGoal ? '#DC2626' : '#10B981'
              }
            ]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerGradient} />
          <View style={styles.headerPattern} />
          <Text style={styles.title}>{t('weeklyReport:title')}</Text>
          <Text style={styles.subtitle}>
            {t('weeklyReport:subtitle', { name })} 👇
          </Text>
          
          <View style={styles.headerInfo}>
            <View style={styles.headerInfoRow}>
              <Text style={styles.headerInfoItem}>
                🗓️  {startDate} – {endDate}, {year}
              </Text>
              <Text style={styles.headerInfoItem}>
                🧍‍♂️ {name}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <StatCard
              icon={Target}
              value={data.overallAverageCaloriesPerDay}
              label={t('weeklyReport:dailyAverage')}
              subtitle={t('foodDetailsScreen:calories')}
            />
            <StatCard
              icon={Calendar}
              value={data.daysWithData}
              label={t('weeklyReport:daysTracked')}
              subtitle={t('weeklyReport:ofSevenDays')}
            />
            <StatCard
              icon={BarChart3}
              value={Object.keys(data.foodCountsPerCategory || {}).length}
              label={t('weeklyReport:foodGroups')}
              subtitle={t('weeklyReport:tracked')}
            />
          </View>
        </View>

        {/* Food Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('weeklyReport:foodCategoriesTitle')}
            </Text>
          </View>
          
          <View style={styles.categoriesContainer}>
            {categories.map(([category, count]) => (
              <CategoryCard
                key={category}
                category={category}
                count={count}
                avgCalories={data.averageCaloriesPerCategory?.[category]}
              />
            ))}
          </View>
        </View>

        {/* Daily Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('weeklyReport:dailyBreakdownTitle')}
            </Text>
            <View style={styles.targetInfo}>
              <Text style={styles.targetText}>
                {t('weeklyReport:target')}: {calorieGoal.toLocaleString()} {t('weeklyReport:cal')}
              </Text>
            </View>
          </View>
          
          <View style={styles.dailyGrid}>
            {dailyEntries.map(([day, calories]) => (
              <DayCard
                key={day}
                day={day}
                calories={calories}
              />
            ))}
          </View>
        </View>
{/* Fiber Analysis */}
{data.fiberAnalysis && (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>�� Nutrition Insights</Text>
    </View>
    
    <View style={styles.insightCard}>
      <Text style={styles.insightText}>
        {data.fiberAnalysis.message || "No fiber data available for this week"}
      </Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill, 
            { 
              width: `${Math.min(data.fiberAnalysis.percentage || 0, 100)}%`,
              backgroundColor: (data.fiberAnalysis.percentage || 0) >= 80 ? '#10B981' : 
                             (data.fiberAnalysis.percentage || 0) >= 60 ? '#F59E0B' : '#EF4444'
            }
          ]} />
        </View>
        <Text style={styles.progressText}>
          {data.fiberAnalysis.averageDailyFiber || 0}g / {data.fiberAnalysis.target || 25}g daily
        </Text>
      </View>
    </View>
  </View>
)}
        {/* Weekly Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Users size={20} color="#1F2937" strokeWidth={2} />
              <Text style={styles.summaryTitle}>
                {t('weeklyReport:weekSummaryTitle')}
              </Text>
            </View>
            <Text style={styles.summaryText}>
              {t('weeklyReport:summaryText', {
                daysTracked: data.daysWithData,
                averageCalories: data.overallAverageCaloriesPerDay
              })}
            </Text>
          </View>
        </View>

        {/* Bottom padding for navigation */}
        <View style={styles.bottomPadding} />

      </ScrollView>
    </SafeAreaView>
  );
};

export default WeeklyReportDisplay;