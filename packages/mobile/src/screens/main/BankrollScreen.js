import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, typography } from '../../theme';
import {
  fetchBankroll,
  initializeBankroll,
  fetchBets,
  adjustBankroll,
} from '../../store/slices/bankrollSlice';

export default function BankrollScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, history, bets, loading, initialized } = useSelector((state) => state.bankroll);
  const [refreshing, setRefreshing] = useState(false);
  const [showInitModal, setShowInitModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [initAmount, setInitAmount] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('deposit');

  const isProTier = user?.subscriptionTier === 'pro';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await dispatch(fetchBankroll());
    if (isProTier) {
      await dispatch(fetchBets({ limit: 10 }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleInitialize = async () => {
    const amount = parseFloat(initAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    await dispatch(initializeBankroll(amount));
    setShowInitModal(false);
    setInitAmount('');
    loadData();
  };

  const handleAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    await dispatch(adjustBankroll({ amount, type: adjustType, notes: `Manual ${adjustType}` }));
    setShowAdjustModal(false);
    setAdjustAmount('');
    loadData();
  };

  const renderProUpgradePrompt = () => (
    <View style={styles.upgradeCard}>
      <Icon name="crown" size={40} color="#FFD700" />
      <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
      <Text style={styles.upgradeText}>
        Track your bets, analyze performance, and manage your bankroll with our Pro tier!
      </Text>
      <TouchableOpacity
        style={styles.upgradeButton}
        onPress={() => navigation.navigate('Subscription')}
      >
        <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInitialization = () => (
    <View style={styles.initContainer}>
      <Icon name="wallet-plus" size={64} color={colors.primary} />
      <Text style={styles.initTitle}>Initialize Your Bankroll</Text>
      <Text style={styles.initText}>
        Set your starting bankroll to begin tracking your betting performance
      </Text>
      <TouchableOpacity
        style={styles.initButton}
        onPress={() => setShowInitModal(true)}
      >
        <Text style={styles.initButtonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    if (!stats) return null;

    const profitColor = stats.profitLoss >= 0 ? colors.success : colors.error;
    const roiColor = stats.roi >= 0 ? colors.success : colors.error;

    return (
      <View style={styles.statsContainer}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <TouchableOpacity onPress={() => setShowAdjustModal(true)}>
              <Icon name="plus-circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            ${stats.currentBalance.toFixed(2)}
          </Text>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.statSubLabel}>P/L</Text>
              <Text style={[styles.statSubValue, { color: profitColor }]}>
                {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.statSubLabel}>ROI</Text>
              <Text style={[styles.statSubValue, { color: roiColor }]}>
                {stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Performance Cards */}
        <View style={styles.performanceGrid}>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{stats.totalBets}</Text>
            <Text style={styles.performanceLabel}>Total Bets</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>${stats.totalWagered.toFixed(0)}</Text>
            <Text style={styles.performanceLabel}>Wagered</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={[styles.performanceValue, { color: colors.success }]}>
              {stats.totalWon}
            </Text>
            <Text style={styles.performanceLabel}>Won</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={[styles.performanceValue, { color: colors.error }]}>
              {stats.totalLost}
            </Text>
            <Text style={styles.performanceLabel}>Lost</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{stats.winRate.toFixed(1)}%</Text>
            <Text style={styles.performanceLabel}>Win Rate</Text>
          </View>
          <View style={styles.performanceCard}>
            <Text style={styles.performanceValue}>{stats.totalPending}</Text>
            <Text style={styles.performanceLabel}>Pending</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentBets = () => {
    if (!isProTier || !bets || bets.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bets</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BetHistory')}>
            <Text style={styles.sectionLink}>View All</Text>
          </TouchableOpacity>
        </View>

        {bets.slice(0, 5).map((bet) => (
          <TouchableOpacity
            key={bet.id}
            style={styles.betCard}
            onPress={() => navigation.navigate('BetDetail', { betId: bet.id })}
          >
            <View style={styles.betRow}>
              <View style={styles.betInfo}>
                <Text style={styles.betPick}>{bet.pick}</Text>
                <Text style={styles.betType}>{bet.bet_type.toUpperCase()}</Text>
              </View>
              <View style={styles.betRight}>
                <Text style={styles.betAmount}>${bet.amount.toFixed(2)}</Text>
                <View style={[styles.betStatus, styles[`status${bet.status}`]]}>
                  <Text style={styles.betStatusText}>{bet.status}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isProTier) {
    return (
      <ScrollView style={styles.container}>
        {renderProUpgradePrompt()}
      </ScrollView>
    );
  }

  if (!initialized || !stats || stats.currentBalance === 0) {
    return (
      <ScrollView style={styles.container}>
        {renderInitialization()}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderStats()}
      {renderRecentBets()}

      {isProTier && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PlaceBet')}
        >
          <Icon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Initialize Modal */}
      <Modal
        visible={showInitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Initialize Bankroll</Text>
            <Text style={styles.modalText}>Enter your starting bankroll amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="$0.00"
              keyboardType="numeric"
              value={initAmount}
              onChangeText={setInitAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowInitModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleInitialize}
              >
                <Text style={styles.modalButtonConfirmText}>Initialize</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Adjust Bankroll Modal */}
      <Modal
        visible={showAdjustModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Bankroll</Text>
            <View style={styles.adjustTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.adjustTypeButton,
                  adjustType === 'deposit' && styles.adjustTypeButtonActive,
                ]}
                onPress={() => setAdjustType('deposit')}
              >
                <Text style={styles.adjustTypeButtonText}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.adjustTypeButton,
                  adjustType === 'withdrawal' && styles.adjustTypeButtonActive,
                ]}
                onPress={() => setAdjustType('withdrawal')}
              >
                <Text style={styles.adjustTypeButtonText}>Withdrawal</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="$0.00"
              keyboardType="numeric"
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAdjustModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAdjust}
              >
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  upgradeCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: 16,
    alignItems: 'center',
  },
  upgradeTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  upgradeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  upgradeButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  initContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  initTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.lg,
  },
  initText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  initButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  initButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  statsContainer: {
    padding: spacing.lg,
  },
  balanceCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  balanceAmount: {
    ...typography.h1,
    color: colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statSubLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statSubValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  performanceCard: {
    width: '48%',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  performanceValue: {
    ...typography.h3,
    color: colors.text,
  },
  performanceLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  sectionLink: {
    ...typography.body,
    color: colors.primary,
  },
  betCard: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  betRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  betInfo: {
    flex: 1,
  },
  betPick: {
    ...typography.bodyBold,
    color: colors.text,
  },
  betType: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  betRight: {
    alignItems: 'flex-end',
  },
  betAmount: {
    ...typography.bodyBold,
    color: colors.text,
  },
  betStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  statuspending: {
    backgroundColor: colors.warning + '33',
  },
  statuswon: {
    backgroundColor: colors.success + '33',
  },
  statuslost: {
    backgroundColor: colors.error + '33',
  },
  statuspush: {
    backgroundColor: colors.textSecondary + '33',
  },
  betStatusText: {
    ...typography.caption,
    textTransform: 'capitalize',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: 16,
    width: '80%',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  modalInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  adjustTypeButtons: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  adjustTypeButton: {
    flex: 1,
    padding: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
  },
  adjustTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  adjustTypeButtonText: {
    ...typography.body,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonCancelText: {
    ...typography.button,
    color: colors.text,
  },
  modalButtonConfirmText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
