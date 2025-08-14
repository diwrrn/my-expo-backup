// components/LanguageSelectionModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useAppStore } from '@/store/appStore';
import KurdistanFlag from '../assets/icons/kurdistan.svg';

interface LanguageSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectLanguage: (languageCode: string) => void;
}

export function LanguageSelectionModal({
  isVisible,
  onClose,
  onSelectLanguage,
}: LanguageSelectionModalProps) {
    const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { currentLanguage } = useAppStore();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },  // Fixed: Use emoji flag
    { 
      code: 'ku', 
      name: 'کوردی', 
      flag: '🇮🇶'  // Iraq flag as fallback, but Kurdistan SVG will show
    },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];
  

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%', // Limit height for scrollability
    },
    modalHeader: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    closeButton: {
      padding: 4,
    },
    languageOptions: {
      flexDirection: 'column',
      gap: 12,
    },
    languageButton: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    languageButtonSelected: {
      backgroundColor: '#22C55E',
      borderColor: '#22C55E',
    },
    flag: {
      fontSize: 24,
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    flagContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    dualFlagContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    languageText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
      textAlign: getTextAlign(isRTL),
    },
    flagLabel: {
      fontSize: 10,
      color: '#6B7280',
      marginTop: 2,
    },
    flagLabelSelected: {
      color: '#FFFFFF',
    },
    languageTextSelected: {
      color: '#FFFFFF',
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('common:selectLanguage')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.languageOptions}>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageButton,
                    currentLanguage === lang.code && styles.languageButtonSelected,
                  ]}
                  onPress={() => onSelectLanguage(lang.code)}
                >
                  {lang.code === 'ku' ? (
                    <View style={styles.flagContainer}>
                      <KurdistanFlag width={24} height={24} />
                    </View>
                  ) : (
                    <View style={styles.flagContainer}>
                      <Text style={styles.flag}>{lang.flag}</Text>
                    </View>
                  )}
                  <Text
                    style={[
                      styles.languageText,
                      currentLanguage === lang.code && styles.languageTextSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}