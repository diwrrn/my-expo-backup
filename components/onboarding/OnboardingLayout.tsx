import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
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
  hideHeaderContent?: boolean; // NEW: Add this prop
  children: React.ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  progress,
  totalSteps = 3,
  showBackButton = true,
  hideProgressBar = false,
  hideHeaderContent = false, // NEW: Default to false
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
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.backButton, isRTL && styles.backButtonRTL]}
            onPress={handleBackPress}
          >
            <ChevronLeft 
              size={24} 
              color="#374151" 
              style={[isRTL && { transform: [{ scaleX: -1 }] }]}
            />
          </TouchableOpacity>
        )}
        {!hideProgressBar && (
          <ProgressBarTwo currentStep={progress} totalSteps={totalSteps} />
        )}
      </View>

      <View style={styles.content}>
        {/* MODIFIED: Conditionally render titleContainer */}
        {!hideHeaderContent && (
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>{subtitle}</Text>
            )}
          </View>
        )}

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
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonRTL: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 36,
    marginBottom: 8,
  },
  titleRTL: {
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  subtitleRTL: {
    textAlign: 'right',
  },
  childrenContainer: {
    flex: 1,
    paddingBottom: 32,
  },
});