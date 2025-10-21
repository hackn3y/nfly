import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView, TextInput as RNTextInput } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../theme';

// Conditionally import native-only components
let DateTimePicker = null;
let Checkbox = null;

if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
  Checkbox = require('react-native-paper').Checkbox;
}

// Simple TextInput for web without animations
const SimpleTextInput = ({ label, value, onChangeText, secureTextEntry, keyboardType, autoCapitalize, style }) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={[styles.simpleInputContainer, style]}>
      <Text style={styles.simpleInputLabel}>{label}</Text>
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.simpleInput}
        placeholderTextColor={colors.placeholder}
      />
    </View>
  );
};

// Simple Checkbox for web
const SimpleCheckbox = ({ checked, onPress, label }) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <TouchableOpacity style={styles.webCheckboxContainer} onPress={onPress}>
      <View style={[styles.webCheckbox, checked && styles.webCheckboxChecked]}>
        {checked && <Text style={styles.webCheckboxCheck}>✓</Text>}
      </View>
      <Text style={styles.checkboxText}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: new Date(2000, 0, 1),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error);
      dispatch(clearError());
    }
  }, [error]);

  const handleRegister = () => {
    // Validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    // Age verification
    const age = Math.floor((new Date() - formData.dateOfBirth) / 31557600000);
    if (age < 21) {
      Alert.alert('Age Requirement', 'You must be 21 or older to use this app');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    dispatch(register({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth.toISOString().split('T')[0],
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the NFL prediction community</Text>

          <View style={styles.form}>
            {Platform.OS === 'web' ? (
              <>
                <SimpleTextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  style={styles.input}
                />

                <SimpleTextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  style={styles.input}
                />

                <SimpleTextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />

                <View style={styles.simpleInputContainer}>
                  <Text style={styles.simpleInputLabel}>Date of Birth</Text>
                  <RNTextInput
                    type="date"
                    value={formData.dateOfBirth.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const date = new Date(e.target.value);
                      if (!isNaN(date.getTime())) {
                        setFormData({ ...formData, dateOfBirth: date });
                      }
                    }}
                    style={styles.simpleInput}
                  />
                </View>

                <SimpleTextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />

                <SimpleTextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <TextInput
                  label="First Name"
                  value={formData.firstName}
                  onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />

                <TextInput
                  label="Last Name"
                  value={formData.lastName}
                  onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                  mode="outlined"
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />

                <TextInput
                  label="Email"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateLabel}>Date of Birth</Text>
                  <Text style={styles.dateValue}>
                    {formData.dateOfBirth.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>

                <TextInput
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off' : 'eye'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />

                <TextInput
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  mode="outlined"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  theme={{ colors: { primary: colors.primary } }}
                />
              </>
            )}

            {showDatePicker && DateTimePicker && (
              <DateTimePicker
                value={formData.dateOfBirth}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFormData({ ...formData, dateOfBirth: selectedDate });
                  }
                }}
                maximumDate={new Date()}
              />
            )}

            {Platform.OS === 'web' ? (
              <SimpleCheckbox
                checked={agreedToTerms}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                label="I agree to the Terms & Conditions and confirm I am 21+"
              />
            ) : (
              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={agreedToTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  color={colors.primary}
                />
                <Text style={styles.checkboxText}>
                  I agree to the Terms & Conditions and confirm I am 21+
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
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
  dateButton: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  dateValue: {
    color: colors.text,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  checkboxText: {
    flex: 1,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  registerButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  registerButtonText: {
    ...typography.h3,
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.placeholder,
  },
  signInText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  // Simple input styles for web (no animations)
  simpleInputContainer: {
    marginBottom: spacing.md,
  },
  simpleInputLabel: {
    fontSize: 12,
    color: colors.placeholder,
    marginBottom: 4,
    marginLeft: 4,
  },
  simpleInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  // Web checkbox styles
  webCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  webCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  webCheckboxChecked: {
    backgroundColor: colors.primary,
  },
  webCheckboxCheck: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
