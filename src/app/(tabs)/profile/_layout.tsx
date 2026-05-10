import React from 'react'
import { Stack } from 'expo-router'

export default function ProfileLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  )
}
