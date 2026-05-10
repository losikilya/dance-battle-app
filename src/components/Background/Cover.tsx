import React from 'react'
import { ColorValue, View } from 'react-native'
import Colors from '@constants/Colors'

type CoverType = 'idle' | 'active' | 'disabled'

type CoverProps = {
  type?: CoverType
  borderRadius?: number
}

const backgroundCololorMap: Record<CoverType, ColorValue> = {
  idle: Colors.dark.backgroundLight,
  active: Colors.primary.main,
  disabled: Colors.dark.backgroundLight,
}

export const Cover: React.FC<CoverProps> = ({ type = 'idle', borderRadius = 0 }) => {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: backgroundCololorMap[type],
        zIndex: 2,
        opacity: 0.9,
        borderRadius,
      }}
    />
  )
}
