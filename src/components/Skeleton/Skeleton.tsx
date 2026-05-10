import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'
import Colors from '@constants/Colors'
import Ionicons from "@expo/vector-icons/Ionicons";

import { Icon } from '../Icon'
import { Card } from '../Cards'
import { Box } from '../Box'

type SkeletonProps = {
  height?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ height = 360 }) => {
  const opacityRef = useRef(new Animated.Value(0.3))

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityRef.current, {
          toValue: 1,
          useNativeDriver: false,
          duration: 300,
        }),
        Animated.timing(opacityRef.current, {
          toValue: 0.3,
          useNativeDriver: false,
          duration: 800,
        }),
      ])
    ).start()
  }, [])

  return (
    <Card style={{ height, backgroundColor: Colors.dark.backgroundLight }}>
      <Box align="center" justify="center" fullHeight>
        <Animated.View style={{ opacity: opacityRef.current }}>
          <Icon size={65}>
            <Ionicons size={24} name="reload" color={Colors.dark.background} />
          </Icon>
        </Animated.View>
      </Box>
    </Card>
  )
}
