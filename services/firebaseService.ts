import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
  documentId,
} from 'firebase/firestore';
import { auth } from '@/config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import {
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import {
  Food,
  DiaryEntry,
  UserProfile,
  SavedMealPlan,
  MealTemplate,
  NutritionGoals,
  MicroNutrientGoals,
  User as AppUser,
  NutritionPer100,
    FoodRequest, // Make sure this is imported

} from '@/types/api';
import { getTodayDateString } from '@/utils/dateUtils';

export interface WorkoutSession {
  id: string;
  planId: string;
  startTime: string;
  endTime?: string;
  totalTime: number;
  status: 'in-progress' | 'completed' | 'cancelled';
  completedExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    sets: Array<{
      reps: number;
      weight?: number;
      completed: boolean;
    }>;
    notes?: string;
    duration: number;
  }>;
}
export interface MonthlyReportDocument {
  startDate: string;
  endDate: string;
  timezone?: string;
  generatedAt: string;
  daysWithData: number;
  reportData: any;
}

export interface WeeklyReportDocument {
  startDate: string;
  endDate: string;
  timezone?: string;
  generatedAt: string;
  daysWithData: number;
  reportData: any;
}

export class FirebaseService {
  // Phone-based Authentication
  static async signUpWithPhone(phoneNumber: string, password: string, name: string): Promise<AppUser> {
    try {
      // Create a temporary email from phone number for Firebase Auth
      const tempEmail = `${phoneNumber.replace(/[^\d]/g, '')}@temp.local`;
      
      const userCredential = await createUserWithEmailAndPassword(auth, tempEmail, password);
      const user = userCredential.user;
      
      // Update display name
      await updateFirebaseProfile(user, { displayName: name });
      
      const appUser: AppUser = {
        id: user.uid,
        phoneNumber,
        name,
        createdAt: new Date().toISOString(),
      };
      
      await this.createUserProfile(appUser);
      
      // Create separate user profile document
      await this.createUserProfileDocument(user.uid);
      
      return appUser;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signInWithPhone(phoneNumber: string, password: string): Promise<AppUser> {
    try {
      // Convert phone number to temporary email format
      const tempEmail = `${phoneNumber.replace(/[^\d]/g, '')}@temp.local`;
      
      const userCredential = await signInWithEmailAndPassword(auth, tempEmail, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(user.uid);
      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Legacy email methods (keeping for backward compatibility)
  static async signUp(email: string, password: string, name: string): Promise<AppUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update display name
      await updateFirebaseProfile(user, { displayName: name });
      
      // Create user profile in Firestore
      const userProfile: UserProfile = {
        weight: 70,
        height: 170,
        age: 25,
        activityLevel: 'moderate',
        goals: {
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 65,
        },
      };
      
      const appUser: AppUser = {
        id: user.uid,
        phoneNumber: '',
        name,
        createdAt: new Date().toISOString(),
      };
      
      await this.createUserProfile(appUser);
      await this.createUserProfileDocument(user.uid);
      return appUser;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  static async signIn(email: string, password: string): Promise<AppUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user profile from Firestore
      const userProfile = await this.getUserProfile(user.uid);
      return userProfile;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // User Profile Management
  static async createUserProfile(user: AppUser): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      console.error('Create user profile error:', error);
      throw error;
    }
  }

  static async getUserProfile(userId: string): Promise<AppUser> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as AppUser;
        if (!userData.phoneNumber) {
          userData.phoneNumber = '';
        }
        return userData;
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  // User Profile Management (separate collection)
  static async createUserProfileDocument(userId: string): Promise<void> {
    try {
      const userProfile: UserProfile = {
        id: userId,
        userId,
        weight: 70,
        height: 170,
        age: 25,
        activityLevel: 'moderate',
        goals: {
          calories: 2000,
          protein: 100,
          carbs: 250,
          fat: 65,
        },
        microNutrientGoals: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'userProfiles', userId), userProfile);
    } catch (error) {
      console.error('Create user profile document error:', error);
      throw error;
    }
  }

  static async getUserProfileDocument(userId: string): Promise<UserProfile> {
    try {
      const profileDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (profileDoc.exists()) {
        return profileDoc.data() as UserProfile;
      } else {
        // Create default profile if it doesn't exist
        await this.createUserProfileDocument(userId);
        return await this.getUserProfileDocument(userId);
      }
    } catch (error) {
      console.error('Get user profile document error:', error);
      throw error;
    }
  }

  static async updateUserProfileDocument(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(doc(db, 'userProfiles', userId), updateData);
      console.log('✅ Firebase: Profile updated successfully for user:', userId, 'with data:', updateData);
      
      // Fetch the updated document from Firebase to ensure we have the latest state
      const updatedProfileDoc = await getDoc(doc(db, 'userProfiles', userId));
      if (updatedProfileDoc.exists()) {
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        console.log('✅ Firebase: Retrieved updated profile from Firebase:', updatedProfile);
        return updatedProfile;
      } else {
        throw new Error('Profile document not found after update');
      }
    } catch (error) {
      console.error('Update user profile document error:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: Partial<AppUser>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  static async updateUserGoals(userId: string, goals: NutritionGoals): Promise<void> {
    try {
      await updateDoc(doc(db, 'userProfiles', userId), {
        goals: goals,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Update user goals error:', error);
      throw error;
    }
  }

  // Check if phone number already exists
  static async checkPhoneNumberExists(phoneNumber: string): Promise<boolean> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Check phone number exists error:', error);
      return false;
    }
  }

  // Get user by phone number
  static async getUserByPhoneNumber(phoneNumber: string): Promise<AppUser | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AppUser;
      }
      
      return null;
    } catch (error) {
      console.error('Get user by phone number error:', error);
      return null;
    }
  }

