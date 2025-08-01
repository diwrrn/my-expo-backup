// app/(tabs)/add/_layout.tsx
import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" /> {/* This refers to app/(tabs)/add.tsx */}
      <Stack.Screen name="meal-selection" /> {/* This refers to app/(tabs)/add/meal-selection.tsx */}
      <Stack.Screen name="food-entry" /> {/* This refers to app/(tabs)/add/food-entry.tsx */}
      <Stack.Screen name="meal-food-search" /> {/* This refers to app/(tabs)/add/meal-food-search.tsx */}
    </Stack>
  );
}
 