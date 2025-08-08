import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import i18n from '../services/i18n';
import { useTranslation } from 'react-i18next';
import { I18nManager, Alert, Platform } from 'react-native';
import * as Updates from 'expo-updates';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lng: string) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isRTL, setIsRTL] = useState(Platform.OS !== 'web' ? I18nManager.isRTL : false);

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
      setIsRTL(['ar', 'ku'].includes(lng));
    };

    // Safety check: only add listener if i18n is fully initialized
    if (i18n && typeof i18n.on === 'function') {
      i18n.on('languageChanged', onLanguageChanged);
      
      return () => {
        if (i18n && typeof i18n.off === 'function') {
          i18n.off('languageChanged', onLanguageChanged);
        }
      };
    }
  }, [i18n]);
  const changeLanguage = useCallback(async (lng: string) => {
    if (i18n.language === lng) return;

    const wasRTL = Platform.OS !== 'web' ? I18nManager.isRTL : false;
    const willBeRTL = ['ar', 'ku'].includes(lng);

    try {
      await i18n.changeLanguage(lng);
      console.log(`Attempted to change language to: ${lng}`);

      if (wasRTL !== willBeRTL) {
        // If direction changes, prompt for app restart
        Alert.alert(
          i18n.t('common:restartRequiredTitle'),
          i18n.t('common:restartRequiredMessage'),
          [
            {
              text: i18n.t('common:cancel'),
              style: 'cancel',
            },
            {
              text: i18n.t('common:restart'),
              onPress: async () => {
                if (Platform.OS === 'web') {
                  window.location.reload();
                } else {
                  try {
                    await Updates.reloadAsync();
                  } catch (error) {
                    console.error('Failed to reload app:', error);
                    Alert.alert(
                      i18n.t('common:error'),
                      'Failed to restart the app. Please restart manually.'
                    );
                  }
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      Alert.alert(i18n.t('common:error'), i18n.t('common:languageChangeError'));
    }
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};