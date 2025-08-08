import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile } from '@/types/api';
import { FirebaseService } from '@/services/firebaseService';

interface ProfileCache {
  profile: UserProfile | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

export function useProfileCache(userId?: string) {
  const [cache, setCache] = useState<ProfileCache>({
    profile: null,
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Check if cache is expired
  const isCacheExpired = useCallback(() => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  }, [cache.lastUpdated]);

  // Load profile from Firebase
  const loadProfileToCache = useCallback(async (forceRefresh = false) => {
    if (!userId) return null;
    
    // Use cache if not expired and not forcing refresh
    if (!forceRefresh && cache.profile && !isCacheExpired()) {
      return cache.profile;
    }

    try {
      setCache(prev => ({ ...prev, isLoading: true, error: null }));
      
      const profile = await FirebaseService.getUserProfileDocument(userId);
      
      setCache({
        profile,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });
      
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [userId, cache.profile, isCacheExpired]);

  // Update profile in cache and Firebase
  const updateProfileInCache = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userId) {
      throw new Error('No user ID available');
    }

    try {
      setCache(prev => ({ ...prev, isLoading: true, error: null }));

      // Update Firebase first
      await FirebaseService.updateUserProfileDocument(userId, updates);

      // Update local cache
      const updatedProfile = cache.profile ? {
        ...cache.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      } : {
        ...updates,
        updatedAt: new Date().toISOString(),
      } as UserProfile;

      setCache({
        profile: updatedProfile,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      });

      return updatedProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [userId, cache.profile]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({
      profile: null,
      lastUpdated: 0,
      isLoading: false,
      error: null,
    });
  }, []);

  // Refresh cache
  const refreshCache = useCallback(() => {
    if (userId) {
      loadProfileToCache(true);
    }
  }, [userId, loadProfileToCache]);

  // Load profile when userId changes
  useEffect(() => {
    if (userId) {
      loadProfileToCache();
    } else {
      clearCache();
    }
  }, [userId, loadProfileToCache, clearCache]);

  // Memoized return object
  return useMemo(() => ({
    profile: cache.profile,
    lastUpdated: cache.lastUpdated,
    isLoading: cache.isLoading,
    error: cache.error,
    isCacheExpired,
    loadProfileToCache,
    updateProfileInCache,
    refreshCache,
    clearCache,
  }), [
    cache.profile,
    cache.lastUpdated,
    cache.isLoading,
    cache.error,
    isCacheExpired,
    loadProfileToCache,
    updateProfileInCache,
    refreshCache,
    clearCache,
  ]);
}