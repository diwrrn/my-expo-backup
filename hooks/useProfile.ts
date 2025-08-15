import { useState, useEffect } from 'react';
import { UserProfile as FirebaseUserProfile } from '@/types/api';
import { useAppStore } from '@/store/appStore';


interface Profile extends Omit<FirebaseUserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
  name: string;
  phoneNumber: string;
  avatar: string;
  streak: number;
  totalDays: number;
  avgCalories: number;
}

export function useProfile() {
  const { user, updateProfile } = useAppStore();
  
  const [profile, setProfile] = useState<Profile>({
    name: user?.name || 'User',
    phoneNumber: user?.phoneNumber || '',
    avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
    weight: user?.profile?.weight || 70,
    height: user?.profile?.height || 170,
    age: user?.profile?.age || 25,
    activityLevel: user?.profile?.activityLevel || 'moderate',
    streak: 14,
    totalDays: 127,
    avgCalories: 1985,
    goalsWaterUpdate: user?.profile?.goalsWaterUpdate,
    goals: {
      calories: user?.profile?.goals?.calories || 2000,
      protein: user?.profile?.goals?.protein || 100,
      carbs: user?.profile?.goals?.carbs || 250,
      fat: user?.profile?.goals?.fat || 65,
    },
  });

  // Synchronize profile state with user.profile from useAuth
  useEffect(() => {
    if (user?.profile) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        phoneNumber: user.phoneNumber || prev.phoneNumber,
        weight: user.profile?.weight || prev.weight,
        height: user.profile?.height || prev.height,
        age: user.profile?.age || prev.age,
        activityLevel: user.profile?.activityLevel || prev.activityLevel,
        goalsWaterUpdate: user.profile?.goalsWaterUpdate,
        goals: {
          calories: user.profile?.goals?.calories || prev.goals.calories,
          protein: user.profile?.goals?.protein || prev.goals.protein,
          carbs: user.profile?.goals?.carbs || prev.goals.carbs,
          fat: user.profile?.goals?.fat || prev.goals.fat,
          water: user.profile?.goals?.water || prev.goals.water, // Sync water goal
        },
      }));
    }
  }, [user?.profile, user?.name, user?.phoneNumber]);

  const updateGoal = async (key: keyof Profile['goals'], value: number) => {
    try {
      console.log('🎯 useProfile: Updating goal via useAuth.updateProfile');
      
      const updatedGoals = {
        ...profile.goals,
        [key]: value,
      };
      
      // Use updateProfile from useAuth to ensure central state management
      await updateProfile({ 
        profile: { 
          goals: updatedGoals 
        } 
      });
      
      console.log('✅ useProfile: Goal update completed via useAuth');
    } catch (error) {
      console.error('❌ useProfile: Error updating goal:', error);
      throw error;
    }
  };

  const updateProfileData = async (updates: Partial<Profile>) => {
    try {
      console.log('🔄 useProfile: Updating profile data via useAuth.updateProfile');
      console.log('🔄 useProfile: Updates being sent:', updates);
      
      // Separate user data from profile data
      const { name, phoneNumber, ...profileUpdates } = updates;
      
      const updateData: any = {};
      
      // Add user-level updates if provided
      if (name !== undefined) updateData.name = name;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      
      // Add profile-level updates if provided
      if (Object.keys(profileUpdates).length > 0) {
        updateData.profile = profileUpdates;
      }
      
      console.log('🔄 useProfile: Final updateData being passed to useAuth.updateProfile:', updateData);
      
      // Use updateProfile from useAuth to ensure central state management
      await updateProfile(updateData);
      
      console.log('✅ useProfile: Profile data update completed via useAuth');
    } catch (error) {
      console.error('❌ useProfile: Error updating profile:', error);
      throw error;
    }
  };

  return {
    profile,
    updateGoal,
    updateProfile: updateProfileData,
  };
}