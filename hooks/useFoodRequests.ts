import { useState, useEffect } from 'react';
import { FirebaseService, FoodRequest } from '@/services/firebaseService';
import { useAppStore } from '@/store/appStore';

interface UseFoodRequestsResult {
  requests: FoodRequest[];
  loading: boolean;
  error: string | null;
  submitRequest: (foodName: string, description?: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

export function useFoodRequests(): UseFoodRequestsResult {
  const user = useAppStore(state => state.user);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up real-time listener
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = FirebaseService.subscribeToFoodRequests(
      user.id,
      (updatedRequests) => {
        setRequests(updatedRequests);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error in food requests subscription:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount or user change
    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Submit a new food request
  const submitRequest = async (foodName: string, description?: string): Promise<void> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await FirebaseService.addFoodRequest(user.id, foodName, description);
      // The real-time listener will automatically update the requests list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit request';
      setError(errorMessage);
      throw err;
    }
  };

  // Manually refresh requests (fallback)
  const refreshRequests = async (): Promise<void> => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const updatedRequests = await FirebaseService.getFoodRequests(user.id);
      setRequests(updatedRequests);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh requests';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    requests,
    loading,
    error,
    submitRequest,
    refreshRequests,
  };
}