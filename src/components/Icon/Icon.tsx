import React, { PropsWithChildren } from 'react'

import { Box } from '../Box'

type IconProps = {
  size?: number
}

export const Icon: React.FC<PropsWithChildren<IconProps>> = ({ size = 24, children }) => {
  return <Box style={{ width: size, height: size }}>{children}</Box>
}
