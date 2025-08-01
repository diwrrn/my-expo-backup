import { View, StyleSheet } from 'react-native';

export function WaterIntakeCardSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.iconSkeleton} />
          <View style={styles.titleSkeleton} />
        </View>
        <View style={styles.subtitleSkeleton} />
      </View>

      <View style={styles.content}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground} />
          <View style={styles.progressTextSkeleton} />
        </View>

        <View style={styles.controls}>
          <View style={styles.buttonSkeleton} />
          <View style={styles.countContainer}>
            <View style={styles.countSkeleton} />
            <View style={styles.unitSkeleton} />
          </View>
          <View style={styles.buttonSkeleton} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  titleSkeleton: {
    width: 100,
    height: 18,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  subtitleSkeleton: {
    width: 160,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginLeft: 28,
  },
  content: {
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressTextSkeleton: {
    width: 80,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  countContainer: {
    alignItems: 'center',
  },
  countSkeleton: {
    width: 40,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  unitSkeleton: {
    width: 50,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
});