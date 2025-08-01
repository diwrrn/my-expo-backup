import { useState, useEffect } from 'react';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal: string;
  timestamp: Date;
}

interface MealData {
  calories: number;
  items: number;
}

interface TodaysEntries {
  breakfast: MealData;
  lunch: MealData;
  dinner: MealData;
  snacks: MealData;
}

interface DailyData {
  calories: number;
  caloriesGoal: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export function useFoodData() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [dailyData, setDailyData] = useState<DailyData>({
    calories: 1847,
    caloriesGoal: 2100,
    protein: 98,
    carbs: 156,
    fat: 67,
    water: 2.3,
  });

  const [todaysEntries, setTodaysEntries] = useState<TodaysEntries>({
    breakfast: { calories: 420, items: 3 },
    lunch: { calories: 650, items: 4 },
    dinner: { calories: 580, items: 3 },
    snacks: { calories: 197, items: 2 },
  });

  const addFoodEntry = (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    const newEntry: FoodEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const removeFoodEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  return {
    entries,
    dailyData,
    todaysEntries,
    addFoodEntry,
    removeFoodEntry,
  };
}