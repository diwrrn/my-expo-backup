// services/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Platform } from 'react-native';

import en from '../locales/en.json';
import ku from '../locales/ku.json';
import ar from '../locales/ar.json';

const LANGUAGES = {
  en, 
  ku,
  ar,
};

const LANG_CODES = Object.keys(LANGUAGES);

const STORAGE_KEY = '@APP:languageCode';

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  init: () => { console.log('[i18n] Language detector initialized'); },
  detect: async (callback: (lang: string) => void) => {
    console.log('[i18n] Language detector: Detecting language...');
    try {
      // 1. Check if language is stored in AsyncStorage
      const storedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLanguage) {
        return callback(storedLanguage);
      }

      // 2. Detect language from device locales, only if not on web
      if (Platform.OS !== 'web') {
        try {
          // Dynamically import react-native-localize only on native platforms
          const RNLocalize = await import('react-native-localize');
          // Check if the function exists before calling it
          if (RNLocalize.findBestAvailableLanguage && typeof RNLocalize.findBestAvailableLanguage === 'function') {
            const bestLanguage = RNLocalize.findBestAvailableLanguage(LANG_CODES);
            if (bestLanguage) {
              return callback(bestLanguage.languageTag);
            }
          } else {
          }
        } catch (error) {
        }
      } else {
      }

      // 3. Fallback to default language
      console.log('[i18n] No language detected, falling back to English');
      return callback('en');
    } catch (error) {
      console.error('[i18n] Error detecting language:', error);
      return callback('en'); // Fallback in case of error
    }
  },
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language);
      console.log('[i18n] Cached user language:', language);
    } catch (error) {
      console.error('[i18n] Error caching user language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: LANGUAGES,
    fallbackLng: 'en',
    debug: __DEV__, // Only enable debug in development
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false,
    },
  })
  .then(() => {
    console.log('18next initialized');
  })
  .catch((error) => {
    console.error('[i18n] i18n.init() promise rejected:', error);
  });

// Add a listener for the 'initialized' event
i18n.on('initialized', () => {
});

export default i18n;