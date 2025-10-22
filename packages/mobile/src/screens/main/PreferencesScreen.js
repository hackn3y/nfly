import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import api from '../../services/api';
import { spacing, typography } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export default function PreferencesScreen({ navigation }) {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    predictionAlerts: true,
    autoRefresh: true,
    showConfidenceScores: true,
    filterLowConfidence: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/users/preferences');
      if (response.data.success) {
        setPreferences({ ...preferences, ...response.data.preferences });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await api.put('/users/preferences', preferences);
      Alert.alert('Success', 'Preferences saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const clearCache = async () => {
    try {
      // Clear AsyncStorage cache (excluding auth token)
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('predictions_') ||
        key.startsWith('gematria_') ||
        key.startsWith('cache_') ||
        key.startsWith('data_')
      );

      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }

      // Optionally clear backend cache via API
      try {
        await api.post('/cache/clear');
      } catch (apiError) {
        console.log('Backend cache clear not available:', apiError);
      }

      Alert.alert('Success', `Cleared ${cacheKeys.length} cached items. Refresh your data to see updated predictions.`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      Alert.alert('Error', 'Failed to clear cache completely');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Preferences</Text>
        <TouchableOpacity onPress={savePreferences} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <PreferenceItem
            icon="email"
            label="Email Notifications"
            description="Receive predictions and updates via email"
            value={preferences.emailNotifications}
            onToggle={() => togglePreference('emailNotifications')}
          />

          <PreferenceItem
            icon="bell"
            label="Push Notifications"
            description="Get instant alerts on your device"
            value={preferences.pushNotifications}
            onToggle={() => togglePreference('pushNotifications')}
          />

          <PreferenceItem
            icon="email-newsletter"
            label="Weekly Digest"
            description="Receive weekly performance summary"
            value={preferences.weeklyDigest}
            onToggle={() => togglePreference('weeklyDigest')}
          />

          <PreferenceItem
            icon="chart-bell-curve"
            label="Prediction Alerts"
            description="Notify when new predictions are available"
            value={preferences.predictionAlerts}
            onToggle={() => togglePreference('predictionAlerts')}
          />
        </View>

        {/* Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>

          <PreferenceItem
            icon="theme-light-dark"
            label="Dark Mode"
            description="Use dark theme"
            value={isDarkMode}
            onToggle={toggleTheme}
          />

          <PreferenceItem
            icon="refresh"
            label="Auto Refresh"
            description="Automatically refresh predictions"
            value={preferences.autoRefresh}
            onToggle={() => togglePreference('autoRefresh')}
          />

          <PreferenceItem
            icon="percent-outline"
            label="Show Confidence Scores"
            description="Display prediction confidence levels"
            value={preferences.showConfidenceScores}
            onToggle={() => togglePreference('showConfidenceScores')}
          />

          <PreferenceItem
            icon="filter"
            label="Filter Low Confidence"
            description="Hide predictions below 60% confidence"
            value={preferences.filterLowConfidence}
            onToggle={() => togglePreference('filterLowConfidence')}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionItemLeft}>
              <Icon name="download" size={24} color={colors.primary} />
              <Text style={styles.actionItemText}>Export Data</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.placeholder} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert(
              'Clear Cache',
              'This will clear all cached predictions and data. You will need to refresh to see updated data.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCache }
              ]
            )}
          >
            <View style={styles.actionItemLeft}>
              <Icon name="delete-sweep" size={24} color={colors.warning} />
              <Text style={styles.actionItemText}>Clear Cache</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Changes will take effect immediately
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PreferenceItem({ icon, label, description, value, onToggle }) {
  return (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceLeft}>
        <Icon name={icon} size={24} color={colors.primary} />
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceLabel}>{label}</Text>
          <Text style={styles.preferenceDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.placeholder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
  },
  saveText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  preferenceText: {
    flex: 1,
  },
  preferenceLabel: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  preferenceDescription: {
    fontSize: 12,
    color: colors.placeholder,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionItemText: {
    ...typography.body,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    color: colors.placeholder,
    fontSize: 12,
    textAlign: 'center',
  },
});
