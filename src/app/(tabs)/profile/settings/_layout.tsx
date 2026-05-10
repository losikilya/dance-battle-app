import React from 'react'
import { Stack } from 'expo-router'

export default function SettingsLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="aboutUs" options={{ headerShown: false }} />
    </Stack>
  )
}
