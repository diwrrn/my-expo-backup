import { View, StyleSheet } from 'react-native';

export function MealCardSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((index) => (
        <View key={index} style={styles.mealCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.iconSkeleton} />
              <View style={styles.titleSkeleton} />
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.caloriesSkeleton} />
              <View style={styles.itemsSkeleton} />
            </View>
            
            <View style={styles.addButtonSkeleton} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconSkeleton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  titleSkeleton: {
    width: 80,
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'column',
    marginRight: 12,
  },
  caloriesSkeleton: {
    width: 60,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  itemsSkeleton: {
    width: 40,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  addButtonSkeleton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
});