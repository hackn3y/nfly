import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function PaymentHistoryScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/payments?limit=50');
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchPayments} tintColor={colors.primary} />
        }
      >
        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <PaymentCard key={payment.id || index} payment={payment} formatDate={formatDate} formatAmount={formatAmount} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="receipt-text-outline" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No Payment History</Text>
            <Text style={styles.emptySubtext}>
              Your payment transactions will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PaymentCard({ payment, formatDate, formatAmount }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
      case 'canceled':
        return colors.error;
      default:
        return colors.placeholder;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return 'check-circle';
      case 'pending':
        return 'clock-outline';
      case 'failed':
      case 'canceled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          <Icon
            name={getStatusIcon(payment.status)}
            size={20}
            color={getStatusColor(payment.status)}
          />
          <Text style={[styles.status, { color: getStatusColor(payment.status) }]}>
            {payment.status?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(payment.created)}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
          <Text style={styles.currency}>{payment.currency?.toUpperCase() || 'USD'}</Text>
        </View>

        <View style={styles.details}>
          <DetailRow label="Description" value={payment.description || 'Subscription Payment'} />
          {payment.invoice_pdf && (
            <DetailRow label="Invoice" value="Available" />
          )}
          {payment.receipt_url && (
            <DetailRow label="Receipt" value="Available" />
          )}
        </View>
      </View>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  paymentCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.border,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: spacing.xs,
  },
  date: {
    color: colors.placeholder,
    fontSize: 12,
  },
  cardBody: {
    padding: spacing.lg,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  amount: {
    ...typography.h1,
    color: colors.primary,
  },
  currency: {
    fontSize: 16,
    color: colors.placeholder,
    marginLeft: spacing.xs,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    color: colors.placeholder,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '600',
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
