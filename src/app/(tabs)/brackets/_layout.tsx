import { Stack } from 'expo-router';

export default function BracketsLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="result/[battleId]" options={{ headerShown: false }} />
    </Stack>
  );
}
