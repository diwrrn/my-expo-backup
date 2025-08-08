import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { Search, Plus, Clock, Star, Grid3x3 as Grid3X3, RefreshCw } from 'lucide-react-native';
import { FoodItem } from '@/components/FoodItem';
import { AddFoodSkeleton } from '@/components/AddFoodSkeleton';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { useRecentlyLoggedFoods } from '@/hooks/useRecentlyLoggedFoods'; // Add this import
import { Food } from '@/types/api';
import { router } from 'expo-router';
import { useRTL, getTextAlign, getFlexDirection } from '@/hooks/useRTL';
import { useTranslation } from 'react-i18next';
import { useDailyMealsContext } from '@/contexts/DailyMealsProvider';

export default function AddFoodScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [searchResults, setSearchResults] = useState<Food[]>([]);
  const [popularFoods, setPopularFoods] = useState<Food[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryFoods, setCategoryFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showFoodDetails, setShowFoodDetails] = useState(false);
  const { t } = useTranslation();
  const isRTL = useRTL();

  const { 
    addFoodToDailyMeal
  } = useDailyMealsContext();
  
  const { 
    searchFoods, 
    getPopularFoods, 
    getFoodsByCategory, 
    getFoodCategories, 
    foodCache
  } = useFirebaseData();

  // Add the recently logged foods hook
  const { 
    recentlyLoggedFoods, 
    isLoading: recentlyLoggedFoodsLoading, 
    error: recentlyLoggedFoodsError, 
    refresh: refreshRecentlyLoggedFoods 
  } = useRecentlyLoggedFoods(7);

  
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
    marginLeft: 16,
    marginRight: 16,
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
  mealSelection: {
    paddingHorizontal: 24,
    marginBottom: 24,
    
  },
  mealOptions: {
    flexDirection: getFlexDirection(isRTL),
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  mealOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mealOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
        textAlign: getTextAlign(isRTL),

  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
  marginLeft: isRTL ? 0 : 12,
    marginRight: isRTL ? 12 : 0,
    fontSize: 16,
    color: '#111827',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    marginBottom: 16,

  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,
        textAlign: getTextAlign(isRTL),

  },
  categoriesContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  marginRight: isRTL ? 0 : 12,
  marginLeft: isRTL ? 12 : 0,
  },
  categoryChipSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: getTextAlign(isRTL),
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  noResults: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
    marginTop: 20,
  },
  customEntryButton: {
    flexDirection: getFlexDirection(isRTL),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
  },
  customEntryText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  marginLeft: isRTL ? 0 : 8,
    marginRight: isRTL ? 8 : 0,

  },
});
  // Meal options configuration
  const mealOptions = [
    { id: 'breakfast', label: t('mealSelectionScreen:breakfast'), color: '#F59E0B' },
    { id: 'lunch', label: t('mealSelectionScreen:lunch'), color: '#10B981' },
    { id: 'dinner', label: t('mealSelectionScreen:dinner'), color: '#3B82F6' },
    { id: 'snacks', label: t('mealSelectionScreen:snacks'), color: '#8B5CF6' },
  ];



