import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ModelStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [timeframe, setTimeframe] = useState('season');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModelStats();
  }, [timeframe]);

  const fetchModelStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/transparency/stats?timeframe=${timeframe}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching model stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 0.55) return colors.success;
    if (accuracy >= 0.50) return colors.primary;
    return colors.error;
  };

  const renderModelCard = (model) => (
    <View key={model.model_name} style={styles.modelCard}>
      <View style={styles.modelHeader}>
        <Icon
          name={model.model_name.includes('Random Forest') ? 'tree' :
                model.model_name.includes('XGBoost') ? 'chart-line' :
                model.model_name.includes('Neural') ? 'brain' : 'robot'}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.modelName}>{model.model_name}</Text>
      </View>

      <View style={styles.modelStats}>
        <StatItem
          label="Accuracy"
          value={`${(model.accuracy * 100).toFixed(1)}%`}
          color={getAccuracyColor(model.accuracy)}
        />
        <StatItem
          label="Predictions"
          value={model.total_predictions}
        />
        <StatItem
          label="Correct"
          value={model.correct_predictions}
          color={colors.success}
        />
      </View>

      {model.avg_confidence && (
        <View style={styles.confidenceBar}>
          <Text style={styles.confidenceLabel}>Avg Confidence</Text>
          <View style={styles.confidenceBarContainer}>
            <View
              style={[
                styles.confidenceBarFill,
                { width: `${model.avg_confidence * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>
            {(model.avg_confidence * 100).toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );

  if (loading && !stats) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Model Statistics</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading model stats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Model Statistics</Text>
        <TouchableOpacity onPress={fetchModelStats}>
          <Icon name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchModelStats}
            tintColor={colors.primary}
          />
        }
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeSelector}>
          {['week', 'month', 'season', 'all'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeframeButton,
                timeframe === period && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(period)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === period && styles.timeframeTextActive,
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {stats && (
          <>
            {/* Overall Performance */}
            <View style={styles.overallCard}>
              <Text style={styles.sectionTitle}>Overall Performance</Text>

              <View style={styles.overallStats}>
                <View style={styles.overallStatLarge}>
                  <Text
                    style={[
                      styles.overallStatValue,
                      { color: getAccuracyColor(stats.overall?.accuracy || 0) },
                    ]}
                  >
                    {((stats.overall?.accuracy || 0) * 100).toFixed(1)}%
                  </Text>
                  <Text style={styles.overallStatLabel}>Overall Accuracy</Text>
                </View>
              </View>

              <View style={styles.overallStatsGrid}>
                <OverallStat
                  icon="chart-timeline-variant"
                  label="Total Predictions"
                  value={stats.overall?.total_predictions || 0}
                />
                <OverallStat
                  icon="check-circle"
                  label="Correct"
                  value={stats.overall?.correct_predictions || 0}
                />
                <OverallStat
                  icon="close-circle"
                  label="Incorrect"
                  value={(stats.overall?.total_predictions || 0) - (stats.overall?.correct_predictions || 0)}
                />
                <OverallStat
                  icon="gauge"
                  label="Avg Confidence"
                  value={`${((stats.overall?.avg_confidence || 0) * 100).toFixed(0)}%`}
                />
              </View>
            </View>

            {/* Model Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Model Breakdown</Text>
              {stats.by_model && stats.by_model.length > 0 ? (
                stats.by_model.map(renderModelCard)
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No model data available</Text>
                </View>
              )}
            </View>

            {/* Performance by Confidence Level */}
            {stats.by_confidence && stats.by_confidence.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Performance by Confidence</Text>
                <View style={styles.confidenceGrid}>
                  {stats.by_confidence.map((item) => (
                    <ConfidenceCard
                      key={item.confidence_range}
                      range={item.confidence_range}
                      accuracy={item.accuracy}
                      count={item.count}
                      color={getAccuracyColor(item.accuracy)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Info Footer */}
            <View style={styles.infoFooter}>
              <Icon name="information-outline" size={20} color={colors.placeholder} />
              <Text style={styles.infoText}>
                Model statistics are updated after each game. Accuracy metrics show historical performance and do not guarantee future results.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, color = colors.text }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function OverallStat({ icon, label, value }) {
  return (
    <View style={styles.overallStatItem}>
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={styles.overallStatItemValue}>{value}</Text>
      <Text style={styles.overallStatItemLabel}>{label}</Text>
    </View>
  );
}

function ConfidenceCard({ range, accuracy, count, color }) {
  return (
    <View style={styles.confidenceCard}>
      <Text style={styles.confidenceRange}>{range}</Text>
      <Text style={[styles.confidenceAccuracy, { color }]}>
        {(accuracy * 100).toFixed(1)}%
      </Text>
      <Text style={styles.confidenceCount}>{count} games</Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.placeholder,
    marginTop: spacing.md,
  },
  timeframeSelector: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 14,
    color: colors.placeholder,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: colors.background,
  },
  overallCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  overallStats: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  overallStatLarge: {
    alignItems: 'center',
  },
  overallStatValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  overallStatLabel: {
    color: colors.placeholder,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  overallStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  overallStatItem: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overallStatItemValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.xs,
  },
  overallStatItemLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  modelCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modelName: {
    ...typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  modelStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confidenceBar: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  confidenceLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  confidenceBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  confidenceValue: {
    color: colors.text,
    fontSize: 12,
    textAlign: 'right',
  },
  confidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  confidenceCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  confidenceRange: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  confidenceAccuracy: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  confidenceCount: {
    color: colors.placeholder,
    fontSize: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.placeholder,
  },
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  infoText: {
    flex: 1,
    color: colors.placeholder,
    fontSize: 12,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});
