import { View, StyleSheet } from 'react-native';

export function ProfileSkeleton() {
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
          </View>
          
          {/* Edit Button Skeleton */}
          <View style={styles.editButtonSkeleton} />
        </View>
      </View>

      {/* Profile Card Skeleton */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarSkeleton} />
          <View style={styles.userInfo}>
            <View style={styles.nameSkeleton} />
            <View style={styles.phoneSkeleton} />
          </View>
        </View>
        
        <View style={styles.stats}>
          {[1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.statItem}>
              <View style={styles.statValueSkeleton} />
              <View style={styles.statLabelSkeleton} />
            </View>
          ))}
        </View>
      </View>

      {/* Quick Stats Skeleton */}
      <View style={styles.quickStats}>
        {[1, 2, 3].map((index) => (
          <View key={index} style={styles.quickStatCard}>
            <View style={styles.quickStatValueSkeleton} />
            <View style={styles.quickStatLabelSkeleton} />
          </View>
        ))}
      </View>

      {/* Goals Section Skeleton */}
      <View style={styles.goalsSection}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.goalCard}>
          {[1, 2, 3, 4].map((index) => (
            <View key={index} style={styles.goalRow}>
              <View style={styles.goalLabelSkeleton} />
              <View style={styles.goalValueSkeleton} />
            </View>
          ))}
        </View>
      </View>

      {/* Settings Section Skeleton */}
      <View style={styles.settingsSection}>
        <View style={styles.sectionTitleSkeleton} />
        {[1, 2, 3, 4, 5].map((index) => (
          <View key={index} style={styles.settingsItem}>
            <View style={styles.settingsIconSkeleton} />
            <View style={styles.settingsContent}>
              <View style={styles.settingsTitleSkeleton} />
              <View style={styles.settingsSubtitleSkeleton} />
            </View>
            <View style={styles.chevronSkeleton} />
          </View>
        ))}
      </View>

      {/* Logout Button Skeleton */}
      <View style={styles.logoutButtonSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Header Skeleton
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  titleSkeleton: {
    width: 120,
    height: 32,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  editButtonSkeleton: {
    width: 60,
    height: 36,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },

  // Profile Card Skeleton
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarSkeleton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  nameSkeleton: {
    width: 140,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  phoneSkeleton: {
    width: 100,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValueSkeleton: {
    width: 32,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  statLabelSkeleton: {
    width: 40,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  // Quick Stats Skeleton
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickStatValueSkeleton: {
    width: 40,
    height: 28,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  quickStatLabelSkeleton: {
    width: 50,
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  // Goals Section Skeleton
  goalsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitleSkeleton: {
    width: 120,
    height: 24,
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
    width: 80,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  goalValueSkeleton: {
    width: 60,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  // Settings Section Skeleton
  settingsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingsIconSkeleton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitleSkeleton: {
    width: 120,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 6,
  },
  settingsSubtitleSkeleton: {
    width: 180,
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  chevronSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },

  // Logout Button Skeleton
  logoutButtonSkeleton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});