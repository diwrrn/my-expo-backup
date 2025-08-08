import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile } from '@/types/api';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from '@/hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileCache {
  profile: UserProfile | null;
  lastUpdated: number;
  isLoading: boolean;
  error: string | null;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  loadProfile: (forceRefresh?: boolean) => Promise<UserProfile | null>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours
const PROFILE_CACHE_KEY = 'profile_cache_';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cache, setCache] = useState<ProfileCache>({
    profile: null,
    lastUpdated: 0,
    isLoading: false,
    error: null,
  });

  // Load profile from AsyncStorage
  const loadProfileFromAsyncStorage = useCallback(async (userId: string) => {
    try {
      const cacheKey = PROFILE_CACHE_KEY + userId;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        const parsedCache: ProfileCache = JSON.parse(cachedData);
        return parsedCache;
      }
      return null;
    } catch (error) {
      return null;
    }
  }, []);

  // Save profile to AsyncStorage
  const saveProfileToAsyncStorage = useCallback(async (userId: string, cacheData: ProfileCache) => {
    try {
      const cacheKey = PROFILE_CACHE_KEY + userId;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      // Silent fail for AsyncStorage errors
    }
  }, []);

  // Check if cache is expired
  const isCacheExpired = useCallback((lastUpdated: number) => {
    return Date.now() - lastUpdated > CACHE_DURATION;
  }, []);

  // Load profile from Firebase
  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return null;
    
    // First, try to load from AsyncStorage
    if (!forceRefresh) {
      const cachedData = await loadProfileFromAsyncStorage(user.id);
      if (cachedData && !isCacheExpired(cachedData.lastUpdated)) {
        setCache(cachedData);
        return cachedData.profile;
      }
    }

    try {
      setCache(prev => ({ ...prev, isLoading: true, error: null }));
      
      const profile = await FirebaseService.getUserProfileDocument(user.id);
      
      const newCache = {
        profile,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };
      
      setCache(newCache);
      await saveProfileToAsyncStorage(user.id, newCache);
      
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [user?.id, loadProfileFromAsyncStorage, saveProfileToAsyncStorage, isCacheExpired]);

  // Update profile in cache and Firebase
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) return null;

    try {
      setCache(prev => ({ ...prev, isLoading: true, error: null }));

      // Update Firebase first
      await FirebaseService.updateUserProfileDocument(user.id, updates);

      // Update local cache
      const updatedProfile = cache.profile ? {
        ...cache.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      } : {
        ...updates,
        updatedAt: new Date().toISOString(),
      } as UserProfile;

      const newCache = {
        profile: updatedProfile,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      };

      setCache(newCache);
      await saveProfileToAsyncStorage(user.id, newCache);

      return updatedProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setCache(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [user?.id, cache.profile, saveProfileToAsyncStorage]);

  // Refresh profile (force reload)
  const refreshProfile = useCallback(async () => {
    await loadProfile(true);
  }, [loadProfile]);

  // Auto-load profile when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfile();
    } else {
      // Clear cache when user logs out
      setCache({
        profile: null,
        lastUpdated: 0,
        isLoading: false,
        error: null,
      });
    }
  }, [user?.id, loadProfile]);

  const contextValue = useMemo(() => ({
    profile: cache.profile,
    isLoading: cache.isLoading,
    error: cache.error,
    loadProfile,
    updateProfile,
    refreshProfile,
  }), [cache.profile, cache.isLoading, cache.error, loadProfile, updateProfile, refreshProfile]);

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    return {
      profile: null,
      isLoading: false,
      error: null,
      loadProfile: async () => null,
      updateProfile: async () => null,
      refreshProfile: async () => {},
    };
  }
  return context;
}