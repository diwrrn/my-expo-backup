import { useState, useEffect } from 'react';
import { FirebaseService } from '@/services/firebaseService';
import { useAuth } from './useAuth';

export const useWeeklyStats = (startDate: string, endDate: string) => {
  const { user } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchWeeklyStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🔄 useWeeklyStats: Fetching weekly stats for:', { startDate, endDate });
        const stats = await FirebaseService.getWeeklyCategoryStats(user.id, startDate, endDate);
        setWeeklyStats(stats);
        console.log('✅ useWeeklyStats: Weekly stats loaded:', stats);
      } catch (err) {
        console.error('❌ useWeeklyStats error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weekly stats');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [user?.id, startDate, endDate]);

  return { weeklyStats, loading, error };
};