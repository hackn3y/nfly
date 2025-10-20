import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function PredictionHistoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all'); // all, correct, incorrect

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/predictions/history');
      if (response.data.success) {
        setHistory(response.data.predictions || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      // Set empty array if endpoint not fully implemented
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'correct') return item.wasCorrect === true;
    if (filter === 'incorrect') return item.wasCorrect === false;
    return true;
  });

  const calculateAccuracy = () => {
    if (history.length === 0) return 0;
    const correct = history.filter(h => h.wasCorrect).length;
    return ((correct / history.length) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Prediction History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {history.filter(h => h.wasCorrect).length}
          </Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {calculateAccuracy()}%
          </Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'correct' && styles.filterChipActive]}
          onPress={() => setFilter('correct')}
        >
          <Text style={[styles.filterText, filter === 'correct' && styles.filterTextActive]}>
            Correct
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'incorrect' && styles.filterChipActive]}
          onPress={() => setFilter('incorrect')}
        >
          <Text style={[styles.filterText, filter === 'incorrect' && styles.filterTextActive]}>
            Incorrect
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="history" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No prediction history yet' : `No ${filter} predictions`}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Your prediction history will appear here'
                : 'Try changing the filter'}
            </Text>
          </View>
        ) : (
          filteredHistory.map((item, index) => (
            <PredictionHistoryCard key={index} prediction={item} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function PredictionHistoryCard({ prediction }) {
  const isCorrect = prediction.wasCorrect;
  const statusColor = isCorrect ? colors.success : colors.error;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTeams}>
            {prediction.awayTeam} @ {prediction.homeTeam}
          </Text>
          <Text style={styles.cardDate}>{prediction.gameDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Icon
            name={isCorrect ? 'check-circle' : 'close-circle'}
            size={16}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.predictionText}>
          Predicted: <Text style={styles.predictionValue}>{prediction.predictedWinner}</Text>
        </Text>
        {prediction.actualWinner && (
          <Text style={styles.predictionText}>
            Actual: <Text style={styles.predictionValue}>{prediction.actualWinner}</Text>
          </Text>
        )}
        <Text style={styles.confidenceText}>
          Confidence: {(prediction.confidence * 100).toFixed(0)}%
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: colors.placeholder,
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 14,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h3,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    color: colors.placeholder,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardTeams: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  cardDate: {
    color: colors.placeholder,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    gap: spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    gap: spacing.xs,
  },
  predictionText: {
    color: colors.placeholder,
  },
  predictionValue: {
    color: colors.text,
    fontWeight: '600',
  },
  confidenceText: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
