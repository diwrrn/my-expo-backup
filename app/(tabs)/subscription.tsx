import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Check, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { usePurchases } from '@/hooks/usePurchases';
import { CustomPaywall } from '@/components/CustomPaywall';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign } from '@/hooks/useRTL';
import { useLanguage } from '@/contexts/LanguageContext';
import { router } from 'expo-router';

export default function SubscriptionScreen() {
  const { hasPremium, loading, restorePurchases } = usePurchases();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const [showPaywall, setShowPaywall] = React.useState(false);

  const handleShowPaywall = () => {
    setShowPaywall(true);
  };

  const handleRestorePurchases = async () => {
    try {
      const result = await restorePurchases();
      if (result.success) {
        Alert.alert(
          t('subscription:success'),
          t('subscription:restoreSuccess'),
          [{ text: t('common:ok'), style: 'default' }]
        );
      } else {
        Alert.alert(
          t('subscription:error'),
          result.error || t('subscription:restoreError'),
          [{ text: t('common:ok'), style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('subscription:error'),
        t('subscription:restoreError'),
        [{ text: t('common:ok'), style: 'default' }]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      flex: 1,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    content: {
      padding: 24,
    },
    statusCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    statusIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    statusText: {
      flex: 1,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    statusDescription: {
      fontSize: 16,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    featuresCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    featuresTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 16,
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    featureIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#10B981',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    featureText: {
      flex: 1,
      fontSize: 16,
      color: '#374151',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    actionButtons: {
      gap: 12,
    },
    primaryButton: {
      backgroundColor: '#3B82F6',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    secondaryButton: {
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: '#374151',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.statusDescription}>{t('subscription:loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#F0FDF4', '#F9FAFB']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('subscription:title')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[
                styles.statusIcon,
                { backgroundColor: hasPremium ? '#10B981' : '#F59E0B' }
              ]}>
                <Crown size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statusText}>
                <Text style={styles.statusTitle}>
                  {hasPremium ? t('subscription:premiumActive') : t('subscription:freePlan')}
                </Text>
                <Text style={styles.statusDescription}>
                  {hasPremium ? t('subscription:premiumDescription') : t('subscription:freeDescription')}
                </Text>
              </View>
            </View>
          </View>

          {/* Features Card */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>{t('subscription:premiumFeatures')}</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature1')}</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature2')}</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature3')}</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature4')}</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature5')}</Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Check size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.featureText}>{t('subscription:feature6')}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {!hasPremium && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleShowPaywall}
                disabled={loading}
              >
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>
                  {t('subscription:upgradeToPremium')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRestorePurchases}
                disabled={loading}
              >
                <RefreshCw size={20} color="#374151" />
                <Text style={styles.secondaryButtonText}>
                  {t('subscription:restorePurchases')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Paywall Modal */}
      <CustomPaywall
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}