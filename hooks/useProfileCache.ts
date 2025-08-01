import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserProfile } from '@/types/api';
import { FirebaseService } from '@/services/firebaseService';

interface ProfileCache {
  profile: UserProfile | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Deep equality comparison for objects
 */
const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (!obj1 || !obj2) return false;
  
  try {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  } catch (error) {
    console.warn('Error in profile equality check:', error);
    return false;
  }
};

export function useProfileCache(userId?: string) {
  const [cache, setCache] = useState<ProfileCache>({
    profile: null,
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Refs for preventing loops and tracking state
  const isUpdatingRef = useRef(false);
  const lastUpdateDataRef = useRef<UserProfile | null>(null);
  const lastLogTimeRef = useRef(0);

  // Stable function to check if cache is expired - REMOVED cache dependencies
  const isCacheExpired = useCallback(() => {
    return Date.now() - cache.lastUpdated > CACHE_DURATION;
  }, [cache.lastUpdated]);

  // Stable function to load profile from Firebase and cache it - CRITICAL: Remove cache.profile dependency
  const loadProfileToCache = useCallback(async (forceRefresh = false) => {
    if (!userId) return null;
    
    // Prevent concurrent updates
    if (isUpdatingRef.current) {
      return cache.profile;
    }
    
    if (!forceRefresh && cache.profile && !isCacheExpired()) {
      return cache.profile; // Use existing cache
    }

    try {
      isUpdatingRef.current = true;
      setCache(prev => ({ ...prev, isLoading: true, error: null }));

      const profile = await FirebaseService.getUserProfileDocument(userId);
      
      // Only update cache if data actually changed
      if (!areObjectsEqual(profile, lastUpdateDataRef.current)) {
        setCache({
          profile,
          lastUpdated: Date.now(),
          isLoading: false,
          error: null,
        });

        lastUpdateDataRef.current = profile;
      } else {
        // Throttle logging to prevent spam
        const now = Date.now();
        if (now - lastLogTimeRef.current > 5000) {
          console.log('Profile data unchanged, skipping cache update');
          lastLogTimeRef.current = now;
        }
        setCache(prev => ({ ...prev, isLoading: false }));
      }
      
      return profile;
    } catch (error) {
      console.error('Error loading profile to cache:', error);
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load profile',
      }));
      throw error;
    } finally {
      isUpdatingRef.current = false;
    }
  }, [userId, isCacheExpired]); // REMOVED cache.profile dependency

// Replace the updateProfileInCache function with this fixed version:

const updateProfileInCache = useCallback(async (updates: Partial<UserProfile>) => {
  if (!userId) {
    throw new Error('No user ID available');
  }

  try {
    isUpdatingRef.current = true;

    // Use functional state update to get the current state
    let newProfileForCache: UserProfile;
    
   setCache(prevCache => {
  // Get the current profile from the actual current state
  const currentLocalProfile = prevCache.profile;
  
  // Create the new profile object for the local cache
  // If no existing profile (new user), create one with just the updates
  newProfileForCache = currentLocalProfile ? {
    ...currentLocalProfile,
    ...updates,
    updatedAt: new Date().toISOString(),
  } : {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

      console.log('✅ Profile updated in cache for user:', userId, 'with optimistic data:', newProfileForCache);

      // Return the new cache state
      return {
        profile: newProfileForCache,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };
    });

    // Update ref for equality check
    lastUpdateDataRef.current = newProfileForCache;

    // Send the update to Firebase in the background
    FirebaseService.updateUserProfileDocument(userId, updates)
      .then(() => {
        console.log('✅ Firebase update sent successfully for profile.');
      })
      .catch(firebaseError => {
        console.error('❌ Error sending profile update to Firebase:', firebaseError);
      });

    return newProfileForCache;
  } catch (error) {
    console.error('Error updating profile in cache:', error);
    setCache(prev => ({
      ...prev,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    }));
    throw error;
  } finally {
    isUpdatingRef.current = false;
  }
}, [userId]); // Remove cache.profile dependency

  // Stable function to clear cache
  const clearCache = useCallback(() => {
    lastUpdateDataRef.current = null;
    lastLogTimeRef.current = 0;
    
    setCache({
      profile: null,
      lastUpdated: 0,
      isLoading: false,
      error: null,
    });
  }, []);

  // Stable function to refresh cache manually
  const refreshCache = useCallback(() => {
    if (userId) {
      lastLogTimeRef.current = 0;
      loadProfileToCache(true);
    }
  }, [userId, loadProfileToCache]);

  // Load profile when userId changes (not when cache changes)
  useEffect(() => {
    if (userId) {
      loadProfileToCache();
    } else {
      clearCache();
    }
  }, [userId]); // Only depend on userId, not the functions or cache

  // Reset logging throttle periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      lastLogTimeRef.current = 0;
    }, 30000);

    return () => clearInterval(resetInterval);
  }, []);

  // Memoize the returned object to ensure stability
  return useMemo(() => ({
    // Cache state
    profile: cache.profile,
    lastUpdated: cache.lastUpdated,
    isLoading: cache.isLoading,
    error: cache.error,
    isCacheExpired,
    
    // Cache operations
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