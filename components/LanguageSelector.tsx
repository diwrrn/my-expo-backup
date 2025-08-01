import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';

export function LanguageSelector() {
  const { currentLanguage, changeLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ku', name: 'کوردی', flag: '🇮🇶' }, // Using Iraq flag for Kurdish
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }, // Using Saudi Arabia flag for Arabic
  ];

  const handleChangeLanguage = async (lng: string) => {
    if (currentLanguage === lng) return;
    await changeLanguage(lng);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { textAlign: getTextAlign(isRTL) }]}>
        {t('common:selectLanguage')}
      </Text>
      <View style={styles.languageOptions}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              currentLanguage === lang.code && styles.selectedLanguageButton,
            ]}
            onPress={() => handleChangeLanguage(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text
              style={[
                styles.languageText,
                currentLanguage === lang.code && styles.selectedLanguageText,
              ]}
            >
              {lang.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  languageButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 100,
    margin: 5,
  },
  selectedLanguageButton: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  flag: {
    fontSize: 24,
    marginBottom: 5,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  selectedLanguageText: {
    color: '#FFFFFF',
  },
});