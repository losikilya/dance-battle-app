import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'

import { Button } from '../Button'

describe('Button', () => {
  const onPressMock = jest.fn()

  it('renders the button with the given title', () => {
    const { getByTestId } = render(<Button onPress={onPressMock}>Click me</Button>)
    const buttonText = getByTestId('button')
    expect(buttonText).toBeDefined()
  })

  it('calls the onPress function when the button is pressed', () => {
    const { getByTestId } = render(<Button onPress={onPressMock}>Click me</Button>)
    const button = getByTestId('button')

    fireEvent.press(button)
    expect(onPressMock).toHaveBeenCalledTimes(1)
  })
})
