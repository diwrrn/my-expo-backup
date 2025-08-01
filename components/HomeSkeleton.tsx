import { View, StyleSheet } from 'react-native';

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {/* Hamburger Menu Skeleton */}
          <View style={styles.hamburgerSkeleton} />
          
          {/* Header Content Skeleton */}
          <View style={styles.headerContent}>
            <View style={styles.titleSkeleton} />
            <View style={styles.subtitleSkeleton} />
          </View>
          
          {/* Streak Badge Skeleton */}
          <View style={styles.streakBadgeSkeleton} />
        </View>
      </View>

      {/* Progress Ring Skeleton */}
      <View style={styles.progressSection}>
        <View style={styles.progressRingSkeleton} />
      </View>

      {/* Quick Stats Skeleton */}
      <View style={styles.quickStats}>
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statValueSkeleton} />
            <View style={styles.statUnitSkeleton} />
            <View style={styles.statLabelSkeleton} />
          </View>
        ))}
      </View>

      {/* Meals Section Skeleton */}
      <View style={styles.mealsSection}>
        <View style={styles.sectionTitleSkeleton} />
        
        {/* Meal Cards Skeleton */}
        {[1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealCardHeader}>
              <View style={styles.mealTitleRow}>
                <View style={styles.mealIconSkeleton} />
                <View style={styles.mealTitleSkeleton} />
              </View>
              <View style={styles.mealStatsSkeleton} />
              <View style={styles.addButtonSkeleton} />
            </View>
          </View>
        ))}
      </View>

      {/* Water Intake Skeleton */}
      <View style={styles.waterCard}>
        <View style={styles.waterCardHeader}>
          <View style={styles.waterTitleSkeleton} />
          <View style={styles.waterSubtitleSkeleton} />
        </View>
        <View style={styles.waterProgressSkeleton} />
        <View style={styles.waterControlsSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburgerSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  titleSkeleton: {
    width: 180,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    width: 140,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  streakBadgeSkeleton: {
    width: 70,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  progressRingSkeleton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E5E7EB',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  statValueSkeleton: {
    width: 40,
    height: 24,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    marginBottom: 4,
  },
  statUnitSkeleton: {
    width: 20,
    height: 12,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    marginBottom: 4,
  },
  statLabelSkeleton: {
    width: 30,
    height: 14,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
  },
  mealsSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitleSkeleton: {
    width: 150,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  mealTitleSkeleton: {
    width: 80,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  mealStatsSkeleton: {
    width: 100,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  addButtonSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  waterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waterCardHeader: {
    marginBottom: 16,
  },
  waterTitleSkeleton: {
    width: 120,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  waterSubtitleSkeleton: {
    width: 180,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  waterProgressSkeleton: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 20,
  },
  waterControlsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
  },
});