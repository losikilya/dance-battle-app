import React, { Children, PropsWithChildren, ReactNode } from 'react'
import { FlatList, FlatListProps, View } from 'react-native'

import { Divider } from '../Divider'

type ListProps = {
  divided?: boolean
} & Omit<FlatListProps<ReactNode>, 'data' | 'renderItem'>

export const List: React.FC<PropsWithChildren<ListProps>> = ({ children, divided, ...props }) => {
  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      {...props}
      style={{ width: '100%', height: '100%' }}
      data={Children.toArray(children)}
      renderItem={({ item }) => (
        <View>
          {item}
          {divided && <Divider />}
        </View>
      )}
      keyExtractor={(_, index) => index.toString()}
    />
  )
}
