import React from 'react'
import { StyleSheet, View } from 'react-native'

const styles = StyleSheet.create({
  root: {
    height: 1,
    width: '100%',
    backgroundColor: 'white',
    opacity: 0.3,
  },
})

export const Divider: React.FC = () => {
  return <View style={styles.root} />
}
