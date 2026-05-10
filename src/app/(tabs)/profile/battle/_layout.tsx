import React from 'react'
import { Stack } from 'expo-router'

export default function CampaignLayout(): React.JSX.Element {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ headerShown: false }} />
      <Stack.Screen name="[campaignId]" options={{ headerShown: false }} />
    </Stack>
  )
}
