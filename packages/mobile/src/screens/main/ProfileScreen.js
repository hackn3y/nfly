import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { logout } from '../../store/slices/authSlice';
import { fetchCurrentSubscription } from '../../store/slices/userSlice';
import { colors, spacing, typography } from '../../theme';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchCurrentSubscription());
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  };

  const subscriptionTier = user?.subscriptionTier || 'free';
  const tierColor = subscriptionTier === 'pro' ? '#FFD700' :
                   subscriptionTier === 'premium' ? colors.primary : colors.placeholder;

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="account" size={48} color={colors.text} />
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Subscription Card */}
      <View style={styles.subscriptionCard}>
        <View style={styles.subscriptionHeader}>
          <View>
            <Text style={styles.subscriptionTitle}>Current Plan</Text>
            <Text style={[styles.subscriptionTier, { color: tierColor }]}>
              {subscriptionTier.toUpperCase()}
            </Text>
          </View>
          {subscriptionTier !== 'pro' && (
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {subscriptionTier === 'free' && (
          <View style={styles.upgradePromo}>
            <Icon name="crown" size={24} color="#FFD700" />
            <Text style={styles.promoText}>
              Upgrade to Premium or Pro for advanced features!
            </Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <MenuItem
          icon="account-edit"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="heart"
          label="Favorite Teams"
          onPress={() => navigation.navigate('FavoriteTeams')}
        />
        <MenuItem
          icon="cog"
          label="Preferences"
          onPress={() => navigation.navigate('Preferences')}
        />
        <MenuItem
          icon="chart-line"
          label="My Statistics"
          onPress={() => navigation.navigate('MyStatistics')}
        />
        <MenuItem
          icon="history"
          label="Prediction History"
          onPress={() => navigation.navigate('PredictionHistory')}
        />
        <MenuItem
          icon="bell"
          label="Notifications"
          onPress={() => Alert.alert('Coming Soon', 'Notifications feature is under development')}
        />
        <MenuItem
          icon="help-circle"
          label="Help & Support"
          onPress={() => Alert.alert('Help & Support', 'For support, please email: support@nflpredictor.com\n\nOr visit our documentation at:\nhttps://docs.nflpredictor.com')}
        />
        <MenuItem
          icon="shield-check"
          label="Privacy Policy"
          onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy at:\nhttps://nflpredictor.com/privacy')}
        />
        <MenuItem
          icon="file-document"
          label="Terms of Service"
          onPress={() => Alert.alert('Terms of Service', 'View our terms of service at:\nhttps://nflpredictor.com/terms')}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Icon name="logout" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.disclaimer}>
          For entertainment purposes only. 21+ only.
        </Text>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label, onPress, badge }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon name={icon} size={24} color={colors.primary} />
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.placeholder} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
    color: colors.placeholder,
  },
  subscriptionCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  subscriptionTitle: {
    color: colors.placeholder,
    fontSize: 12,
  },
  subscriptionTier: {
    ...typography.h2,
    marginTop: spacing.xs,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  upgradePromo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.md,
  },
  promoText: {
    flex: 1,
    color: colors.text,
  },
  menu: {
    paddingHorizontal: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    color: colors.error,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appVersion: {
    color: colors.placeholder,
    marginBottom: spacing.sm,
  },
  disclaimer: {
    color: colors.placeholder,
    fontSize: 12,
  },
});
