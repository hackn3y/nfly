import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fetchBet, cancelBet, clearCurrentBet } from '../../store/slices/bankrollSlice';
import { colors, spacing, typography } from '../../theme';

export default function BetDetailScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { betId } = route.params;
  const { currentBet, loading } = useSelector((state) => state.bankroll);

  useEffect(() => {
    dispatch(fetchBet(betId));

    return () => {
      dispatch(clearCurrentBet());
    };
  }, [betId]);

  const handleCancelBet = () => {
    Alert.alert(
      'Cancel Bet',
      'Are you sure you want to cancel this bet?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(cancelBet(betId)).unwrap();
              Alert.alert('Success', 'Bet cancelled successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to cancel bet');
            }
          },
        },
      ]
    );
  };

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
      case 'cancelled':
        return 'cancel';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading || !currentBet) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bet Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const bet = currentBet;
  const statusColor = getStatusColor(bet.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bet Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor }]}>
          <Icon name={getStatusIcon(bet.status)} size={48} color={colors.background} />
          <Text style={styles.statusText}>{bet.status?.toUpperCase()}</Text>
          {bet.status === 'won' && (
            <Text style={styles.statusAmount}>+${bet.potentialWin?.toFixed(2)}</Text>
          )}
          {bet.status === 'lost' && (
            <Text style={styles.statusAmount}>-${bet.stake?.toFixed(2)}</Text>
          )}
        </View>

        {/* Game Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game</Text>
          <View style={styles.gameCard}>
            <Text style={styles.gameTitle}>
              {bet.homeTeam} vs {bet.awayTeam}
            </Text>
            <Text style={styles.gameSubtitle}>{formatDate(bet.gameDate)}</Text>
          </View>
        </View>

        {/* Bet Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bet Information</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Bet Type" value={bet.betType || 'Straight Bet'} />
            <InfoRow label="Selection" value={bet.selection || bet.team} />
            <InfoRow label="Stake" value={`$${bet.stake?.toFixed(2)}`} />
            <InfoRow label="Odds" value={bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`} />
            <InfoRow
              label="Potential Win"
              value={`$${bet.potentialWin?.toFixed(2)}`}
              highlight
            />
            <InfoRow
              label="Total Payout"
              value={`$${((bet.stake || 0) + (bet.potentialWin || 0)).toFixed(2)}`}
              highlight
            />
          </View>
        </View>

        {/* Prediction Details */}
        {bet.prediction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prediction Details</Text>
            <View style={styles.infoCard}>
              <InfoRow
                label="Predicted Winner"
                value={bet.prediction.predicted_winner}
              />
              <InfoRow
                label="Confidence"
                value={`${((bet.prediction.confidence || 0) * 100).toFixed(0)}%`}
              />
              <InfoRow
                label="Spread"
                value={bet.prediction.spread_prediction}
              />
              <InfoRow
                label="Over/Under"
                value={bet.prediction.over_under_prediction}
              />
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timeline}>
            <TimelineItem
              icon="plus-circle"
              label="Bet Placed"
              value={formatDate(bet.createdAt)}
            />
            {bet.settledAt && (
              <TimelineItem
                icon="check-circle"
                label="Settled"
                value={formatDate(bet.settledAt)}
              />
            )}
            {bet.cancelledAt && (
              <TimelineItem
                icon="cancel"
                label="Cancelled"
                value={formatDate(bet.cancelledAt)}
              />
            )}
          </View>
        </View>

        {/* Actions */}
        {bet.status === 'pending' && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBet}>
            <Icon name="close-circle" size={20} color={colors.error} />
            <Text style={styles.cancelButtonText}>Cancel Bet</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

function TimelineItem({ icon, label, value }) {
  return (
    <View style={styles.timelineItem}>
      <Icon name={icon} size={20} color={colors.primary} />
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineValue}>{value}</Text>
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.placeholder,
  },
  statusBanner: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusText: {
    color: colors.background,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  statusAmount: {
    color: colors.background,
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  gameTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  gameSubtitle: {
    color: colors.placeholder,
  },
  infoCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  infoLabel: {
    color: colors.placeholder,
  },
  infoValue: {
    color: colors.text,
    fontWeight: '600',
  },
  infoValueHighlight: {
    color: colors.primary,
    fontSize: 16,
  },
  timeline: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  timelineLabel: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  timelineValue: {
    color: colors.placeholder,
    fontSize: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
