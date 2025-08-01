import { View, Text, StyleSheet } from 'react-native';

interface AchievementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  date?: string;
}

export function AchievementCard({ title, description, icon, color, unlocked, date }: AchievementCardProps) {
  return (
    <View style={[styles.container, !unlocked && styles.locked]}>
      <View style={[styles.iconContainer, { backgroundColor: unlocked ? color : '#E5E7EB' }]}>
        {icon}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, !unlocked && styles.lockedText]}>{title}</Text>
        <Text style={[styles.description, !unlocked && styles.lockedText]}>{description}</Text>
        {date && unlocked && (
          <Text style={styles.date}>{date}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
    marginTop: 4,
  },
  lockedText: {
    color: '#9CA3AF',
  },
});