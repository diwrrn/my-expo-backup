import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import i18n from '../services/i18n';
import { useTranslation } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import { useAppStore } from '@/store/appStore';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (lng: string) => Promise<void>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  // ADD THIS LOGGING:
  useEffect(() => {
    console.log('🔍 LanguageProvider re-rendered');
  });
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isRTL, setIsRTL] = useState(Platform.OS !== 'web' ? I18nManager.isRTL : false);

  useEffect(() => {
    const onLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
      setIsRTL(['ar', 'ku'].includes(lng));
      // Sync to Zustand
      useAppStore.getState().setLanguage(lng);
      useAppStore.getState().setRTL(['ar', 'ku'].includes(lng));
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

    try {
      await i18n.changeLanguage(lng);
      console.log(`Language changed to: ${lng}`);
      
      // Update RTL state immediately
      const newIsRTL = ['ar', 'ku'].includes(lng);
      setIsRTL(newIsRTL);
      
      // REMOVE THE I18nManager.forceRTL CALL COMPLETELY
      // Let React Native handle RTL automatically based on the language
      
    } catch (error) {
      console.error('Failed to change language:', error);
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