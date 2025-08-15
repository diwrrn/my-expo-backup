import { createContext, useContext, type PropsWithChildren } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { FirebaseService } from '@/services/firebaseService';
import { User as AppUser, UserProfile } from '@/types/api';
import { useAppStore } from '@/store/appStore';
import { useStorageState } from './useStorageState';
import { useEffect } from 'react';

interface AuthUser extends AppUser {
  profile?: UserProfile;
}

interface SessionContextType {
  signIn: (phoneNumber: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signUpWithPhoneVerification: (phoneNumber: string, name: string, password: string) => Promise<void>;
  signOut: () => void;
  session?: string | null;
  user?: AuthUser | null;
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  signIn: () => Promise.resolve(),
  signOut: () => null,
  session: null,
  user: null,
  isLoading: false,
  signUp: () => Promise.resolve(),
  signUpWithPhoneVerification: () => Promise.resolve(),
});

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState('session');
  
  const setUser = useAppStore(state => state.setUser);
  const setUserLoading = useAppStore(state => state.setUserLoading);
  const user = useAppStore(state => state.user);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      try {
        if (firebaseUser) {
          console.log('🔥 User logged in:', firebaseUser.uid);
          
          const [userData, userProfile] = await Promise.all([
            FirebaseService.getUserProfile(firebaseUser.uid),
            FirebaseService.getUserProfileDocument(firebaseUser.uid)
          ]);

          const fullUser: AuthUser = {
            ...userData,
            profile: userProfile ?? undefined,
          };

          if (isMounted) {
            setSession(firebaseUser.uid);
            setUser(fullUser);
            setUserLoading(false);
          }
        } else {
          console.log('🔥 User logged out');
          
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserLoading(false);
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setUserLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (phoneNumber: string, password: string) => {
    try {
      setUserLoading(true);
      await FirebaseService.signInWithPhone(phoneNumber, password);
    } catch (error) {
      setUserLoading(false);
      throw error;
    }
  };

  const signUpWithPhoneVerification = async (phoneNumber: string, name: string, password: string) => {
    try {
      setUserLoading(true);
      
      // Check if phone exists
      const phoneExists = await FirebaseService.checkPhoneNumberExists(phoneNumber);
      if (phoneExists) {
        throw new Error('Phone number already registered');
      }
      
      await FirebaseService.signUpWithPhone(phoneNumber, password, name);
      // Firebase auth listener will handle the rest automatically
    } catch (error) {
      setUserLoading(false);
      throw error;
    }
  };
  
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setUserLoading(true);
      await FirebaseService.signUp(email, password, name);
      // Firebase auth listener will handle the rest automatically
    } catch (error) {
      setUserLoading(false);
      throw error;
    }
  };

  const signOut = () => {
    FirebaseService.signOut();
  };

  return (
    <SessionContext.Provider
      value={{
        signIn,
        signUp,
        signUpWithPhoneVerification,
        signOut,
        session,
        user,
        isLoading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}