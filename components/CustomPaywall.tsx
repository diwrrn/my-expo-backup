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
import { X, Crown, Check, Heart, Target, TrendingUp, Users, Zap, Apple, Award } from 'lucide-react-native';
import { usePurchases } from '@/hooks/usePurchases';
import { usePremiumContext } from '@/contexts/PremiumContext';

import { useTranslation } from 'react-i18next';
import { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface CustomPaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function CustomPaywall({ visible, onClose }: CustomPaywallProps) {
  const { getAvailablePackages, purchasePackage } = usePurchases();
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = React.useState(false);
  const { loading } = usePremiumContext();

  // Simplified animations that won't interfere with scrolling
  const breathingScale = useSharedValue(1);
  const calorieCounter = useSharedValue(0);
  const proteinProgress = useSharedValue(0);
  const carbsProgress = useSharedValue(0);
  const fatProgress = useSharedValue(0);
  const userCounter = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      // Gentle breathing animation for crown (simplified)
      breathingScale.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );

      // Animate counters with natural delays
      setTimeout(() => {
        calorieCounter.value = withSpring(2847, { damping: 15, stiffness: 50 });
        userCounter.value = withSpring(47532, { damping: 12, stiffness: 40 });
      }, 300);

      setTimeout(() => {
        proteinProgress.value = withSpring(0.85, { damping: 15, stiffness: 60 });
      }, 500);

      setTimeout(() => {
        carbsProgress.value = withSpring(0.72, { damping: 15, stiffness: 60 });
      }, 700);

      setTimeout(() => {
        fatProgress.value = withSpring(0.68, { damping: 15, stiffness: 60 });
      }, 900);
    }
  }, [visible]);

  // Simplified animated styles
  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  const calorieStyle = useAnimatedStyle(() => ({
    opacity: interpolate(calorieCounter.value, [0, 2847], [0, 1]),
  }));

  const userCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(userCounter.value, [0, 47532], [0, 1]),
  }));

  // Progress ring styles
  const proteinRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${proteinProgress.value * 360}deg` }],
  }));

  const carbsRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${carbsProgress.value * 360}deg` }],
  }));

  const fatRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fatProgress.value * 360}deg` }],
  }));

  const packages = getAvailablePackages();

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      
      if (result.success) {
        Alert.alert(
          '�� Welcome to Premium!',
          'Your nutrition journey just got supercharged!',
          [
            {
              text: 'Start Tracking',
              onPress: onClose
            }
          ]
        );
      } else {
        Alert.alert(
          'Oops!',
          result.error || 'Something went wrong. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Oops!',
        'Something went wrong. Please try again.'
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
      return 'Monthly Plan';
    } else if (pkg.identifier.includes('3months')) {
      return '3-Month Plan';
    }
    return pkg.product.title || pkg.identifier;
  };

  const getPackageDescription = (pkg: PurchasesPackage): string => {
    if (pkg.identifier.includes('monthly')) {
      return 'Perfect for getting started';
    } else if (pkg.identifier.includes('3months')) {
      return 'Most popular choice';
    }
    return pkg.product.description || '';
  };

  const getBestValuePackage = (): PurchasesPackage | null => {
    return packages.find(pkg => pkg.identifier.includes('3months')) || null;
  };

  const bestValuePackage = getBestValuePackage();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Simplified static background */}
        <View style={styles.backgroundPattern} pointerEvents="none">
          <View style={[styles.organicShape, styles.shape1]} />
          <View style={[styles.organicShape, styles.shape2]} />
          <View style={[styles.organicShape, styles.shape3]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Animated.View style={breathingStyle}>
              <Crown size={20} color="#22C55E" />
            </Animated.View>
            <Text style={styles.headerTitle}>Go Premium</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Use regular ScrollView instead of Animated.ScrollView for better performance */}
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Animated.View style={[styles.heroIcon, breathingStyle]}>
              <LinearGradient
                colors={['#22C55E', '#16A34A', '#15803D']}
                style={styles.heroIconGradient}
              >
                <Crown size={48} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.heroTitle}>
              Transform Your Health Journey ��
            </Text>
            <Text style={styles.heroSubtitle}>
              Join thousands who've reached their nutrition goals with personalized meal plans and smart tracking
            </Text>
            
            {/* Live Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Animated.Text style={[styles.statNumber, calorieStyle]}>
                  {Math.round(calorieCounter.value).toLocaleString()}
                </Animated.Text>
                <Text style={styles.statLabel}>Calories tracked today</Text>
              </View>
              
              <View style={styles.statCard}>
                <Animated.Text style={[styles.statNumber, userCountStyle]}>
                  {Math.round(userCounter.value).toLocaleString()}+
                </Animated.Text>
                <Text style={styles.statLabel}>Happy users</Text>
              </View>
            </View>

            {/* Macro Progress Rings */}
            <View style={styles.macroSection}>
              <Text style={styles.macroTitle}>Your daily nutrition goals</Text>
              <View style={styles.macroRings}>
                <View style={styles.macroRing}>
                  <View style={styles.progressRing}>
                    <Animated.View style={[styles.progressFill, styles.proteinFill, proteinRingStyle]} />
                  </View>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroPercent}>85%</Text>
                </View>
                
                <View style={styles.macroRing}>
                  <View style={styles.progressRing}>
                    <Animated.View style={[styles.progressFill, styles.carbsFill, carbsRingStyle]} />
                  </View>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroPercent}>72%</Text>
                </View>
                
                <View style={styles.macroRing}>
                  <View style={styles.progressRing}>
                    <Animated.View style={[styles.progressFill, styles.fatFill, fatRingStyle]} />
                  </View>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroPercent}>68%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Real Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>
              What you'll unlock
            </Text>
            
            <View style={styles.benefitsList}>
              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Target size={24} color="#22C55E" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Personalized Meal Plans</Text>
                  <Text style={styles.benefitDescription}>
                    Get custom meal plans based on your goals, preferences, and dietary restrictions
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <TrendingUp size={24} color="#3B82F6" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Advanced Analytics</Text>
                  <Text style={styles.benefitDescription}>
                    Track 50+ nutrients, see weekly trends, and get insights into your eating patterns
                  </Text>
                </View>
              </View>

              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}>
                  <Heart size={24} color="#EF4444" />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Health Coaching</Text>
                  <Text style={styles.benefitDescription}>
                    Get personalized tips and recommendations from certified nutritionists
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <View style={styles.testimonialCard}>
              <Text style={styles.testimonialText}>
                "I lost 22 pounds in 4 months using the meal planner. It's like having a nutritionist in my pocket!"
              </Text>
              <Text style={styles.testimonialAuthor}>— Sarah M.</Text>
            </View>
          </View>

          {/* Packages */}
          <View style={styles.packagesSection}>
            <Text style={styles.packagesTitle}>
              Choose your plan
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
                  activeOpacity={0.95}
                >
                  {isBestValue && (
                    <View style={styles.bestValueBadge}>
                      <Award size={16} color="#FFFFFF" />
                      <Text style={styles.bestValueText}>Most Popular</Text>
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
                      
                      <View style={styles.packageFeatures}>
                        <View style={styles.featureRow}>
                          <Check size={16} color="#22C55E" />
                          <Text style={styles.featureText}>Unlimited meal plans</Text>
                        </View>
                        <View style={styles.featureRow}>
                          <Check size={16} color="#22C55E" />
                          <Text style={styles.featureText}>Advanced nutrient tracking</Text>
                        </View>
                        <View style={styles.featureRow}>
                          <Check size={16} color="#22C55E" />
                          <Text style={styles.featureText}>Export your data</Text>
                        </View>
                        {isBestValue && (
                          <View style={styles.featureRow}>
                            <Check size={16} color="#22C55E" />
                            <Text style={[styles.featureText, styles.highlightText]}>Save 40% vs monthly</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.packagePricing}>
                      <Text style={styles.packagePrice}>
                        {getPackagePrice(pkg)}
                      </Text>
                      <Text style={styles.packagePeriod}>per month</Text>
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

          {/* Trust Section */}
          <View style={styles.trustSection}>
            <View style={styles.trustItems}>
              <View style={styles.trustItem}>
                <Users size={18} color="#22C55E" />
                <Text style={styles.trustText}>47K+ users trust us</Text>
              </View>
              <View style={styles.trustItem}>
                <Heart size={18} color="#EF4444" />
                <Text style={styles.trustText}>Cancel anytime</Text>
              </View>
              <View style={styles.trustItem}>
                <Zap size={18} color="#F59E0B" />
                <Text style={styles.trustText}>Instant activation</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Subscription auto-renews. Cancel anytime in your account settings. By subscribing, you agree to our Terms of Service.
            </Text>
          </View>
        </ScrollView>

        {/* Natural Loading */}
        {purchasing && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <Animated.View style={breathingStyle}>
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={styles.loadingIcon}
                >
                  <Crown size={32} color="#FFFFFF" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.loadingText}>
                Setting up your premium experience...
              </Text>
              <ActivityIndicator size="large" color="#22C55E" style={styles.loadingSpinner} />
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
    overflow: 'hidden',
    pointerEvents: 'none', // Ensure background doesn't interfere with touches
  },
  organicShape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.04,
  },
  shape1: {
    width: 200,
    height: 150,
    backgroundColor: '#22C55E',
    top: 100,
    right: -50,
    transform: [{ rotate: '25deg' }],
  },
  shape2: {
    width: 150,
    height: 200,
    backgroundColor: '#16A34A',
    bottom: 200,
    left: -30,
    transform: [{ rotate: '-15deg' }],
  },
  shape3: {
    width: 100,
    height: 120,
    backgroundColor: '#15803D',
    top: 300,
    left: 50,
    transform: [{ rotate: '45deg' }],
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
    borderBottomColor: '#F1F5F9',
    zIndex: 10, // Ensure header is above background
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent', // Ensure scroll view is transparent
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Add bottom padding for better scrolling
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  heroSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  macroSection: {
    width: '100%',
    alignItems: 'center',
  },
  macroTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
  },
  macroRings: {
    flexDirection: 'row',
    gap: 24,
  },
  macroRing: {
    alignItems: 'center',
    gap: 8,
  },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '50%',
    height: '100%',
    transformOrigin: 'right center',
  },
  proteinFill: {
    backgroundColor: '#22C55E',
  },
  carbsFill: {
    backgroundColor: '#3B82F6',
  },
  fatFill: {
    backgroundColor: '#F59E0B',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  macroPercent: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  benefitsSection: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  benefitsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  benefitsList: {
    gap: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  socialProof: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  testimonialCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  testimonialText: {
    fontSize: 16,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  testimonialAuthor: {
    fontSize: 14,
    color: '#22C55E',
    fontWeight: '600',
  },
  packagesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  packagesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  bestValueCard: {
    borderColor: '#22C55E',
    backgroundColor: '#F0FDF4',
    transform: [{ scale: 1.02 }],
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    left: 24,
    backgroundColor: '#22C55E',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bestValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  packageDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  packageFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  highlightText: {
    fontWeight: '600',
    color: '#22C55E',
  },
  packagePricing: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  packagePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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
  trustItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 20,
  },
  trustItem: {
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 40,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});