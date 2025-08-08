import { View, Text, StyleSheet, Image, ImageSourcePropType, TouchableOpacity } from 'react-native';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Edit3 } from 'lucide-react-native';

interface ProfileCardProps {
  name: string;
  phoneNumber: string;
  avatar: ImageSourcePropType;
  stats: {
    weight: number;
    height: number;
    age: number;
    activityLevel: string;
  };
  isPremium?: boolean;
  onWeightPress?: () => void;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  freeContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    borderRadius: 20,
  },
  premiumContainer: {
    padding: 24,
    borderRadius: 20,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  premiumAvatar: {
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  proBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD93D',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  proBadgeText: {
    color: '#2D3748',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  premiumName: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  phoneNumber: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumPhoneNumber: {
    color: '#D1FAE5',
  },
  physicalStats: {
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  statBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
  },
  editIconContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 6,
    padding: 2,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumStatBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  premiumStatNumber: {
    color: '#2D3748',
  },
  statUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumStatUnit: {
    color: '#4A5568',
  },
  stats: {
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
});

export function ProfileCard({ name, phoneNumber, avatar, stats, isPremium = false, onWeightPress }: ProfileCardProps) {
  const isRTL = useRTL();
  const {t, i18n} = useTranslation();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';

  const ProfileContent = () => (
    <>
      <View style={styles.centerContent}>
        <View style={styles.avatarContainer}>
          <Image 
            source={avatar} 
            style={[
              styles.avatar, 
              isPremium && styles.premiumAvatar
            ]} 
          />
          {isPremium && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.name, 
          useKurdishFont && { fontFamily: 'rudawregular2' },
          isPremium && styles.premiumName
        ]}>
          {String(name)}
        </Text>
      </View>
      
      <View style={styles.physicalStats}>
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[styles.statBox, isPremium && styles.premiumStatBox]}
            onPress={onWeightPress}
            activeOpacity={0.7}
          >
            <View style={styles.editIconContainer}>
              <Edit3 
                size={10} 
                color={isPremium ? '#4A5568' : '#64748B'} 
              />
            </View>
            <Text style={[styles.statNumber, isPremium && styles.premiumStatNumber]}>
              {String(stats.weight)}
            </Text>
            <Text style={[styles.statUnit, isPremium && styles.premiumStatUnit]}>
              {t("common:kg")}
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.statBox, isPremium && styles.premiumStatBox]}>
            <Text style={[styles.statNumber, isPremium && styles.premiumStatNumber]}>
              {String(stats.height)}
            </Text>
            <Text style={[styles.statUnit, isPremium && styles.premiumStatUnit]}>
              {t("common:cm")}
            </Text>
          </View>
          
          <View style={[styles.statBox, isPremium && styles.premiumStatBox]}>
            <Text style={[styles.statNumber, isPremium && styles.premiumStatNumber]}>
              {String(stats.age)}
            </Text>
            <Text style={[styles.statUnit, isPremium && styles.premiumStatUnit]}>
              {t("common:year")}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  if (isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumContainer}
        >
          <ProfileContent />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.freeContainer]}>
      <ProfileContent />
    </View>
  );
}