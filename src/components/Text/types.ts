import { Text } from 'react-native'

type Variant = 'h1' | 'h2' | 'bodyBold' | 'body' | 'body2' | 'button' | 'caption'

export type Color = 'primary' | 'secondary' | 'textPrimary' | 'textSecondary' | 'dark' | 'error'

export type StyledTextProps = Text['props'] & {
  variant?: Variant
  color?: Color | string
  centered?: boolean
  contrast?: boolean
}
