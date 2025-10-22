import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function ParlayBuilderScreen({ navigation }) {
  const { upcoming } = useSelector((state) => state.predictions);
  const [selectedPicks, setSelectedPicks] = useState([]);
  const [parlayResult, setParlayResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const togglePick = (prediction) => {
    const isSelected = selectedPicks.some(p => p.game_id === prediction.game_id);

    if (isSelected) {
      setSelectedPicks(selectedPicks.filter(p => p.game_id !== prediction.game_id));
    } else {
      if (selectedPicks.length >= 10) {
        Alert.alert('Limit Reached', 'You can select up to 10 games in a parlay');
        return;
      }
      setSelectedPicks([...selectedPicks, prediction]);
    }

    setParlayResult(null);
  };

  const calculateParlay = async () => {
    if (selectedPicks.length < 2) {
      Alert.alert('Invalid Selection', 'Please select at least 2 games for a parlay');
      return;
    }

    try {
      setLoading(true);

      const games = selectedPicks.map(pick => ({
        game_id: pick.game_id,
        pick: pick.predicted_winner,
        confidence: pick.confidence
      }));

      const response = await api.post('/predictions/parlay', {
        games,
        max_legs: 10
      });

      setParlayResult(response.data.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to calculate parlay');
    } finally {
      setLoading(false);
    }
  };

  const clearSelections = () => {
    setSelectedPicks([]);
    setParlayResult(null);
  };

  const isPicked = (prediction) => {
    return selectedPicks.some(p => p.game_id === prediction.game_id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parlay Builder</Text>
        <TouchableOpacity onPress={clearSelections}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Selection Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryHeader}>
            <Icon name="view-list" size={24} color={colors.primary} />
            <Text style={styles.summaryTitle}>
              {selectedPicks.length} {selectedPicks.length === 1 ? 'Game' : 'Games'} Selected
            </Text>
          </View>

          {selectedPicks.length > 0 && (
            <View style={styles.selectedGames}>
              {selectedPicks.map((pick, index) => (
                <View key={pick.game_id} style={styles.selectedGame}>
                  <Text style={styles.selectedGameText}>
                    {index + 1}. {pick.home_team} vs {pick.away_team}
                  </Text>
                  <Text style={styles.selectedPick}>→ {pick.predicted_winner}</Text>
                </View>
              ))}
            </View>
          )}

          {selectedPicks.length >= 2 && (
            <TouchableOpacity
              style={[styles.calculateButton, loading && styles.calculateButtonDisabled]}
              onPress={calculateParlay}
              disabled={loading}
            >
              <Text style={styles.calculateButtonText}>
                {loading ? 'Calculating...' : 'Calculate Parlay Odds'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Parlay Result */}
        {parlayResult && (
          <View style={styles.result}>
            <Text style={styles.resultTitle}>Parlay Analysis</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Combined Odds</Text>
                <Text style={styles.resultValue}>
                  {parlayResult.combined_odds > 0 ? '+' : ''}
                  {parlayResult.combined_odds}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Win Probability</Text>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  {(parlayResult.win_probability * 100).toFixed(1)}%
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Expected Value</Text>
                <Text style={[
                  styles.resultValue,
                  { color: parlayResult.expected_value > 0 ? colors.success : colors.error }
                ]}>
                  {parlayResult.expected_value > 0 ? '+' : ''}
                  {parlayResult.expected_value?.toFixed(2)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Confidence Score</Text>
                <Text style={styles.resultValue}>
                  {(parlayResult.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            {parlayResult.recommendation && (
              <View style={styles.recommendation}>
                <Icon
                  name={parlayResult.recommendation === 'STRONG_BET' ? 'thumb-up' : 'alert'}
                  size={20}
                  color={parlayResult.recommendation === 'STRONG_BET' ? colors.success : colors.warning}
                />
                <Text style={styles.recommendationText}>
                  {parlayResult.recommendation.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Available Games */}
        <View style={styles.gamesSection}>
          <Text style={styles.sectionTitle}>Available Games</Text>

          {upcoming && upcoming.length > 0 ? (
            upcoming.map((prediction) => (
              <TouchableOpacity
                key={prediction.game_id}
                style={[
                  styles.gameCard,
                  isPicked(prediction) && styles.gameCardSelected
                ]}
                onPress={() => togglePick(prediction)}
              >
                <View style={styles.gameHeader}>
                  <Text style={styles.teams}>
                    {prediction.home_team} vs {prediction.away_team}
                  </Text>
                  {isPicked(prediction) && (
                    <Icon name="check-circle" size={20} color={colors.primary} />
                  )}
                </View>

                <View style={styles.gameDetails}>
                  <View style={styles.gameDetail}>
                    <Text style={styles.detailLabel}>Pick:</Text>
                    <Text style={styles.detailValue}>{prediction.predicted_winner}</Text>
                  </View>
                  <View style={styles.gameDetail}>
                    <Text style={styles.detailLabel}>Confidence:</Text>
                    <Text style={styles.detailValue}>
                      {((prediction.confidence || 0.5) * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="football-off" size={48} color={colors.placeholder} />
              <Text style={styles.emptyText}>No games available</Text>
            </View>
          )}
        </View>
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
  clearText: {
    color: colors.error,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  summary: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
  },
  selectedGames: {
    marginBottom: spacing.md,
  },
  selectedGame: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  selectedGameText: {
    color: colors.text,
    flex: 1,
  },
  selectedPick: {
    color: colors.primary,
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonDisabled: {
    opacity: 0.5,
  },
  calculateButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  result: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  resultTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  resultLabel: {
    color: colors.placeholder,
  },
  resultValue: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
  },
  recommendationText: {
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  gamesSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  teams: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  gameDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameDetail: {
    flexDirection: 'row',
  },
  detailLabel: {
    color: colors.placeholder,
    marginRight: spacing.xs,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.placeholder,
    marginTop: spacing.md,
  },
});
