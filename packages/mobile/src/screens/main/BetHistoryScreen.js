import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchBets } from '../../store/slices/bankrollSlice';
import { colors, spacing, typography } from '../../theme';

export default function BetHistoryScreen({ navigation }) {
  const dispatch = useDispatch();
  const { bets, loading } = useSelector((state) => state.bankroll);
  const [filter, setFilter] = useState('all'); // all, pending, won, lost

  useEffect(() => {
    dispatch(fetchBets());
  }, []);

  const handleRefresh = () => {
    dispatch(fetchBets());
  };

  const getFilteredBets = () => {
    if (!bets || bets.length === 0) return [];

    switch (filter) {
      case 'pending':
        return bets.filter(bet => bet.status === 'pending');
      case 'won':
        return bets.filter(bet => bet.status === 'won');
      case 'lost':
        return bets.filter(bet => bet.status === 'lost');
      case 'all':
      default:
        return bets;
    }
  };

  const filteredBets = getFilteredBets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bet History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label="Pending"
            active={filter === 'pending'}
            onPress={() => setFilter('pending')}
          />
          <FilterChip
            label="Won"
            active={filter === 'won'}
            onPress={() => setFilter('won')}
          />
          <FilterChip
            label="Lost"
            active={filter === 'lost'}
            onPress={() => setFilter('lost')}
          />
        </ScrollView>
      </View>

      {/* Bet List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {filteredBets.length > 0 ? (
          filteredBets.map((bet) => (
            <BetCard
              key={bet.id}
              bet={bet}
              onPress={() => navigation.navigate('BetDetail', { betId: bet.id })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="ticket-outline" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No bets found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'Place your first bet to get started'
                : `No ${filter} bets to display`}
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

function BetCard({ bet, onPress }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'won':
        return colors.success;
      case 'lost':
        return colors.error;
      case 'pending':
        return colors.warning;
      default:
        return colors.placeholder;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'won':
        return 'check-circle';
      case 'lost':
        return 'close-circle';
      case 'pending':
        return 'clock-outline';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColor = getStatusColor(bet.status);

  return (
    <TouchableOpacity style={styles.betCard} onPress={onPress}>
      {/* Header */}
      <View style={styles.betCardHeader}>
        <View style={styles.betType}>
          <Icon name="football" size={16} color={colors.primary} />
          <Text style={styles.betTypeText}>{bet.betType || 'Straight Bet'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Icon name={getStatusIcon(bet.status)} size={14} color={colors.background} />
          <Text style={styles.statusText}>{bet.status?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Bet Details */}
      <View style={styles.betDetails}>
        <Text style={styles.betTitle}>
          {bet.team || `${bet.homeTeam} vs ${bet.awayTeam}`}
        </Text>
        <Text style={styles.betSubtitle}>
          {bet.selection || bet.predictionType}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.betStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Stake</Text>
          <Text style={styles.statValue}>${bet.stake?.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Odds</Text>
          <Text style={styles.statValue}>{bet.odds > 0 ? '+' : ''}{bet.odds}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Potential</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            ${bet.potentialWin?.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Date */}
      <Text style={styles.betDate}>{formatDate(bet.createdAt)}</Text>
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
  headerTitle: {
    ...typography.h2,
  },
  headerRight: {
    width: 40,
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
  betCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  betCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  betType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  betTypeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  betDetails: {
    marginBottom: spacing.md,
  },
  betTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  betSubtitle: {
    color: colors.placeholder,
    fontSize: 14,
  },
  betStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  betDate: {
    color: colors.placeholder,
    fontSize: 12,
    textAlign: 'right',
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
