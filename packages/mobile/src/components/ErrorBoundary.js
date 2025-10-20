import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Only catch animation-related errors, let others through
    if (error && error.message && (
      error.message.includes('TimingAnimation') ||
      error.message.includes('flushQueue') ||
      error.message.includes('not a constructor')
    )) {
      console.warn('[ErrorBoundary] Caught animation error, ignoring:', error.message);
      // Don't show error UI for animation errors
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Only log non-animation errors
    if (!error.message.includes('TimingAnimation') && 
        !error.message.includes('flushQueue')) {
      console.error('[ErrorBoundary] Error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
          <Text style={{ color: colors.text, fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ color: colors.placeholder }}>Please reload the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
