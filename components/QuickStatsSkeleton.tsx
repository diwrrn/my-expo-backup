import { View, StyleSheet } from 'react-native';

export function QuickStatsSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4].map((index) => (
        <View key={index} style={styles.statItem}>
          <View style={styles.statIndicator} />
          <View style={styles.statValue} />
          <View style={styles.statUnit} />
          <View style={styles.statLabel} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    backgroundColor: '#F3F4F6',
  },
  statIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  statValue: {
    width: 40,
    height: 22,
    backgroundColor: '#D1D5DB',
    borderRadius: 4,
    marginBottom: 4,
  },
  statUnit: {
    width: 20,
    height: 11,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    marginTop: 2,
    marginBottom: 4,
  },
  statLabel: {
    width: 40,
    height: 13,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    marginTop: 4,
  },
});