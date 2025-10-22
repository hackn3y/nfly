import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function LivePredictionsScreen({ navigation }) {
  const [liveGames, setLiveGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLiveGames();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLiveGames, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchLiveGames = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch games with in_progress status
      const response = await api.get('/predictions/live');

      setLiveGames(response.data.data || []);
    } catch (err) {
      console.error('Error fetching live games:', err);
      setError(err.response?.data?.error || 'Failed to fetch live games');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLiveGames();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="animation" size={16} color={colors.error} />
          <Text style={styles.headerTitle}>LIVE</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Live Games */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && liveGames.length > 0 ? (
          liveGames.map((game, index) => (
            <LiveGameCard
              key={game.id || index}
              game={game}
              onPress={() => navigation.navigate('PredictionDetail', { gameId: game.id })}
            />
          ))
        ) : !error && !loading ? (
          <View style={styles.emptyState}>
            <Icon name="football-off" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No Live Games</Text>
            <Text style={styles.emptySubtext}>
              Check back when games are in progress
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function LiveGameCard({ game, onPress }) {
  const prediction = game.prediction || {};

  // Calculate win probability
  const homeWinProb = prediction.home_win_probability || 0.5;
  const awayWinProb = 1 - homeWinProb;

  // Determine who's currently winning
  const homeScore = game.home_score || 0;
  const awayScore = game.away_score || 0;
  const homeLeading = homeScore > awayScore;
  const awayLeading = awayScore > homeScore;

  // Check if prediction is correct so far
  const predictedHome = prediction.predicted_winner === 'home' || prediction.predicted_winner === game.home_team;
  const predictedAway = prediction.predicted_winner === 'away' || prediction.predicted_winner === game.away_team;

  const predictionCorrect = (predictedHome && homeLeading) || (predictedAway && awayLeading);

  return (
    <TouchableOpacity style={styles.liveCard} onPress={onPress}>
      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
        <Text style={styles.quarter}>{game.period || 'Q1'}</Text>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <View style={[styles.team, homeLeading && styles.teamLeading]}>
          <Text style={styles.teamName}>{game.home_team}</Text>
          <Text style={[styles.score, homeLeading && styles.scoreLeading]}>
            {homeScore}
          </Text>
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={[styles.team, awayLeading && styles.teamLeading]}>
          <Text style={styles.teamName}>{game.away_team}</Text>
          <Text style={[styles.score, awayLeading && styles.scoreLeading]}>
            {awayScore}
          </Text>
        </View>
      </View>

      {/* Prediction Status */}
      <View style={styles.predictionStatus}>
        <View style={styles.predictionRow}>
          <Icon
            name={predictionCorrect ? 'check-circle' : 'alert-circle'}
            size={16}
            color={predictionCorrect ? colors.success : colors.warning}
          />
          <Text style={styles.predictionText}>
            Predicted: {prediction.predicted_winner || 'N/A'}
          </Text>
        </View>
        <Text style={styles.confidence}>
          {((prediction.confidence || 0.5) * 100).toFixed(0)}% Confidence
        </Text>
      </View>

      {/* Win Probability Bars */}
      <View style={styles.probabilityContainer}>
        <View style={styles.probabilityBar}>
          <View
            style={[
              styles.probabilityFill,
              { width: `${homeWinProb * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
        <View style={styles.probabilityLabels}>
          <Text style={styles.probabilityLabel}>
            {game.home_team} {(homeWinProb * 100).toFixed(0)}%
          </Text>
          <Text style={styles.probabilityLabel}>
            {game.away_team} {(awayWinProb * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  liveCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.error,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    marginRight: spacing.xs,
  },
  liveText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  quarter: {
    color: colors.placeholder,
    fontSize: 12,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  team: {
    alignItems: 'center',
    flex: 1,
  },
  teamLeading: {
    opacity: 1,
  },
  teamName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  score: {
    ...typography.h1,
    color: colors.text,
  },
  scoreLeading: {
    color: colors.primary,
  },
  vs: {
    color: colors.placeholder,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: spacing.md,
  },
  predictionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionText: {
    color: colors.text,
    marginLeft: spacing.xs,
  },
  confidence: {
    color: colors.primary,
    fontWeight: '600',
  },
  probabilityContainer: {
    marginTop: spacing.sm,
  },
  probabilityBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  probabilityFill: {
    height: '100%',
  },
  probabilityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  probabilityLabel: {
    color: colors.placeholder,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
