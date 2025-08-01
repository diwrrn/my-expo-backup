import { I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

export const useRTL = () => {
  const { i18n } = useTranslation();
  
  // Guard I18nManager access for web compatibility
  if (Platform.OS === 'web') {
    return ['ar', 'ku'].includes(i18n.language); // Check current language
  }
  
  // For native, check both I18nManager and current language
  const isLanguageRTL = ['ar', 'ku'].includes(i18n.language);
  return isLanguageRTL;
};
// Helper for conditional styling
export const getDirectionalStyle = (isRTL: boolean, ltrStyle: any, rtlStyle: any) => {
  return isRTL ? rtlStyle : ltrStyle;
};

// Helper for text alignment
export const getTextAlign = (isRTL: boolean) => {
  return isRTL ? 'right' : 'left';
};

// Helper for flex direction
export const getFlexDirection = (isRTL: boolean) => {
  return isRTL ? 'row-reverse' : 'row';
};

// Helper for margin
export const getMargin = (isRTL: boolean, side: 'start' | 'end', value: number) => {
  if (side === 'start') {
    return isRTL ? { marginRight: value } : { marginLeft: value };
  } else {
    return isRTL ? { marginLeft: value } : { marginRight: value };
  }
};

// Helper for padding
export const getPadding = (isRTL: boolean, side: 'start' | 'end', value: number) => {
  if (side === 'start') {
    return isRTL ? { paddingRight: value } : { paddingLeft: value };
  } else {
    return isRTL ? { paddingLeft: value } : { paddingRight: value };
  }
};