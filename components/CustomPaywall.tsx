// components/CustomPaywall.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { X, Crown, Check, Heart, Target, TrendingUp, Shield, Zap, Apple } from 'lucide-react-native';
import { usePurchases } from '@/hooks/usePurchases';
import { useTranslation } from 'react-i18next';
import { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface CustomPaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function CustomPaywall({ visible, onClose }: CustomPaywallProps) {
  const { getAvailablePackages, purchasePackage, loading } = usePurchases();
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = React.useState(false);

  // Gentle animations
  const pulseScale = useSharedValue(1);
  const floatY = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Gentle pulse animation
      pulseScale.value = withRepeat(
        withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Gentle float animation
      floatY.value = withRepeat(
        withTiming(-5, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [visible]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const floatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const packages = getAvailablePackages();

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      
      if (result.success) {
        Alert.alert(
          '🎉 ' + t('subscription:success'),
          t('subscription:purchaseSuccess'),
          [
            {
              text: t('common:ok'),
              onPress: onClose
            }
          ]
        );
      } else {
        Alert.alert(
          '⚠️ ' + t('subscription:error'),
          result.error || t('subscription:purchaseError')
        );
      }
    } catch (error) {
      Alert.alert(
        '⚠️ ' + t('subscription:error'),
        t('subscription:purchaseError')
      );
    } finally {
      setPurchasing(false);
    }
  };

  const getPackagePrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString || 'Price unavailable';
  };

  const getPackageTitle = (pkg: PurchasesPackage): string => {
    if (pkg.identifier.includes('monthly')) {
      return t('subscription:monthlyPlan');
    } else if (pkg.identifier.includes('3months')) {
      return t('subscription:threeMonthPlan');
    }
    return pkg.product.title || pkg.identifier;
  };

  const getPackageDescription = (pkg: PurchasesPackage): string => {
    if (pkg.identifier.includes('monthly')) {
      return t('subscription:monthlyDescription');
    } else if (pkg.identifier.includes('3months')) {
      return t('subscription:threeMonthDescription');
    }
    return pkg.product.description || '';
  };

  const getBestValuePackage = (): PurchasesPackage | null => {
    return packages.find(pkg => pkg.identifier.includes('3months')) || null;
  };

  const bestValuePackage = getBestValuePackage();

  const features = [
    { icon: Target, text: t('subscription:feature1'), color: '#22C55E', bgColor: '#DCFCE7' },
    { icon: TrendingUp, text: t('subscription:feature2'), color: '#3B82F6', bgColor: '#DBEAFE' },
    { icon: Heart, text: t('subscription:feature3'), color: '#EF4444', bgColor: '#FEE2E2' },
    { icon: Shield, text: t('subscription:feature4'), color: '#8B5CF6', bgColor: '#EDE9FE' },
    { icon: Zap, text: t('subscription:feature5'), color: '#F59E0B', bgColor: '#FEF3C7' },
    { icon: Apple, text: t('subscription:feature6'), color: '#10B981', bgColor: '#D1FAE5' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Subtle Background Pattern */}
        <View style={styles.backgroundPattern} pointerEvents="none">
          <Animated.View style={[styles.backgroundIcon, styles.bgIcon1, floatAnimatedStyle]}>
            <Apple size={24} color="rgba(34, 197, 94, 0.08)" />
          </Animated.View>
          <Animated.View style={[styles.backgroundIcon, styles.bgIcon2, pulseAnimatedStyle]}>
            <Heart size={20} color="rgba(239, 68, 68, 0.08)" />
          </Animated.View>
          <Animated.View style={[styles.backgroundIcon, styles.bgIcon3, floatAnimatedStyle]}>
            <Target size={22} color="rgba(59, 130, 246, 0.08)" />
          </Animated.View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Crown size={20} color="#22C55E" />
            <Text style={styles.headerTitle}>{t('subscription:upgradeToPremium')}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Animated.View style={[styles.heroIcon, pulseAnimatedStyle]}>
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                style={styles.heroIconGradient}
              >
                <Crown size={48} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.heroTitle}>
              Unlock Premium Nutrition 🌱
            </Text>
            <Text style={styles.heroSubtitle}>
              Get personalized meal plans, advanced tracking, and reach your health goals faster
            </Text>
            
            {/* Health Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Recipes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50+</Text>
                <Text style={styles.statLabel}>Nutrients</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Tracking</Text>
              </View>
            </View>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>
              Premium Health Features
            </Text>
            
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.bgColor }]}>
                    <feature.icon size={20} color={feature.color} />
                  </View>
                  <Text style={styles.featureText}>
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Packages */}
          <View style={styles.packagesSection}>
            <Text style={styles.packagesTitle}>
              Choose Your Plan
            </Text>
            
            {packages.map((pkg, index) => {
              const isBestValue = bestValuePackage?.identifier === pkg.identifier;
              
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[
                    styles.packageCard,
                    isBestValue && styles.bestValueCard
                  ]}
                  onPress={() => handlePurchase(pkg)}
                  disabled={purchasing}
                >
                  {isBestValue && (
                    <View style={styles.bestValueBadge}>
                      <Text style={styles.bestValueText}>
                        🏆 Most Popular
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.packageContent}>
                    <View style={styles.packageInfo}>
                      <Text style={styles.packageTitle}>
                        {getPackageTitle(pkg)}
                      </Text>
                      <Text style={styles.packageDescription}>
                        {getPackageDescription(pkg)}
                      </Text>
                      
                      {/* Health Benefits */}
                      <View style={styles.benefitsList}>
                        <View style={styles.benefitItem}>
                          <Check size={16} color="#22C55E" />
                          <Text style={styles.benefitText}>Advanced meal planning</Text>
                        </View>
                        <View style={styles.benefitItem}>
                          <Check size={16} color="#22C55E" />
                          <Text style={styles.benefitText}>Macro & micro tracking</Text>
                        </View>
                        {isBestValue && (
                          <View style={styles.benefitItem}>
                            <Check size={16} color="#22C55E" />
                            <Text style={styles.benefitText}>Save 40% vs monthly</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.packagePricing}>
                      <Text style={styles.packagePrice}>
                        {getPackagePrice(pkg)}
                      </Text>
                      <Text style={styles.packagePeriod}>
                        per month
                      </Text>
                      {isBestValue && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsText}>Save 40%</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustSection}>
            <Text style={styles.trustTitle}>Trusted by Health Enthusiasts</Text>
            <View style={styles.trustItems}>
              <View style={styles.trustItem}>
                <Shield size={20} color="#22C55E" />
                <Text style={styles.trustText}>Secure payments</Text>
              </View>
              <View style={styles.trustItem}>
                <Heart size={20} color="#EF4444" />
                <Text style={styles.trustText}>Cancel anytime</Text>
              </View>
              <View style={styles.trustItem}>
                <Check size={20} color="#3B82F6" />
                <Text style={styles.trustText}>Instant access</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Auto-renewable subscription. Cancel anytime in settings. Terms apply.
            </Text>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {purchasing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <Animated.View style={pulseAnimatedStyle}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.loadingIcon}
                >
                  <Crown size={32} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <ActivityIndicator size="large" color="#22C55E" style={styles.loadingSpinner} />
              <Text style={styles.loadingText}>
                Activating Premium...
              </Text>
              <Text style={styles.loadingSubtext}>
                Unlocking your health journey
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundIcon: {
    position: 'absolute',
  },
  bgIcon1: {
    top: 120,
    right: 40,
  },
  bgIcon2: {
    top: 300,
    left: 30,
  },
  bgIcon3: {
    bottom: 200,
    right: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
  },
  heroIcon: {
    marginBottom: 20,
  },
  heroIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22C55E',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  featuresTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },
  packagesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  packagesTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  bestValueCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    left: 24,
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  packageInfo: {
    flex: 1,
    paddingRight: 16,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
  },
  packagePricing: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  packagePeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  savingsBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  savingsText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trustSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  trustItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustItem: {
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});