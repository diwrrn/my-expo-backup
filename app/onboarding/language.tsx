import React, { useState, useEffect } from 'react'; // Import useState
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'; // Import Alert
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { useAppStore } from '@/store/appStore';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, isRTL } = useAppStore();

  // New state to hold the temporarily selected language
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(currentLanguage);

  // Update tempSelectedLanguage if currentLanguage changes externally (e.g., initial load)
  useEffect(() => {
    setTempSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  // This function now only updates the local state
  const handleLanguageSelect = (language: string) => {
    setTempSelectedLanguage(language);
  };

  // This function now triggers the actual language change and navigation
  const handleContinue = async () => {
    try {
      // Only change language if it's different from the current one
      if (tempSelectedLanguage !== currentLanguage) {
        await changeLanguage(tempSelectedLanguage);
      }
      router.push('/onboarding/personal-info');
    } catch (error) {
      console.error('Error changing language on continue:', error);
      Alert.alert(t('common:error'), t('common:languageChangeError'));
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ku', name: 'کوردی', flag: '🇮🇶' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const styles = StyleSheet.create({
    welcomeContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      lineHeight: 28,
    },
    languageOptions: {
      marginTop: 16,
    },
    flagIcon: {
      fontSize: 24,
    },
    // New styles for language buttons
    languageButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: '#E5E7EB',
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageButtonSelected: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    languageButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
      textAlign: 'center',
    },
    languageButtonTextSelected: {
      color: '#FFFFFF',
    },
    languageButtonIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    languageButtonIconContainerSelected: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    // Styles for the submit button
    submitButton: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 'auto', // Pushes the button to the bottom
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    multiLanguageTitle: {
      marginBottom: 32,
      alignItems: 'center',
    },
    multiLanguageTitleText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
      lineHeight: 28,
    },
  });

  return (
    <OnboardingLayout
      title="" // Empty title, as we're creating a custom one
      subtitle="" // Empty subtitle
      progress={1}
      showBackButton={false}
    >
      <View style={styles.multiLanguageTitle}>
        <Text style={styles.multiLanguageTitleText}>
          {t('onboarding:languageTitle', 'Choose Your Language')}
        </Text>
        <Text style={styles.multiLanguageTitleText}>
          {t('onboarding:languageTitle', { lng: 'ku' })}
        </Text>
        <Text style={styles.multiLanguageTitleText}>
          {t('onboarding:languageTitle', { lng: 'ar' })}
        </Text>
      </View>

      <View style={styles.languageOptions}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              tempSelectedLanguage === lang.code && styles.languageButtonSelected, // Use tempSelectedLanguage
            ]}
            onPress={() => handleLanguageSelect(lang.code)}
          >
            <View
              style={[
                styles.languageButtonIconContainer,
                tempSelectedLanguage === lang.code && styles.languageButtonIconContainerSelected, // Use tempSelectedLanguage
              ]}
            >
              <Text style={styles.flagIcon}>{lang.flag}</Text>
            </View>
            <Text
              style={[
                styles.languageButtonText,
                tempSelectedLanguage === lang.code && styles.languageButtonTextSelected, // Use tempSelectedLanguage
              ]}
            >
              {lang.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleContinue}
      >
        <Text style={styles.submitButtonText}>
          {t('onboarding:continue', 'Continue')}
        </Text>
      </TouchableOpacity>
    </OnboardingLayout>
  );
}
