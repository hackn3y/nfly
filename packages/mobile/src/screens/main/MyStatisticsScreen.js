import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function MyStatisticsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/predictions/stats');
      if (response.data.success) {
        setStats(response.data.stats || getDefaultStats());
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Use default stats if endpoint not fully implemented
      setStats(getDefaultStats());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDefaultStats = () => ({
    totalPredictions: 0,
    correctPredictions: 0,
    accuracy: 0,
    bestStreak: 0,
    currentStreak: 0,
    byType: {
      moneyline: { total: 0, correct: 0 },
      spread: { total: 0, correct: 0 },
      overUnder: { total: 0, correct: 0 },
    },
    byConfidence: {
      high: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      low: { total: 0, correct: 0 },
    },
  });

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const calculateAccuracy = (correct, total) => {
    if (total === 0) return 0;
    return ((correct / total) * 100).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>My Statistics</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Overall Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Performance</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="poll"
              label="Total Predictions"
              value={stats.totalPredictions}
              color={colors.primary}
            />
            <StatCard
              icon="check-circle"
              label="Correct"
              value={stats.correctPredictions}
              color={colors.success}
            />
            <StatCard
              icon="percent"
              label="Accuracy"
              value={`${stats.accuracy.toFixed(1)}%`}
              color={colors.primary}
            />
            <StatCard
              icon="fire"
              label="Best Streak"
              value={stats.bestStreak}
              color="#FF6B35"
            />
          </View>
        </View>

        {/* Current Streak */}
        <View style={styles.streakCard}>
          <Icon name="trophy" size={32} color="#FFD700" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakValue}>{stats.currentStreak} correct</Text>
          </View>
        </View>

        {/* By Bet Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Bet Type</Text>
          <View style={styles.typeCard}>
            <TypeRow
              label="Moneyline"
              icon="currency-usd"
              total={stats.byType.moneyline.total}
              correct={stats.byType.moneyline.correct}
              accuracy={calculateAccuracy(stats.byType.moneyline.correct, stats.byType.moneyline.total)}
            />
            <TypeRow
              label="Spread"
              icon="chart-line"
              total={stats.byType.spread.total}
              correct={stats.byType.spread.correct}
              accuracy={calculateAccuracy(stats.byType.spread.correct, stats.byType.spread.total)}
            />
            <TypeRow
              label="Over/Under"
              icon="swap-vertical"
              total={stats.byType.overUnder.total}
              correct={stats.byType.overUnder.correct}
              accuracy={calculateAccuracy(stats.byType.overUnder.correct, stats.byType.overUnder.total)}
            />
          </View>
        </View>

        {/* By Confidence Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Confidence Level</Text>
          <View style={styles.typeCard}>
            <TypeRow
              label="High Confidence"
              icon="shield-star"
              total={stats.byConfidence.high.total}
              correct={stats.byConfidence.high.correct}
              accuracy={calculateAccuracy(stats.byConfidence.high.correct, stats.byConfidence.high.total)}
              color={colors.success}
            />
            <TypeRow
              label="Medium Confidence"
              icon="shield-half-full"
              total={stats.byConfidence.medium.total}
              correct={stats.byConfidence.medium.correct}
              accuracy={calculateAccuracy(stats.byConfidence.medium.correct, stats.byConfidence.medium.total)}
              color={colors.warning}
            />
            <TypeRow
              label="Low Confidence"
              icon="shield-alert"
              total={stats.byConfidence.low.total}
              correct={stats.byConfidence.low.correct}
              accuracy={calculateAccuracy(stats.byConfidence.low.correct, stats.byConfidence.low.total)}
              color={colors.error}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={32} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TypeRow({ label, icon, total, correct, accuracy, color = colors.primary }) {
  return (
    <View style={styles.typeRow}>
      <View style={styles.typeRowLeft}>
        <Icon name={icon} size={20} color={color} />
        <Text style={styles.typeLabel}>{label}</Text>
      </View>
      <View style={styles.typeRowRight}>
        <Text style={styles.typeStats}>
          {correct}/{total}
        </Text>
        <Text style={[styles.typeAccuracy, { color }]}>
          {accuracy}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    color: colors.placeholder,
    fontSize: 12,
    textAlign: 'center',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    color: colors.placeholder,
    fontSize: 12,
  },
  streakValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  typeCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  typeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeLabel: {
    ...typography.body,
  },
  typeRowRight: {
    alignItems: 'flex-end',
  },
  typeStats: {
    color: colors.placeholder,
    fontSize: 12,
  },
  typeAccuracy: {
    ...typography.h4,
    marginTop: spacing.xs,
  },
});
