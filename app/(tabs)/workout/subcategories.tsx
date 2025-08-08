import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Grid, Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useSubcategoriesCache } from '@/hooks/useSubcategoriesCache';
import { WorkoutSubcategoryCard } from '@/components/WorkoutSubcategoryCard';

const { width } = Dimensions.get('window');

export default function WorkoutSubcategoriesScreen() {
  const { categoryId, categoryName, targetPlanId } = useLocalSearchParams<{ 
    categoryId: string; 
    categoryName: string;
    targetPlanId?: string;
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
 
  // Use the cached hook instead of direct Firebase calls
  const { subcategories, isLoading, error, refreshSubcategories } = useSubcategoriesCache(categoryId || '');

  // Calculate responsive card dimensions
  const padding = 16;
  const cardGap = 12;
  const numColumns = 2;
  const cardWidth = (width - (padding * 2) - (cardGap * (numColumns - 1))) / numColumns;

  const handleSubcategoryPress = (subcategoryId: string) => {
    // Get the localized subcategory name
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    const subcategoryName = subcategory ? (
      i18n.language === 'ku' && subcategory.kurdishName ? subcategory.kurdishName :
      i18n.language === 'ar' && subcategory.arabicName ? subcategory.arabicName :
      subcategory.name
    ) : 'Subcategory';
    
    // Navigate to exercises list screen
    router.push({
      pathname: '/(tabs)/workout/exercises-list',
      params: { categoryId, subcategoryId, subcategoryName, targetPlanId },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },

    // Header Styles
    header: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    headerTop: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#1F2937',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 28,
    },
    headerStats: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      marginTop: 4,
    },
    categoryCount: {
      fontSize: 15,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Content Styles
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: padding,
      paddingBottom: 100,
    },

    // Grid Layout
    subcategoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: cardGap,
    },

    // Loading & Error States
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      minHeight: 300,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      marginTop: 16,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    errorText: {
      fontSize: 16,
      color: '#EF4444',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 24,
    },
    emptyText: {
      fontSize: 18,
      color: '#9CA3AF',
      textAlign: 'center',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      lineHeight: 26,
    },
    emptySubtext: {
      fontSize: 15,
      color: '#D1D5DB',
      textAlign: 'center',
      marginTop: 8,
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Section Header
    sectionHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Enhanced card hover effect
    cardPressed: {
      opacity: 0.95,
      transform: [{ scale: 0.98 }],
    },

    // Different category color themes
    cardIconBlue: {
      backgroundColor: '#EFF6FF',
      borderColor: '#DBEAFE',
    },
    cardIconGreen: {
      backgroundColor: '#F0FDF4',
      borderColor: '#D1FAE5',
    },
    cardIconYellow: {
      backgroundColor: '#FFFBEB',
      borderColor: '#FEF3C7',
    },
    cardIconPurple: {
      backgroundColor: '#FAF5FF',
      borderColor: '#E9D5FF',
    },
  });

  // Color variations for different categories
  const getCardIconStyle = (index: number) => {
    const colors = [
      styles.cardIconGreen,
      styles.cardIconBlue, 
      styles.cardIconYellow,
      styles.cardIconPurple,
    ];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            {isRTL ? (
              <ArrowLeft size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} />
            ) : (
              <ArrowLeft size={20} color="#374151" />
            )}
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{categoryName}</Text>
          </View>
        </View>
        
        <View style={styles.headerStats}>
          <Text style={styles.categoryCount}>
            {subcategories.length} {subcategories.length === 1 ? t('common:category') : t('common:categories')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>{t('common:loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>
              {t('common:errorLoadingCategories')}
            </Text>
          </View>
        ) : subcategories.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>{t('workoutSubcategoriesScreen:noSubcategories')}</Text>
            <Text style={styles.emptySubtext}>{t('workoutSubcategoriesScreen:tryRefreshing')}</Text>
          </View>
        ) : (
          <>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {t('workoutSubcategoriesScreen:selectCategory')}
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {t('workoutSubcategoriesScreen:chooseYourWorkout')}
                </Text>
              </View>
              <Grid size={24} color="#22C55E" />
            </View>

            {/* Subcategories Grid */}
            <View style={styles.subcategoriesGrid}>
              {subcategories.map((subcategory, index) => (
                <WorkoutSubcategoryCard
                  key={subcategory.id}
                  subcategory={subcategory}
                  onPress={handleSubcategoryPress}
                  cardWidth={cardWidth}
                  style={{ marginBottom: cardGap }}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}