import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuthStore } from '@store/auth-store'
import SplashScreenComponent from '@screens/SplashScreen'
import LoginScreen from '@screens/LoginScreen'
import RegisterScreen from '@screens/RegisterScreen'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

const Stack = createNativeStackNavigator()

export default function App() {
  const { isLoading, restoreToken } = useAuthStore()

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Restore token and check if user is authenticated
        await restoreToken()
      } catch (e) {
        console.error('Failed to restore token:', e)
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync()
      }
    }

    bootstrapAsync()
  }, [])

  if (isLoading) {
    return null
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
          }}
        >
          <Stack.Screen
            name="Splash"
            component={SplashScreenComponent}
            options={{ animationEnabled: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animationTypeForReplace: isLoading ? 'none' : 'pop',
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar barStyle="dark-content" />
    </>
  )
}
