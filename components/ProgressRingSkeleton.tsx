import { View, StyleSheet } from 'react-native';

export function ProgressRingSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.ring} />
      <View style={styles.center}>
        <View style={styles.caloriesValue} />
        <View style={styles.caloriesLabel} />
        <View style={styles.caloriesRemaining} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 200,
    height: 200,
  },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 12,
    borderColor: '#E5E7EB',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caloriesValue: {
    width: 80,
    height: 36,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  caloriesLabel: {
    width: 60,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  caloriesRemaining: {
    width: 70,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});