import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FirebaseService } from '@/services/firebaseService';
import { User as AppUser, UserProfile } from '@/types/api';
import { useAppStore } from '@/store/appStore';

interface AuthUser extends AppUser {
 profile?: UserProfile;
}

export function useAuth() {
 const [user, setUser] = useState<AuthUser | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [prevUser, setPrevUser] = useState<AuthUser | null>(null);
 
 // ADD PROCESSING GUARD TO PREVENT INFINITE LOOPS
 const processingAuthChange = useRef(false);

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

// Add debounce ref at the component level
const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

// Auth state change handler
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    // GUARD: Prevent recursive auth state changes
    if (processingAuthChange.current) {
      console.log('🛑 Auth change already processing, skipping...');
      return;
    }
    
    processingAuthChange.current = true;
    console.log('�� onAuthStateChanged FIRED - Firebase user changed');
    
    try {
      if (firebaseUser) {
        // Load user data and profile in parallel
        const [userData, userProfile] = await Promise.all([
          loadUserData(firebaseUser),
          loadUserProfile(firebaseUser.uid)
        ]);

        const finalUser = {
          ...userData,
          profile: userProfile ?? undefined,
        };
        
        // ONLY UPDATE IF USER ACTUALLY CHANGED
        const userChanged = !prevUser || 
          finalUser.id !== prevUser.id ||
          finalUser.name !== prevUser.name ||
          finalUser.phoneNumber !== prevUser.phoneNumber ||
          finalUser.onboardingCompleted !== prevUser.onboardingCompleted ||
          JSON.stringify(finalUser.profile) !== JSON.stringify(prevUser.profile);

        if (userChanged) {
          // Clear any existing timeout
          if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
          }
          
          // Debounce the update
          debounceTimeout.current = setTimeout(() => {
            console.log('🔄 User actually changed, updating...', {
              id: finalUser.id !== prevUser?.id,
              name: finalUser.name !== prevUser?.name,
              updatedAt: finalUser.profile?.updatedAt !== prevUser?.profile?.updatedAt
            });
            setUser(finalUser);
            setPrevUser(finalUser);
            useAppStore.getState().setUser(finalUser);
          }, 100); // 100ms debounce
        } else {
          console.log('🔍 User unchanged, skipping update');
        }
      } else {
        if (prevUser !== null) {
          setUser(null);
          setPrevUser(null);
          useAppStore.getState().setUser(null);
        }
      }
    } catch (err) {
      console.error('Auth state change error:', err);
      setError(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setLoading(false);
      useAppStore.getState().setUserLoading(false);
      // RESET PROCESSING FLAG
      processingAuthChange.current = false;
    }
  });

  return unsubscribe;
}, [loadUserData, loadUserProfile]);
useEffect(() => {
  return () => {
    // Cleanup timeout on unmount
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
  }; 
}, []);
 // Auth methods
 const signUp = useCallback(async (email: string, password: string, name: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);
     const newUser = await FirebaseService.signUp(email, password, name);
     setUser(newUser);
     useAppStore.getState().setUser(newUser);
     return newUser;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, []);

 const signUpWithPhone = useCallback(async (phoneNumber: string, password: string, name: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);

     const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
     if (phoneExists) {
       throw new Error('Phone number already registered');
     }

     const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);
     const userProfile = await loadUserProfile(newUser.id);

     const finalUser = {
       ...newUser,
       profile: userProfile ?? undefined,
     };
     setUser(finalUser);
     useAppStore.getState().setUser(finalUser);
     return newUser;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, [loadUserProfile]);

 const signUpWithPhoneVerification = useCallback(async (phoneNumber: string, name: string, password: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);

     const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
     if (phoneExists) {
       throw new Error('Phone number already registered');
     }

     const newUser = await FirebaseService.signUpWithPhone(phoneNumber, password, name);
     const userProfile = await loadUserProfile(newUser.id);

     const finalUser = {
       ...newUser,
       profile: userProfile ?? undefined,
     };
     setUser(finalUser);
     useAppStore.getState().setUser(finalUser);
     return newUser;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign up with phone verification failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, [loadUserProfile]);

 const signIn = useCallback(async (email: string, password: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);
     const user = await FirebaseService.signIn(email, password);
     const userProfile = await loadUserProfile(user.id);

     const finalUser = {
       ...user,
       profile: userProfile ?? undefined,
     };
     setUser(finalUser);
     useAppStore.getState().setUser(finalUser);
     return user;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, [loadUserProfile]);

 const signInWithPhone = useCallback(async (phoneNumber: string, password: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);
     const user = await FirebaseService.signInWithPhone(phoneNumber, password);
     const userProfile = await loadUserProfile(user.id);

     const finalUser = {
       ...user,
       profile: userProfile ?? undefined,
     };
     setUser(finalUser);
     useAppStore.getState().setUser(finalUser);
     return user;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, [loadUserProfile]);

 const signInWithPhoneVerification = useCallback(async (phoneNumber: string, password: string) => {
   try {
     setError(null);
     setLoading(true);
     useAppStore.getState().setUserLoading(true);
     const user = await FirebaseService.signInWithPhone(phoneNumber, password);
     const userProfile = await loadUserProfile(user.id);

     const finalUser = {
       ...user,
       profile: userProfile ?? undefined,
     };
     setUser(finalUser);
     useAppStore.getState().setUser(finalUser);
     return user;
   } catch (err) {
     const errorMessage = err instanceof Error ? err.message : 'Sign in with phone verification failed';
     setError(errorMessage);
     throw err;
   } finally {
     setLoading(false);
     useAppStore.getState().setUserLoading(false);
   }
 }, [loadUserProfile]);

 const signOut = useCallback(async () => {
   try {
     setError(null);
     await FirebaseService.signOut();
     setUser(null);
     useAppStore.getState().setUser(null);
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
     const updatedUser = user ? {
       ...user,
       ...updates,
       profile: updates.profile ? { ...user.profile, ...updates.profile } : user.profile
     } : null;
     setUser(updatedUser);
     useAppStore.getState().setUser(updatedUser);
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