import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crown, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { useLanguage } from '@/contexts/LanguageContext';

interface RevenueCatFallbackProps {
  onRetry?: () => void;
}

export function RevenueCatFallback({ onRetry }: RevenueCatFallbackProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      padding: 16,
      margin: 16,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    icon: {
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: '#92400E',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    message: {
      fontSize: 14,
      color: '#92400E',
      marginBottom: 12,
      lineHeight: 20,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    retryButton: {
      backgroundColor: '#F59E0B',
      borderRadius: 8,
      padding: 8,
      alignItems: 'center',
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={20} color="#92400E" style={styles.icon} />
        <Text style={styles.title}>{t('subscription:unavailable')}</Text>
      </View>
      
      <Text style={styles.message}>
        {t('subscription:unavailableMessage')}
      </Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{t('subscription:retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
} 