import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

const EXPORT_OPTIONS = [
  {
    id: 'predictions',
    title: 'Prediction History',
    description: 'Export all your predictions and results',
    icon: 'chart-line',
  },
  {
    id: 'stats',
    title: 'Personal Statistics',
    description: 'Export your accuracy stats and performance metrics',
    icon: 'chart-bar',
  },
  {
    id: 'bankroll',
    title: 'Bankroll Data',
    description: 'Export your bet history and bankroll tracking',
    icon: 'cash',
  },
  {
    id: 'favorites',
    title: 'Favorites & Preferences',
    description: 'Export your favorite teams and app preferences',
    icon: 'heart',
  },
  {
    id: 'account',
    title: 'Account Information',
    description: 'Export your profile and subscription data',
    icon: 'account',
  },
  {
    id: 'all',
    title: 'Complete Data Export',
    description: 'Export all your data in one comprehensive file',
    icon: 'database-export',
  },
];

export default function DataExportScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState(null);

  const exportData = async (dataType) => {
    try {
      setLoading(true);
      setExportingType(dataType);

      // Fetch data from API
      const response = await api.get(`/users/export/${dataType}`);
      const data = response.data;

      // Generate CSV content
      const csvContent = generateCSV(dataType, data);

      // Create filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `nfl_predictor_${dataType}_${timestamp}.csv`;

      // Write to file
      const fileUri = FileSystem.documentDirectory + filename;
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Data',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert(
          'Export Complete',
          `Your data has been exported to: ${filename}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error.response?.data?.error || 'Failed to export data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setExportingType(null);
    }
  };

  const generateCSV = (dataType, data) => {
    switch (dataType) {
      case 'predictions':
        return generatePredictionsCSV(data);
      case 'stats':
        return generateStatsCSV(data);
      case 'bankroll':
        return generateBankrollCSV(data);
      case 'favorites':
        return generateFavoritesCSV(data);
      case 'account':
        return generateAccountCSV(data);
      case 'all':
        return generateCompleteCSV(data);
      default:
        return '';
    }
  };

  const generatePredictionsCSV = (data) => {
    const headers = 'Date,Home Team,Away Team,Prediction,Confidence,Actual Winner,Correct,Result\n';
    const rows = (data.predictions || []).map(p =>
      `${p.date || ''},${p.home_team || ''},${p.away_team || ''},${p.prediction || ''},${p.confidence || ''},${p.actual_winner || ''},${p.correct || ''},${p.result || ''}`
    ).join('\n');
    return headers + rows;
  };

  const generateStatsCSV = (data) => {
    const headers = 'Metric,Value\n';
    const rows = [
      `Total Predictions,${data.totalPredictions || 0}`,
      `Correct Predictions,${data.correctPredictions || 0}`,
      `Accuracy,${((data.accuracy || 0) * 100).toFixed(2)}%`,
      `Current Streak,${data.currentStreak || 0}`,
      `Best Streak,${data.bestStreak || 0}`,
      `Leaderboard Rank,${data.rank || 'N/A'}`,
    ].join('\n');
    return headers + rows;
  };

  const generateBankrollCSV = (data) => {
    const headers = 'Date,Type,Amount,Balance,Description\n';
    const rows = (data.transactions || []).map(t =>
      `${t.date || ''},${t.type || ''},${t.amount || ''},${t.balance || ''},${t.description || ''}`
    ).join('\n');
    return headers + rows;
  };

  const generateFavoritesCSV = (data) => {
    const headers = 'Category,Value\n';
    const rows = [
      `Favorite Teams,${(data.favoriteTeams || []).join('; ')}`,
      `Notifications Enabled,${data.notificationsEnabled || false}`,
      `Theme,${data.theme || 'default'}`,
    ].join('\n');
    return headers + rows;
  };

  const generateAccountCSV = (data) => {
    const headers = 'Field,Value\n';
    const rows = [
      `Name,${data.firstName || ''} ${data.lastName || ''}`,
      `Email,${data.email || ''}`,
      `Subscription Tier,${data.subscriptionTier || 'free'}`,
      `Member Since,${data.createdAt || ''}`,
      `Last Login,${data.lastLogin || ''}`,
    ].join('\n');
    return headers + rows;
  };

  const generateCompleteCSV = (data) => {
    let csv = '=== NFL PREDICTOR DATA EXPORT ===\n\n';
    csv += generateAccountCSV(data.account) + '\n\n';
    csv += '=== STATISTICS ===\n';
    csv += generateStatsCSV(data.stats) + '\n\n';
    csv += '=== PREDICTIONS ===\n';
    csv += generatePredictionsCSV(data.predictions) + '\n\n';
    csv += '=== BANKROLL ===\n';
    csv += generateBankrollCSV(data.bankroll) + '\n\n';
    csv += '=== FAVORITES ===\n';
    csv += generateFavoritesCSV(data.favorites) + '\n';
    return csv;
  };

  const handleExport = (option) => {
    Alert.alert(
      'Export Data',
      `Export ${option.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => exportData(option.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Export</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-outline" size={24} color={colors.primary} />
          <Text style={styles.infoText}>
            Export your data in CSV format. You can view these files in Excel, Google Sheets, or any text editor.
          </Text>
        </View>

        {/* Export Options */}
        <View style={styles.optionsContainer}>
          {EXPORT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleExport(option)}
              disabled={loading}
            >
              <View style={styles.optionIcon}>
                <Icon name={option.icon} size={32} color={colors.primary} />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>

              {loading && exportingType === option.id ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Icon name="download" size={20} color={colors.placeholder} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* GDPR Notice */}
        <View style={styles.gdprNotice}>
          <Icon name="shield-check" size={20} color={colors.success} />
          <Text style={styles.gdprText}>
            Your data privacy is important to us. Exported data is for your personal use only and is not shared with third parties.
          </Text>
        </View>

        {/* Delete Account Link */}
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'To delete your account and all associated data, please contact support at support@nflpredictor.com',
              [{ text: 'OK' }]
            );
          }}
        >
          <Icon name="delete-forever" size={20} color={colors.error} />
          <Text style={styles.deleteAccountText}>Request Account Deletion</Text>
        </TouchableOpacity>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.md,
    color: colors.text,
    lineHeight: 20,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.placeholder,
    lineHeight: 16,
  },
  gdprNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
  },
  gdprText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: 12,
    color: colors.placeholder,
    lineHeight: 18,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteAccountText: {
    color: colors.error,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
