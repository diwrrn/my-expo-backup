import { View, Text, StyleSheet } from 'react-native';

interface WeeklyChartProps {
  data: Array<{
    day: string;
    calories: number;
    goal: number;
  }>;
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCalories = Math.max(...data.map(d => Math.max(d.calories, d.goal)));

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {data.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barColumn}>
              <View
                style={[
                  styles.goalBar,
                  { height: (item.goal / maxCalories) * 120 }
                ]}
              />
              <View
                style={[
                  styles.caloriesBar,
                  { height: (item.calories / maxCalories) * 120 }
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Calories</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E5E7EB' }]} />
          <Text style={styles.legendText}>Goal</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barColumn: {
    position: 'relative',
    width: 24,
    height: 120,
    justifyContent: 'flex-end',
  },
  goalBar: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  caloriesBar: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    backgroundColor: '#22C55E',
    borderRadius: 12,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});