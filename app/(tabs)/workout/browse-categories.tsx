import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { WorkoutCategoryCard } from '@/components/WorkoutCategoryCard';
import { router } from 'expo-router';
import { Dumbbell } from 'lucide-react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
 
const { width } = Dimensions.get('window');
const CARD_MARGIN = 12; // Margin between cards
const NUM_COLUMNS = 2;

export default function WorkoutScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const { fromCreatePlan } = useLocalSearchParams<{ fromCreatePlan?: string }>();
  const { workoutCategories, workoutCategoriesLoading, workoutCategoriesError } = useFirebaseData();

  const cardWidth = (width - (24 * 2) - (CARD_MARGIN * (NUM_COLUMNS - 1))) / NUM_COLUMNS; // 24*2 for screen padding

  const handleCategoryPress = (categoryId: string) => {
    // Get the localized category name
    const category = workoutCategories.find(cat => cat.id === categoryId);
    const categoryName = category ? (
      i18n.language === 'ku' && category.nameKurdish ? category.nameKurdish :
      i18n.language === 'ar' && category.nameArabic ? category.nameArabic :
      category.name
    ) : 'Category';
    
    router.push({
      pathname: '/(tabs)/workout/subcategories',
      params: { categoryId, categoryName, fromCreatePlan },
    });
  };

  const handleMyWorkoutPlansPress = () => {
    router.push('/(tabs)/workout/my-plans');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90, // Space for footer navigation
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
    },
    headerContent: {
      flex: 1,
      marginLeft: isRTL ? 0 : 16,
      marginRight: isRTL ? 16 : 0,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
      marginBottom: 4,
      textAlign: getTextAlign(isRTL),
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
    },
    breadcrumb: {
      fontSize: 14,
      color: '#22C55E',
      fontWeight: '600',
      marginTop: 4,
      textAlign: getTextAlign(isRTL),
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
    },
    categoriesGrid: {
      flexDirection: getFlexDirection(isRTL),
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 24,
      marginHorizontal: -CARD_MARGIN / 2, // Negative margin to offset card's internal margin
    },
    myWorkoutPlansButton: {
      backgroundColor: '#22C55E',
      borderRadius: 12,
      paddingVertical: 16,
      marginHorizontal: 24,
      marginBottom: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: getFlexDirection(isRTL),
    },
    myWorkoutPlansButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
         {/* Header */}
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        {isRTL ? (
          <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
        ) : (
          <ArrowLeft size={24} color="#111827" />
        )}
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{t('workoutScreen:headerTitle')}</Text>
        <Text style={styles.headerSubtitle}>{t('workoutScreen:headerSubtitle')}</Text>
        {fromCreatePlan && (
          <Text style={styles.breadcrumb}>Adding exercises to plan</Text>
        )}
      </View>
    </View>
  </View>

          {workoutCategoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
            </View>
          ) : workoutCategoriesError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('common:error')}: {workoutCategoriesError}</Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {workoutCategories.map((category, index) => (
                <WorkoutCategoryCard
                  key={category.id}
                  category={category}
                  onPress={handleCategoryPress}
                  cardWidth={cardWidth}
                  style={{ marginHorizontal: CARD_MARGIN / 2 }} // Apply horizontal margin to the card itself
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.myWorkoutPlansButton}
            onPress={handleMyWorkoutPlansPress}
          >
            <Dumbbell size={20} color="#FFFFFF" />
            <Text style={styles.myWorkoutPlansButtonText}>{t('workoutScreen:myWorkoutPlans')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}