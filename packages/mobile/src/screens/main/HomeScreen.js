import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchUpcomingPredictions } from '../../store/slices/predictionsSlice';
import { colors, spacing, typography } from '../../theme';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { upcoming, loading } = useSelector((state) => state.predictions);
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only fetch predictions if user is authenticated and has a token
    if (isAuthenticated && token) {
      dispatch(fetchUpcomingPredictions());
    }
  }, [isAuthenticated, token]);

  const handleRefresh = () => {
    dispatch(fetchUpcomingPredictions());
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
        </View>
        <View style={styles.subscriptionBadge}>
          <Text style={styles.subscriptionText}>
            {user?.subscriptionTier?.toUpperCase() || 'FREE'}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <StatCard icon="chart-line" label="Accuracy" value="68%" />
        <StatCard icon="football" label="Games" value="12" />
        <StatCard icon="trophy" label="Wins" value="8" />
      </View>

      {/* Featured Predictions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Predictions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Predictions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcoming && upcoming.length > 0 ? (
          upcoming.slice(0, 3).map((prediction, index) => (
            <PredictionCard key={index} prediction={prediction} />
          ))
        ) : (
          <Text style={styles.noData}>No upcoming games</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="calculator"
            title="Gematria"
            subtitle="Calculate values"
            onPress={() => navigation.navigate('Gematria')}
          />
          <ActionCard
            icon="crown"
            title="Upgrade"
            subtitle="Get Premium"
            highlight
            onPress={() => navigation.navigate('Profile')}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Icon name={icon} size={24} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PredictionCard({ prediction }) {
  const confidenceColor = prediction.confidence > 0.7 ? colors.success :
                         prediction.confidence > 0.55 ? colors.warning : colors.placeholder;

  return (
    <View style={styles.predictionCard}>
      <View style={styles.matchup}>
        <Text style={styles.teamName}>{prediction.home_team}</Text>
        <Text style={styles.vs}>vs</Text>
        <Text style={styles.teamName}>{prediction.away_team}</Text>
      </View>

      <View style={styles.predictionDetails}>
        <View style={styles.predictionRow}>
          <Text style={styles.label}>Predicted Winner:</Text>
          <Text style={[styles.value, styles.winner]}>{prediction.predicted_winner}</Text>
        </View>
        <View style={styles.predictionRow}>
          <Text style={styles.label}>Confidence:</Text>
          <Text style={[styles.value, { color: confidenceColor }]}>
            {(prediction.confidence * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function ActionCard({ icon, title, subtitle, highlight, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.actionCard, highlight && styles.actionCardHighlight]}
      onPress={onPress}
    >
      <Icon
        name={icon}
        size={32}
        color={highlight ? colors.background : colors.primary}
      />
      <Text style={[styles.actionTitle, highlight && styles.actionTitleHighlight]}>
        {title}
      </Text>
      <Text style={[styles.actionSubtitle, highlight && styles.actionSubtitleHighlight]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
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
    padding: spacing.lg,
  },
  greeting: {
    ...typography.body,
    color: colors.placeholder,
  },
  userName: {
    ...typography.h2,
  },
  subscriptionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  subscriptionText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  seeAll: {
    color: colors.primary,
  },
  predictionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  teamName: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  vs: {
    color: colors.placeholder,
    paddingHorizontal: spacing.md,
  },
  predictionDetails: {
    gap: spacing.sm,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.placeholder,
  },
  value: {
    color: colors.text,
    fontWeight: '600',
  },
  winner: {
    color: colors.primary,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionCardHighlight: {
    backgroundColor: colors.primary,
  },
  actionTitle: {
    ...typography.h3,
    marginTop: spacing.sm,
  },
  actionTitleHighlight: {
    color: colors.background,
  },
  actionSubtitle: {
    ...typography.caption,
  },
  actionSubtitleHighlight: {
    color: colors.background,
    opacity: 0.8,
  },
  noData: {
    ...typography.body,
    color: colors.placeholder,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
