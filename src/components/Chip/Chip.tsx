import React, { PropsWithChildren } from 'react'
import { View } from 'react-native'

import { Text } from '../Text'

export const Chip: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <View style={{ paddingHorizontal: 8, backgroundColor: 'white', borderRadius: 16 }}>
      <Text variant="caption" color="primary">
        {children}
      </Text>
    </View>
  )
}
