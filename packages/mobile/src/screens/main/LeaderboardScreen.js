import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

const TIMEFRAME_OPTIONS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'season', label: 'This Season' },
  { value: 'all', label: 'All Time' },
];

export default function LeaderboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leaderboard?timeframe=${timeframe}&limit=50`);
      setLeaderboard(response.data.leaderboard || []);
      setUserRank(response.data.userRank || null);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return colors.text;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Timeframe Selector */}
      <View style={styles.timeframeSelector}>
        {TIMEFRAME_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeframeButton,
              timeframe === option.value && styles.timeframeButtonActive,
            ]}
            onPress={() => setTimeframe(option.value)}
          >
            <Text
              style={[
                styles.timeframeText,
                timeframe === option.value && styles.timeframeTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* User's Rank Card */}
      {userRank && (
        <View style={styles.userRankCard}>
          <View style={styles.userRankHeader}>
            <Icon name="account" size={24} color={colors.primary} />
            <Text style={styles.userRankTitle}>Your Ranking</Text>
          </View>
          <View style={styles.userRankContent}>
            <View style={styles.userRankStat}>
              <Text style={styles.userRankLabel}>Rank</Text>
              <Text style={styles.userRankValue}>#{userRank.rank}</Text>
            </View>
            <View style={styles.userRankStat}>
              <Text style={styles.userRankLabel}>Accuracy</Text>
              <Text style={styles.userRankValue}>
                {(userRank.accuracy * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.userRankStat}>
              <Text style={styles.userRankLabel}>Predictions</Text>
              <Text style={styles.userRankValue}>{userRank.totalPredictions}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchLeaderboard}
            tintColor={colors.primary}
          />
        }
      >
        {loading && leaderboard.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length > 0 ? (
          <View style={styles.leaderboardList}>
            {leaderboard.map((entry, index) => (
              <LeaderboardCard
                key={entry.userId || index}
                entry={entry}
                rank={index + 1}
                isCurrentUser={entry.userId === user?.id}
                rankIcon={getRankIcon(index + 1)}
                rankColor={getRankColor(index + 1)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="trophy-outline" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No Rankings Yet</Text>
            <Text style={styles.emptySubtext}>
              Start making predictions to appear on the leaderboard!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function LeaderboardCard({ entry, rank, isCurrentUser, rankIcon, rankColor }) {
  return (
    <View style={[styles.leaderboardCard, isCurrentUser && styles.leaderboardCardCurrent]}>
      <View style={styles.rankContainer}>
        {rankIcon ? (
          <Text style={styles.rankEmoji}>{rankIcon}</Text>
        ) : (
          <Text style={[styles.rankNumber, { color: rankColor }]}>#{rank}</Text>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Icon name="account" size={20} color={colors.text} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {entry.firstName} {entry.lastName?.charAt(0)}.
            {isCurrentUser && <Text style={styles.youBadge}> (You)</Text>}
          </Text>
          <Text style={styles.userStats}>
            {entry.totalPredictions} predictions • {entry.correctPredictions} correct
          </Text>
        </View>
      </View>

      <View style={styles.accuracyContainer}>
        <Text style={styles.accuracyValue}>
          {(entry.accuracy * 100).toFixed(1)}%
        </Text>
        <Text style={styles.accuracyLabel}>Accuracy</Text>
      </View>
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
    paddingHorizontal: spacing.xs,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: colors.primary,
  },
  timeframeText: {
    fontSize: 12,
    color: colors.placeholder,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: colors.background,
  },
  userRankCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  userRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userRankTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
  },
  userRankContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userRankStat: {
    alignItems: 'center',
  },
  userRankLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  userRankValue: {
    ...typography.h2,
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  loadingText: {
    color: colors.placeholder,
    marginTop: spacing.md,
  },
  leaderboardList: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  leaderboardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  leaderboardCardCurrent: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankEmoji: {
    fontSize: 32,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  youBadge: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  userStats: {
    fontSize: 12,
    color: colors.placeholder,
  },
  accuracyContainer: {
    alignItems: 'flex-end',
    marginLeft: spacing.md,
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  accuracyLabel: {
    fontSize: 10,
    color: colors.placeholder,
    marginTop: 2,
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
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
