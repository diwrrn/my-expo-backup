import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Grid, Target, Dumbbell } from 'lucide-react-native';

import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useWorkoutCache } from '@/hooks/useWorkoutCache';
import { WorkoutCategoryCard } from '@/components/WorkoutCategoryCard';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function WorkoutCategoriesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const { targetPlanId } = useLocalSearchParams<{ targetPlanId?: string }>();
  const { categories, categoriesLoading, categoriesError, loadWorkoutCategories } = useWorkoutCache();
  
  const flatListRef = useRef(null);

  // Calculate responsive card dimensions
  const padding = 16;
  const cardGap = 12;
  const numColumns = 2;
  const cardWidth = (width - (padding * 2) - (cardGap * (numColumns - 1))) / numColumns;

  const handleCategoryPress = React.useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryName = category ? (
      i18n.language === 'ku' && category.nameKurdish ? category.nameKurdish :
      i18n.language === 'ar' && category.nameArabic ? category.nameArabic :
      category.name
    ) : 'Category';
    
    router.push({
      pathname: '/(tabs)/workout/subcategories',
      params: { categoryId, categoryName, targetPlanId },
    });
  }, [categories, i18n.language, targetPlanId]);

  const handleMyWorkoutPlansPress = () => {
    router.push('/(tabs)/workout/my-plans');
  };

  // Create pairs for two-column layout with unique IDs
  const createPairs = (arr: any[]) => {
    const pairs = [];
    for (let i = 0; i < arr.length; i += numColumns) {
      pairs.push({
        id: Math.floor(i / numColumns),
        categories: arr.slice(i, i + numColumns)
      });
    }
    return pairs;
  };

  const categoryPairs = categories ? createPairs(categories) : [];

  const renderCategoryRow = React.useCallback(({ item: categoryRow }: { item: any }) => (
    <View style={styles.categoryRow}>
      {categoryRow.categories.map((category: any) => {
        return (
          <View
            key={category.id}
            style={[
              styles.categoryItem,
              { marginHorizontal: cardGap / 2 }
            ]}
          >
            <WorkoutCategoryCard
              category={category}
              onPress={handleCategoryPress}
              cardWidth={cardWidth}
            />
          </View>
        );
      })}
      {/* Fill empty space if odd number of items */}
      {categoryRow.categories.length < numColumns && (
        <View style={[styles.categoryItem, { marginHorizontal: cardGap / 2, opacity: 0 }]} />
      )}
    </View>
  ), [cardWidth, cardGap, numColumns, handleCategoryPress]);

  const ListHeaderComponent = () => (
    <View style={styles.headerContainer}>
      {/* Professional Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.7}
          >
            {isRTL ? 
              <ArrowLeft size={20} color="#374151" style={{ transform: [{ rotate: '180deg' }] }} /> : 
              <ArrowLeft size={20} color="#374151" />
            }
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('workoutScreen:headerTitle')}</Text>
          </View>
        </View>

        <View style={styles.headerStats}>
          <Text style={styles.categoryCount}>
            {categories.length} {categories.length === 1 ? t('common:category') : t('common:categories')}
          </Text>
          {targetPlanId && (
            <View style={styles.breadcrumbContainer}>
              <Target size={14} color="#22C55E" />
              <Text style={styles.breadcrumb}>Adding to workout plan</Text>
            </View>
          )}
        </View>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {t('workoutScreen:selectCategory')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t('workoutScreen:headerSubtitle')}
          </Text>
        </View>
        <Dumbbell size={24} color="#22C55E" />
      </View>
    </View>
  );

  const ListEmptyComponent = () => {
    if (categoriesLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>{t('common:loading')}</Text>
        </View>
      );
    }

    if (categoriesError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {t('common:errorLoadingCategories')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{t('workoutScreen:noCategories')}</Text>
        <Text style={styles.emptySubtext}>{t('workoutScreen:tryRefreshing')}</Text>
      </View>
    );
  };

  useEffect(() => {
    loadWorkoutCategories();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FAFAFA',
    },
    flatList: {
      flex: 1,
    },

    // Header Styles
    headerContainer: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
      marginBottom: 8,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
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
      justifyContent: 'space-between',
    },
    categoryCount: {
      fontSize: 15,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    breadcrumbContainer: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      backgroundColor: '#F0FDF4',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    breadcrumb: {
      fontSize: 13,
      color: '#16A34A',
      fontWeight: '600',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },

    // Section Header
    sectionHeader: {
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1F2937',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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

    // Grid Layout
    categoryRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      paddingHorizontal: padding,
      marginBottom: 16,
      marginHorizontal: -cardGap / 2,
    },
    categoryItem: {
      flex: 1,
      maxWidth: cardWidth + cardGap,
    },

    // Floating Action Button
    fab: {
      position: 'absolute',
      bottom: 100,
      right: isRTL ? undefined : 20,
      left: isRTL ? 20 : undefined,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    fabText: {
      position: 'absolute',
      bottom: 160,
      right: isRTL ? undefined : 20,
      left: isRTL ? 20 : undefined,
      backgroundColor: '#1F2937',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      opacity: 0.9,
    },
    fabTextContent: {
      fontSize: 12,
      color: '#FFFFFF',
      fontWeight: '500',
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
      textAlign: 'center',
    },

    // Enhanced animations
    categoryItemAnimated: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        data={categoryPairs}
        renderItem={renderCategoryRow}
        keyExtractor={(item) => `row-${item.id}`}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={true}
        maxToRenderPerBatch={4}
        windowSize={8}
        initialNumToRender={4}
        updateCellsBatchingPeriod={100}
        disableIntervalMomentum={true}
        legacyImplementation={false}
        scrollEventThrottle={16}
      />

      {/* Enhanced Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleMyWorkoutPlansPress}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}