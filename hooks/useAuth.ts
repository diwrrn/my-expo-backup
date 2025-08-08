import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FirebaseService } from '@/services/firebaseService';
import { User as AppUser, UserProfile } from '@/types/api';

interface AuthUser extends AppUser {
  profile?: UserProfile;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user profile from Firebase
  const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      return await FirebaseService.getUserProfileDocument(userId);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }, []);

  // Load user data from Firebase
  const loadUserData = useCallback(async (firebaseUser: User): Promise<AppUser> => {
    try {
      return await FirebaseService.getUserProfile(firebaseUser.uid);
    } catch (error) {
      if (error instanceof Error && error.message === 'User profile not found') {
        // New user - create basic profile
        return {
          id: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
          name: firebaseUser.displayName || 'New User',
          onboardingCompleted: false,
        };
      }
      throw error;
    }
  }, []);

  // Auth state change handler
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        if (firebaseUser) {
          // Load user data and profile in parallel
          const [userData, userProfile] = await Promise.all([
            loadUserData(firebaseUser),
            loadUserProfile(firebaseUser.uid)
          ]);

          setUser({
            ...userData,
            profile: userProfile ?? undefined,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadUserData, loadUserProfile]);

  // Auth methods
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await FirebaseService.signUp(email, password, name);
      setUser(newUser);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUpWithPhone = useCallback(async (phoneNumber: string, password: string, name: string) => {
    try {
      setError(null);
      setLoading(true);

      const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }

      const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);
      const userProfile = await loadUserProfile(newUser.id);

      setUser({
        ...newUser,
        profile: userProfile ?? undefined,
      });
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signUpWithPhoneVerification = useCallback(async (phoneNumber: string, name: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }

      const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);
      const userProfile = await loadUserProfile(newUser.id);

      setUser({
        ...newUser,
        profile: userProfile ?? undefined,
      });
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up with phone verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await FirebaseService.signIn(email, password);
      const userProfile = await loadUserProfile(user.id);

      setUser({
        ...user,
        profile: userProfile ?? undefined,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signInWithPhone = useCallback(async (phoneNumber: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await FirebaseService.signInWithPhone(phoneNumber, password);
      const userProfile = await loadUserProfile(user.id);

      setUser({
        ...user,
        profile: userProfile ?? undefined,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signInWithPhoneVerification = useCallback(async (phoneNumber: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await FirebaseService.signInWithPhone(phoneNumber, password);
      const userProfile = await loadUserProfile(user.id);

      setUser({
        ...user,
        profile: userProfile ?? undefined,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in with phone verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await FirebaseService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }
      setError(null);
      
      // Update user data
      if (updates.name || updates.phoneNumber || updates.onboardingCompleted !== undefined) {
        const userUpdates: Partial<AppUser> = {};
        if (updates.name) userUpdates.name = updates.name;
        if (updates.phoneNumber) userUpdates.phoneNumber = updates.phoneNumber;
        if (updates.onboardingCompleted !== undefined) userUpdates.onboardingCompleted = updates.onboardingCompleted;
        
        await FirebaseService.updateUserProfile(user.id, userUpdates);
      }
      
      // Update profile data
      if (updates.profile) {
        await FirebaseService.updateUserProfileDocument(user.id, updates.profile);
      }
      
      // Update local state
      setUser(prev => prev ? {
        ...prev,
        ...updates,
        profile: updates.profile ? { ...prev.profile, ...updates.profile } : prev.profile
      } : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateUserPassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');
      setError(null);
      // Implement password update logic here
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    signUp,
    signUpWithPhone,
    signUpWithPhoneVerification,
    signIn,
    signInWithPhone,
    signInWithPhoneVerification,
    signOut,
    updateProfile,
    updateUserPassword,
    isAuthenticated: !!user,
    profileLoaded: !loading && !!user,
  };
}