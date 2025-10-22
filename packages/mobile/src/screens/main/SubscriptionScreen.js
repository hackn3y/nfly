import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function SubscriptionScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [tiers, setTiers] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTiers();
    fetchCurrentSubscription();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await api.get('/subscriptions/tiers');
      setTiers(response.data.tiers);
    } catch (error) {
      console.error('Error fetching tiers:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const response = await api.get('/subscriptions/current');
      setCurrentSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleSubscribe = async (tier) => {
    if (tier.id === 'free') {
      Alert.alert('Info', 'You are already on the free tier');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/subscriptions/checkout', { tier: tier.id });

      if (response.data.url) {
        // Open Stripe checkout in browser
        const supported = await Linking.canOpenURL(response.data.url);
        if (supported) {
          await Linking.openURL(response.data.url);
        } else {
          Alert.alert('Error', 'Could not open checkout page');
        }
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.post('/subscriptions/portal');

      if (response.data.url) {
        const supported = await Linking.canOpenURL(response.data.url);
        if (supported) {
          await Linking.openURL(response.data.url);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open subscription portal');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentTier = (tierId) => {
    return user?.subscriptionTier === tierId ||
           currentSubscription?.tier === tierId;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Current Subscription Status */}
        {currentSubscription && currentSubscription.tier !== 'free' && (
          <View style={styles.currentSubscription}>
            <View style={styles.currentHeader}>
              <Icon name="check-circle" size={24} color={colors.success} />
              <Text style={styles.currentTitle}>Active Subscription</Text>
            </View>
            <Text style={styles.currentTier}>
              {currentSubscription.tier?.toUpperCase() || 'FREE'}
            </Text>
            {currentSubscription.cancelAtPeriodEnd ? (
              <Text style={styles.cancelText}>
                Cancels on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            ) : currentSubscription.currentPeriodEnd && (
              <Text style={styles.renewText}>
                Renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            )}
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
              disabled={loading}
            >
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Subscription Tiers */}
        {tiers.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrent={isCurrentTier(tier.id)}
            isPopular={tier.id === 'premium'}
            onSubscribe={() => handleSubscribe(tier)}
            loading={loading}
          />
        ))}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Icon name="information-outline" size={20} color={colors.placeholder} />
          <Text style={styles.footerText}>
            All subscriptions are billed monthly. Cancel anytime. 21+ only.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function TierCard({ tier, isCurrent, isPopular, onSubscribe, loading }) {
  return (
    <View style={[styles.tierCard, isPopular && styles.tierCardPopular]}>
      {isPopular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>MOST POPULAR</Text>
        </View>
      )}

      <View style={styles.tierHeader}>
        <Text style={styles.tierName}>{tier.name}</Text>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>CURRENT</Text>
          </View>
        )}
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>
          ${tier.price}
        </Text>
        <Text style={styles.priceLabel}>/month</Text>
      </View>

      <View style={styles.features}>
        {tier.features?.map((feature, index) => (
          <View key={index} style={styles.feature}>
            <Icon name="check" size={18} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {!isCurrent && (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            tier.id === 'free' && styles.subscribeButtonDisabled,
            isPopular && styles.subscribeButtonPopular
          ]}
          onPress={onSubscribe}
          disabled={loading || tier.id === 'free'}
        >
          <Text style={[
            styles.subscribeButtonText,
            isPopular && styles.subscribeButtonTextPopular
          ]}>
            {tier.id === 'free' ? 'Free Forever' : loading ? 'Loading...' : 'Subscribe'}
          </Text>
        </TouchableOpacity>
      )}
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
  currentSubscription: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.success,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentTitle: {
    ...typography.h3,
    marginLeft: spacing.sm,
    color: colors.success,
  },
  currentTier: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  renewText: {
    color: colors.placeholder,
    marginBottom: spacing.md,
  },
  cancelText: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  manageButton: {
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: colors.text,
    fontWeight: '600',
  },
  tierCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierCardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  popularText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierName: {
    ...typography.h2,
  },
  currentBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.placeholder,
    marginLeft: spacing.xs,
  },
  features: {
    marginBottom: spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscribeButtonPopular: {
    backgroundColor: colors.primary,
  },
  subscribeButtonDisabled: {
    backgroundColor: colors.border,
  },
  subscribeButtonText: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  subscribeButtonTextPopular: {
    color: colors.background,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  footerText: {
    flex: 1,
    color: colors.placeholder,
    fontSize: 12,
    marginLeft: spacing.sm,
  },
});
