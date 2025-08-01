import { View, StyleSheet } from 'react-native';

export function AddFoodSkeleton() {
  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, index) => (
        <View key={index} style={styles.foodItem}>
          <View style={styles.content}>
            <View style={styles.mainInfo}>
              <View style={styles.nameSkeleton} />
              <View style={styles.categorySkeleton} />
              <View style={styles.servingSkeleton} />
              <View style={styles.unitsSkeleton} />
            </View>
            <View style={styles.nutritionInfo}>
              <View style={styles.caloriesContainer}>
                <View style={styles.caloriesSkeleton} />
                <View style={styles.caloriesLabelSkeleton} />
              </View>
              <View style={styles.macrosSkeleton} />
            </View>
          </View>
          <View style={styles.addButtonSkeleton} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Container styling to match the food items section
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  mainInfo: {
    marginBottom: 8,
  },
  nameSkeleton: {
    width: '70%',
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  categorySkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  servingSkeleton: {
    width: '50%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  unitsSkeleton: {
    width: '60%',
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  caloriesSkeleton: {
    width: 40,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 4,
  },
  caloriesLabelSkeleton: {
    width: 30,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  macrosSkeleton: {
    width: 120,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  addButtonSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
});