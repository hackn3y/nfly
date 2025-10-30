import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export function PredictionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.header, styles.skeleton]} />

      <View style={styles.teamsContainer}>
        <View style={[styles.teamBlock, styles.skeleton]} />
        <View style={styles.divider} />
        <View style={[styles.teamBlock, styles.skeleton]} />
      </View>

      <View style={[styles.detailsBlock, styles.skeleton]} />
    </View>
  );
}

export function StatsCardSkeleton() {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statsRow}>
        <View style={[styles.statBlock, styles.skeleton]} />
        <View style={[styles.statBlock, styles.skeleton]} />
        <View style={[styles.statBlock, styles.skeleton]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
  },
  skeleton: {
    backgroundColor: colors.placeholder,
    opacity: 0.3,
  },
  header: {
    height: 20,
    borderRadius: 4,
    marginBottom: spacing.md,
    width: '60%',
  },
  teamsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  teamBlock: {
    flex: 1,
    height: 80,
    borderRadius: 8,
  },
  divider: {
    width: spacing.md,
  },
  detailsBlock: {
    height: 60,
    borderRadius: 8,
  },
  statsCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    width: '30%',
    height: 80,
    borderRadius: 8,
  },
});
