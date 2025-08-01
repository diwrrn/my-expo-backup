import { useState, useEffect } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from './useAuth';
import { getTodayDateString } from '@/utils/dateUtils';

interface WeightLog {
  date: string;
  weight: number;
}

export function useWeightHistory(userId?: string) {
  //const { updateProfile } = useAuth();
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load weight history when userId changes
  useEffect(() => {
    if (userId) {
      loadWeightHistory();
    } else {
      setWeightLogs([]);
    }
  }, [userId]);

  const loadWeightHistory = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);
      const history = await FirebaseService.getWeightHistory(userId);
      setWeightLogs(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weight history';
      setError(errorMessage);
      console.error('Error loading weight history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logWeight = async (weight: number) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (weight <= 0 || weight > 500) {
      throw new Error('Weight must be between 1 and 500 kg');
    }

    try {
      setError(null);
      const today = getTodayDateString();
      
      // Add weight log to Firebase
      await FirebaseService.addWeightLog(userId, weight, today);
      
      // Update the user's main profile weight
      await updateProfile({ 
        profile: { 
          weight: weight 
        } 
      });
      
      // Refresh the weight history
      await loadWeightHistory();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log weight';
      setError(errorMessage);
          console.error('useWeightHistory: Error logging weight:', err); // <--- ADD THIS LINE

      throw err;
    }
  };

  return {
    weightLogs,
    isLoading,
    error,
    logWeight,
    refreshHistory: loadWeightHistory,
  };
}