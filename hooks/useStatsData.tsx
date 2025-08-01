import { useState } from 'react';
import { Award, Target, TrendingUp, Star } from 'lucide-react-native';

interface WeeklyData {
  day: string;
  calories: number;
  goal: number;
}

interface MonthlyStats {
  avgCalories: number;
  daysTracked: number;
  goalStreak: number;
  avgProtein: number;
}

interface Achievement {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  date?: string;
}

export function useStatsData() {
  const [weeklyData] = useState<WeeklyData[]>([
    { day: 'Mon', calories: 1850, goal: 2100 },
    { day: 'Tue', calories: 2200, goal: 2100 },
    { day: 'Wed', calories: 1950, goal: 2100 },
    { day: 'Thu', calories: 2050, goal: 2100 },
    { day: 'Fri', calories: 1800, goal: 2100 },
    { day: 'Sat', calories: 2300, goal: 2100 },
    { day: 'Sun', calories: 1900, goal: 2100 },
  ]);

  const [monthlyStats] = useState<MonthlyStats>({
    avgCalories: 1985,
    daysTracked: 28,
    goalStreak: 14,
    avgProtein: 95,
  });

  const [achievements] = useState<Achievement[]>([
    {
      title: 'Week Warrior',
      description: 'Logged food for 7 consecutive days',
      icon: <Award size={24} color="#FFFFFF" />,
      color: '#22C55E',
      unlocked: true,
      date: '2 days ago',
    },
    {
      title: 'Protein Power',
      description: 'Hit your protein goal 5 days in a row',
      icon: <Target size={24} color="#FFFFFF" />,
      color: '#3B82F6',
      unlocked: true,
      date: '1 week ago',
    },
    {
      title: 'Consistency King',
      description: 'Track calories for 30 days straight',
      icon: <TrendingUp size={24} color="#FFFFFF" />,
      color: '#8B5CF6',
      unlocked: false,
    },
    {
      title: 'Perfect Balance',
      description: 'Hit all macro goals in one day',
      icon: <Star size={24} color="#FFFFFF" />,
      color: '#F59E0B',
      unlocked: true,
      date: '3 days ago',
    },
  ]);

  return {
    weeklyData,
    monthlyStats,
    achievements,
  };
}