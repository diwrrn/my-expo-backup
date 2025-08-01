import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native'; // ADD ImageSourcePropType
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation, TFunction } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProfileCardProps {
  name: string;
  phoneNumber: string;
  avatar: ImageSourcePropType; // CHANGE THIS LINE
  stats: {
    weight: number;
    height: number;
    age: number;
    activityLevel: string;
  };
}

export function ProfileCard({ name, phoneNumber, avatar, stats }: ProfileCardProps) {
  const isRTL = useRTL();
  const {t, i18n} = useTranslation();
    const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';

  const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
  phoneNumber: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  physicalStats: {
    alignItems: 'center',
  },
  physicalStatsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statHighlight: {
    fontWeight: '600',
    color: '#374151',
  },
  separator: {
    color: '#D1D5DB',
    fontWeight: '400',
  },
  stats: {
    flexDirection: getFlexDirection(isRTL),
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
        fontFamily: useKurdishFont ? 'rudawregular2' : undefined,

  },
});
  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Image source={avatar} style={styles.avatar} /> {/* CHANGE THIS LINE */}
        <Text style={styles.name}>{name}</Text>
      </View>
      
      <View style={styles.physicalStats}>
        <Text style={styles.physicalStatsText}>
          <Text style={styles.statHighlight}>{stats.weight}{t("common:kg")} </Text>
          <Text style={styles.separator}> • </Text>
          <Text style={styles.statHighlight}>{stats.height}{t("common:cm")}</Text>
          <Text style={styles.separator}> • </Text>
          <Text style={styles.statHighlight}>{stats.age}{t("common:year")} </Text>
        </Text>
      </View>
    </View>
  );
}
