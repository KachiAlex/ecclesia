import React, { useEffect } from 'react'
import { View, Image, StyleSheet, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'

const SplashScreen = () => {
  const navigation = useNavigation()
  const scaleAnim = React.useRef(new Animated.Value(0.5)).current
  const opacityAnim = React.useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Zoom in animation for logo (0.5x to 1x over 1 second)
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()

    // After 2 seconds, start fade out
    const fadeTimer = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
    }, 2000)

    // After 3 seconds total, navigate to login
    const navigationTimer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      })
    }, 3000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navigationTimer)
    }
  }, [navigation, scaleAnim, opacityAnim])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.loadingDot} />
        <View style={[styles.loadingDot, { marginLeft: 8 }]} />
        <View style={[styles.loadingDot, { marginLeft: 8 }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
})

export default SplashScreen
