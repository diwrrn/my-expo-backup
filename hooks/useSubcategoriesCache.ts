// hooks/useSubcategoriesCache.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseService } from '../services/firebaseService';

const CACHE_KEY = 'workout_subcategories_cache';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week

interface Subcategory {
  id: string;
  name: string;
  kurdishName?: string;
  arabicName?: string;
  categoryId: string;
  // add other properties as needed
}

interface SubcategoriesCache {
  subcategories: Subcategory[];
  lastUpdated: number;
}

export const useSubcategoriesCache = (categoryId: string) => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCacheKey = () => `${CACHE_KEY}_${categoryId}`;

  const loadSubcategoriesFromAsyncStorage = async (): Promise<Subcategory[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(getCacheKey());
      if (!cached) return null;

      const cache: SubcategoriesCache = JSON.parse(cached);
      const now = Date.now();

      if (now - cache.lastUpdated < CACHE_DURATION) {
        console.log('📱 Using cached subcategories from AsyncStorage');
        return cache.subcategories;
      }

      console.log('📱 Subcategories cache expired, will refresh');
      return null;
    } catch (error) {
      console.log('📱 Error loading subcategories from AsyncStorage:', error);
      return null;
    }
  };

  const saveSubcategoriesToAsyncStorage = async (subcategories: Subcategory[]) => {
    try {
      const cache: SubcategoriesCache = {
        subcategories,
        lastUpdated: Date.now()
      };
      await AsyncStorage.setItem(getCacheKey(), JSON.stringify(cache));
      console.log('📱 Subcategories saved to AsyncStorage');
    } catch (error) {
      console.log('📱 Error saving subcategories to AsyncStorage:', error);
    }
  };

  const loadSubcategories = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!forceRefresh) {
        const cachedSubcategories = await loadSubcategoriesFromAsyncStorage();
        if (cachedSubcategories) {
          setSubcategories(cachedSubcategories);
          setIsLoading(false);
          return;
        }
      }

      console.log('🔥 Fetching subcategories from Firebase...');
      const fetchedSubcategories = await FirebaseService.getSubcategories(categoryId);
      
      if (fetchedSubcategories && fetchedSubcategories.length > 0) {
        setSubcategories(fetchedSubcategories);
        await saveSubcategoriesToAsyncStorage(fetchedSubcategories);
        console.log(`🔥 Loaded ${fetchedSubcategories.length} subcategories from Firebase`);
      } else {
        setError('No subcategories found');
      }
    } catch (error) {
      console.log('🔥 Error loading subcategories:', error);
      setError('Failed to load subcategories');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubcategories = () => loadSubcategories(true);

  useEffect(() => {
    if (categoryId) {
      loadSubcategories();
    }
  }, [categoryId]);

  return {
    subcategories,
    isLoading,
    error,
    refreshSubcategories
  };
};