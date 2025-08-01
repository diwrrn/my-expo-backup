/**
 * Hook for user feedback functionality
 */

import { useState } from 'react';
import { Food } from '@/types/api';
import { useAuth } from './useAuth';

// Define interfaces for feedback types
export interface FoodCombinationFeedback {
  id: string;
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  foodIds: string[];
  rating: number; // 1-5 stars
  createdAt: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  preferredCategories: string[];
  dislikedCategories: string[];
  dietaryRestrictions: {
    vegan: boolean;
    vegetarian: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    [key: string]: boolean;
  };
  updatedAt: string;
}

export function useUserFeedback() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFeedbackId, setLastFeedbackId] = useState<string | null>(null);

  /**
   * Submit feedback for a food combination
   */
  const submitFoodCombinationFeedback = async (
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    foods: Food[],
    rating: number
  ) => {
    if (!user) {
      setError('User must be logged in to submit feedback');
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create feedback object
      const feedback: FoodCombinationFeedback = {
        id: Date.now().toString(),
        userId: user.id,
        mealType,
        foodIds: foods.map(f => f.id),
        rating,
        createdAt: new Date().toISOString()
      };
      
      // In a real implementation, this would be saved to a database
      console.log('Food combination feedback logged:', feedback);
      
      setLastFeedbackId(feedback.id);
      return feedback.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Save user preferences
   */
  const savePreferences = async (preferences: Partial<UserPreference>) => {
    if (!user) {
      setError('User must be logged in to save preferences');
      return null;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create preferences object
      const updatedPreferences: UserPreference = {
        id: Date.now().toString(),
        userId: user.id,
        preferredCategories: preferences.preferredCategories || [],
        dislikedCategories: preferences.dislikedCategories || [],
        dietaryRestrictions: preferences.dietaryRestrictions || {
          vegan: false,
          vegetarian: false,
          glutenFree: false,
          dairyFree: false
        },
        updatedAt: new Date().toISOString()
      };
      
      // In a real implementation, this would be saved to a database
      console.log('User preferences saved:', updatedPreferences);
      
      return updatedPreferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preferences';
      setError(errorMessage);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get user preferences
   */
  const getPreferences = async () => {
    if (!user) {
      setError('User must be logged in to get preferences');
      return null;
    }

    try {
      // In a real implementation, this would fetch preferences from a database
      // For now, return mock data
      const mockPreferences: UserPreference = {
        id: 'mock-preferences',
        userId: user.id,
        preferredCategories: ['Protein', 'Vegetables'],
        dislikedCategories: [],
        dietaryRestrictions: {
          vegan: false,
          vegetarian: false,
          glutenFree: false,
          dairyFree: false
        },
        updatedAt: new Date().toISOString()
      };
      
      return mockPreferences;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get preferences';
      console.error(errorMessage);
      return null;
    }
  };

  return {
    submitFoodCombinationFeedback,
    savePreferences,
    getPreferences,
    isSubmitting,
    error,
    lastFeedbackId
  };
}