import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { FirebaseService } from '@/services/firebaseService';
import { WorkoutSubcategoryCard } from '@/components/WorkoutSubcategoryCard';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12; // Margin between cards
const NUM_COLUMNS = 2;

export default function WorkoutSubcategoriesScreen() {
  const { categoryId, categoryName, targetPlanId } = useLocalSearchParams<{ 
    categoryId: string; 
    categoryName: string;
    targetPlanId?: string;
  }>();
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
 
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardWidth = (width - (24 * 2) - (CARD_MARGIN * (NUM_COLUMNS - 1))) / NUM_COLUMNS;

  useEffect(() => {
    if (categoryId) {
      const fetchSubcategories = async () => {
        try {
          setLoading(true);
          setError(null);
          const fetchedSubcategories = await FirebaseService.getSubcategories(categoryId);
          setSubcategories(fetchedSubcategories);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load subcategories');
        } finally {
          setLoading(false);
        }
      };
      fetchSubcategories();
    }
  }, [categoryId]);

  const handleSubcategoryPress = (subcategoryId: string) => {
    // Get the localized subcategory name
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    const subcategoryName = subcategory ? (
      i18n.language === 'ku' && subcategory.nameKurdish ? subcategory.nameKurdish :
      i18n.language === 'ar' && subcategory.nameArabic ? subcategory.nameArabic :
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
      backgroundColor: '#F9FAFB',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 90, // Space for footer navigation
    },
    header: {
      backgroundColor: '#FFFFFF',
      padding: 24,
      paddingTop: 60,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      flexDirection: getFlexDirection(isRTL),
      alignItems: 'flex-start',
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    headerContent: {
      flex: 1,
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
    subcategoriesGrid: {
      flexDirection: getFlexDirection(isRTL),
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      marginBottom: 24,
      marginHorizontal: -CARD_MARGIN / 2, // Negative margin to offset card's internal margin
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 24,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          {isRTL ? (
            <ArrowLeft size={24} color="#111827" style={{ transform: [{ rotate: '180deg' }] }} />
          ) : (
            <ArrowLeft size={24} color="#111827" />
          )}
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>{t('workoutSubcategoriesScreen:headerSubtitle')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={{ color: '#6B7280', marginTop: 10 }}>{t('common:loading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{t('common:error')}: {error}</Text>
            </View>
          ) : subcategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('workoutSubcategoriesScreen:noSubcategories')}</Text>
            </View>
          ) : (
            <View style={styles.subcategoriesGrid}>
              {subcategories.map((subcategory, index) => (
                <WorkoutSubcategoryCard
                  key={subcategory.id}
                  subcategory={subcategory}
                  onPress={handleSubcategoryPress}
                  cardWidth={cardWidth}
                  style={{ marginHorizontal: CARD_MARGIN / 2 }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}