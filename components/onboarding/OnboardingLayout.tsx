import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { ProgressBarTwo } from './ProgressBarTwo';
import { useLanguage } from '@/contexts/LanguageContext';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  progress: number;
  totalSteps?: number;
  showBackButton?: boolean;
  hideProgressBar?: boolean;
  hideHeaderContent?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  progress,
  totalSteps = 3,
  showBackButton = true,
  hideProgressBar = false,
  hideHeaderContent = false,
  children,
}: OnboardingLayoutProps) {
  const { isRTL } = useLanguage();

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <ArrowLeft size={22} color="#374151" />
            </TouchableOpacity>
          )}
          
          {!hideHeaderContent && (
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{title}</Text>
              {subtitle && (
                <Text style={styles.headerSubtitle}>{subtitle}</Text>
              )}
            </View>
          )}
        </View>

        {!hideProgressBar && (
          <View style={styles.progressContainer}>
            <ProgressBarTwo currentStep={progress} totalSteps={totalSteps} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.childrenContainer}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header Styles - matching FAQ header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 4,
  },
  
  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  childrenContainer: {
    flex: 1,
    paddingBottom: 32,
  },
});