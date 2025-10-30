import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, KeyboardAvoidingView, Platform, Alert, TextInput as RNTextInput } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const styles = getStyles(colors);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Login Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(login({ email, password }));
  };

  // Simple TextInput for web without animations
  const SimpleTextInput = React.useCallback(({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, style }) => {
    if (Platform.OS !== 'web') {
      return null;
    }

    return (
      <View style={{ marginBottom: spacing.md, backgroundColor: 'transparent' }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4, marginLeft: 4 }}>{label}</Text>
        <View style={{ backgroundColor: colors.surface, borderRadius: 8, overflow: 'hidden' }}>
          <RNTextInput
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            placeholder={label}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 14,
              paddingVertical: 14,
              fontSize: 16,
              color: colors.text,
              outlineStyle: 'none',
              minHeight: 48,
              margin: 0,
            }}
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>
    );
  }, [colors]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          {Platform.OS === 'web' ? (
            <>
              <SimpleTextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />

              <View style={styles.passwordContainer}>
                <SimpleTextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                textColor={colors.text}
                theme={{
                  colors: {
                    primary: colors.primary,
                    onSurfaceVariant: colors.placeholder,
                    outline: colors.border,
                  }
                }}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
                textColor={colors.text}
                theme={{
                  colors: {
                    primary: colors.primary,
                    onSurfaceVariant: colors.placeholder,
                    outline: colors.border,
                  }
                }}
              />
            </>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.placeholder,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
  },
  loginButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginButtonText: {
    ...typography.h3,
    color: colors.onPrimary,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.placeholder,
  },
  signUpText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Simple input styles for web (no animations)
  simpleInputContainer: {
    marginBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  simpleInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    marginLeft: 4,
  },
  simpleInput: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    outlineStyle: 'none',
    minHeight: 48,
    margin: 0,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 36,
    padding: 8,
  },
  eyeIconText: {
    fontSize: 20,
  },
});
