import React from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { Platform, View, Text } from 'react-native';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { darkTheme } from './src/theme';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <PaperProviderWrapper>
          <AppNavigator />
        </PaperProviderWrapper>
      </ThemeProvider>
    </Provider>
  );
}

// Wrapper component to use theme from context
function PaperProviderWrapper({ children }) {
  const { theme } = require('./src/context/ThemeContext').useTheme();
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
