import { useState } from 'react';

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

export function useFoodDatabase() {
  const [popularFoods] = useState<Food[]>([
    {
      id: '1',
      name: 'Grilled Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      serving: '100g',
    },
    {
      id: '2',
      name: 'Brown Rice',
      calories: 123,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      serving: '100g cooked',
    },
    {
      id: '3',
      name: 'Avocado',
      calories: 160,
      protein: 2,
      carbs: 9,
      fat: 15,
      serving: '1 medium',
    },
    {
      id: '4',
      name: 'Greek Yogurt',
      calories: 100,
      protein: 17,
      carbs: 6,
      fat: 0.4,
      serving: '170g',
    },
    {
      id: '5',
      name: 'Salmon Fillet',
      calories: 206,
      protein: 22,
      carbs: 0,
      fat: 12,
      serving: '100g',
    },
    {
      id: '6',
      name: 'Sweet Potato',
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      serving: '1 medium',
    },
  ]);

  const [recentFoods] = useState<Food[]>([
    {
      id: '7',
      name: 'Oatmeal',
      calories: 154,
      protein: 5.3,
      carbs: 28,
      fat: 3.2,
      serving: '1 cup cooked',
    },
    {
      id: '8',
      name: 'Banana',
      calories: 105,
      protein: 1.3,
      carbs: 27,
      fat: 0.4,
      serving: '1 medium',
    },
    {
      id: '9',
      name: 'Almonds',
      calories: 164,
      protein: 6,
      carbs: 6,
      fat: 14,
      serving: '28g',
    },
  ]);

  const [allFoods] = useState<Food[]>([
    ...popularFoods,
    ...recentFoods,
    {
      id: '10',
      name: 'Quinoa',
      calories: 222,
      protein: 8,
      carbs: 39,
      fat: 3.6,
      serving: '1 cup cooked',
    },
    {
      id: '11',
      name: 'Broccoli',
      calories: 55,
      protein: 3.7,
      carbs: 11,
      fat: 0.6,
      serving: '1 cup',
    },
    {
      id: '12',
      name: 'Eggs',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      serving: '2 large',
    },
  ]);

  const searchFoods = (query: string): Food[] => {
    if (!query) return [];
    return allFoods.filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    );
  };

  return {
    popularFoods,
    recentFoods,
    searchFoods,
    allFoods,
  };
}