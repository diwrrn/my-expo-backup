import { View, StyleSheet } from 'react-native';

export function DailyGoalsSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.titleSkeleton} />
      <View style={styles.goalCard}>
        <View style={styles.goalRow}>
          <View style={styles.goalLabelSkeleton} />
          <View style={styles.goalValueSkeleton} />
        </View>
        <View style={styles.goalRow}>
          <View style={styles.goalLabelSkeleton} />
          <View style={styles.goalValueSkeleton} />
        </View>
        <View style={styles.goalRow}>
          <View style={styles.goalLabelSkeleton} />
          <View style={styles.goalValueSkeleton} />
        </View>
        <View style={styles.goalRow}>
          <View style={styles.goalLabelSkeleton} />
          <View style={styles.goalValueSkeleton} />
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
  titleSkeleton: {
    height: 24,
    width: 120,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 16,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalLabelSkeleton: {
    height: 16,
    width: 80,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  goalValueSkeleton: {
    height: 16,
    width: 60,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});