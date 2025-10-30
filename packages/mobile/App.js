import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { darkTheme } from './src/theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const s = getStyles();
      return (
        <View style={s.errorContainer}>
          <Text style={s.errorTitle}>Something went wrong</Text>
          <Text style={s.errorText}>{this.state.error?.toString()}</Text>
          <Text style={s.errorHint}>Try reloading the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    // Initialize app with error handling
    const initApp = async () => {
      try {
        // Small delay to ensure everything is loaded
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsReady(true);
      } catch (error) {
        console.error('[App] Init error:', error);
        setInitError(error);
      }
    };

    initApp();
  }, []);

  if (initError) {
    const s = getStyles();
    return (
      <View style={s.errorContainer}>
        <Text style={s.errorTitle}>Initialization Error</Text>
        <Text style={s.errorText}>{initError.toString()}</Text>
      </View>
    );
  }

  if (!isReady) {
    const s = getStyles();
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={s.loadingText}>Initializing NFL Predictor...</Text>
      </View>
    );
  }

  try {
    return (
      <ErrorBoundary>
        <Provider store={store}>
          <ThemeProvider>
            <PaperProviderWrapper>
              <AppNavigator />
            </PaperProviderWrapper>
          </ThemeProvider>
        </Provider>
      </ErrorBoundary>
    );
  } catch (error) {
    const s = getStyles();
    return (
      <View style={s.errorContainer}>
        <Text style={s.errorTitle}>Render Error</Text>
        <Text style={s.errorText}>{error.toString()}</Text>
      </View>
    );
  }
}

// Lazy-load styles to avoid runtime errors
let styles;
const getStyles = () => {
  if (!styles) {
    // Fallback if StyleSheet is not available
    if (typeof StyleSheet === 'undefined' || !StyleSheet.create) {
      return {
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1a1a2e',
        },
        loadingText: {
          marginTop: 10,
          fontSize: 16,
          color: '#00d4ff',
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#1a1a2e',
        },
        errorTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#ff4444',
          marginBottom: 10,
        },
        errorText: {
          fontSize: 14,
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: 10,
        },
        errorHint: {
          fontSize: 12,
          color: '#aaaaaa',
          textAlign: 'center',
        },
      };
    }

    styles = StyleSheet.create({
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
      },
      loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#00d4ff',
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#1a1a2e',
      },
      errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ff4444',
        marginBottom: 10,
      },
      errorText: {
        fontSize: 14,
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 10,
      },
      errorHint: {
        fontSize: 12,
        color: '#aaaaaa',
        textAlign: 'center',
      },
    });
  }
  return styles;
};

// Wrapper component to use theme from context
function PaperProviderWrapper({ children }) {
  const { theme } = useTheme();
  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
