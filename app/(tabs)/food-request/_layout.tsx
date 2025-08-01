// app/(tabs)/food-request/_layout.tsx
import { Stack } from 'expo-router';

export default function FoodRequestLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="submit" />
      <Stack.Screen name="history" />
    </Stack>
  );
}