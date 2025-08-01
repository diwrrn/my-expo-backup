import { Stack } from 'expo-router/stack';

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{
    }}>
      <Stack.Screen name="index" options={{ title: 'Workout Categories',headerShown: false }} />
      <Stack.Screen name="create-plan-name" options={{ title: 'Create Plan', headerShown: false }} />
      <Stack.Screen name="my-plans" options={{ title: 'My Workout Plans', headerShown: false }} />
      <Stack.Screen name="create-plan" options={{ title: 'Create Plan', headerShown: false }} />
      <Stack.Screen name="plan-details" options={{ title: 'Plan Details', headerShown: false }} />
      <Stack.Screen name="session" options={{ title: 'Workout Session', headerShown: false }} />
      <Stack.Screen name="subcategories" options={{ title: 'Subcategories', headerShown: false }} />
      <Stack.Screen name="exercises-list" options={{ title: 'Exercises', headerShown: false }} />
      <Stack.Screen name="exercise-detail" options={{ title: 'Exercise Detail', headerShown: false }} />
      <Stack.Screen name="history" options={{ title: 'Workout History', headerShown: false }} />
      <Stack.Screen name="session-details" options={{ title: 'Session Details', headerShown: false }} />
    </Stack>
  );
}