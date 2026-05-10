import { ColorValue, FlexStyle, ViewStyle } from 'react-native'

export type SpacingProps = {
  // margin
  m?: string | number
  // margin-top
  mt?: string | number
  // marginRight
  mr?: string | number
  // marginBottom
  mb?: string | number
  // margin-left
  ml?: string | number
  // margin-left, marginRight
  mx?: string | number
  // margin-top, marginBottom
  my?: string | number
  // padding
  p?: string | number
  // paddingTop
  pt?: string | number
  // paddingRight
  pr?: string | number
  // paddingBottom
  pb?: string | number
  // paddingLeft
  pl?: string | number
  // paddingLeft, paddingRight
  px?: string | number
  // paddingTop, paddingBottom
  py?: string | number
}

export type BoxProps = SpacingProps & {
  display?: FlexStyle['display']
  direction?: FlexStyle['flexDirection']
  style?: ViewStyle
  gap?: FlexStyle['gap']
  align?: FlexStyle['alignItems']
  justify?: FlexStyle['justifyContent']
  fullWidth?: boolean
  fullHeight?: boolean
  color?: ColorValue
  flex?: FlexStyle['flex']
}
