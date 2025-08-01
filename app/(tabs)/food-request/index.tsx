// app/(tabs)/food-request/index.tsx
import { Redirect } from 'expo-router';

export default function FoodRequestIndex() {
  return <Redirect href="/(tabs)/food-request/submit" />;
}