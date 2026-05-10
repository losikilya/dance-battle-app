import React, { Children, PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import Colors from '@constants/Colors'

import { Box } from '../Box'
import { Text } from '../Text'

const styles = StyleSheet.create({
  circle: {
    backgroundColor: Colors.primary.main,
    width: 40,
    height: 40,
    borderRadius: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export const AvatarStack: React.FC<PropsWithChildren> = ({ children }) => {
  const Avatars = Children.toArray(children)
  const isTrunced = Avatars.length > 3

  return (
    <Box direction="row" align="center" gap={-20}>
      {isTrunced ? Avatars.slice(0, 2) : Avatars}
      {isTrunced && (
        <View style={styles.circle}>
          <Text variant="caption">+{Avatars.length - 2}</Text>
        </View>
      )}
    </Box>
  )
}
