import { Link, Stack } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { Text } from '@components'
import { getResource } from '@resources'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
})

const NotFoundScreen: React.FC = () => {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>{getResource('screen_not_exist')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{getResource('go_home')}</Text>
        </Link>
      </View>
    </>
  )
}

export default NotFoundScreen
