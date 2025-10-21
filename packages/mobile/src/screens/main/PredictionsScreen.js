import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchUpcomingPredictions, fetchWeeklyPredictions, setCurrentWeek } from '../../store/slices/predictionsSlice';
import { colors, spacing, typography } from '../../theme';

export default function PredictionsScreen() {
  const dispatch = useDispatch();
  const { upcoming, weekly, loading, currentWeek, currentSeason } = useSelector((state) => state.predictions);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming' or 'weekly'

  // Get current NFL season and week based on actual data
  const getCurrentNFLWeek = () => {
    // For now, default to 2025 season Week 10 (where we have data)
    // In production, this should query the backend for current week
    return { season: 2025, week: 10 };
  };

  useEffect(() => {
    const { season, week } = getCurrentNFLWeek();
    dispatch(setCurrentWeek({ season, week }));
    dispatch(fetchUpcomingPredictions());
  }, []);

  const handleRefresh = () => {
    if (viewMode === 'upcoming') {
      dispatch(fetchUpcomingPredictions());
    } else {
      dispatch(fetchWeeklyPredictions({ week: currentWeek, season: currentSeason }));
    }
  };

  const handleWeekChange = (direction) => {
    const newWeek = currentWeek + direction;
    if (newWeek >= 1 && newWeek <= 18) {
      dispatch(setCurrentWeek({ season: currentSeason, week: newWeek }));
      dispatch(fetchWeeklyPredictions({ week: newWeek, season: currentSeason }));
      setViewMode('weekly');
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'upcoming') {
      dispatch(fetchUpcomingPredictions());
    } else {
      dispatch(fetchWeeklyPredictions({ week: currentWeek, season: currentSeason }));
    }
  };

  const displayPredictions = viewMode === 'upcoming' ? upcoming : weekly;

  return (
    <View style={styles.container}>
      {/* Week Navigation */}
      <View style={styles.weekNavigation}>
        <TouchableOpacity
          style={styles.weekButton}
          onPress={() => handleViewModeChange('upcoming')}
        >
          <Text style={[styles.weekButtonText, viewMode === 'upcoming' && styles.weekButtonTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <View style={styles.weekSelector}>
          <TouchableOpacity onPress={() => handleWeekChange(-1)} disabled={!currentWeek || currentWeek <= 1}>
            <Icon name="chevron-left" size={24} color={currentWeek > 1 ? colors.primary : colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleViewModeChange('weekly')}>
            <Text style={[styles.weekText, viewMode === 'weekly' && styles.weekTextActive]}>
              Week {currentWeek || '?'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleWeekChange(1)} disabled={!currentWeek || currentWeek >= 18}>
            <Icon name="chevron-right" size={24} color={currentWeek < 18 ? colors.primary : colors.placeholder} />
          </TouchableOpacity>
        </View>
      </View>

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
        {displayPredictions && displayPredictions.length > 0 ? (
          displayPredictions.map((prediction, index) => (
            <DetailedPredictionCard key={prediction.game_id || index} prediction={prediction} />
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
  const confidence = prediction.confidence || 0.5;
  const confidenceColor = confidence > 0.7 ? colors.success :
                         confidence > 0.55 ? colors.warning : colors.placeholder;

  // Format predicted winner
  const winner = prediction.predicted_winner === 'home'
    ? prediction.home_team
    : prediction.predicted_winner === 'away'
    ? prediction.away_team
    : prediction.predicted_winner;

  // Format game date
  const formatGameDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.gameDate}>{formatGameDate(prediction.game_date)}</Text>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>
            {(confidence * 100).toFixed(0)}% Confidence
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
            {winner}
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
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weekButtonText: {
    color: colors.placeholder,
    fontSize: 14,
    fontWeight: '600',
  },
  weekButtonTextActive: {
    color: colors.primary,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: spacing.md,
  },
  weekTextActive: {
    color: colors.primary,
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
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    color: colors.placeholder,
    flex: 1,
    marginLeft: spacing.sm,
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
    marginBottom: spacing.xs,
  },
  factorText: {
    color: colors.text,
    fontSize: 12,
    marginLeft: spacing.sm,
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
