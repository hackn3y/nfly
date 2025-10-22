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
    // NFL 2025 season started September 4, 2025
    const seasonStart = new Date('2025-09-04');
    const now = new Date();

    // Calculate weeks since season start
    const daysSinceStart = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);

    // Week 1 starts on Sept 4, so current week is weeksSinceStart + 1
    const currentWeek = Math.min(Math.max(weeksSinceStart + 1, 1), 18);

    return { season: 2025, week: currentWeek };
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

  const handleWeekChange = async (direction) => {
    let newWeek = currentWeek + direction;
    const maxAttempts = 5; // Maximum weeks to check before giving up
    let attempts = 0;

    // Keep navigating until we find a week with games or hit boundaries
    while (newWeek >= 1 && newWeek <= 18 && attempts < maxAttempts) {
      attempts++;

      try {
        console.log('[PredictionsScreen] Checking Week', newWeek);

        // Fetch the week's predictions to check if it has games
        const result = await dispatch(fetchWeeklyPredictions({ week: newWeek, season: currentSeason })).unwrap();

        // If this week has games, use it
        if (result && result.length > 0) {
          dispatch(setCurrentWeek({ season: currentSeason, week: newWeek }));
          setViewMode('weekly');
          break;
        } else {
          // No games this week, try the next week in the same direction
          console.log(`[PredictionsScreen] Week ${newWeek} has no games, trying next week`);
          newWeek += direction;
        }
      } catch (error) {
        console.error(`[PredictionsScreen] Error fetching Week ${newWeek}:`, error);
        // If there's an error, just set the week anyway
        dispatch(setCurrentWeek({ season: currentSeason, week: newWeek }));
        setViewMode('weekly');
        break;
      }
    }

    // If we've exhausted all attempts, stay on current week
    if (attempts >= maxAttempts) {
      console.log('[PredictionsScreen] No weeks with games found in search range');
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

  // Apply filters to predictions
  const getFilteredPredictions = () => {
    const predictions = viewMode === 'upcoming' ? upcoming : weekly;

    if (!predictions || predictions.length === 0) return [];

    switch (selectedFilter) {
      case 'high':
        return predictions.filter(p => (p.confidence || 0) >= 0.7);
      case 'underdogs':
        return predictions.filter(p => {
          // Underdog is the team with lower win probability
          const homeWinProb = p.home_win_probability || 0.5;
          return homeWinProb < 0.5;
        });
      case 'favorites':
        return predictions.filter(p => {
          // Favorite is the team with higher win probability
          const homeWinProb = p.home_win_probability || 0.5;
          return homeWinProb > 0.5;
        });
      case 'all':
      default:
        return predictions;
    }
  };

  const displayPredictions = getFilteredPredictions();

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
            <Text style={styles.emptyText}>
              {viewMode === 'weekly' ? `No games for Week ${currentWeek}` : 'No predictions available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {viewMode === 'weekly'
                ? 'Try navigating to a different week'
                : 'Check back later for upcoming games'}
            </Text>
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
