import Colors from '@constants/Colors'
import React, { PropsWithChildren } from 'react'
import { StyleSheet, StyleProp, TouchableOpacity, ViewStyle } from 'react-native'

type IconButtonProps = {
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  variant?: 'outlined' | 'contained'
  transparent?: boolean
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  outlined: { backgroundColor: 'transparent', borderColor: Colors.text.primary },
  contained: {
    borderColor: 'transparent',
    backgroundColor: Colors.dark.backgroundLight,
  },
  transparent: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
})

export const IconButton: React.FC<PropsWithChildren<IconButtonProps>> = ({
  style,
  variant = 'outlined',
  transparent = false,
  onPress,
  children,
}) => {
  return (
    <TouchableOpacity
      style={[styles.root, styles[variant], transparent && styles.transparent, style]}
      testID="button"
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  )
}