// Initial load when component mounts
useEffect(() => {
  loadPopularFoods();
  loadCategories();
}, []);

  // Search foods when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
      setSelectedCategory(''); // Clear category when searching
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Load foods by category when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadCategoryFoods();
      setSearchQuery(''); // Clear search when selecting category
    } else {
      setCategoryFoods([]);
    }
  }, [selectedCategory]);
  // Re-load popular foods when food cache updates
  useEffect(() => {
    if (foodCache.foods.length > 0 && popularFoods.length === 0) {
      loadPopularFoods();
    }
  }, [foodCache.foods.length]);
  const loadPopularFoods = async () => {
    try {
      const foods = await getPopularFoods();
      if (foods && foods.length > 0) {
      }
      setPopularFoods(foods);
    } catch (error) {
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getFoodCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCategoryFoods = async () => {
    if (!selectedCategory) return;
    
    try {
      setLoading(true);
      const foods = await getFoodsByCategory(selectedCategory);
      setCategoryFoods(foods);
    } catch (error) {
      console.error('Error loading category foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const results = await searchFoods(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (food: Food) => {
    handleShowFoodDetails(food);
  };

  // Determine which foods to show (recently logged or popular)
  const getFoodsToShow = () => {
    // If user has recently logged foods, show those
    if (recentlyLoggedFoods && recentlyLoggedFoods.length > 0) {
      return {
        foods: recentlyLoggedFoods,
        title: t('addFoodScreen:recentlyLoggedFoods'),
        icon: <Clock size={20} color="#6B7280" />,
        isLoading: recentlyLoggedFoodsLoading,
        isRecentlyLogged: true
      };
    }
      
   // Otherwise, show popular foods
   return {
    foods: popularFoods,
    title: t('addFoodScreen:popularFoods'),
    icon: <Star size={20} color="#6B7280" />,
    isLoading: popularFoods.length === 0 && foodCache.foods.length < 168,
    isRecentlyLogged: false
  };
  };  

  const foodsToShow = getFoodsToShow();
  
 
  // Shared nutrition calculation function
  const calculateNutritionForFood = (food: Food, quantity: number, unit: string) => {
    const safeQuantity = isNaN(quantity) || quantity <= 0 ? 1 : quantity;
    
    // Get base nutrition per 100g
    const nutritionPer100 = food.nutritionPer100 || {
      calories: food.calories || 0,
      protein: food.protein || 0,
      carbs: food.carbs || 0,
      fat: food.fat || 0,
    };
    
    let totalGrams = 0;
    
    // Calculate total grams based on selected unit
    if (unit === '100g') {
      // For 100g unit, quantity represents grams directly
      totalGrams = safeQuantity;
    } else if (food.customConversions && food.customConversions[unit]) {
      // For other units, multiply quantity by gram equivalent per unit
      const gramsPerUnit = food.customConversions[unit];
      totalGrams = gramsPerUnit * safeQuantity;
    } else {
      // Fallback: treat quantity as grams
      totalGrams = safeQuantity;
    }
    
    // Calculate nutrition based on total grams (nutritionPer100 * totalGrams/100)
    const multiplier = totalGrams / 100;
    
    return {
      calories: Math.round((nutritionPer100.calories || 0) * multiplier * 10) / 10,
      protein: Math.round((nutritionPer100.protein || 0) * multiplier * 10) / 10,
      carbs: Math.round((nutritionPer100.carbs || 0) * multiplier * 10) / 10,
      fat: Math.round((nutritionPer100.fat || 0) * multiplier * 10) / 10,
    };
  };

  const handleShowFoodDetails = (food: Food) => {
    router.push({ pathname: '/(tabs)/add/food-entry', params: { foodId: food.id } });
  };

  const handleAddFoodFromModal = async (food: Food, quantity: number, unit: string) => {
    try {
      // Navigate to meal selection screen
      setShowFoodDetails(false);
      router.push({
        pathname: '/(tabs)/add/meal-selection', // Updated path
        params: {
          food: JSON.stringify(food),
          quantity: quantity.toString(),
          unit: unit
        }
      });
    } catch (error) {
      console.error('Error preparing food for meal selection:', error);
      Alert.alert('Error', 'Failed to prepare food');
    }
  };

  const handleFoodRequest = () => {
    router.push('/(tabs)/food-request');
  };
  
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
            <HamburgerMenu currentRoute="/(tabs)/add" />
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t('addFoodScreen:headerTitle')}</Text>
              <Text style={styles.headerSubtitle}>{t('addFoodScreen:headerSubtitle')}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('addFoodScreen:searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>
        </View>
{/* Categories */}
{!searchQuery && categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <Text style={styles.sectionTitle}>{t('addFoodScreen:browseByCategory')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(selectedCategory === category ? '' : category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextSelected,
                    ]}
                  >
                    {t(`common:${category}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Results */}
        {searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('addFoodScreen:searchResults')}</Text>
            {foodCache.isLoading ? (
              <AddFoodSkeleton />
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
                  onAdd={() => handleAddFood(food)}
                  onShowDetails={() => handleShowFoodDetails(food)}
                />
              ))
            ) : !loading && (
              <Text style={styles.noResults}>{t('addFoodScreen:noFoodsFound')}</Text>
            )}
          </View>
        )}

        {/* Category Foods */}
        {selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('addFoodScreen:noFoodsInCategory')}</Text>
            {foodCache.isLoading ? (
              <AddFoodSkeleton />
            ) : categoryFoods.length > 0 ? (
              categoryFoods.map((food) => (
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
                  onAdd={() => handleAddFood(food)}
                  onShowDetails={() => handleShowFoodDetails(food)}
                />
              ))
            ) : !loading && (
              <Text style={styles.noResults}>{t('addFoodScreen:noFoodsInCategory')}</Text>
            )}
          </View>
        )}

{/* Recently Logged Foods or Popular Foods */}
{!searchQuery && !selectedCategory && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              {foodsToShow.icon}
              <Text style={styles.sectionTitle}>{foodsToShow.title}</Text>
              {foodsToShow.isRecentlyLogged && (
                <TouchableOpacity 
                  onPress={refreshRecentlyLoggedFoods}
                  style={{ marginLeft: 'auto' }}
                >
                  <RefreshCw size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
            {foodsToShow.isLoading || foodCache.isLoading ? (
              <AddFoodSkeleton />
            ) : foodsToShow.foods.length > 0 ? (
              foodsToShow.foods.map((food) => (
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
                  onAdd={() => handleAddFood(food)}
                  onShowDetails={() => handleShowFoodDetails(food)}
                />
              ))
            ) : (
              <Text style={styles.noResults}>
                {foodsToShow.isRecentlyLogged 
                  ? t('addFoodScreen:noRecentlyLoggedFoods') 
                  : t('addFoodScreen:noPopularFoods')
                }
              </Text>
            )}
          </View>
        )}

        {/* Custom Food Entry */}
        <TouchableOpacity 
            style={styles.customEntryButton}
            onPress={handleFoodRequest}
          >         
          <Plus size={24} color="#22C55E" />
          <Text style={styles.customEntryText}>{t('addFoodScreen:createCustomFood')}</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>  
    </SafeAreaView>
  );
}







