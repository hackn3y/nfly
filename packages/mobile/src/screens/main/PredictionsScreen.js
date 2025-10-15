import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchUpcomingPredictions } from '../../store/slices/predictionsSlice';
import { colors, spacing, typography } from '../../theme';

export default function PredictionsScreen() {
  const dispatch = useDispatch();
  const { upcoming, loading } = useSelector((state) => state.predictions);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchUpcomingPredictions());
  }, []);

  const handleRefresh = () => {
    dispatch(fetchUpcomingPredictions());
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All Games"
            active={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
          <FilterChip
            label="High Confidence"
            active={selectedFilter === 'high'}
            onPress={() => setSelectedFilter('high')}
          />
          <FilterChip
            label="Underdogs"
            active={selectedFilter === 'underdogs'}
            onPress={() => setSelectedFilter('underdogs')}
          />
          <FilterChip
            label="Favorites"
            active={selectedFilter === 'favorites'}
            onPress={() => setSelectedFilter('favorites')}
          />
        </ScrollView>
      </View>

      {/* Predictions List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {upcoming && upcoming.length > 0 ? (
          upcoming.map((prediction, index) => (
            <DetailedPredictionCard key={index} prediction={prediction} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="football" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No predictions available</Text>
            <Text style={styles.emptySubtext}>Check back later for upcoming games</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function DetailedPredictionCard({ prediction }) {
  const confidenceColor = prediction.confidence > 0.7 ? colors.success :
                         prediction.confidence > 0.55 ? colors.warning : colors.placeholder;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.gameDate}>Sunday, Oct 20</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {(prediction.confidence * 100).toFixed(0)}% Confidence
          </Text>
        </View>
      </View>

      {/* Teams */}
      <View style={styles.teamsContainer}>
        <View style={styles.team}>
          <Text style={styles.teamEmoji}>🏈</Text>
          <Text style={styles.teamName}>{prediction.home_team}</Text>
          <Text style={styles.teamScore}>{prediction.predicted_score?.home || '-'}</Text>
        </View>

        <View style={styles.divider}>
          <Text style={styles.vs}>VS</Text>
        </View>

        <View style={styles.team}>
          <Text style={styles.teamEmoji}>🏈</Text>
          <Text style={styles.teamName}>{prediction.away_team}</Text>
          <Text style={styles.teamScore}>{prediction.predicted_score?.away || '-'}</Text>
        </View>
      </View>

      {/* Prediction Details */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="trophy" size={16} color={colors.primary} />
          <Text style={styles.detailLabel}>Winner:</Text>
          <Text style={[styles.detailValue, styles.winner]}>
            {prediction.predicted_winner}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="chart-timeline-variant" size={16} color={colors.primary} />
          <Text style={styles.detailLabel}>Spread:</Text>
          <Text style={styles.detailValue}>
            {prediction.spread_prediction >= 0 ? '+' : ''}
            {prediction.spread_prediction}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="sigma" size={16} color={colors.primary} />
          <Text style={styles.detailLabel}>O/U:</Text>
          <Text style={styles.detailValue}>
            {prediction.over_under_prediction}
          </Text>
        </View>
      </View>

      {/* Key Factors */}
      {prediction.key_factors && prediction.key_factors.length > 0 && (
        <View style={styles.factors}>
          <Text style={styles.factorsTitle}>Key Factors:</Text>
          {prediction.key_factors.slice(0, 3).map((factor, idx) => (
            <View key={idx} style={styles.factor}>
              <Icon name="checkbox-marked-circle" size={14} color={colors.success} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filtersContainer: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.placeholder,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  gameDate: {
    color: colors.placeholder,
  },
  confidenceBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  teamsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  team: {
    flex: 1,
    alignItems: 'center',
  },
  teamEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  teamName: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamScore: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  divider: {
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  vs: {
    color: colors.placeholder,
    fontWeight: 'bold',
  },
  details: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    color: colors.placeholder,
    flex: 1,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
  },
  winner: {
    color: colors.primary,
  },
  factors: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  factorsTitle: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  factorText: {
    color: colors.text,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.placeholder,
    marginTop: spacing.sm,
  },
});
