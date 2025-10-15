import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { StripeProvider } from '@stripe/stripe-react-native';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_stripe_key';

export default function App() {
  return (
    <Provider store={store}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AppNavigator />
        </PaperProvider>
      </StripeProvider>
    </Provider>
  );
}