  // Food Database
  static async getAllFoods(): Promise<Food[]> {
    try {
      const foodsRef = collection(db, 'foods');
      const querySnapshot = await getDocs(foodsRef);
      
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Food));
    } catch (error) {
      console.error('Get all foods error:', error);
      return [];
    }
  }

  static async searchFoods(searchQuery: string, limitCount = 20): Promise<Food[]> {
    try {
      const foodsRef = collection(db, 'foods');
      
      // Search in multiple language fields
      const searchLower = searchQuery.toLowerCase();
      
      // Get all foods and filter client-side for multi-field search
      const querySnapshot = await getDocs(foodsRef);
      const allFoods = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Food));
      
      // Filter foods that match search in any language or category
      return allFoods.filter(food => 
        food.name?.toLowerCase().includes(searchLower) ||
        food.nameKurdish?.toLowerCase().includes(searchLower) ||
        food.nameArabic?.toLowerCase().includes(searchLower) ||
        food.baseName?.toLowerCase().includes(searchLower) ||
        food.category?.toLowerCase().includes(searchLower)
      ).slice(0, limitCount);
    } catch (error) {
      console.error('Search foods error:', error);
      return [];
    }
  }

  static async getPopularFoods(limitCount = 10): Promise<Food[]> {
    try {
      const foodsRef = collection(db, 'foods');
      const querySnapshot = await getDocs(foodsRef);
      
      const foods = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Food));
      
      // Sort by popularity if available, otherwise by name
      const sortedFoods = foods.sort((a, b) => {
        if (a.popularity && b.popularity) {
          return b.popularity - a.popularity;
        }
        return a.name.localeCompare(b.name);
      });
      
      return sortedFoods.slice(0, limitCount);
    } catch (error) {
      console.error('Get popular foods error:', error);
      return [];
    }
  }

  static async getFoodsByCategory(category: string, limitCount = 20): Promise<Food[]> {
    try {
      const foodsRef = collection(db, 'foods');
      const q = query(
        foodsRef,
        where('category', '==', category),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Food));
    } catch (error) {
      console.error('Get foods by category error:', error);
      return [];
    }
  }

  static async getFoodCategories(): Promise<string[]> {
    try {
      const foodsRef = collection(db, 'foods');
      const querySnapshot = await getDocs(foodsRef);
      
      const categories = new Set<string>();
      querySnapshot.docs.forEach(doc => {
        const food = doc.data() as Food;
        if (food.category) {
          categories.add(food.category);
        }
      });
      
      return Array.from(categories).sort();
    } catch (error) {
      console.error('Get food categories error:', error);
      return [];
    }
  }

  static async addCustomFood(food: Omit<Food, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'foods'), food);
      return docRef.id;
    } catch (error) {
      console.error('Add custom food error:', error);
      throw error;
    }
  }

  // Mock foods for initial setup
  static getMockFoods(): Food[] {
    return [
      {
        id: '1',
        name: 'Grilled Chicken Breast',
        kurdishName: 'مرغی برژاو',
        arabicName: 'صدر دجاج مشوي',
        baseName: 'chicken_breast',
        category: 'Protein',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        serving: '100g',
        availableUnits: ['100g', '1 piece', '1 oz'],
        customConversions: {
          '1 piece': 140, // 1 piece = 140g
          '1 oz': 28.35   // 1 oz = 28.35g
        },
        popularity: 95,
        mealPlanner: true,
        mealTiming: ['morning', 'lunch', 'dinner'],
        allowDuplication: true, // High protein food can be duplicated
        minPortion: 80,
        maxPortion: 200,
        calorieAdjustment: false, // High protein food, not suitable for calorie adjustments
        lowCalorie: true, // High protein (31g), relatively low calorie (165) - perfect for protein boosts
        nutritionPer100: {
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          sodium: 74,
          potassium: 256,
          calcium: 15,
          iron: 1.04,
          magnesium: 29,
          phosphorus: 228,
          zinc: 1.09,
          vitaminA: 21,
          vitaminC: 1.2,
          vitaminB12: 0.34,
          niacin: 10.9,
          riboflavin: 0.166,
          thiamine: 0.063,
          folate: 4,
          selenium: 27.6,
        },
      },
      {
        id: '2',
        name: 'Brown Rice',
        kurdishName: 'برنجی قاوەیی',
        arabicName: 'أرز بني',
        baseName: 'brown_rice',
        category: 'Grains',
        calories: 123,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        serving: '100g cooked',
        availableUnits: ['100g cooked', '1 cup cooked', '1 tbsp'],
        customConversions: {
          '1 cup cooked': 175, // 1 cup cooked = 175g
          '1 tbsp': 12         // 1 tbsp = 12g
        },
        popularity: 88,
        mealPlanner: true,
        mealTiming: ['lunch', 'dinner'],
        allowDuplication: false,
        minPortion: 100,
        maxPortion: 250,
        calorieAdjustment: false, // Carb food, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 123,
          protein: 2.6,
          carbs: 23,
          fat: 0.9,
          fiber: 1.8,
          sugar: 0.4,
          sodium: 5,
          potassium: 43,
          calcium: 10,
          iron: 0.56,
          magnesium: 44,
          phosphorus: 77,
          zinc: 0.63,
          vitaminB12: 0,
          niacin: 1.53,
          riboflavin: 0.048,
          thiamine: 0.102,
          folate: 4,
          selenium: 9.8,
        },
      },
      {
        id: '3',
        name: 'Avocado',
        kurdishName: 'ئەڤۆکادۆ',
        arabicName: 'أفوكادو',
        baseName: 'avocado',
        category: 'Fruits',
        calories: 160,
        protein: 2,
        carbs: 9,
        fat: 15,
        serving: '1 medium',
        availableUnits: ['1 medium', '100g', '1 slice'],
        customConversions: {
          '1 medium': 150, // 1 medium avocado = 150g
          '1 slice': 30    // 1 slice = 30g
        },
        popularity: 92,
        mealPlanner: true,
        mealTiming: ['morning', 'snack'],
        allowDuplication: false,
        minPortion: 50,
        maxPortion: 150,
        calorieAdjustment: true, // High-fat, calorie-dense - excellent for calorie adjustments
        nutritionPer100: {
          calories: 160,
          protein: 2,
          carbs: 9,
          fat: 15,
          fiber: 6.7,
          sugar: 0.7,
          sodium: 7,
          potassium: 485,
          calcium: 12,
          iron: 0.55,
          magnesium: 29,
          phosphorus: 52,
          zinc: 0.64,
          vitaminA: 146,
          vitaminC: 10,
          vitaminE: 2.07,
          vitaminK: 21,
          folate: 81,
          niacin: 1.738,
          riboflavin: 0.13,
          thiamine: 0.067,
        },
      },
      {
        id: '4',
        name: 'Greek Yogurt',
        kurdishName: 'ماستی یۆنانی',
        arabicName: 'زبادي يوناني',
        baseName: 'greek_yogurt',
        category: 'Dairy',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.4,
        serving: '170g',
        availableUnits: ['170g', '100g', '1 cup'],
        customConversions: {
          '170g': 170,  // 170g container
          '1 cup': 245  // 1 cup = 245g
        },
        popularity: 85,
        mealPlanner: true,
        mealTiming: ['morning', 'snack'],
        allowDuplication: false,
        minPortion: 100,
        maxPortion: 250,
        calorieAdjustment: false, // High protein food, not suitable for calorie adjustments
        lowCalorie: true, // High protein (17g), very low calorie (100) - excellent for protein without calories
        nutritionPer100: {
          calories: 59,
          protein: 10,
          carbs: 3.6,
          fat: 0.39,
          sugar: 3.6,
          sodium: 36,
          potassium: 141,
          calcium: 110,
          iron: 0.04,
          magnesium: 11,
          phosphorus: 135,
          zinc: 0.52,
          vitaminA: 27,
          vitaminC: 0.8,
          vitaminB12: 0.75,
          riboflavin: 0.273,
          thiamine: 0.044,
          folate: 7,
        },
      },
      {
        id: '5',
        name: 'Salmon Fillet',
        kurdishName: 'ماسی سەلمۆن',
        arabicName: 'فيليه سلمون',
        baseName: 'salmon',
        category: 'Protein',
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        serving: '100g',
        availableUnits: ['100g', '1 fillet', '1 oz'],
        customConversions: {
          '1 fillet': 200, // 1 fillet = 200g
          '1 oz': 28.35    // 1 oz = 28.35g
        },
        popularity: 78,
        mealPlanner: true,
        mealTiming: ['lunch', 'dinner'],
        allowDuplication: true, // High protein food can be duplicated
        minPortion: 100,
        maxPortion: 250,
        calorieAdjustment: false, // High protein food, not suitable for calorie adjustments
        lowCalorie: true, // High protein (22g), moderate calories (206) - good for protein focus
        nutritionPer100: {
          calories: 206,
          protein: 22,
          carbs: 0,
          fat: 12,
          sodium: 59,
          potassium: 363,
          calcium: 9,
          iron: 0.25,
          magnesium: 27,
          phosphorus: 200,
          zinc: 0.64,
          vitaminA: 12,
          vitaminC: 0,
          vitaminD: 526,
          vitaminB12: 2.8,
          niacin: 8.5,
          riboflavin: 0.155,
          thiamine: 0.226,
          folate: 26,
          selenium: 36.5,
          omega3: 2.3,
        },
      },
      {
        id: '6',
        name: 'Sweet Potato',
        kurdishName: 'پەتاتەی شیرین',
        arabicName: 'بطاطا حلوة',
        baseName: 'sweet_potato',
        category: 'Vegetables',
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fat: 0.1,
        serving: '1 medium',
        availableUnits: ['1 medium', '100g', '1 cup cubed'],
        customConversions: {
          '1 medium': 130,    // 1 medium sweet potato = 130g
          '1 cup cubed': 133  // 1 cup cubed = 133g
        },
        popularity: 82,
        mealPlanner: true,
        mealTiming: ['lunch', 'dinner'],
        minPortion: 80,
        maxPortion: 200,
        calorieAdjustment: false, // Vegetable, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 86,
          protein: 1.6,
          carbs: 20,
          fat: 0.05,
          fiber: 3,
          sugar: 4.2,
          sodium: 54,
          potassium: 337,
          calcium: 30,
          iron: 0.61,
          magnesium: 25,
          phosphorus: 47,
          zinc: 0.3,
          vitaminA: 14187,
          vitaminC: 2.4,
          vitaminE: 0.26,
          vitaminK: 1.8,
          folate: 11,
          niacin: 0.557,
          riboflavin: 0.061,
          thiamine: 0.078,
        },
      },
      {
        id: '7',
        name: 'Oatmeal',
        kurdishName: 'جۆی ئاو',
        arabicName: 'شوفان',
        baseName: 'oats',
        category: 'Grains',
        calories: 154,
        protein: 5.3,
        carbs: 28,
        fat: 3.2,
        serving: '1 cup cooked',
        availableUnits: ['1 cup cooked', '100g', '1 tbsp'],
        customConversions: {
          '1 cup cooked': 234, // 1 cup cooked oatmeal = 234g
          '1 tbsp': 15         // 1 tbsp = 15g
        },
        popularity: 80,
        mealPlanner: true,
        mealTiming: ['morning'],
        allowDuplication: false,
        minPortion: 150,
        maxPortion: 300,
        calorieAdjustment: false, // Breakfast carb, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 68,
          protein: 2.4,
          carbs: 12,
          fat: 1.4,
          fiber: 1.7,
          sugar: 0.3,
          sodium: 49,
          potassium: 70,
          calcium: 9,
          iron: 0.9,
          magnesium: 18,
          phosphorus: 77,
          zinc: 0.6,
          vitaminA: 0,
          vitaminC: 0,
          folate: 4,
          niacin: 0.23,
          riboflavin: 0.028,
          thiamine: 0.083,
        },
      },
      {
        id: '8',
        name: 'Banana',
        kurdishName: 'مۆز',
        arabicName: 'موز',
        baseName: 'banana',
        category: 'Fruits',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        serving: '1 medium',
        availableUnits: ['1 medium', '100g', '1 slice'],
        customConversions: {
          '1 medium': 118, // 1 medium banana = 118g
          '1 slice': 10    // 1 slice = 10g
        },
        popularity: 85,
        mealPlanner: true,
        mealTiming: ['morning', 'snack'],
        allowDuplication: false,
        minPortion: 80,
        maxPortion: 150,
        calorieAdjustment: false, // Fruit, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 89,
          protein: 1.1,
          carbs: 23,
          fat: 0.33,
          fiber: 2.6,
          sugar: 12,
          sodium: 1,
          potassium: 358,
          calcium: 5,
          iron: 0.26,
          magnesium: 27,
          phosphorus: 22,
          zinc: 0.15,
          vitaminA: 64,
          vitaminC: 8.7,
          vitaminE: 0.1,
          vitaminK: 0.5,
          folate: 20,
          niacin: 0.665,
          riboflavin: 0.073,
          thiamine: 0.031,
        },
      },
      {
        id: '9',
        name: 'Almonds',
        kurdishName: 'بادەم',
        arabicName: 'لوز',
        baseName: 'almonds',
        category: 'Nuts',
        calories: 164,
        protein: 6,
        carbs: 6,
        fat: 14,
        serving: '28g',
        availableUnits: ['28g', '100g', '1 almond'],
        customConversions: {
          '28g': 28,      // 28g serving
          '1 almond': 1.2 // 1 almond = 1.2g
        },
        popularity: 75,
        mealPlanner: true,
        mealTiming: ['snack'],
        allowDuplication: false,
        minPortion: 20,
        maxPortion: 50,
        calorieAdjustment: true, // High-calorie, high-fat - perfect for calorie adjustments
        nutritionPer100: {
          calories: 579,
          protein: 21,
          carbs: 22,
          fat: 50,
          fiber: 12,
          sugar: 4.4,
          sodium: 1,
          potassium: 733,
          calcium: 269,
          iron: 3.9,
          magnesium: 270,
          phosphorus: 481,
          zinc: 3.12,
          vitaminA: 2,
          vitaminC: 0,
          vitaminE: 25.6,
          folate: 44,
          niacin: 3.618,
          riboflavin: 1.138,
          thiamine: 0.205,
        },
      },
      {
        id: '10',
        name: 'Quinoa',
        kurdishName: 'کینۆا',
        arabicName: 'كينوا',
        baseName: 'quinoa',
        category: 'Grains',
        calories: 222,
        protein: 8,
        carbs: 39,
        fat: 3.6,
        serving: '1 cup cooked',
        availableUnits: ['1 cup cooked', '100g', '1 tbsp'],
        customConversions: {
          '1 cup cooked': 185, // 1 cup cooked quinoa = 185g
          '1 tbsp': 12         // 1 tbsp = 12g
        },
        popularity: 70,
        mealPlanner: true,
        mealTiming: ['lunch', 'dinner'],
        allowDuplication: false,
        minPortion: 100,
        maxPortion: 200,
        calorieAdjustment: false, // Grain, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 120,
          protein: 4.4,
          carbs: 22,
          fat: 1.92,
          fiber: 2.8,
          sugar: 0.9,
          sodium: 7,
          potassium: 172,
          calcium: 17,
          iron: 1.49,
          magnesium: 64,
          phosphorus: 152,
          zinc: 1.09,
          vitaminA: 5,
          vitaminC: 0,
          vitaminE: 0.63,
          folate: 42,
          niacin: 0.412,
          riboflavin: 0.11,
          thiamine: 0.107,
        },
      },
      {
        id: '11',
        name: 'Broccoli',
        kurdishName: 'بڕۆکۆلی',
        arabicName: 'بروكلي',
        baseName: 'broccoli',
        category: 'Vegetables',
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        serving: '100g',
        availableUnits: ['100g', '1 cup chopped', '1 floret'],
        customConversions: {
          '1 cup chopped': 91, // 1 cup chopped = 91g
          '1 floret': 10       // 1 floret = 10g
        },
        popularity: 70,
        mealPlanner: true,
        mealTiming: ['lunch', 'dinner'],
        allowDuplication: false,
        minPortion: 80,
        maxPortion: 150,
        calorieAdjustment: false, // Vegetable, not suitable for calorie adjustments
        nutritionPer100: {
          calories: 34,
          protein: 2.8,
          carbs: 7,
          fat: 0.37,
          fiber: 2.6,
          sugar: 1.5,
          sodium: 33,
          potassium: 316,
          calcium: 47,
          iron: 0.73,
          magnesium: 21,
          phosphorus: 66,
          zinc: 0.41,
          vitaminA: 623,
          vitaminC: 89.2,
          vitaminE: 0.78,
          vitaminK: 102,
          folate: 63,
          niacin: 0.639,
          riboflavin: 0.117,
          thiamine: 0.071,
        },
      },
      {
        id: '12',
        name: 'Eggs',
        kurdishName: 'هێلکە',
        arabicName: 'بيض',
        baseName: 'eggs',
        category: 'Protein',
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        serving: '2 large',
        availableUnits: ['2 large', '1 large', '100g'],
        customConversions: {
          '2 large': 100, // 2 large eggs = 100g
          '1 large': 50   // 1 large egg = 50g
        },
        popularity: 90,
        mealPlanner: true,
        mealTiming: ['morning'],
        allowDuplication: true, // High protein food can be duplicated
        minPortion: 50,
        maxPortion: 150,
        calorieAdjustment: false, // High protein food, not suitable for calorie adjustments
        lowCalorie: true, // High protein (13g), moderate calories (155) - good for protein without excessive calories
        nutritionPer100: {
          calories: 155,
          protein: 13,
          carbs: 1.1,
          fat: 11,
          sodium: 124,
          potassium: 126,
          calcium: 50,
          iron: 1.2,
          magnesium: 10,
          phosphorus: 172,
          zinc: 1.05,
          vitaminA: 540,
          vitaminC: 0,
          vitaminD: 87,
          vitaminE: 1.03,
          vitaminB12: 1.11,
          folate: 44,
          niacin: 0.064,
          riboflavin: 0.5,
          thiamine: 0.066,
          selenium: 30.8,
          cholesterol: 373,
        },
      },
    ];
  }

  static async getDiaryEntries(userId: string, date: string): Promise<DiaryEntry[]> {
    try {
      const entriesRef = collection(db, 'diary_entries');
      
      // First filter by userId and date, then sort client-side to avoid index requirement
      const q = query(
        entriesRef,
        where('userId', '==', userId),
        where('date', '==', date)
      );
      
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate().toISOString(),
        } as DiaryEntry;
      });
      
      // Sort by createdAt descending on the client side
      return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
    } catch (error) {
      console.error('Get diary entries error:', error);
      return [];
    }
  }

  static async updateDiaryEntry(entryId: string, updates: Partial<DiaryEntry>): Promise<void> {
    try {
      await updateDoc(doc(db, 'diary_entries', entryId), updates);
    } catch (error) {
      console.error('Update diary entry error:', error);
      throw error;
    }
  }

  static async deleteDiaryEntry(entryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'diary_entries', entryId));
    } catch (error) {
      console.error('Delete diary entry error:', error);
      throw error;
    }
  }

  // Water Tracking
  static async addWaterEntry(userId: string, amount: number, date: string): Promise<string> {
    try {
      const waterEntry = {
        userId,
        amount,
        date,
        timestamp: Timestamp.now(),
      };
      
      const docRef = await addDoc(collection(db, 'water_entries'), waterEntry);
      return docRef.id;
    } catch (error) {
      console.error('Add water entry error:', error);
      throw error;
    }
  }
  static async updateExerciseInWorkoutPlan(
    userId: string,
    planId: string,
    exerciseId: string,
    updatedExerciseData: {
      exerciseName: string;
      sets: number;
      reps: Array<{ reps: number; weight?: number | null }>;
      notes?: string | null;
    }
  ): Promise<void> {
    try {
      const planRef = doc(db, 'users', userId, 'workoutPlans', planId);
      const planSnap = await getDoc(planRef);

      if (!planSnap.exists()) {
        throw new Error('Workout plan not found.');
      }

      const planData = planSnap.data();
      let exercises = planData.exercises || [];

      // Find the index of the exercise to update
      const exerciseIndex = exercises.findIndex(
        (ex: any) => ex.exerciseId === exerciseId
      );

      if (exerciseIndex === -1) {
        throw new Error('Exercise not found in workout plan.');
      }

      // Create the updated exercise object
      const updatedExercise = {
        ...exercises[exerciseIndex], // Keep existing properties
        exerciseName: updatedExerciseData.exerciseName,
        sets: updatedExerciseData.sets,
        reps: updatedExerciseData.reps,
        notes: updatedExerciseData.notes === undefined ? null : updatedExerciseData.notes,
      };

      // Replace the old exercise with the updated one
      exercises[exerciseIndex] = updatedExercise;

      // Update the document in Firestore
      await updateDoc(planRef, { exercises: exercises });

      console.log(`Exercise ${exerciseId} updated in plan ${planId} for user ${userId}`);
    } catch (error) {
      console.error('Error updating exercise in workout plan:', error);
      throw error;
    }
  }

  static async getWaterEntries(userId: string, date: string): Promise<any[]> {
    try {
      const waterRef = collection(db, 'water_entries');
      const q = query(
        waterRef,
        where('userId', '==', userId),
        where('date', '==', date),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp.toDate().toISOString(),
        };
      });
    } catch (error) {
      console.error('Get water entries error:', error);
      return [];
    }
  }

  // Statistics
  static async getWeeklyStats(userId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const entriesRef = collection(db, 'diary_entries');
      const q = query(
        entriesRef,
        where('userId', '==', userId),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const entries = querySnapshot.docs.map(doc => doc.data());
      
      // Group by date and calculate daily totals
      const dailyTotals: { [date: string]: any } = {};
      
      entries.forEach(entry => {
        if (!dailyTotals[entry.date]) {
          dailyTotals[entry.date] = {
            date: entry.date,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
          };
        }
        
        dailyTotals[entry.date].calories += entry.calories * entry.quantity;
        dailyTotals[entry.date].protein += entry.protein * entry.quantity;
        dailyTotals[entry.date].carbs += entry.carbs * entry.quantity;
        dailyTotals[entry.date].fat += entry.fat * entry.quantity;
      });
      
      return Object.values(dailyTotals);
    } catch (error) {
      console.error('Get weekly stats error:', error);
      return [];
    }
  }
  // Add this after the getWeeklyStats method (around line 1227)
