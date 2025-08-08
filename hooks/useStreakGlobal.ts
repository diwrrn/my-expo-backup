import { useState, useEffect } from 'react';
import { streakGlobal } from '@/contexts/StreakGlobal';
import { useAuth } from '@/hooks/useAuth';

export function useStreakGlobal() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(streakGlobal.currentStreak);
  const [bestStreak, setBestStreak] = useState(streakGlobal.bestStreak);
  const [monthlyData, setMonthlyData] = useState(streakGlobal.monthlyData);
  const [isLoading, setIsLoading] = useState(streakGlobal.isLoading);
  const [error, setError] = useState(streakGlobal.error);

  useEffect(() => {
    const removeListener = streakGlobal.addListener({
      onStreakChange: (current, best) => {
        setCurrentStreak(current);
        setBestStreak(best);
      },
      onMonthlyDataChange: (data) => {
        setMonthlyData(data);
      },
      onLoadingChange: (loading) => {
        setIsLoading(loading);
      },
      onErrorChange: (err) => {
        setError(err);
      },
    });
  
    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    streakGlobal.setUser(user?.id || null);
  }, [user?.id]);

  return {
    currentStreak,
    bestStreak,
    monthlyData,
    isLoading,
    error,
    getMonthlyDates: streakGlobal.getMonthlyDates.bind(streakGlobal),
    refreshStreak: streakGlobal.refreshStreak.bind(streakGlobal),
    refreshMonthlyData: streakGlobal.refreshMonthlyData.bind(streakGlobal),
  };
}