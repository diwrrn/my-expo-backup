import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Award, Target } from 'lucide-react-native';
import { useState, useEffect } from 'react';

import { WeeklyChart } from '@/components/WeeklyChart';
import { StatsCard } from '@/components/StatsCard';
import { AchievementCard } from '@/components/AchievementCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useStatsData } from '@/hooks/useStatsData';
import { useWeeklyStats } from '@/hooks/useWeeklyStats';
import { useAuth } from '@/hooks/useAuth';
import { FirebaseService } from '@/services/firebaseService';
import { PDFService } from '@/services/pdfService';
import { WeeklyReportDisplay } from '@/components/WeeklyReportDisplay';
import { useProfile } from '@/hooks/useProfile';

export default function StatsScreen() {
  const { weeklyData, monthlyStats, achievements } = useStatsData();
  const { user } = useAuth();
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const { profile } = useProfile(); // Add this line

  // Add this hook - get current week dates
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() - 1); // Yesterday
  const startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(endOfWeek.getDate() - 6); // 7 days ago
  
  const startDate = startOfWeek.toISOString().split('T')[0];
  const endDate = endOfWeek.toISOString().split('T')[0];

  const { weeklyStats, loading, error } = useWeeklyStats(startDate, endDate);

  const generatePDFReport = async () => {
    if (!weeklyStats || !user) return;

    try {
      console.log('📄 Generating PDF report...');
      const filteredReportData = FirebaseService.filterWeeklyStatsForReport(weeklyStats);

      // Set the report data for display
      setReportData(filteredReportData);
      setShowReport(true);
      // Get the daily calorie goal from user profile
      const dailyCalorieGoal = profile?.goals?.calories || null;

      // Generate PDF with calorie goal
      await PDFService.generateWeeklyReport(
        filteredReportData, 
        user.name || 'User',
        dailyCalorieGoal
      );
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    }
  };

  // Add this to see the data in console
  useEffect(() => {
    if (weeklyStats) {
      console.log('📊 Stats Screen - Weekly Stats:', weeklyStats);
    }
  }, [weeklyStats]);

  // Add this after your weeklyStats is loaded
  useEffect(() => {
    if (weeklyStats) {
      const reportData = FirebaseService.filterWeeklyStatsForReport(weeklyStats);
      console.log('📊📊📊����📊📊📊📊📊 Filtered Report Data:', reportData);

      // This will show exactly what you want:
      console.log('🥗 Food Counts:', reportData.foodCountsPerCategory);
      console.log('📈 Daily Calories:', reportData.dailyCalories);
      console.log('📊 Avg Calories/Day:', reportData.overallAverageCaloriesPerDay);
      console.log('🥗 Avg Calories/Category:', reportData.averageCaloriesPerCategory);
    }
  }, [weeklyStats]);

  // Add this to your JSX
  if (showReport && reportData) {
    return (
      <WeeklyReportDisplay 
        reportData={reportData} 
        userName={user?.name || 'User'} 
        dailyCalorieGoal={profile?.goals?.calories} // Add this prop

      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <HamburgerMenu currentRoute="/(tabs)/stats" />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <Text style={styles.headerSubtitle}>Track your nutrition journey</Text>
            </View>
          </View>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          <WeeklyChart data={weeklyData} />
        </View>

        {/* Monthly Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Avg Calories"
              value={monthlyStats.avgCalories}
              unit="kcal"
              icon={<Target size={24} color="#22C55E" />}
              color="#22C55E"
            />

            <StatsCard
              title="Days Tracked"
              value={monthlyStats.daysTracked}
              unit="days"
              icon={<Calendar size={24} color="#3B82F6" />}
              color="#3B82F6"
            />
            <StatsCard
              title="Goal Streak"
              value={monthlyStats.goalStreak}
              unit="days"
              icon={<TrendingUp size={24} color="#F59E0B" />}
              color="#F59E0B"
            />
            <StatsCard
              title="Protein Avg"
              value={monthlyStats.avgProtein}
              unit="g"
              icon={<Award size={24} color="#8B5CF6" />}
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {achievements.map((achievement, index) => (
            <AchievementCard
              key={index}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              color={achievement.color}
              unlocked={achievement.unlocked}
              date={achievement.date}
            />
          ))}
        </View>
        {/* Weekly Report Button */}
        <View style={styles.reportSection}>
          <Button 
            title="Generate Weekly Report" 
            onPress={generatePDFReport}
            style={{ marginTop: 20 }}
          />
        </View>

        {/* Nutrition Breakdown */}
        <View style={styles.nutritionSection}>
          <Text style={styles.sectionTitle}>Nutrition Breakdown</Text>
          <View style={styles.nutritionChart}>
            <View style={styles.nutritionItem}>
              <View style={[styles.nutritionBar, { backgroundColor: '#22C55E', width: '65%' }]} />
              <Text style={styles.nutritionLabel}>Protein: 65%</Text>
            </View>
            <View style={styles.nutritionItem}>
              <View style={[styles.nutritionBar, { backgroundColor: '#3B82F6', width: '80%' }]} />
              <Text style={styles.nutritionLabel}>Carbs: 80%</Text>
            </View>
            <View style={styles.nutritionItem}>
              <View style={[styles.nutritionBar, { backgroundColor: '#F59E0B', width: '45%' }]} />
              <Text style={styles.nutritionLabel}>Fat: 45%</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nutritionSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nutritionChart: {
    marginTop: 16,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    flex: 1,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 80,
  },
  reportSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});