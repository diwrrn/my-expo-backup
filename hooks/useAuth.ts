import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FirebaseService } from '@/services/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User as AppUser, UserProfile } from '@/types/api';
import { useProfileCache } from './useProfileCache';

interface AuthUser extends AppUser {
  profile?: UserProfile;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true); // Auth state loading
  const [error, setError] = useState<string | null>(null);
  const [isProfileDataLoaded, setIsProfileDataLoaded] = useState(false); // NEW: Explicit state for profile data loading completion

  const profileCache = useProfileCache(user?.id);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        if (firebaseUser) {
          // This call will update profileCache.isLoading internally
          await profileCache.loadProfileToCache();
          
          let userData: any = {}; // Initialize userData
          try {
            // Attempt to get user-level data (name, phoneNumber, onboardingCompleted)
            // This call might fail if the profile document isn't immediately available
            // This is a placeholder for FirebaseService.getUserProfile, which is not provided in the context.
            // Assuming it fetches user details from Firestore based on UID.
            userData = await FirebaseService.getUserProfile(firebaseUser.uid);
          } catch (err) {
            // If FirebaseService.getUserProfile throws "User profile not found",
            // it means the profile document might not exist yet for a new user.
            // We'll proceed with basic firebaseUser data and rely on profileCache.profile.
            if (err instanceof Error && err.message === 'User profile not found') {
              console.log('📝 User profile not found immediately after auth state change. This is expected for new users.');
              // Populate with basic firebaseUser data if profile not found
              userData = {
                id: firebaseUser.uid,
                phoneNumber: firebaseUser.phoneNumber,
                name: firebaseUser.displayName || 'New User', // Fallback name
                onboardingCompleted: false // Assume false for new users
              };
            } else {
              // Re-throw other unexpected errors
              throw err;
            }
          }

          const userProfile = profileCache.profile; // Get the latest profile from cache

          const newUserObject = {
            ...userData,
            profile: userProfile,
          };

          setUser(prevUser => {
            if (prevUser && prevUser.id === newUserObject.id &&
                prevUser.name === newUserObject.name &&
                prevUser.phoneNumber === newUserObject.phoneNumber &&
                (JSON.stringify(prevUser.profile) === JSON.stringify(newUserObject.profile))) {
              return prevUser;
            }
            console.log('useAuth: Setting user state with profile:', newUserObject.profile?.goalsWaterUpdate);
            return newUserObject;
          });

          // Simple background retry if no profile
          if (!userProfile) {
            setTimeout(async () => {
              try {
                const retryProfile = await profileCache.loadProfileToCache();
                if (retryProfile) {
                  console.log('✅ Profile found on background retry!');
                  setUser(prev => {
                    if (prev && !prev.profile && retryProfile) {
                      return { ...prev, profile: retryProfile };
                    }
                    return prev;
                  });
                }
              } catch (err) {
                console.log('📝 Background retry failed - user is new');
              }
            }, 3000);
          }

        } else {
          // User is null (signed out or not logged in)
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state change error:', err); // This will now only log truly unexpected errors
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false); // Auth loading is done
      }
    });

    return unsubscribe;
  }, [profileCache.loadProfileToCache]);

  // NEW: Effect to set isProfileDataLoaded once both loading states are false
  useEffect(() => {
    if (!loading && !profileCache.isLoading) {
      setIsProfileDataLoaded(true);
    } 
  }, [loading, profileCache.isLoading]);

  useEffect(() => {
    if (user && profileCache.profile) {
      console.log('🔄 Profile cache updated, syncing to user state:', profileCache.profile.goalsWaterUpdate);
      setUser(prevUser => {
        if (prevUser && prevUser.profile !== profileCache.profile) {
          console.log('✅ Updating user state with new profile data');
          return {
            ...prevUser,
            profile: profileCache.profile
          };
        }
        return prevUser;
      });
    }
  }, [profileCache.profile]);

  const signUp = async (email: string, password: string, name: string) => {
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
  };

  const signUpWithPhone = async (phoneNumber: string, password: string, name: string) => {
    try {
      setError(null);
      setLoading(true);

      const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }

      const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);

      const userProfile = await profileCache.loadProfileToCache(true);

      setUser({
        ...newUser,
        profile: userProfile,
      });
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs up a user with a phone number after successful external phone verification.
   * This method should only be called by the UI after `usePhoneVerification` has confirmed
   * the phone number is successfully verified.
   */
  const signUpWithPhoneVerification = async (phoneNumber: string, name: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      // Assume phone number has already been verified by the UI using usePhoneVerification hook.
      // No token validation is performed here.

      const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }

      const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);

      // After successful sign-up, load the profile to cache
      const userProfile = await profileCache.loadProfileToCache(true); // Force refresh for new user

      setUser({
        ...newUser,
        profile: userProfile,
      });
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up with phone verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await FirebaseService.signIn(email, password);

      const userProfile = await profileCache.loadProfileToCache();

      setUser({
        ...user,
        profile: userProfile,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const user = await FirebaseService.signInWithPhone(phoneNumber, password);

      const userProfile = await profileCache.loadProfileToCache();

      setUser({
        ...user,
        profile: userProfile,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Signs in a user using a phone number and password.
   * This method is intended for users who have registered via a phone verification flow.
   * It does not perform a new verification step at sign-in.
   */
  const signInWithPhoneVerification = async (phoneNumber: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      // This method directly uses the existing password-based phone sign-in.
      // The "verification" in the name implies that this is the designated method
      // for users who have gone through our phone verification flow (e.g., at registration).
      const user = await FirebaseService.signInWithPhone(phoneNumber, password);

      const userProfile = await profileCache.loadProfileToCache();

      setUser({
        ...user,
        profile: userProfile,
      });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in with phone verification failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);

      await FirebaseService.signOut();

      profileCache.clearCache();

      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      throw err;
    }
  };

 const updateProfile = async (updates: Partial<AppUser>) => {
  try {
    if (!user) {
      console.warn('Attempted to update profile with no user logged in. This should be prevented by calling components.');
      throw new Error('No user logged in');
    }
    setError(null);
    
    if (updates.name || updates.phoneNumber || updates.onboardingCompleted !== undefined) {
      // Extract only the fields that should go to users collection
      const userUpdates: Partial<AppUser> = {};
      if (updates.name) userUpdates.name = updates.name;
      if (updates.phoneNumber) userUpdates.phoneNumber = updates.phoneNumber;
      if (updates.onboardingCompleted !== undefined) userUpdates.onboardingCompleted = updates.onboardingCompleted;
      
      await FirebaseService.updateUserProfile(user.id, userUpdates);
    }
    
    let updatedUserProfile = user.profile;
    if (updates.profile) {
      updatedUserProfile = await profileCache.updateProfileInCache(updates.profile);
    }
    
    setUser({
      ...user,
      ...updates,
      profile: updates.profile ? updatedUserProfile : (user.profile || undefined)
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
    setError(errorMessage);
    throw err;
  }
};

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user) throw new Error('No user logged in');

      setError(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password update failed';
      setError(errorMessage);
      throw err;
    }
  };
  return {
    user,
    loading,
    error,
    signUp,
    signUpWithPhone,
    signUpWithPhoneVerification, // EXPOSE NEW METHOD
    signIn,
    signInWithPhone,
    signInWithPhoneVerification, // EXPOSE NEW METHOD
    signOut,
    updateProfile,
    updateUserPassword,
    isAuthenticated: !!user,

    profileCache: {
      profile: profileCache.profile,
      isLoading: profileCache.isLoading,
      error: profileCache.error,
      refreshCache: profileCache.refreshCache,
      isCacheExpired: profileCache.isCacheExpired,
    },
    profileLoaded: isProfileDataLoaded, // EXPOSE NEW STATE
  };
}
