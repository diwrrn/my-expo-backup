// app/(tabs)/settings/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, User, Settings as SettingsIcon, Circle as HelpCircle, Smartphone, Languages, CircleQuestionMark  } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { SettingsItem } from '@/components/SettingsItem';
import { router } from 'expo-router';
import { useState } from 'react'; // Import useState
import { LanguageSelectionModal } from '@/components/LanguageSelectionModal'; // Import the new modal
import { useLanguage } from '@/contexts/LanguageContext'; // Import useLanguage hook
import { Alert } from 'react-native'; // Import Alert

export default function SettingsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { currentLanguage, changeLanguage } = useLanguage(); // Use the language context

  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false); // State for modal visibility

  const handleLanguageSelected = async (languageCode: string) => {
    setIsLanguageModalVisible(false); // Close the selection modal

    if (languageCode === currentLanguage) {
      Alert.alert(t('common:languageTitle'), t('common:languageAlreadySelected')); // Add this translation key
      return;
    }

    Alert.alert(
      t('common:languageTitle'),
      t('common:confirmLanguageChange', { language: languageCode }), // Add this translation key
      [
        {
          text: t('common:cancel'),
          style: 'cancel',
        },
        {
          text: t('common:ok'),
          onPress: async () => {
            try {
              await changeLanguage(languageCode);
              // The changeLanguage function in LanguageContext already handles reload for RTL changes.
              // If no reload happens (e.g., changing from en to another LTR language),
              // we explicitly navigate to the homepage.
              router.replace('/(tabs)/'); // Redirect to homepage
            } catch (error) {
              console.error('Error changing language:', error);
              Alert.alert(t('common:error'), t('common:languageChangeError'));
            }
          },
        },
      ]
    );
  };

  const settingsItems = [
    {
      icon: <Bell size={20} color="#3B82F6" />,
      title: t('common:notifications'),
      subtitle: t('common:notificationsSubtitle'),
      onPress: () => console.log('Notifications'),
    },
    {
      icon: <User size={20} color="#8B5CF6" />,
      title: t('personalInfoScreen:headerTitle'),
      subtitle: t('personalInfoScreen:headerSubtitle'),
      onPress: () => router.push('/settings/personal-info'),
    },
    {
      icon: <SettingsIcon size={20} color="#059669" />,
      title: t('accountSettingsScreen:headerTitle'),
      subtitle: t('accountSettingsScreen:headerSubtitle'),
      onPress: () => router.push('/settings/account-settings'),
    },
    {
      icon: <CircleQuestionMark  size={20} color="#F59E0B" />,
      title: t('common:helpSupport'),
      subtitle: t('common:helpSupportSubtitle'),
      onPress: () => router.push('/(tabs)/faqs'), // MODIFIED: Navigate to FAQs screen
    },
    {
      icon: <Languages size={20} color="#6B7280" />,
      title: t('common:languageTitle'),
      subtitle: t('common:languageSub'),
      onPress: () => setIsLanguageModalVisible(true), // Open the language selection modal
    },
  ];

  const handleGoBack = () => {
    router.back();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90, // Space for footer navigation
    },
    header: {
      backgroundColor: '#FFFFFF',
      padding: 24,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
    },
    settingsSection: {
      paddingHorizontal: 24,
      paddingTop: 24,
      marginBottom: 32,
    },
    appInfoSection: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    appInfoTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
    },
    appInfoCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 20,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    appInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    appInfoLabel: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '500',
    },
    appInfoValue: {
      fontSize: 16,
      color: '#111827',
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
          {/* Header */}
          <View style={[styles.header, { flexDirection: getFlexDirection(isRTL) }]}>
            <TouchableOpacity
              style={[styles.backButton, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}
              onPress={handleGoBack}
            >
              <ArrowLeft size={24} color="#111827" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { textAlign: getTextAlign(isRTL) }]}>
                {t('common:settings')}
              </Text>
              
            </View>
          </View>

          {/* Settings Items */}
          <View style={styles.settingsSection}>
            {settingsItems.map((item, index) => (
              <SettingsItem
                key={index}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
              />
            ))}
          </View>

          {/* App Info */}
          <View style={styles.appInfoSection}>
            <Text style={[styles.appInfoTitle, { textAlign: getTextAlign(isRTL) }]}>
              {t('common:appInformation')}
            </Text>
            <View style={styles.appInfoCard}>
              <View style={[styles.appInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <Text style={[styles.appInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                  {t('common:version')}
                </Text>
                <Text style={styles.appInfoValue}>1.0.0</Text>
              </View>
              <View style={[styles.appInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <Text style={[styles.appInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                  {t('common:build')}
                </Text>
                <Text style={styles.appInfoValue}>2024.01.15</Text>
              </View>
              <View style={[styles.appInfoRow, { flexDirection: getFlexDirection(isRTL) }]}>
                <Text style={[styles.appInfoLabel, { textAlign: getTextAlign(isRTL) }]}>
                  {t('common:platform')}
                </Text>
                <Text style={styles.appInfoValue}>Expo</Text>
              </View>
            </View>
          </View>
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
