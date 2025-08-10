import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, Zap, Leaf, Flame, Target } from 'lucide-react-native';
import { FoodItem } from '@/components/FoodItem';
import { AddFoodSkeleton } from '@/components/AddFoodSkeleton';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { useFirebaseData } from '@/hooks/useFirebaseData';
import { Food } from '@/types/api';
import { router } from 'expo-router';

export default function ExploreFoodsScreen() {
  const { foodCache, getFoodCategories } = useFirebaseData();

  // Search state
  const [query, setQuery] = useState('');
  
  // Pagination
  const [displayCount, setDisplayCount] = useState(15);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper function to safely convert string to number
  const toNum = (s: string) => {
    if (!s.trim()) return null;
    const n = Number(s);
    return Number.isFinite(n) ? Math.max(0, n) : null;
  };
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popularity' | 'protein' | 'calories'>('popularity');

  // Micronutrient filters
  const MICROS = [
    'fiber','calcium','sodium','potassium','magnesium','sugar','iron',
    'vitaminB12','vitaminA','vitaminC','vitaminD','vitaminE',
  ] as const;
  type MicroKey = typeof MICROS[number];
  
  const [selectedMicro, setSelectedMicro] = useState<MicroKey | null>(null);
  
  const toggleMicro = useCallback((key: MicroKey) => {
    setSelectedMicro(prev => (prev === key ? null : key));
    setDisplayCount(15);
  }, []);
  const MICRO_LABELS: Record<MicroKey, string> = {
    fiber: 'Fiber',
    calcium: 'Calcium',
    sodium: 'Sodium',
    potassium: 'Potassium',
    magnesium: 'Magnesium',
    sugar: 'Sugar',
    iron: 'Iron',
    vitaminB12: 'Vit B12',
    vitaminA: 'Vit A',
    vitaminC: 'Vit C',
    vitaminD: 'Vit D',
    vitaminE: 'Vit E',
  };
  
  const [microSortOrder, setMicroSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Nutrition filters
  const [highProtein, setHighProtein] = useState(false);
  const [lowCarb, setLowCarb] = useState(false);
  const [lowCalorie, setLowCalorie] = useState(false);
  
  // Calorie range
  const [calMin, setCalMin] = useState<string>('');
  const [calMax, setCalMax] = useState<string>('');

  // Load categories when filters are shown
  useEffect(() => {
    if (showFilters && categories.length === 0) {
      getFoodCategories().then(cats => {
        if (Array.isArray(cats)) setCategories(cats);
      });
    }
  }, [showFilters, getFoodCategories, categories.length]);


  // Full filtered results (no pagination here)
  const allFilteredFoods = useMemo(() => {
    const foods = foodCache?.foods || [];
    if (!foods.length) return [];

    let result = [...foods];

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(q) ||
        (f as any).kurdishName?.toLowerCase().includes(q) ||
        (f as any).arabicName?.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    // Sorting
if (selectedMicro) {
  const getVal = (f: any) => {
    const raw = (f.nutritionPer100 as any)?.[selectedMicro];
    const v = typeof raw === 'string' ? Number(raw) : raw ?? 0;
    return Number.isFinite(v) ? v : 0;
  };
  result.sort((a, b) => {
    const va = getVal(a);
    const vb = getVal(b);
    return microSortOrder === 'asc' ? va - vb : vb - va;
  });
} else if (sortBy === 'protein') {
  result.sort((a, b) => {
    const aProtein = a.nutritionPer100?.protein ?? a.protein ?? 0;
    const bProtein = b.nutritionPer100?.protein ?? b.protein ?? 0;
    return bProtein - aProtein;
  });
} else if (sortBy === 'calories') {
  result.sort((a, b) => {
    const aCals = a.nutritionPer100?.calories ?? a.calories ?? 0;
    const bCals = b.nutritionPer100?.calories ?? b.calories ?? 0;
    return aCals - bCals;
  });
} else {
  // Popularity sort
  result.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
}

    // Category filter
    if (selectedCategory) {
      result = result.filter(f => f.category === selectedCategory);
    }
    console.log('Applying micro filter:', selectedMicro, 'foods:', result.length);

    // Micronutrient filters (selected chips require the nutrient > 0 per 100g)
    //const selectedMicros = MICROS.filter(k => microFilters[k]);
    if (selectedMicro) {
      result = result.filter(f => {
        const raw = (f.nutritionPer100 as any)?.[selectedMicro];
        const val = typeof raw === 'string' ? Number(raw) : raw ?? 0;
        return Number.isFinite(val) && val > 0;
      });
    }
    console.log('After micro filter:', result.length);
    // Nutrition filters
    result = result.filter(f => {
      const calories = f.nutritionPer100?.calories ?? f.calories ?? 0;
      const protein = f.nutritionPer100?.protein ?? f.protein ?? 0;
      const carbs = f.nutritionPer100?.carbs ?? f.carbs ?? 0;

      // Advanced filter checks
      if (highProtein && protein < 15) return false;
      if (lowCarb && carbs > 15) return false;
      if (lowCalorie && calories > 120) return false;

      // Calorie range with safe number conversion
      const minCals = toNum(calMin);
      const maxCals = toNum(calMax);
      if (minCals !== null && calories < minCals) return false;
      if (maxCals !== null && calories > maxCals) return false;

      return true;
    });

    // Sorting
    if (sortBy === 'protein') {
      result.sort((a, b) => {
        const aProtein = a.nutritionPer100?.protein ?? a.protein ?? 0;
        const bProtein = b.nutritionPer100?.protein ?? b.protein ?? 0;
        return bProtein - aProtein;
      });
    } else if (sortBy === 'calories') {
      result.sort((a, b) => {
        const aCals = a.nutritionPer100?.calories ?? a.calories ?? 0;
        const bCals = b.nutritionPer100?.calories ?? b.calories ?? 0;
        return aCals - bCals;
      });
    } else {
      // Popularity sort
      result.sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
    }

    return result;
  }, [foodCache?.foods, query, selectedCategory, selectedMicro, highProtein, lowCarb, lowCalorie, calMin, calMax, sortBy]);
  // Paginated display foods
  const displayedFoods = useMemo(() => {
    return allFilteredFoods.slice(0, displayCount);
  }, [allFilteredFoods, displayCount]);

  const hasMoreFoods = allFilteredFoods.length > displayCount;

  const loadMoreFoods = useCallback(() => {
    if (hasMoreFoods && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setDisplayCount(prev => prev + 5);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [hasMoreFoods, isLoadingMore]);
  const handleShowFoodDetails = useCallback((food: Food) => {
    router.push({ 
      pathname: '/(tabs)/add/food-entry', 
      params: { foodId: String(food.id) } 
    });
  }, []);
  const renderFoodItem = useCallback(({ item }: { item: any }) => (
    <FoodItem
      name={item.name}
      kurdishName={item.kurdishName}
      arabicName={item.arabicName}
      baseName={item.baseName}
      category={item.category}
      calories={item.nutritionPer100?.calories || item.calories || 0}
      serving={item.serving}
      availableUnits={item.availableUnits}
      protein={item.nutritionPer100?.protein || item.protein || 0}
      carbs={item.nutritionPer100?.carbs || item.carbs || 0}
      fat={item.nutritionPer100?.fat || item.fat || 0}
      onAdd={() => handleShowFoodDetails(item)}
      onShowDetails={() => handleShowFoodDetails(item)}
    />
  ), [handleShowFoodDetails]);

  const renderLoadMoreFooter = useCallback(() => {
    if (!hasMoreFoods) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity 
          style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonLoading]} 
          onPress={loadMoreFoods}
          disabled={isLoadingMore}
        >
          <Text style={styles.loadMoreText}>
            {isLoadingMore ? 'Loading...' : 'Load 5 more foods'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [hasMoreFoods, isLoadingMore, loadMoreFoods]);
  const clearFilters = useCallback(() => {
    setQuery('');
    setSelectedCategory('');
    setSortBy('popularity');
    setHighProtein(false);
    setLowCarb(false);
    setLowCalorie(false);
    setCalMin('');
    setCalMax('');
    setDisplayCount(15); 
    setSelectedMicro(null); 
  }, []);
  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No foods found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters or search terms</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
        <Text style={styles.emptyButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  ), [clearFilters]);





  // Reset pagination when filters change
  useEffect(() => {
    setDisplayCount(15);
  }, [query, selectedCategory, selectedMicro, highProtein, lowCarb, lowCalorie, calMin, calMax, sortBy]);

  const foods = foodCache?.foods || [];
  const loading = foodCache?.isLoading && foods.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <HamburgerMenu currentRoute="/(tabs)/add" />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Explore Foods</Text>
            <Text style={styles.headerSubtitle}>Discover nutrition that fits your goals</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for foods..."
              value={query}
              onChangeText={setQuery}
              placeholderTextColor="#9CA3AF"
            />
            {query && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearSearch}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <TouchableOpacity 
            style={styles.filtersToggle}
            onPress={() => setShowFilters(!showFilters)}
          >
            <View style={styles.filtersToggleLeft}>
              <SlidersHorizontal size={18} color="#6B7280" />
              <Text style={styles.filtersToggleText}>Filters & Sort</Text>
            </View>
            {showFilters ? (
              <ChevronUp size={18} color="#6B7280" />
            ) : (
              <ChevronDown size={18} color="#6B7280" />
            )}
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filtersContent}>
              {/* Micronutrients */}
              <View style={styles.filterGroup}>
                  <View style={styles.filterHeader}>
    <Target size={16} color="#6B7280" />
    <Text style={styles.filterLabel}>Micronutrients</Text>
  </View>
  <View style={styles.chipGrid}>
    {[
      { key: 'fiber', label: 'Fiber' },
      { key: 'calcium', label: 'Calcium' },
      { key: 'sodium', label: 'Sodium' },
      { key: 'potassium', label: 'Potassium' },
      { key: 'magnesium', label: 'Magnesium' },
      { key: 'sugar', label: 'Sugar' },
      { key: 'iron', label: 'Iron' },
      { key: 'vitaminB12', label: 'Vit B12' },
      { key: 'vitaminA', label: 'Vit A' },
      { key: 'vitaminC', label: 'Vit C' },
      { key: 'vitaminD', label: 'Vit D' },
      { key: 'vitaminE', label: 'Vit E' },
    ].map(m => (
      <TouchableOpacity
        key={m.key}
        style={[styles.filterChip, selectedMicro === (m.key as MicroKey) && styles.filterChipActive]}
                onPress={() => toggleMicro(m.key as MicroKey)}
      >
<Text style={[styles.filterChipText, selectedMicro === (m.key as MicroKey) && styles.filterChipTextActive]}>
            {m.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
  {selectedMicro && (
  <View style={styles.microSortRow}>
    <Text style={styles.microSortLabel}>
      Sort by {MICRO_LABELS[selectedMicro]}
    </Text>
    <View style={styles.sortToggleRow}>
      <TouchableOpacity
        style={[styles.sortToggle, microSortOrder === 'asc' && styles.sortToggleActive]}
        onPress={() => setMicroSortOrder('asc')}
        accessibilityRole="button"
        accessibilityLabel="Sort ascending"
      >
        <Text style={[styles.sortToggleText, microSortOrder === 'asc' && styles.sortToggleTextActive]}>
          Asc
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sortToggle, microSortOrder === 'desc' && styles.sortToggleActive]}
        onPress={() => setMicroSortOrder('desc')}
        accessibilityRole="button"
        accessibilityLabel="Sort descending"
      >
        <Text style={[styles.sortToggleText, microSortOrder === 'desc' && styles.sortToggleTextActive]}>
          Desc
        </Text>
      </TouchableOpacity>
    </View>
  </View>
)}
</View>

              {/* Nutrition Focus */}
              <View style={styles.filterGroup}>
                <View style={styles.filterHeader}>
                  <Target size={16} color="#6B7280" />
                  <Text style={styles.filterLabel}>Nutrition Focus</Text>
                </View>
                <View style={styles.chipGrid}>
                  <TouchableOpacity
                    style={[styles.nutritionChip, highProtein && styles.nutritionChipActive]}
                    onPress={() => setHighProtein(!highProtein)}
                  >
                    <Zap size={14} color={highProtein ? '#FFFFFF' : '#EF4444'} />
                    <Text style={[styles.nutritionChipText, highProtein && styles.nutritionChipTextActive]}>
                      High Protein
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.nutritionChip, lowCarb && styles.nutritionChipActive]}
                    onPress={() => setLowCarb(!lowCarb)}
                  >
                    <Leaf size={14} color={lowCarb ? '#FFFFFF' : '#22C55E'} />
                    <Text style={[styles.nutritionChipText, lowCarb && styles.nutritionChipTextActive]}>
                      Low Carb
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.nutritionChip, lowCalorie && styles.nutritionChipActive]}
                    onPress={() => setLowCalorie(!lowCalorie)}
                  >
                    <Flame size={14} color={lowCalorie ? '#FFFFFF' : '#F59E0B'} />
                    <Text style={[styles.nutritionChipText, lowCalorie && styles.nutritionChipTextActive]}>
                      Low Calorie
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Calorie Range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Calories per 100g</Text>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeInputContainer}>
                    <TextInput
                      style={styles.rangeInput}
                      value={calMin}
                      onChangeText={setCalMin}
                      placeholder="Min"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.rangeSeparator}>to</Text>
                  <View style={styles.rangeInputContainer}>
                    <TextInput
                      style={styles.rangeInput}
                      value={calMax}
                      onChangeText={setCalMax}
                      placeholder="Max"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                {/* Quick calorie presets */}
                <View style={styles.presetRow}>
                  <TouchableOpacity 
                    style={styles.presetChip}
                    onPress={() => { setCalMin(''); setCalMax('120'); }}
                  >
                    <Text style={styles.presetText}>Low (≤120)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.presetChip}
                    onPress={() => { setCalMin('120'); setCalMax('300'); }}
                  >
                    <Text style={styles.presetText}>Medium (120-300)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.presetChip}
                    onPress={() => { setCalMin('300'); setCalMax(''); }}
                  >
                    <Text style={styles.presetText}>High (300+)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Categories */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Categories</Text>
                <FlatList
                  data={[{ key: '', label: 'All' }, ...categories.map(cat => ({ key: cat, label: cat }))]}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.categoryChip, selectedCategory === item.key && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(selectedCategory === item.key ? '' : item.key)}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === item.key && styles.categoryChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.key}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>

              {/* Sort Options */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.sortOptions}>
                  {[
                    { key: 'popularity', label: 'Popular' },
                    { key: 'protein', label: 'Protein' },
                    { key: 'calories', label: 'Calories' },
                  ].map(option => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                      onPress={() => setSortBy(option.key as any)}
                    >
                      <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Clear Filters */}
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {loading ? 'Loading...' : `${allFilteredFoods.length} foods found`}
          </Text>
          {displayedFoods.length > 0 && displayedFoods.length < allFilteredFoods.length && (
            <Text style={styles.showingCount}>
              Showing {displayedFoods.length} of {allFilteredFoods.length}
            </Text>
          )}
        </View>
      </View>

      {/* FlatList for Foods */}
      {loading ? (
        <AddFoodSkeleton />
      ) : (
        <FlatList
          data={displayedFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => String(item.id)}
          onEndReached={loadMoreFoods}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          initialNumToRender={15}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderLoadMoreFooter}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Header
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
  headerContent: {
    flex: 1,
    marginLeft: 16,
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
  
  // Search
  searchContainer: {
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  clearSearch: {
    padding: 4,
  },
  
  scrollView: {
    flex: 1,
  },

  // Content Container (for non-FlatList content)
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Filters Section
  filtersSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  filtersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  filtersToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  filtersContent: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 16,
  },
  
  // Filter Groups
  filterGroup: {
    marginBottom: 20,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  
  // Filter Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Nutrition Chips
  nutritionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  microSortRow: {
    marginTop: 8,
    gap: 8,
  },
  microSortLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  sortToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  sortToggleActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  sortToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  sortToggleTextActive: {
    color: '#FFFFFF',
  },
  nutritionChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  nutritionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  nutritionChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Range Inputs
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rangeInputContainer: {
    flex: 1,
  },
  rangeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Preset Chips
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  
  // Category Chips
  categoryChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  
  // Sort Options
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sortOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },
  
  // Clear Button
  clearButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Results
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  showingCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // FlatList
  flatListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Load More Container
  loadMoreContainer: {
    paddingVertical: 16,
  },
  
  // Load More Button
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  loadMoreButtonLoading: {
    backgroundColor: '#9CA3AF',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});