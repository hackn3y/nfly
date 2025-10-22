import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, View } from 'react-native';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { colors } from '../theme';

const Stack = createStackNavigator();

export default function AuthNavigator() {
  // On web, use simple component switching instead of Stack Navigator
  if (Platform.OS === 'web') {
    const [currentScreen, setCurrentScreen] = React.useState('Welcome');

    // Update document title on screen change
    React.useEffect(() => {
      if (typeof document !== 'undefined') {
        const titles = {
          Welcome: 'Welcome - NFL Predictor',
          Login: 'Sign In - NFL Predictor',
          Register: 'Create Account - NFL Predictor'
        };
        document.title = titles[currentScreen] || 'NFL Predictor';
      }
    }, [currentScreen]);

    // Simple navigation object for web
    const navigation = {
      navigate: (screen) => setCurrentScreen(screen),
      goBack: () => setCurrentScreen('Welcome'),
    };

    return (
      <View style={{ flex: 1 }}>
        {currentScreen === 'Onboarding' && <OnboardingScreen navigation={navigation} />}
        {currentScreen === 'Welcome' && <WelcomeScreen navigation={navigation} />}
        {currentScreen === 'Login' && <LoginScreen navigation={navigation} />}
        {currentScreen === 'Register' && <RegisterScreen navigation={navigation} />}
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}
