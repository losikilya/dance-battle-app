import React from 'react'
import { StyleSheet, TextInput, TextInputProps } from 'react-native'
import Colors from '@constants/Colors'

const styles = StyleSheet.create({
  root: {
    width: 100,
    padding: 12,
    borderWidth: 1,
    borderRadius: 32,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: 0.84,
    textAlign: 'center',
    backgroundColor: Colors.dark.backgroundLight,
    color: 'white',
    fontFamily: 'HauoraBold',
  },
})

export const Input: React.FC<TextInputProps & { innerRef?: React.RefObject<TextInput> }> = ({
  innerRef,
  style,
  ...props
}) => {
  return <TextInput ref={innerRef} style={[styles.root, style]} {...props} />
}
