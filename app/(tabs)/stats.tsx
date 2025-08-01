import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, TrendingUp, Award, Target } from 'lucide-react-native';
import { WeeklyChart } from '@/components/WeeklyChart';
import { StatsCard } from '@/components/StatsCard';
import { AchievementCard } from '@/components/AchievementCard';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useStatsData } from '@/hooks/useStatsData';

export default function StatsScreen() {
  const { weeklyData, monthlyStats, achievements } = useStatsData();

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
    padding: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  chartSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  nutritionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  nutritionChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nutritionItem: {
    marginBottom: 16,
  },
  nutritionBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});