static async getWeeklyCategoryStats(userId: string, startDate: string, endDate: string): Promise<any> {
  try {
    console.log('📊 getWeeklyCategoryStats: Starting weekly aggregation for:', { userId, startDate, endDate });
    
    const dailyData: { [date: string]: any } = {};
    const weeklyTotals: { [category: string]: { totalCalories: number; totalCount: number; totalProtein: number; totalCarbs: number; totalFat: number; totalFiber: number } } = {};
    const weeklyAverages: { [category: string]: { avgCalories: number; avgCount: number; avgProtein: number; avgCarbs: number; avgFat: number; avgFiber: number } } = {};
    
    // Generate array of dates for the week
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('📅 getWeeklyCategoryStats: Processing dates:', dates);
    
    // Fetch data for each day
    for (const date of dates) {
      try {
        const dailyMeals = await this.getDailyMeals(userId, date);
        
        if (dailyMeals && dailyMeals.meals) {
          // Calculate category totals for this day using the existing method
          const dayCategoryTotals = this.calculateMealCategoryTotals(dailyMeals.meals);
          
          dailyData[date] = dayCategoryTotals;
          
          console.log(`📊 getWeeklyCategoryStats: Day ${date} totals:`, dayCategoryTotals);
          
          // Add to weekly totals
          Object.keys(dayCategoryTotals).forEach(category => {
            const dayData = dayCategoryTotals[category];
            
            if (!weeklyTotals[category]) {
              weeklyTotals[category] = {
                totalCalories: 0,
                totalCount: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
                totalFiber: 0
              };
            }
            
            weeklyTotals[category].totalCalories += dayData.calories || 0;
            weeklyTotals[category].totalCount += dayData.count || 0;
            weeklyTotals[category].totalProtein += dayData.protein || 0;
            weeklyTotals[category].totalCarbs += dayData.carbs || 0;
            weeklyTotals[category].totalFat += dayData.fat || 0;
            weeklyTotals[category].totalFiber += dayData.fiber || 0;
          });
        } else {
          console.log(`📊 getWeeklyCategoryStats: No data for ${date}`);
          dailyData[date] = {};
        }
      } catch (error) {
        console.error(`❌ getWeeklyCategoryStats: Error fetching data for ${date}:`, error);
        dailyData[date] = {};
      }
    }
    
    // Calculate weekly averages
    const daysWithData = dates.filter(date => Object.keys(dailyData[date]).length > 0).length || 1;
    
    Object.keys(weeklyTotals).forEach(category => {
      const totals = weeklyTotals[category];
      weeklyAverages[category] = {
        avgCalories: Math.round(totals.totalCalories / daysWithData),
        avgCount: Math.round((totals.totalCount / daysWithData) * 10) / 10, // Round to 1 decimal
        avgProtein: Math.round((totals.totalProtein / daysWithData) * 10) / 10,
        avgCarbs: Math.round((totals.totalCarbs / daysWithData) * 10) / 10,
        avgFat: Math.round((totals.totalFat / daysWithData) * 10) / 10,
        avgFiber: Math.round((totals.totalFiber / daysWithData) * 10) / 10
      };
    });
    
    const result = {
      weekStart: startDate,
      weekEnd: endDate,
      dailyData,
      weeklyTotals,
      weeklyAverages,
      daysWithData,
      totalDays: dates.length
    };
    
    console.log('✅ getWeeklyCategoryStats: Weekly aggregation completed:', {
      categories: Object.keys(weeklyTotals),
      totalDays: dates.length,
      daysWithData
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ getWeeklyCategoryStats error:', error);
    throw error;
  }
}
// Add this function after getWeeklyCategoryStats
static filterWeeklyStatsForReport(weeklyStats: any) {

  const allowedCategories = ['vegetables', 'fruits', 'proteins', 'carb rich foods'];
  const normalizeCategoryName = (category: string) => {
    return category.toLowerCase();
  };
  
  // Filter daily data
  const filteredDailyData: { [date: string]: any } = {};
  Object.keys(weeklyStats.dailyData).forEach(date => {
    const dayData = weeklyStats.dailyData[date];
    filteredDailyData[date] = {};
    
    Object.keys(dayData).forEach(category => {
      if (allowedCategories.includes(category)) {
        filteredDailyData[date][category] = dayData[category];
      }
    });
  });
  
  // Filter weekly totals
  const filteredWeeklyTotals: any = {};
  Object.keys(weeklyStats.weeklyTotals).forEach(category => {
    if (allowedCategories.includes(category)) {
      filteredWeeklyTotals[category] = weeklyStats.weeklyTotals[category];
    }
  });
  
  // Filter weekly averages
  const filteredWeeklyAverages: any = {};
  Object.keys(weeklyStats.weeklyAverages).forEach(category => {
    if (allowedCategories.includes(category)) {
      filteredWeeklyAverages[category] = weeklyStats.weeklyAverages[category];
    }
  });
  
// Calculate daily calories for chart - FIXED: Use ALL categories, not just filtered ones
const dailyCalories: { [date: string]: number } = {};
Object.keys(weeklyStats.dailyData).forEach(date => {
  let totalCalories = 0;
  
  // Add debugging
  console.log(`🔍 Processing date: ${date}`);
  console.log(`�������� All categories for ${date}:`, Object.keys(weeklyStats.dailyData[date]));
  
  // Use the original dailyData, not filteredDailyData
  Object.keys(weeklyStats.dailyData[date]).forEach(category => { 
    const categoryCalories = weeklyStats.dailyData[date][category].calories || 0;
    totalCalories += categoryCalories;
    
    // Add debugging for each category
    console.log(`🔍 Category ${category}: ${categoryCalories} calories`);
  });
  
  dailyCalories[date] = totalCalories;
  console.log(`�� Total calories for ${date}: ${totalCalories}`);
});  
  // Calculate overall averages
  const totalDays = weeklyStats.totalDays;
  const daysWithData = weeklyStats.daysWithData;
  
  const overallAverageCaloriesPerDay = Object.values(dailyCalories).reduce((sum: number, calories: number) => sum + calories, 0) / daysWithData;
  
  const averageCaloriesPerCategory: any = {};
  Object.keys(filteredWeeklyAverages).forEach(category => {
    averageCaloriesPerCategory[category] = filteredWeeklyAverages[category].avgCalories;
  });
  
// Add fiber analysis
const fiberAnalysis = this.calculateFiberAnalysis(weeklyStats);

return {
  weekStart: weeklyStats.weekStart,
  weekEnd: weeklyStats.weekEnd,
  daysWithData,
  totalDays,
  
  // Filtered data
  dailyData: filteredDailyData,
  weeklyTotals: filteredWeeklyTotals,
  weeklyAverages: filteredWeeklyAverages,
  
  // Chart data
  dailyCalories,
  
  // Summary data
  overallAverageCaloriesPerDay: Math.round(overallAverageCaloriesPerDay),
  averageCaloriesPerCategory,
  
  // Food counts
  foodCountsPerCategory: Object.keys(filteredWeeklyTotals).reduce((acc: any, category: string) => {
    acc[category] = filteredWeeklyTotals[category].totalCount;
    return acc;
  }, {}),
  
  // Add this line:
  fiberAnalysis
};
}

static calculateFiberAnalysis(weeklyStats: any) {
  // Calculate total weekly fiber
  let totalWeeklyFiber = 0;
  let daysWithFiberData = 0;
  
  Object.values(weeklyStats.dailyData).forEach((dayData: any) => {
    let dayFiber = 0;
    Object.values(dayData).forEach((category: any) => {
      dayFiber += category.fiber || 0;
    });
    
    if (dayFiber > 0) {
      totalWeeklyFiber += dayFiber;
      daysWithFiberData++;
    }
  });
  
  const averageDailyFiber = daysWithFiberData > 0 ? totalWeeklyFiber / daysWithFiberData : 0;
  
  // Categorize fiber intake
  const getFiberCategory = (fiber: number) => {
    if (fiber >= 25) return "optimal";
    if (fiber >= 20) return "good";
    if (fiber >= 15) return "moderate";
    if (fiber >= 10) return "low";
    return "veryLow";
  };
  
  const getFiberMessage = (fiber: number) => {
    const category = getFiberCategory(fiber);
    
    switch (category) {
      case "optimal":
        return `🎉 Your fiber intake is OPTIMAL! (${fiber.toFixed(1)}g/day) - You're in the top 10% of healthy eaters!`;
      case "good":
        return `👍 Your fiber intake is GOOD (${fiber.toFixed(1)}g/day) - Almost at the recommended 25g!`;
      case "moderate":
        return `⚠️ Your fiber intake is MODERATE (${fiber.toFixed(1)}g/day) - Try adding more vegetables and whole grains`;
      case "low":
        return `😟 Your fiber intake is LOW (${fiber.toFixed(1)}g/day) - Consider more fruits, vegetables, and legumes`;
      case "veryLow":
        return `🚨 Your fiber intake is VERY LOW (${fiber.toFixed(1)}g/day) - This could affect your digestive health`;
    }
  };
  
  return {
    averageDailyFiber: Math.round(averageDailyFiber * 10) / 10,
    category: getFiberCategory(averageDailyFiber),
    message: getFiberMessage(averageDailyFiber),
    target: 25,
    percentage: Math.round((averageDailyFiber / 25) * 100),
    totalWeeklyFiber: Math.round(totalWeeklyFiber)
  };
}
  // Daily Meals Management
  static async addDailyMeal(userId: string, date: string, meal: string, foodData: {
    foodId: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
    kurdishName?: string;
    arabicName?: string;
    [key: string]: any;
  }): Promise<void> {
    try {
      console.log('🍽️ addDailyMeal: Starting to add food:', {
        userId,
        date,
        meal,
        foodName: foodData.foodName,
        foodId: foodData.foodId
      });
  
      // Get the full food object to extract micronutrients and category
      const foodDoc = await getDoc(doc(db, 'foods', foodData.foodId));
      let micronutrients = {};
      let foodCategory = '';
      
      if (foodDoc.exists()) {
        const food = foodDoc.data();
        foodCategory = food.category || '';
        
        console.log('🍽️ addDailyMeal: Food category found:', foodCategory);
        
        if (food.nutritionPer100) {
          // Calculate the multiplier based on quantity and unit
          let totalGrams = foodData.quantity;
          
          // If unit is not 100g, convert to grams using customConversions
          if (foodData.unit !== '100g' && food.customConversions && food.customConversions[foodData.unit]) {
            totalGrams = food.customConversions[foodData.unit] * foodData.quantity;
          }
          
          const multiplier = totalGrams / 100;
          
          // Extract micronutrients and calculate based on portion size
          micronutrients = {
            fiber: (food.nutritionPer100.fiber || 0) * multiplier,
            sugar: (food.nutritionPer100.sugar || 0) * multiplier,
            sodium: (food.nutritionPer100.sodium || 0) * multiplier,
            calcium: (food.nutritionPer100.calcium || 0) * multiplier,
            vitaminD: (food.nutritionPer100.vitaminD || 0) * multiplier,
            potassium: (food.nutritionPer100.potassium || 0) * multiplier,
            iron: (food.nutritionPer100.iron || 0) * multiplier,
          };
        }
      } else {
        console.warn('⚠️ addDailyMeal: Food document not found for ID:', foodData.foodId);
      }
      
      const dailyMealRef = doc(db, 'dailyMeals', `${userId}_${date}`);
      const dailyMealDoc = await getDoc(dailyMealRef);
      
      if (dailyMealDoc.exists()) {
        // Document exists, update the specific meal array
        const currentData = dailyMealDoc.data();
        const currentMeals = currentData.meals || {};
        const currentMealData = currentMeals[meal] || {};
        
        // Find the next food index (food1, food2, etc.)
        const existingFoodKeys = Object.keys(currentMealData).filter(key => key.startsWith('food'));
        const nextFoodIndex = existingFoodKeys.length + 1;
        const foodKey = `food${nextFoodIndex}`;
        
        // Create the food entry structure with category information
        const newFoodEntry = {
          [foodKey]: {
            '0': {
              calories: foodData.calories,
              carbs: foodData.carbs,
              protein: foodData.protein,
              fat: foodData.fat,
              id: foodData.foodId,
              name: foodData.foodName,
              quantity: foodData.quantity,
              unit: foodData.unit,
              addedAt: Timestamp.now(),
              // Micronutrients
              fiber: micronutrients.fiber || 0,
              sugar: micronutrients.sugar || 0,
              sodium: micronutrients.sodium || 0,
              calcium: micronutrients.calcium || 0,
              vitaminD: micronutrients.vitaminD || 0,
              potassium: micronutrients.potassium || 0,
              iron: micronutrients.iron || 0,
              // Category information
              category: foodCategory,
              kurdishName: foodData.kurdishName || '',
              arabicName: foodData.arabicName || '',
            }
          }
        };
        
        // Calculate category totals for this meal
        const updatedMealData = {
          ...currentMealData,
          ...newFoodEntry
        };
        
// Should calculate for ALL meals in the day
const allMealsData = {
  ...currentData.meals,
  [meal]: updatedMealData
};
const categoryTotals = this.calculateMealCategoryTotals(allMealsData);        
        console.log('🍽️ addDailyMeal: Category totals for meal:', {
          meal,
          categoryTotals
        });
        
        await updateDoc(dailyMealRef, {
          [`meals.${meal}`]: updatedMealData,
          [`categoryTotals.${meal}`]: categoryTotals,
          updatedAt: Timestamp.now(),
        });
        
        console.log('✅ addDailyMeal: Food added successfully with category totals');
        
      } else {
        // Document doesn't exist, create new one with food1 structure
        const newFoodEntry = {
          food1: {
            '0': {
              calories: foodData.calories,
              carbs: foodData.carbs,
              protein: foodData.protein,
              fat: foodData.fat,
              id: foodData.foodId,
              name: foodData.foodName,
              quantity: foodData.quantity,
              unit: foodData.unit,
              addedAt: Timestamp.now(),
              // Micronutrients
              fiber: micronutrients.fiber || 0,
              sugar: micronutrients.sugar || 0,
              sodium: micronutrients.sodium || 0,
              calcium: micronutrients.calcium || 0,
              vitaminD: micronutrients.vitaminD || 0,
              potassium: micronutrients.potassium || 0,
              iron: micronutrients.iron || 0,
              // Category information
              category: foodCategory,
              kurdishName: foodData.kurdishName || '',
              arabicName: foodData.arabicName || '',
            }
          }
        };
        
        // Calculate category totals for the new meal
        const categoryTotals = this.calculateMealCategoryTotals(newFoodEntry);
        
        console.log('��️ addDailyMeal: New meal category totals:', {
          meal,
          categoryTotals
        });
        
        const dailyMealData = {
          userId,
          date,
          meals: {
            [meal]: newFoodEntry
          },
          categoryTotals: {
            [meal]: categoryTotals
          },
          waterIntake: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        await setDoc(dailyMealRef, dailyMealData);
        console.log('✅ addDailyMeal: New daily meal document created with category totals');
      }
    } catch (error) {
      console.error('❌ addDailyMeal error:', error);
      throw error;
    }
  }
  
// Replace the calculateMealCategoryTotals function (lines 1414-1446)
static calculateMealCategoryTotals(allMealsData: any): any {
  const categoryTotals: { [category: string]: { count: number; calories: number; protein: number; carbs: number; fat: number; fiber: number } } = {};
  
  // Iterate through all meals (breakfast, lunch, dinner, snacks)
  Object.keys(allMealsData).forEach(mealKey => {
    const mealData = allMealsData[mealKey];
    
    // Iterate through all food items in this meal
    Object.keys(mealData).forEach(foodKey => {
      if (foodKey.startsWith('food')) {
        const foodItem = mealData[foodKey]['0'];
        const category = foodItem.category || 'Unknown';
        
        if (!categoryTotals[category]) {
          categoryTotals[category] = {
            count: 0,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
          };
        }
        
        // Add this food's nutrition to the category totals
        categoryTotals[category].count += 1;
        categoryTotals[category].calories += foodItem.calories || 0;
        categoryTotals[category].protein += foodItem.protein || 0;
        categoryTotals[category].carbs += foodItem.carbs || 0;
        categoryTotals[category].fat += foodItem.fat || 0;
        categoryTotals[category].fiber += foodItem.fiber || 0;
      }
    });
  });
  
  console.log('📊 calculateMealCategoryTotals: Calculated totals:', categoryTotals);
  return categoryTotals;
}

  static async getDailyMeals(userId: string, date: string): Promise<any> {
    try {
      const dailyMealRef = doc(db, 'dailyMeals', `${userId}_${date}`);
      const dailyMealDoc = await getDoc(dailyMealRef);
      
      if (dailyMealDoc.exists()) {
        const data = dailyMealDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
      } else {
        // Return empty structure if no data exists
        return {
          userId,
          date,
          meals: {
            breakfast: {},
            lunch: {},
            dinner: {},
            snacks: {}
          },
          waterIntake: 0,
        };
      }
    } catch (error) {
      console.error('Get daily meals error:', error);
      throw error;
    }
  }

  static async updateWaterIntake(userId: string, date: string, waterIntake: number): Promise<void> {
    try {
      const dailyMealRef = doc(db, 'dailyMeals', `${userId}_${date}`);
      const dailyMealDoc = await getDoc(dailyMealRef);
      
      if (dailyMealDoc.exists()) {
        await updateDoc(dailyMealRef, {
          waterIntake,
          updatedAt: Timestamp.now(),
        });
      } else {
        // Create new document if it doesn't exist
        const dailyMealData = {
          userId,
          date,
          meals: {
            breakfast: {},
            lunch: {},
            dinner: {},
            snacks: {}
          },
          waterIntake,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        await setDoc(dailyMealRef, dailyMealData);
      }
    } catch (error) {
      console.error('Update water intake error:', error);
      throw error;
    }
  }
  // NEW: addFoodRequest method
  static async addFoodRequest(userId: string, foodName: string, description?: string): Promise<string> {
    const foodRequestsCol = collection(db, 'foodRequests');
    const newRequestRef = doc(foodRequestsCol);
    const newRequest: FoodRequest = {
      id: newRequestRef.id,
      userId: userId,
      foodName: foodName,
      description: description || undefined,
      status: false, // Default to pending
      createdAt: new Date().toISOString(),
    };
    await setDoc(newRequestRef, newRequest);
    return newRequestRef.id;
  }

  // Real-time listener for daily meals
  static subscribeToDailyMeals(
    userId: string, 
    date: string, 
    onUpdate: (meals: any) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const dailyMealRef = doc(db, 'dailyMeals', `${userId}_${date}`);
      
      const unsubscribe = onSnapshot(
        dailyMealRef,
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const processedData = {
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            };
            onUpdate(processedData);
          } else {
            // Return empty structure if no data exists
            onUpdate({
              userId,
              date,
              meals: {
                breakfast: {},
                lunch: {},
                dinner: {},
                snacks: {}
              },
              waterIntake: 0,
            });
          }
        },
        (error) => {
          console.error('Daily meals listener error:', error);
          onError(error);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error('Subscribe to daily meals error:', error);
      onError(error instanceof Error ? error : new Error('Failed to subscribe to daily meals'));
      return () => {}; // Return empty function as fallback
    }
  }

  static async removeFoodFromDailyMeal(
    userId: string, 
    date: string, 
    meal: string, 
    foodKey: string // Now we use foodKey (like 'food1', 'food2') instead of index
  ): Promise<void> {
    try {
      const dailyMealRef = doc(db, 'dailyMeals', `${userId}_${date}`);
      const dailyMealDoc = await getDoc(dailyMealRef);
      
      if (dailyMealDoc.exists()) {
        const currentData = dailyMealDoc.data();
        const currentMeals = currentData.meals || {};
        const currentMealData = currentMeals[meal] || {};
        
        // Remove the specific food key
        const updatedMealData = { ...currentMealData };
        delete updatedMealData[foodKey];
        
        await updateDoc(dailyMealRef, {
          [`meals.${meal}`]: updatedMealData,
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Remove food from daily meal error:', error);
      throw error;
    }
  }

  // Meal Templates Management
  static async getMealsFromFirebase(mealType: string): Promise<MealTemplate[]> {
    console.log(`🔍 Querying meals collection for mealType: "${mealType}"`);
    
    try {
      const mealsRef = collection(db, 'meals');
      const q = query(
        mealsRef,
        where('mealType', 'array-contains', mealType)
      );
      
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as MealTemplate));
      
      console.log(`📋 Query results: ${results.length} meals found`);
      if (results.length > 0) {
        console.log(`📋 Sample meal names: ${results.slice(0, 3).map(m => m.name).join(', ')}`);
      }
      
      return results;
    } catch (error) {
      console.error('Get meals from Firebase error:', error);
      return [];
    }
  }

  static async getFoodFromFirebase(foodId: string): Promise<Food | null> {
    try {
      const foodDoc = await getDoc(doc(db, 'foods', foodId));
      if (foodDoc.exists()) {
        return { id: foodDoc.id, ...foodDoc.data() } as Food;
      }
      return null;
    } catch (error) {
      console.error('Get food from Firebase error:', error);
      return null;
    }
  }

  // Sample meal templates for initial setup
  static getMockMealTemplates(): MealTemplate[] {
    return [
      {
        id: 'breakfast_eggs_bread',
        name: 'Eggs & Bread',
        mealType: ['breakfast'],
        foods: [
          {
            foodId: '12', // Eggs
            allowedPortions: [50, 100, 150] // 1, 2, 3 eggs
          },
          {
            foodId: '7', // Oatmeal (as bread substitute)
            allowedPortions: [150, 200, 250]
          }
        ],
        description: 'Classic breakfast with eggs and bread',
        difficulty: 'easy',
        prepTime: 10
      },
      {
        id: 'breakfast_yogurt_banana',
        name: 'Greek Yogurt & Banana',
        mealType: ['breakfast'],
        foods: [
          {
            foodId: '4', // Greek Yogurt
            allowedPortions: [170, 200, 250]
          },
          {
            foodId: '8', // Banana
            allowedPortions: [80, 118, 150] // small, medium, large
          }
        ],
        description: 'Healthy yogurt breakfast with fruit',
        difficulty: 'easy',
        prepTime: 5
      },
      {
        id: 'lunch_chicken_rice',
        name: 'Chicken & Rice',
        mealType: ['lunch'],
        foods: [
          {
            foodId: '1', // Grilled Chicken Breast
            allowedPortions: [100, 150, 200]
          },
          {
            foodId: '2', // Brown Rice
            allowedPortions: [100, 150, 200]
          },
          {
            foodId: '11', // Broccoli
            allowedPortions: [80, 100, 150]
          }
        ],
        description: 'Balanced lunch with protein, carbs, and vegetables',
        difficulty: 'medium',
        prepTime: 25
      },
      {
        id: 'lunch_salmon_quinoa',
        name: 'Salmon & Quinoa',
        mealType: ['lunch'],
        foods: [
          {
            foodId: '5', // Salmon Fillet
            allowedPortions: [100, 150, 200]
          },
          {
            foodId: '10', // Quinoa
            allowedPortions: [100, 150, 185]
          },
          {
            foodId: '6', // Sweet Potato
            allowedPortions: [80, 130, 180]
          }
        ],
        description: 'Nutritious lunch with omega-3 rich salmon',
        difficulty: 'medium',
        prepTime: 30
      },
      {
        id: 'dinner_chicken_sweet_potato',
        name: 'Chicken & Sweet Potato',
        mealType: ['dinner'],
        foods: [
          {
            foodId: '1', // Grilled Chicken Breast
            allowedPortions: [120, 180, 220]
          },
          {
            foodId: '6', // Sweet Potato
            allowedPortions: [130, 180, 200]
          },
          {
            foodId: '11', // Broccoli
            allowedPortions: [100, 150, 200]
          }
        ],
        description: 'Hearty dinner with lean protein and complex carbs',
        difficulty: 'medium',
        prepTime: 35
      },
      {
        id: 'dinner_salmon_vegetables',
        name: 'Salmon & Vegetables',
        mealType: ['dinner'],
        foods: [
          {
            foodId: '5', // Salmon Fillet
            allowedPortions: [150, 200, 250]
          },
          {
            foodId: '11', // Broccoli
            allowedPortions: [100, 150, 200]
          },
          {
            foodId: '3', // Avocado
            allowedPortions: [50, 100, 150]
          }
        ],
        description: 'Light dinner rich in healthy fats and protein',
        difficulty: 'easy',
        prepTime: 20
      }
    ];
  }

  // Initialize sample meal templates
  static async initializeSampleMealTemplates(): Promise<void> {
    try {
      const mealsRef = collection(db, 'meals');
      
      // Check if meals already exist
      const existingMeals = await getDocs(mealsRef);
      if (!existingMeals.empty) {
        console.log('Meal templates already exist in database');
        return;
      }
      
      const mockMealTemplates = this.getMockMealTemplates();
      
      for (const mealTemplate of mockMealTemplates) {
        const { id, ...mealData } = mealTemplate;
        await addDoc(mealsRef, mealData);
      }
      
      console.log(`Sample meal templates initialized with ${mockMealTemplates.length} templates`);
    } catch (error) {
      console.error('Error initializing sample meal templates:', error);
      throw error;
    }
  }

  // Workout Plans Management
  static async addWorkoutPlan(userId: string, planData: any): Promise<string> {
    console.log(`[FirebaseService] addWorkoutPlan called for userId: ${userId}`);
    console.log(`[FirebaseService] Plan data received:`, planData);

    if (!userId) {
      console.error("[FirebaseService] addWorkoutPlan: userId is null or undefined.");
      throw new Error("User ID is required to add a workout plan.");
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      const workoutPlansCollectionRef = collection(userDocRef, 'workoutPlans');
      const newPlanRef = doc(workoutPlansCollectionRef); // Create a new document reference with an auto-generated ID

      // Clean exercises array: replace undefined with null for Firestore compatibility
      const cleanedExercises = planData.exercises.map((ex: any) => {
        const cleanedEx: any = { ...ex };
        if (cleanedEx.notes === undefined) {
          cleanedEx.notes = null; // Firestore does not allow undefined
        }
        if (cleanedEx.weight === undefined) {
          cleanedEx.weight = null; // Firestore does not allow undefined
        }
        return cleanedEx;
      });

      const planToSave = {
        ...planData,
        exercises: cleanedExercises, // Use the cleaned exercises array
        id: newPlanRef.id, // Assign the auto-generated ID to the plan data
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(), // Set initial lastUsedAt
      };

      console.log(`[FirebaseService] Attempting to save new workout plan with ID: ${newPlanRef.id}`);
      console.log(`[FirebaseService] Data being sent to Firestore:`, planToSave);

      await setDoc(newPlanRef, planToSave);

      console.log(`[FirebaseService] Successfully added workout plan with ID: ${newPlanRef.id}`);
      return newPlanRef.id;

    } catch (error) {
      console.error(`[FirebaseService] Error adding workout plan:`, error);
      throw error;
    }
  }

  static async getWorkoutPlans(userId: string): Promise<any[]> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const workoutPlansCollectionRef = collection(userDocRef, 'workoutPlans');
      
      const q = query(workoutPlansCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const plans: any[] = [];
      querySnapshot.forEach((doc) => {
        plans.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return plans;
    } catch (error) {
      console.error('Error getting workout plans:', error);
      throw error;
    }
  }

  static async getWorkoutPlanById(userId: string, planId: string): Promise<any | null> {
    try {
      const planDocRef = doc(db, 'users', userId, 'workoutPlans', planId);
      const planDoc = await getDoc(planDocRef);
      
      if (planDoc.exists()) {
        return {
          id: planDoc.id,
          ...planDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting workout plan by ID:', error);
      throw error;
    }
  }

  static async updateWorkoutPlan(userId: string, planId: string, updates: any): Promise<void> {
    try {
      const planDocRef = doc(db, 'users', userId, 'workoutPlans', planId);
      await updateDoc(planDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  static async deleteWorkoutPlan(userId: string, planId: string): Promise<void> {
    try {
      const planDocRef = doc(db, 'users', userId, 'workoutPlans', planId);
      await deleteDoc(planDocRef);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  // --- Exercise and Workout Plan Methods ---

  static async getExerciseById(categoryId: string, subcategoryId: string, exerciseId: string): Promise<any | null> {
    try {
      console.log('Firebase path being constructed:');
      console.log('workoutCategories/', categoryId, '/subcategories/', subcategoryId, '/exercises/', exerciseId);
      
      const exerciseRef = doc(db, 'workoutCategories', categoryId, 'subcategories', subcategoryId, 'exercises', exerciseId);
      console.log('Document reference created:', exerciseRef.path);
      
      const exerciseSnap = await getDoc(exerciseRef);
      console.log('Document exists?', exerciseSnap.exists());
      
      if (exerciseSnap.exists()) {
        console.log('Document data:', exerciseSnap.data());
        return { id: exerciseSnap.id, ...exerciseSnap.data() };
      } else {
        console.log('No such exercise document at path:', exerciseRef.path);
        return null;
      }
    } catch (error) {
      console.error('Error getting exercise by ID:', error);
      throw error;
    }
  }

  static async addExerciseToWorkoutPlan(userId: string, planId: string, exerciseData: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: Array<{ reps: number; weight?: number }>;  // Changed this line
    notes?: string;  // Make it optional with ?
    order: number;
  }): Promise<void> {
    try {
      // Get the existing plan
      const planRef = doc(db, 'users', userId, 'workoutPlans', planId);
      const planDoc = await getDoc(planRef);
      
      if (!planDoc.exists()) {
        throw new Error('Workout plan not found');
      }
      
      const plan = planDoc.data();
      const updatedExercises = [...plan.exercises, exerciseData];
      
      // Update the plan with the new exercise
      await updateDoc(planRef, {
        exercises: updatedExercises,
        lastUsedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding exercise to workout plan:', error);
      throw error;
    }
  }

  static async removeExerciseFromWorkoutPlan(userId: string, planId: string, exerciseId: string): Promise<void> {
    try {
      const planRef = doc(db, 'users', userId, 'workoutPlans', planId);
      
      // Fetch the current plan to find the exercise object to remove
      const planSnap = await getDoc(planRef);
      if (!planSnap.exists()) {
        throw new Error('Workout plan not found.');
      }
      const currentExercises = planSnap.data()?.exercises || [];
      
      // Find the exact exercise object to remove from the array
      const exerciseToRemove = currentExercises.find((ex: any) => ex.exerciseId === exerciseId);

      if (exerciseToRemove) {
        await updateDoc(planRef, {
          exercises: arrayRemove(exerciseToRemove)
        });
        console.log(`Exercise ${exerciseId} removed from plan ${planId} for user ${userId}`);
      } else {
        console.warn(`Exercise ${exerciseId} not found in plan ${planId}. No action taken.`);
      }
    } catch (error) {
      console.error('Error removing exercise from workout plan:', error);
      throw error;
    }
  }

  /**
   * Find an exercise by ID across all categories and subcategories
   * This is a fallback method when we don't know the category/subcategory
   */
  static async findExerciseById(exerciseId: string): Promise<any> {
    try {
      // Get all workout categories
      const categories = await this.getWorkoutCategories();
      
      // Search through each category and subcategory
      for (const category of categories) {
        try {
          const subcategories = await this.getSubcategories(category.id);
          
          for (const subcategory of subcategories) {
            try {
              const exercises = await this.getExercises(category.id, subcategory.id);
              const exercise = exercises.find(ex => ex.id === exerciseId);
              
              if (exercise) {
                return exercise;
              }
            } catch (error) {
              // Continue searching in other subcategories
              console.warn(`Error searching in subcategory ${subcategory.id}:`, error);
            }
          }
        } catch (error) {
          // Continue searching in other categories
          console.warn(`Error searching in category ${category.id}:`, error);
        }
      }
      
      throw new Error(`Exercise with ID ${exerciseId} not found`);
    } catch (error) {
      console.error('Error finding exercise by ID:', error);
      throw error;
    }
  }

  // Workout Sessions Management
  static async addWorkoutSession(userId: string, sessionData: any): Promise<string> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const workoutSessionsCollectionRef = collection(userDocRef, 'workoutSessions');
      
      const newSessionDocRef = doc(workoutSessionsCollectionRef);
      
      const sessionDocument = {
        id: newSessionDocRef.id,
        userId,
        ...sessionData,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(newSessionDocRef, sessionDocument);
      return newSessionDocRef.id;
    } catch (error) {
      console.error('Error adding workout session:', error);
      throw error;
    }
  }

   /**
   * Get a specific workout session by its ID.
   */
  static async getWorkoutSessionById(userId: string, sessionId: string): Promise<WorkoutSession | null> {
    try {
      console.log(`[FirebaseService] getWorkoutSessionById called for userId: ${userId}, sessionId: ${sessionId}`);
      const sessionDocRef = doc(db, 'users', userId, 'workoutSessions', sessionId);
      const sessionDoc = await getDoc(sessionDocRef);

      if (sessionDoc.exists()) {
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as WorkoutSession;
        console.log(`[FirebaseService] Found workout session with ID: ${sessionId}`);
        return sessionData;
      } else {
        console.log(`[FirebaseService] No workout session found with ID: ${sessionId}`);
        return null;
      }
    } catch (error) {
      console.error(`[FirebaseService] Error getting workout session by ID (${sessionId}):`, error);
      throw error;
    }
  }

  static async updateWorkoutSession(userId: string, sessionId: string, updates: any): Promise<void> {
    try {
      const sessionDocRef = doc(db, 'users', userId, 'workoutSessions', sessionId);
      await updateDoc(sessionDocRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating workout session:', error);
      throw error;
    }
  }

  static async getWorkoutSessions(userId: string, planId?: string): Promise<any[]> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const workoutSessionsCollectionRef = collection(userDocRef, 'workoutSessions');
      
      let q = query(workoutSessionsCollectionRef, orderBy('startTime', 'desc'));
      
      if (planId) {
        q = query(workoutSessionsCollectionRef, where('planId', '==', planId), orderBy('startTime', 'desc'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const sessions: any[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting workout sessions:', error);
      throw error;
    }
  }

  // NEW: Get workout sessions for a specific plan
  static async getWorkoutSessionsByPlanId(userId: string, planId: string): Promise<WorkoutSession[]> {
    try {
      const sessionsRef = collection(db, 'users', userId, 'workoutSessions');
      const q = query(
        sessionsRef,
        where('planId', '==', planId),
        where('status', '==', 'completed'), // Only get completed sessions
        orderBy('startTime', 'desc') // Order by most recent first
      );
      const querySnapshot = await getDocs(q);

      const sessions: WorkoutSession[] = [];
      querySnapshot.forEach((doc) => {
        sessions.push({
          id: doc.id,
          ...doc.data(),
        } as WorkoutSession);
      });
      return sessions;
    } catch (error) {
      console.error('Error getting workout sessions by plan ID:', error);
      throw error;
    }
  }

  // Initialize sample data (call this once to populate your database)
  static async initializeSampleData(): Promise<void> {
    try {
      const foodsRef = collection(db, 'foods');
      
      // Check if foods already exist
      const existingFoods = await getDocs(foodsRef);
      if (!existingFoods.empty) {
        console.log('Foods already exist in database');
        return;
      }
      
      const mockFoods = this.getMockFoods();
      
      for (const food of mockFoods) {
        const { id, ...foodData } = food;
        await addDoc(foodsRef, foodData);
      }
      
      console.log(`Sample food data initialized with ${mockFoods.length} foods`);
      
      // Also initialize meal templates
      await this.initializeSampleMealTemplates();
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }

  // Saved Meal Plans
  static async saveMealPlan(userId: string, mealPlanData: any, name: string): Promise<string> {
    try {
      const savedMealPlan: Omit<SavedMealPlan, 'id'> = {
        userId,
        name,
        mealPlanData,
        generatedAt: new Date().toISOString(),
        mealNumber: await this.getMealPlanCountForDate(userId, new Date().toISOString().split('T')[0]) + 1,
      };
      
      const docRef = await addDoc(collection(db, 'savedMealPlans'), savedMealPlan);
      return docRef.id;
    } catch (error) {
      console.error('Save meal plan error:', error);
      throw error;
    }
  }

  static async getMealPlanCountForDate(userId: string, date: string): Promise<number> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const plansRef = collection(db, 'savedMealPlans');
      const q = query(
        plansRef,
        where('userId', '==', userId),
        where('generatedAt', '>=', startOfDay.toISOString()),
        where('generatedAt', '<=', endOfDay.toISOString())
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Get meal plan count error:', error);
      return 0;
    }
  }

  static async getSavedMealPlans(userId: string): Promise<SavedMealPlan[]> {
    try {
      const plansRef = collection(db, 'savedMealPlans');
      const q = query(
        plansRef,
        where('userId', '==', userId),
        orderBy('generatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SavedMealPlan));
    } catch (error) {
      console.error('Get saved meal plans error:', error);
      return [];
    }
  }

  static async getSavedMealPlanById(userId: string, planId: string): Promise<SavedMealPlan | null> {
    try {
        const planDoc = await getDoc(doc(db, 'savedMealPlans', planId));
        if (planDoc.exists()) {
            const data = planDoc.data() as SavedMealPlan;
            // CRITICAL: Verify that the plan belongs to the current user
            if (data.userId === userId) {
                return {
                    id: planDoc.id,
                    ...data
                } as SavedMealPlan;
            } else {
                // Log a warning if a user tries to access another user's plan
                console.warn(`Security Alert: User ${userId} attempted to access plan ${planId} which belongs to ${data.userId}`);
                return null; // Return null if userId does not match
            }
        }
        return null; // Document with planId does not exist
    } catch (error) {
        console.error('Get saved meal plan by ID error:', error);
        throw error;
    }
  }

  static async updateSavedMealPlanName(planId: string, newName: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'savedMealPlans', planId), { name: newName });
    } catch (error) {
      console.error('Update saved meal plan name error:', error);
      throw error;
    }
  }

  static async deleteSavedMealPlan(planId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'savedMealPlans', planId));
    } catch (error) {
      console.error('Delete saved meal plan error:', error);
      throw error;
    }
  }

  /**
   * Add a weight log entry for a user
   */
  static async addWeightLog(userId: string, weight: number, date: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const weightLogsCollectionRef = collection(userDocRef, 'weightLogs');
      const newWeightLogDocRef = doc(weightLogsCollectionRef);
      
      const weightLogDocument = {
        id: newWeightLogDocRef.id,
        userId,
        weight,
        date,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(newWeightLogDocRef, weightLogDocument);
    } catch (error) {
      console.error('Error adding weight log:', error);
      throw error;
    }
  }

  /**
   * Get weight history for a user
   */
  static async getWeightHistory(userId: string): Promise<Array<{ date: string; weight: number }>> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const weightLogsCollectionRef = collection(userDocRef, 'weightLogs');
      
      // CHANGE THIS: Order by createdAt instead of date for proper timestamp ordering
      const q = query(weightLogsCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const weightLogs: Array<{ date: string; weight: number }> = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        weightLogs.push({
          date: data.date, // This should now be the timestamp
          weight: data.weight,
        });
      });
      
      return weightLogs;
    } catch (error) {
      console.error('Error getting weight history:', error);
      throw error;
    }
  }
  /**
   * Get workout categories from Firebase
   */
  static async getWorkoutCategories(): Promise<any[]> {
    try {
      const categoriesCol = collection(db, 'workoutCategories');
      const q = query(categoriesCol, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const categories: any[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });
      return categories;
    } catch (error) {
      console.error('Error getting workout categories:', error);
      throw error;
    }
  }

  /**
   * Get subcategories for a workout category
   */
  static async getSubcategories(categoryId: string): Promise<any[]> {
    try {
      const subcategoriesCol = collection(db, 'workoutCategories', categoryId, 'subcategories');
      const q = query(subcategoriesCol, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const subcategories: any[] = [];
      querySnapshot.forEach((doc) => {
        subcategories.push({ id: doc.id, ...doc.data() });
      });
      return subcategories;
    } catch (error) {
      console.error(`Error getting subcategories for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Get exercises for a workout subcategory
   */
  static async getExercises(categoryId: string, subcategoryId: string): Promise<any[]> {
    try {
      const exercisesCol = collection(db, 'workoutCategories', categoryId, 'subcategories', subcategoryId, 'exercises');
      const q = query(exercisesCol, orderBy('order', 'asc'));
      const querySnapshot = await getDocs(q);
      const exercises: any[] = [];
      querySnapshot.forEach((doc) => {
        exercises.push({ id: doc.id, ...doc.data() });
      });
      return exercises;
    } catch (error) {
      console.error(`Error getting exercises for subcategory ${subcategoryId}:`, error);
      throw error;
    }
  }

  static async getPushToken(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.pushToken || null;
      }
      
      return null;
    } catch (error) {
      console.error('📱 FirebaseService: Error getting push token:', error);
      throw error;
    }
  }

  /**
   * Save push notification token to user document
   */
  static async savePushToken(userId: string, pushToken: string): Promise<void> {
    try {
      
      const userDocRef = doc(db, 'users', userId);
      
      await setDoc(userDocRef, {
        pushToken,
        pushTokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log(`📱 FirebaseService: Push token saved successfully for user ${userId}`);
    } catch (error) {
      console.error('📱 FirebaseService: Error saving push token:', error);
      throw error;
    }
  }

  static async saveUserTimezone(userId: string, timezone: string): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', userId);
      
      await setDoc(userDocRef, {
        timezone,
        timezoneUpdatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log(`📱 FirebaseService: Timezone saved successfully for user ${userId}: ${timezone}`);
    } catch (error) {
      console.error('📱 FirebaseService: Error saving timezone:', error);
      throw error;
    }
  }
  
  static async getUserTimezone(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.timezone || null;
      }
      
      return null;
    } catch (error) {
      console.error('📱 FirebaseService: Error getting timezone:', error);
      throw error;
    }
  }

  /**
   * Remove push token from user document (useful for logout)
   */
  static async removePushToken(userId: string): Promise<void> {
    try {
      console.log(`📱 FirebaseService: Removing push token for user ${userId}`);
      
      const userDocRef = doc(db, 'users', userId);
      
      await setDoc(userDocRef, {
        pushToken: null,
        pushTokenUpdatedAt: new Date().toISOString(),
      }, { merge: true });
      
      console.log(`📱 FirebaseService: Push token removed successfully for user ${userId}`);
    } catch (error) {
      console.error('📱 FirebaseService: Error removing push token:', error);
      throw error;
    }
  }

  /**
   * Fetches food log dates for a specific month for streak calendar.
   * Assumes food logs have a 'date' field in 'YYYY-MM-DD' string format.
   * @param userId The ID of the user.
   * @param year The year of the month.
   * @param month The month (1-12).
   * @returns A Promise that resolves to an array of 'YYYY-MM-DD' strings for logged days.
   */
    static subscribeToFoodRequests(
    userId: string,
    onUpdate: (requests: FoodRequest[]) => void,
    onError: (error: Error) => void
  ): () => void {
    try {
      const foodRequestsCollection = collection(db, 'foodRequests');
      const q = query(
        foodRequestsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requests: FoodRequest[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
              id: doc.id,
              userId: data.userId,
              foodName: data.foodName,
              description: data.description || undefined,
              status: data.status,
              createdAt: data.createdAt, // Assuming createdAt is stored as a string or Firestore Timestamp
              updatedAt: data.updatedAt || undefined,
            } as FoodRequest);
          });
          onUpdate(requests);
        },
        (error) => {
          console.error('Error subscribing to food requests:', error);
          onError(error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Failed to set up food requests subscription:', error);
      onError(error instanceof Error ? error : new Error('Unknown error setting up subscription'));
      return () => {}; // Return a no-op unsubscribe function
    }
  }
  static weeklyReportDocRef(userId: string, startDate: string, endDate: string) {
    return doc(db, 'users', userId, 'weeklyReports', `${startDate}_${endDate}`);
  }
  
  static async getWeeklyReport(userId: string, startDate: string, endDate: string): Promise<WeeklyReportDocument | null> {
    try {
      const ref = this.weeklyReportDocRef(userId, startDate, endDate);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return snap.data() as WeeklyReportDocument;
    } catch (error) {
      console.error('getWeeklyReport error:', error);
      return null;
    }
  }
  
  static async saveWeeklyReport(userId: string, data: WeeklyReportDocument): Promise<void> {
    try {
      const ref = this.weeklyReportDocRef(userId, data.startDate, data.endDate);
      await setDoc(ref, data, { merge: false });
    } catch (error) {
      console.error('saveWeeklyReport error:', error);
      throw error;
    }
  }
  
  static async getOrCreateWeeklyReport(userId: string, startDate: string, endDate: string, timezone?: string): Promise<WeeklyReportDocument> {
    const existing = await this.getWeeklyReport(userId, startDate, endDate);
    if (existing) return existing;
  
    const weeklyStats = await this.getWeeklyCategoryStats(userId, startDate, endDate);
    const reportData = this.filterWeeklyStatsForReport(weeklyStats);
    const daysWithData = weeklyStats?.daysWithData ?? 0;
  
    const docToSave: WeeklyReportDocument = {
      startDate,
      endDate,
      timezone,
      generatedAt: new Date().toISOString(),
      daysWithData,
      reportData,
    };
  
    await this.saveWeeklyReport(userId, docToSave);
    return docToSave;
  }
  
  static async listWeeklyReports(userId: string, limitCount = 12): Promise<WeeklyReportDocument[]> {
    try {
      const colRef = collection(db, 'users', userId, 'weeklyReports');
      const qy = query(colRef, orderBy('endDate', 'desc'), limit(limitCount));
      const qs = await getDocs(qy);
      return qs.docs.map(d => d.data() as WeeklyReportDocument);
    } catch (error) {
      console.error('listWeeklyReports error:', error);
      return [];
    }
  }
  // ===== Monthly Reports (compute-once, then read) =====

static monthlyReportDocRef(userId: string, startDate: string, endDate: string) {
  return doc(db, 'users', userId, 'monthlyReports', `${startDate}_${endDate}`);
}

static async getMonthlyReport(userId: string, startDate: string, endDate: string): Promise<MonthlyReportDocument | null> {
  try {
    const ref = this.monthlyReportDocRef(userId, startDate, endDate);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as MonthlyReportDocument;
  } catch (error) {
    console.error('getMonthlyReport error:', error);
    return null;
  }
}

static async saveMonthlyReport(userId: string, data: MonthlyReportDocument): Promise<void> {
  try {
    const ref = this.monthlyReportDocRef(userId, data.startDate, data.endDate);
    await setDoc(ref, data, { merge: false });
  } catch (error) {
    console.error('saveMonthlyReport error:', error);
    throw error;
  }
}

/**
 * Compute once and store, or return existing doc if already stored.
 * Reuses the weekly range aggregator for a month date range.
 */
static async getOrCreateMonthlyReport(userId: string, startDate: string, endDate: string, timezone?: string): Promise<MonthlyReportDocument> {
  const existing = await this.getMonthlyReport(userId, startDate, endDate);
  if (existing) return existing;

  // Reuse the same range-based aggregator
  const stats = await this.getWeeklyCategoryStats(userId, startDate, endDate);
  const reportData = this.filterWeeklyStatsForReport(stats);
  const daysWithData = stats?.daysWithData ?? 0;

  const docToSave: MonthlyReportDocument = {
    startDate,
    endDate,
    timezone,
    generatedAt: new Date().toISOString(),
    daysWithData,
    reportData,
  };

  await this.saveMonthlyReport(userId, docToSave);
  return docToSave;
}

static async listMonthlyReports(userId: string, limitCount = 12): Promise<MonthlyReportDocument[]> {
  try {
    const colRef = collection(db, 'users', userId, 'monthlyReports');
    const qy = query(colRef, orderBy('endDate', 'desc'), limit(limitCount));
    const qs = await getDocs(qy);
    return qs.docs.map(d => d.data() as MonthlyReportDocument);
  } catch (error) {
    console.error('listMonthlyReports error:', error);
    return [];
  }
}

static async getDailyMealDatesForMonth(userId: string, year: number, month: number): Promise<string[]> {
    try {
      console.log(`🔍 FirebaseService: getDailyMealDatesForMonth called for userId: ${userId}, year: ${year}, month: ${month}`);

      // Construct start and end dates for the month (these will be values of the 'date' field)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      console.log(`🔍 FirebaseService: Querying 'date' field from: ${startDate} to ${endDate}`);

      // Corrected: Reference the top-level 'dailyMeals' collection
      const dailyMealsRef = collection(db, 'dailyMeals');
      
      console.log(`🔍 FirebaseService: Querying collection path: dailyMeals`);

      const q = query(
        dailyMealsRef,
        where('userId', '==', userId), // Filter by userId field
        where('date', '>=', startDate), // Filter by date field
        where('date', '<=', endDate),   // Filter by date field
        orderBy('date', 'asc') // Order by date field
      );

      const querySnapshot = await getDocs(q);
      const loggedDates: string[] = [];
      
      console.log(`🔍 FirebaseService: Found ${querySnapshot.docs.length} documents for the month.`);

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Corrected: Push the value of the 'date' field
        if (data.date) {
          loggedDates.push(data.date);
          console.log(`🔍 FirebaseService: Retrieved document date: ${data.date}`);
        }
      });
      return loggedDates;
    } catch (error) {
      console.error('Error fetching daily meal dates for month:', error);
      throw new Error('Failed to fetch daily meal dates for month.');
    }
  }


}