import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { placeBet } from '../../store/slices/bankrollSlice';
import { colors, spacing, typography } from '../../theme';

export default function PlaceBetScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { prediction, gameId } = route.params || {};
  const { stats, loading } = useSelector((state) => state.bankroll);

  const [stake, setStake] = useState('');
  const [betType, setBetType] = useState('moneyline'); // moneyline, spread, over_under
  const [selection, setSelection] = useState('home');

  const calculatePotentialWin = () => {
    const stakeAmount = parseFloat(stake) || 0;

    // Simple odds calculation (would be more complex in production)
    let odds = 1.9; // Default American odds equivalent to -110

    if (betType === 'moneyline' && prediction) {
      const confidence = prediction.confidence || 0.5;
      // Higher confidence = lower payout
      odds = selection === prediction.predicted_winner ? 1.7 : 2.3;
    }

    const potentialProfit = stakeAmount * odds;
    return potentialProfit.toFixed(2);
  };

  const handlePlaceBet = async () => {
    if (!stake || parseFloat(stake) <= 0) {
      Alert.alert('Invalid Stake', 'Please enter a valid bet amount');
      return;
    }

    const stakeAmount = parseFloat(stake);

    if (stats && stakeAmount > stats.currentBalance) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds');
      return;
    }

    const betData = {
      gameId: gameId || prediction?.game_id,
      predictionId: prediction?.id,
      betType,
      selection,
      stake: stakeAmount,
      odds: parseFloat(calculatePotentialWin()) / stakeAmount,
      potentialWin: parseFloat(calculatePotentialWin()),
      homeTeam: prediction?.home_team,
      awayTeam: prediction?.away_team,
      team: selection === 'home' ? prediction?.home_team : prediction?.away_team,
      predictionType: betType,
    };

    try {
      await dispatch(placeBet(betData)).unwrap();
      Alert.alert('Success', 'Bet placed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error || 'Failed to place bet');
    }
  };

  const quickStakes = ['10', '25', '50', '100'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Bet</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Game Info */}
        {prediction && (
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>
              {prediction.home_team} vs {prediction.away_team}
            </Text>
            <Text style={styles.gameSubtitle}>
              Confidence: {((prediction.confidence || 0.5) * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        {/* Bet Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bet Type</Text>
          <View style={styles.betTypeContainer}>
            <BetTypeButton
              label="Moneyline"
              icon="currency-usd"
              active={betType === 'moneyline'}
              onPress={() => setBetType('moneyline')}
            />
            <BetTypeButton
              label="Spread"
              icon="arrow-expand-horizontal"
              active={betType === 'spread'}
              onPress={() => setBetType('spread')}
            />
            <BetTypeButton
              label="Over/Under"
              icon="sigma"
              active={betType === 'over_under'}
              onPress={() => setBetType('over_under')}
            />
          </View>
        </View>

        {/* Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Pick</Text>
          {betType === 'moneyline' || betType === 'spread' ? (
            <View style={styles.selectionContainer}>
              <SelectionButton
                label={prediction?.home_team || 'Home'}
                active={selection === 'home'}
                onPress={() => setSelection('home')}
              />
              <SelectionButton
                label={prediction?.away_team || 'Away'}
                active={selection === 'away'}
                onPress={() => setSelection('away')}
              />
            </View>
          ) : (
            <View style={styles.selectionContainer}>
              <SelectionButton
                label="Over"
                active={selection === 'over'}
                onPress={() => setSelection('over')}
              />
              <SelectionButton
                label="Under"
                active={selection === 'under'}
                onPress={() => setSelection('under')}
              />
            </View>
          )}
        </View>

        {/* Stake Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stake Amount</Text>
          <View style={styles.stakeInput}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.stakeTextInput}
              value={stake}
              onChangeText={setStake}
              placeholder="0.00"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Quick Stakes */}
          <View style={styles.quickStakes}>
            {quickStakes.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.quickStakeButton}
                onPress={() => setStake(amount)}
              >
                <Text style={styles.quickStakeText}>${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Balance */}
          {stats && (
            <Text style={styles.balanceText}>
              Available Balance: ${stats.currentBalance?.toFixed(2) || '0.00'}
            </Text>
          )}
        </View>

        {/* Bet Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stake</Text>
            <Text style={styles.summaryValue}>${stake || '0.00'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Potential Win</Text>
            <Text style={[styles.summaryValue, styles.potentialWin]}>
              ${calculatePotentialWin()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Payout</Text>
            <Text style={[styles.summaryValue, styles.totalPayout]}>
              ${(parseFloat(stake || 0) + parseFloat(calculatePotentialWin())).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Place Bet Button */}
        <TouchableOpacity
          style={[styles.placeBetButton, loading && styles.placeBetButtonDisabled]}
          onPress={handlePlaceBet}
          disabled={loading}
        >
          <Text style={styles.placeBetButtonText}>
            {loading ? 'Placing Bet...' : 'Place Bet'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function BetTypeButton({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.betTypeButton, active && styles.betTypeButtonActive]}
      onPress={onPress}
    >
      <Icon name={icon} size={24} color={active ? colors.background : colors.primary} />
      <Text style={[styles.betTypeButtonText, active && styles.betTypeButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SelectionButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.selectionButton, active && styles.selectionButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.selectionButtonText, active && styles.selectionButtonTextActive]}>
        {label}
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
  gameInfo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: 12,
  },
  gameTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  gameSubtitle: {
    color: colors.placeholder,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  betTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  betTypeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  betTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  betTypeButtonText: {
    color: colors.text,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  betTypeButtonTextActive: {
    color: colors.background,
    fontWeight: 'bold',
  },
  selectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  selectionButtonActive: {
    backgroundColor: colors.primary,
  },
  selectionButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  selectionButtonTextActive: {
    color: colors.background,
  },
  stakeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  currencySymbol: {
    ...typography.h2,
    marginRight: spacing.sm,
  },
  stakeTextInput: {
    flex: 1,
    ...typography.h2,
    color: colors.text,
    paddingVertical: spacing.lg,
  },
  quickStakes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quickStakeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  quickStakeText: {
    color: colors.primary,
    fontWeight: '600',
  },
  balanceText: {
    color: colors.placeholder,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    color: colors.placeholder,
  },
  summaryValue: {
    color: colors.text,
    fontWeight: '600',
  },
  potentialWin: {
    color: colors.success,
  },
  totalPayout: {
    color: colors.primary,
    fontSize: 18,
  },
  placeBetButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  placeBetButtonDisabled: {
    opacity: 0.5,
  },
  placeBetButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
