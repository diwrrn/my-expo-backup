// app/(tabs)/add/_layout.tsx
import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        // Add this to ensure proper navigation
        presentation: 'modal'
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Add Food'
        }}
      />
      <Stack.Screen 
        name="meal-selection" 
        options={{
          title: 'Meal Selection'
        }}
      />
      <Stack.Screen 
        name="food-entry" 
        options={{
          title: 'Food Entry'
        }}
      />
      <Stack.Screen 
        name="meal-food-search" 
        options={{
          title: 'Food Search'
        }}
      />
    </Stack>
  );
} 