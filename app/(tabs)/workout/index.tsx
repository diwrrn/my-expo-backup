import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  ViewToken
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { WorkoutCategoryCard } from '@/components/WorkoutCategoryCard';
import { router, useLocalSearchParams } from 'expo-router';
import { BookOpen } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const CARD_MARGIN = 12;
const NUM_COLUMNS = 2;

// Animated WorkoutCategoryCard wrapper using reanimated
const AnimatedWorkoutCategoryCard = React.memo(({ 
  category, 
  onPress, 
  cardWidth, 
  style, 
  viewableItems,
  rowId
}) => {
  const rStyle = useAnimatedStyle(() => {
    const isVisible = Boolean(
      viewableItems.value
        .filter((item) => item.isViewable)
        .find((viewableItem) => viewableItem.item.id === rowId)
    );
    
    return {
      opacity: withTiming(isVisible ? 1 : 0, {
        duration: 400,
      }),
      transform: [
        {
          scale: withTiming(isVisible ? 1 : 0, {
            duration: 400,
          }),
        },
        {
          translateY: withTiming(isVisible ? 0 : 50, {
            duration: 400,
          }),
        },
      ],
    };
  }, []);

  return (
    <Animated.View style={[style, rStyle]}>
      <WorkoutCategoryCard
        category={category}
        onPress={onPress}
        cardWidth={cardWidth}
      />
    </Animated.View>
  );
});

export default function WorkoutCategoriesScreen() {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const useKurdishFont = i18n.language === 'ku' || i18n.language === 'ckb' || i18n.language === 'ar';
  const { targetPlanId } = useLocalSearchParams<{ targetPlanId?: string }>();
  const { workoutCategories, workoutCategoriesLoading, workoutCategoriesError } = useFirebaseData();
  
  const viewableItems = useSharedValue<ViewToken[]>([]);
  const flatListRef = useRef(null);

  const cardWidth = (width - (24 * 2) - (CARD_MARGIN * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

  const handleCategoryPress = (categoryId: string) => {
    const category = workoutCategories.find(cat => cat.id === categoryId);
    const categoryName = category ? (
      i18n.language === 'ku' && category.nameKurdish ? category.nameKurdish :
      i18n.language === 'ar' && category.nameArabic ? category.nameArabic :
      category.name
    ) : 'Category';
    
    router.push({
      pathname: '/(tabs)/workout/subcategories',
      params: { categoryId, categoryName, targetPlanId },
    });
  };

  const handleMyWorkoutPlansPress = () => {
    router.push('/(tabs)/workout/my-plans');
  };

  // Create pairs for two-column layout with unique IDs
  const createPairs = (arr) => {
    const pairs = [];
    for (let i = 0; i < arr.length; i += NUM_COLUMNS) {
      pairs.push({
        id: Math.floor(i / NUM_COLUMNS), // Row ID for viewability tracking
        categories: arr.slice(i, i + NUM_COLUMNS)
      });
    }
    return pairs;
  };

  const categoryPairs = workoutCategories ? createPairs(workoutCategories) : [];

  const renderCategoryRow = ({ item: categoryRow }) => (
    <View style={styles.categoryRow}>
      {categoryRow.categories.map((category, categoryIndex) => {
        return (
          <AnimatedWorkoutCategoryCard
            key={category.id}
            category={category}
            onPress={handleCategoryPress}
            cardWidth={cardWidth}
            style={[
              styles.categoryItem,
              { marginHorizontal: CARD_MARGIN / 2 }
            ]}
            viewableItems={viewableItems}
            rowId={categoryRow.id}
          />
        );
      })}
      {/* Fill empty space if odd number of items */}
      {categoryRow.categories.length < NUM_COLUMNS && (
        <View style={[styles.categoryItem, { marginHorizontal: CARD_MARGIN / 2, opacity: 0 }]} />
      )}
    </View>
  );

  const onViewableItemsChanged = ({ viewableItems: vItems }) => {
    viewableItems.value = vItems;
  };

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const ListHeaderComponent = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={[styles.backButton, { marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }]}
          onPress={() => router.push('/(tabs)/')}
        >
          {isRTL ? 
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} /> : 
            <ArrowLeft size={24} color="#111827" />
          }
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('workoutScreen:headerTitle')}</Text>
          <Text style={styles.headerSubtitle}>{t('workoutScreen:headerSubtitle')}</Text>
          {targetPlanId && (
            <Text style={styles.breadcrumb}>Adding exercises to plan</Text>
          )}
        </View>
      </View>
    </View>
  );

  const ListEmptyComponent = () => {
    if (workoutCategoriesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
        </View>
      );
    }

    if (workoutCategoriesError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('common:error')}: {workoutCategoriesError}</Text>
        </View>
      );
    }

    return null;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9FAFB',
    },
    flatList: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      textAlign: getTextAlign(isRTL),
      fontFamily: useKurdishFont ? 'rudawregular2' : undefined,
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
    categoryRow: {
      flexDirection: getFlexDirection(isRTL),
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 16,
      marginHorizontal: -CARD_MARGIN / 2,
    },
    categoryItem: {
      flex: 1,
      maxWidth: cardWidth + CARD_MARGIN,
    },
    fab: {
      position: 'absolute',
      bottom: 100,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#22C55E',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#22C55E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleMyWorkoutPlansPress}
      >
        <BookOpen size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
} 