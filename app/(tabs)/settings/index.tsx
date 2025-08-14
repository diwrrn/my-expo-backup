// app/(tabs)/settings/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, User, Settings as SettingsIcon, CircleQuestionMark, Crown, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useState } from 'react';
import { LanguageSelectionModal } from '@/components/LanguageSelectionModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { Alert } from 'react-native';
import i18n from '@/services/i18n';
import { useAppStore } from '@/store/appStore';

export default function SettingsScreen() {
  console.log('SettingsScreen rendering');
  const { isRTL, currentLanguage } = useAppStore();
  const { t } = useTranslation();
  const useKurdishFont = currentLanguage === 'ku' || currentLanguage === 'ckb' || currentLanguage === 'ar';
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    // Direct language change without subscription
const changeLanguage = async (lng: string) => {
  try {
    await i18n.changeLanguage(lng);
    // Update Zustand store directly
    useAppStore.getState().setLanguage(lng);
    useAppStore.getState().setRTL(['ar', 'ku'].includes(lng));
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

// Replace the handleLanguageSelected function
const handleLanguageSelected = async (languageCode: string) => {
  setIsLanguageModalVisible(false);

  if (languageCode === currentLanguage) {
    return; // Just close modal if same language
  }

  try {
    await changeLanguage(languageCode);
    // Language changes instantly, no alerts needed
  } catch (error) {
    console.error('Error changing language:', error);
  }
};
  const handleGoBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Crown size={22} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Premium</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Upgrade your experience</Text>
          </View>
          
          <SettingsItem
            icon={<Crown size={20} color="#F59E0B" />}
            title={t('subscription:title', 'Subscription')}
            subtitle="Manage your premium subscription"
            onPress={() => router.push('/settings/subscription')}
          />
        </View>

        {/* Account Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <User size={22} color="#10B981" />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Manage your personal information</Text>
          </View>
          
          <View style={styles.itemsContainer}>
            <SettingsItem
              icon={<User size={20} color="#8B5CF6" />}
              title={t('personalInfoScreen:headerTitle', 'Personal Information')}
              subtitle={t('personalInfoScreen:headerSubtitle', 'Update your profile details')}
              onPress={() => router.push('/settings/personal-info')}
            />
            <View style={styles.itemDivider} />
            <SettingsItem
              icon={<SettingsIcon size={20} color="#059669" />}
              title={t('accountSettingsScreen:headerTitle', 'Account Settings')}
              subtitle={t('accountSettingsScreen:headerSubtitle', 'Manage your account information')}
              onPress={() => router.push('/settings/account-settings')}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <SettingsIcon size={22} color="#3B82F6" />
              <Text style={styles.sectionTitle}>App Settings</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Customize your app experience</Text>
          </View>
          
          <View style={styles.itemsContainer}>
            <SettingsItem
              icon={<Bell size={20} color="#3B82F6" />}
              title={t('common:notifications', 'Notifications')}
              subtitle={t('common:notificationsSubtitle', 'Manage notification preferences')}
              onPress={() => router.push('/settings/notifs')}
            />
            <View style={styles.itemDivider} />
            <SettingsItem
              icon={<Languages size={20} color="#6B7280" />}
              title={t('common:languageTitle', 'Language')}
              subtitle={t('common:languageSub', 'Change app language')}
              onPress={() => setIsLanguageModalVisible(true)}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <CircleQuestionMark size={22} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Help & Support</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Get help when you need it</Text>
          </View>
          
          <SettingsItem
            icon={<CircleQuestionMark size={20} color="#F59E0B" />}
            title={t('common:helpSupport', 'Help & Support')}
            subtitle={t('common:helpSupportSubtitle', 'Frequently Asked Questions')}
            onPress={() => router.push('/settings/faqs')}
          />
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <LanguageSelectionModal
        isVisible={isLanguageModalVisible}
        onClose={() => setIsLanguageModalVisible(false)}
        onSelectLanguage={handleLanguageSelected}
      />
    </SafeAreaView>
  );
}

// Settings Item Component
const SettingsItem = ({ 
  icon, 
  title, 
  subtitle, 
  onPress 
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.settingsItemLeft}>
      <View style={styles.settingsIconContainer}>
        {icon}
      </View>
      <View style={styles.settingsTextContainer}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <View style={styles.chevronContainer}>
      <ArrowLeft size={16} color="#9CA3AF" style={{ transform: [{ rotate: '180deg' }] }} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  itemsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});