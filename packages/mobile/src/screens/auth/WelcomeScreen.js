import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <LinearGradient
      colors={[colors.background, colors.secondary]}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>🏈</Text>
          <Text style={styles.title}>NFL Predictor</Text>
          <Text style={styles.subtitle}>
            AI-Powered Predictions + Gematria Analysis
          </Text>
        </View>

        <View style={styles.features}>
          <FeatureItem icon="🤖" text="Machine Learning Predictions" />
          <FeatureItem icon="🔢" text="Advanced Gematria Calculator" />
          <FeatureItem icon="📊" text="Real-time Betting Insights" />
          <FeatureItem icon="💰" text="Parlay Optimizer" />
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          21+ Only. For entertainment purposes only.
        </Text>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.placeholder,
    textAlign: 'center',
  },
  features: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  buttons: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.h3,
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    ...typography.h3,
    color: colors.primary,
  },
  disclaimer: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
