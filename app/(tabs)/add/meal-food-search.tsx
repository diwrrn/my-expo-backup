import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Settings } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FoodItem } from '@/components/FoodItem';
import { Food } from '@/types/api';
import { getTodayDateString } from '@/utils/dateUtils';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useRecentlyLoggedFoods } from '@/hooks/useRecentlyLoggedFoods';
import { useDailyMealsContext } from '@/contexts/DailyMealsProvider';
// Add this utility function if it doesn't exist
const formatDisplayDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function MealFoodSearchScreen() {
  const { mealType, mealTitle, fromHome } = useLocalSearchParams<{
    mealType: string;
    mealTitle: string;
    currentViewDate?: string;
    fromHome?: string;
  }>();
  const { recentlyLoggedFoods } = useRecentlyLoggedFoods(7);

  const params = useLocalSearchParams();
  const currentViewDate = (typeof params.currentViewDate === 'string' ? params.currentViewDate : params.currentViewDate?.[0]) || getTodayDateString();
    const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [isSearching, setIsSearching] = useState(false); 
  const [showAdvanced, setShowAdvanced] = useState(false); 
  const [includeSnacks, setIncludeSnacks] = useState(false);
  const [displaySectionTitle, setDisplaySectionTitle] = useState('Loading...');

  const { addFoodToDailyMeal } = useDailyMealsContext();
  const { searchFoods, getPopularFoods } = useFirebaseData(currentViewDate);
  // Initial load when component mounts
  useEffect(() => {
    loadInitialFoods();
  }, []);
  useEffect(() => {
    if (recentlyLoggedFoods.length > 0) {
      loadInitialFoods();
    }
  }, [recentlyLoggedFoods]);
  
  // Trigger search or reload initial foods when searchQuery or includeSnacks changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadInitialFoods();
    }
  }, [searchQuery, includeSnacks]);

  const loadPopularFoodsData = async () => {
    try {
      setIsSearching(true);
      const popularFoods = await getPopularFoods();
      setSearchResults(popularFoods);
      setDisplaySectionTitle(`🔥 Popular Foods${includeSnacks ? ' (including snacks)' : ''}`);
    } catch (error) {
      console.error('Error loading popular foods:', error);
      setDisplaySectionTitle('Error loading popular foods');
    } finally {
      setIsSearching(false);
    }
  };
  
  
  const loadInitialFoods = async () => {
    try {
      setIsSearching(true);
      setDisplaySectionTitle('Loading...');
      
      // Use the hook data instead of calling the function
      if (recentlyLoggedFoods.length > 0) {
        setSearchResults(recentlyLoggedFoods);
        setDisplaySectionTitle(`🕒 Recently Logged Foods${includeSnacks ? ' (including snacks)' : ''}`);
      } else {
        await loadPopularFoodsData();
      }
    } catch (error) {
      console.error('🔍 loadInitialFoods: Error loading initial foods:', error);
      setDisplaySectionTitle('Error loading foods');
    } finally {
      setIsSearching(false);
    }
  };
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadInitialFoods();
      return;
    }
    
    try {
      setIsSearching(true);
      const results = await searchFoods(searchQuery.trim(), true, includeSnacks);
      setSearchResults(results);
      setDisplaySectionTitle(`🔍 Results for "${searchQuery}"${includeSnacks ? ' (including snacks)' : ''}`);
    } catch (error) {
      console.error('Error searching foods:', error);
      setDisplaySectionTitle('Error searching foods');
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickAdd = async (food: Food) => {
    try {
      const nutrition = calculateNutritionForFood(food, 100, '100g');
      
      
      await addFoodToDailyMeal(mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks', {
        foodId: food.id,
        foodName: food.name,
        calories: Math.round(nutrition.calories * 10) / 10,
        protein: Math.round(nutrition.protein * 10) / 10,
        carbs: Math.round(nutrition.carbs * 10) / 10,
        fat: Math.round(nutrition.fat * 10) / 10, 
        quantity: 100,
        unit: '100g',
        kurdishName: food.kurdishName || '',
        arabicName: food.arabicName || '',
        category: food.category,
      });
      
      Alert.alert('Success', `${food.name} added to ${mealTitle}${currentViewDate !== getTodayDateString() ? ' for ' + formatDisplayDate(currentViewDate) : ''}`, [
        {
          text: 'OK',
          onPress: () => router.back()
        }
      ]);
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('Error', 'Failed to add food');
    }
  };

  const handleShowDetails = (food: Food) => {
    router.push({
      pathname: '/(tabs)/add/food-entry',
      params: { 
        foodId: food.id,
        fromMealFoodSearch: 'true',
        mealType: mealType,
        mealTitle: mealTitle,
      }
    });
  };

  const calculateNutritionForFood = (food: Food, quantity: number, unit: string) => {
    const safeQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    let totalGrams = 0;
    
    if (unit === '100g') {
      totalGrams = safeQuantity;
    } else if (food.customConversions && food.customConversions[unit]) {
      const gramsPerUnit = food.customConversions[unit];
      totalGrams = gramsPerUnit * safeQuantity;
    } else {
      totalGrams = safeQuantity;
    }
    
    const multiplier = totalGrams / 100;
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier * 10) / 10,
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (fromHome === 'true') {
            router.replace('/(tabs)/'); 
          } else {
            router.back();
          }
        }}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Add Food to {mealTitle}</Text>
          <Text style={styles.subtitle}>Search and add foods to your meal</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6B7280"
            autoFocus
          />
        </View>
        
        {/* Advanced Search Toggle */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings size={16} color="#6B7280" />
          <Text style={styles.advancedToggleText}>Advanced</Text>
        </TouchableOpacity>
        
        {/* Advanced Options */}
        {showAdvanced && (
          <View style={styles.advancedOptions}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Include Snacks</Text>
              <TouchableOpacity
                style={[styles.toggle, includeSnacks && styles.toggleActive]}
                onPress={() => setIncludeSnacks(!includeSnacks)}
              >
                <View style={[styles.toggleThumb, includeSnacks && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
            <Text style={styles.optionDescription}>
              By default, snack foods are hidden in search results. Enable this to include them.
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollViewContent}> 
          {/* Section Title */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {displaySectionTitle}
            </Text>
            
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((food) => (
                <FoodItem
                  key={food.id}
                  name={food.name}
                  kurdishName={food.kurdishName}
                  arabicName={food.arabicName}
                  baseName={food.baseName}
                  category={food.category}
                  calories={food.nutritionPer100?.calories || food.calories || 0}
                  serving={food.serving}
                  availableUnits={food.availableUnits}
                  protein={food.nutritionPer100?.protein || food.protein || 0}
                  carbs={food.nutritionPer100?.carbs || food.carbs || 0}
                  fat={food.nutritionPer100?.fat || food.fat || 0}
                  onAdd={() => handleQuickAdd(food)}
                  onShowDetails={() => handleShowDetails(food)}
                />
              ))
            ) : !isSearching && searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No foods found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try searching with different keywords
                </Text>
              </View>
            ) : !isSearching && !searchQuery ? (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No recent foods found</Text>
                <Text style={styles.noResultsSubtext}>
                  Start logging some foods to see them here
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
  advancedOptions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#22C55E',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  scrollViewContent: {
    paddingBottom: 90,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});