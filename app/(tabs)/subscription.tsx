// app/(tabs)/subscription.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePurchases } from '@/hooks/usePurchases';
import { CustomPaywall } from '@/components/CustomPaywall';
import { RevenueCatFallback } from '@/components/RevenueCatFallback';
import { useRTL } from '@/hooks/useRTL';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumContext } from '@/contexts/PremiumContext';


export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const { user } = useAuth();
  const { customerInfo, offerings, purchasePackage, restorePurchases } = usePurchases();
  const [showPaywall, setShowPaywall] = useState(false);
  const { hasPremium, loading } = usePremiumContext();

  const handleShowPaywall = () => {
    setShowPaywall(true);
  };

  const handleRestorePurchases = async () => {
    const result = await restorePurchases();
    if (result.success) {
      Alert.alert(
        t('subscription:restoreSuccess'),
        t('subscription:restoreSuccessMessage')
      );
    } else {
      Alert.alert(
        t('subscription:restoreError'),
        result.error || t('subscription:restoreErrorMessage')
      );
    }
  };

  const handleRefresh = async () => {
    await refreshCustomerInfo();
  };

  const copyUserId = () => {
    if (user?.id) {
      Clipboard.setString(user.id);
      Alert.alert('✓ Copied!', 'User ID copied to clipboard');
    }
  };

  // Show fallback if RevenueCat is not available
  if (!customerInfo && !loading) {
    return <RevenueCatFallback onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={[styles.scrollView, { direction: isRTL ? 'rtl' : 'ltr' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('subscription:title')}</Text>
          <Text style={styles.subtitle}>Manage your nutrition journey</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loading}>{t('subscription:loading')}</Text>
          </View>
        ) : (
          <>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <View>
                  <Text style={styles.statusTitle}>Current Plan</Text>
                  <Text style={styles.statusSubtitle}>
                    {hasPremium ? 'Premium Nutrition Plan' : 'Basic Nutrition Plan'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, hasPremium ? styles.premiumBadge : styles.freeBadge]}>
                  <Text style={styles.statusBadgeText}>
                    {hasPremium ? 'PRO' : 'FREE'}
                  </Text>
                </View>
              </View>
              
              {/* Premium Expiry */}
              {hasPremium && customerInfo && (
                <View style={styles.expirySection}>
                  <View style={styles.expiryRow}>
                    <Text style={styles.expiryLabel}>Valid until</Text>
                    <View style={styles.expiryBadge}>
                      <Text style={styles.expiryBadgeText}>
                        {new Date(customerInfo.entitlements.active.premium.expirationDate) > new Date() 
                          ? 'Active' 
                          : 'Expired'
                        }
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.expiryDate}>
                    {customerInfo.entitlements?.active?.premium?.expirationDate 
                      ? new Date(customerInfo.entitlements.active.premium.expirationDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'No expiry date available'
                    }
                  </Text>
                </View>
              )}
            </View>

            {/* User ID Card */}
            <View style={styles.userIdCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Account Information</Text>
              </View>
              <View style={styles.userIdRow}>
                <View style={styles.userIdContent}>
                  <Text style={styles.userIdLabel}>User ID</Text>
                  <Text style={styles.userIdText} numberOfLines={1} ellipsizeMode="middle">
                    {user?.id || 'Not available'}
                  </Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={copyUserId}>
                  <Text style={styles.copyButtonText}>Copy</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Features Section */}
            {hasPremium ? (
              <View style={styles.featuresCard}>
                <Text style={styles.featuresTitle}>🌟 Premium Features Unlocked</Text>
                <View style={styles.featuresList}>
                  <FeatureItem text={t('subscription:feature1')} />
                  <FeatureItem text={t('subscription:feature2')} />
                  <FeatureItem text={t('subscription:feature3')} />
                  <FeatureItem text={t('subscription:feature4')} />
                  <FeatureItem text={t('subscription:feature5')} />
                  <FeatureItem text={t('subscription:feature6')} />
                  <FeatureItem text={t('subscription:feature7')} />
                  <FeatureItem text={t('subscription:feature8')} />
                </View>
              </View>
            ) : (
              <View style={styles.upgradeCard}>
                <View style={styles.upgradeHeader}>
                  <Text style={styles.upgradeEmoji}>🚀</Text>
                  <Text style={styles.upgradeTitle}>Unlock Premium Nutrition</Text>
                  <Text style={styles.upgradeDescription}>
                    Get personalized meal plans, advanced tracking, and expert nutrition insights
                  </Text>
                </View>
                
                <View style={styles.upgradeFeatures}>
                  <UpgradeFeature text="Personalized meal plans" />
                  <UpgradeFeature text="Advanced macro tracking" />
                  <UpgradeFeature text="Recipe recommendations" />
                  <UpgradeFeature text="Priority support" />
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.upgradeButton} onPress={handleShowPaywall}>
                    <Text style={styles.upgradeButtonText}>
                      {t('subscription:upgradeToPremium')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.restoreButton} onPress={handleRestorePurchases}>
                    <Text style={styles.restoreButtonText}>
                      {t('subscription:restorePurchases')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showPaywall && (
        <CustomPaywall
          offerings={offerings}
          onPurchase={purchasePackage}
          onClose={() => setShowPaywall(false)}
        />
      )}
    </View>
  );
}

// Helper Components
const FeatureItem = ({ text }: { text: string }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>✓</Text>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const UpgradeFeature = ({ text }: { text: string }) => (
  <View style={styles.upgradeFeatureItem}>
    <Text style={styles.upgradeFeatureIcon}>•</Text>
    <Text style={styles.upgradeFeatureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loading: {
    fontSize: 16,
    color: '#64748B',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#10B981',
  },
  freeBadge: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expirySection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  expiryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expiryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  expiryBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiryBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  expiryDate: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  userIdCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  userIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userIdContent: {
    flex: 1,
    marginRight: 12,
  },
  userIdLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  userIdText: {
    fontSize: 13,
    color: '#1E293B',
    fontFamily: 'monospace',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  featureIcon: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '700',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  upgradeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  upgradeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  upgradeFeatures: {
    marginBottom: 24,
    gap: 8,
  },
  upgradeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  upgradeFeatureIcon: {
    fontSize: 18,
    color: '#3B82F6',
    fontWeight: '700',
    marginRight: 12,
    width: 20,
  },
  upgradeFeatureText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restoreButton: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  restoreButtonText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
});