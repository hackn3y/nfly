import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function PlayerPropsScreen({ navigation, route }) {
  const { gameId } = route.params || {};

  const [props, setProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, passing, rushing, receiving

  useEffect(() => {
    fetchPlayerProps();
  }, [gameId]);

  const fetchPlayerProps = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = gameId ? `/predictions/props/${gameId}` : '/predictions/props';
      const response = await api.get(endpoint);

      setProps(response.data.data || []);
    } catch (err) {
      console.error('Error fetching player props:', err);
      setError(err.response?.data?.error || 'Failed to fetch player props');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPlayerProps();
  };

  const getFilteredProps = () => {
    let filtered = props;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(prop => prop.propType === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(prop =>
        prop.playerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prop.team?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredProps = getFilteredProps();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Player Props</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor={colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All"
            active={filterType === 'all'}
            onPress={() => setFilterType('all')}
          />
          <FilterChip
            label="Passing"
            active={filterType === 'passing'}
            onPress={() => setFilterType('passing')}
          />
          <FilterChip
            label="Rushing"
            active={filterType === 'rushing'}
            onPress={() => setFilterType('rushing')}
          />
          <FilterChip
            label="Receiving"
            active={filterType === 'receiving'}
            onPress={() => setFilterType('receiving')}
          />
        </ScrollView>
      </View>

      {/* Props List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && filteredProps.length > 0 ? (
          filteredProps.map((prop, index) => (
            <PropCard
              key={prop.id || index}
              prop={prop}
              onPress={() => navigation.navigate('PlaceBet', { prop })}
            />
          ))
        ) : !error && !loading ? (
          <View style={styles.emptyState}>
            <Icon name="account-off" size={64} color={colors.placeholder} />
            <Text style={styles.emptyText}>No Player Props Found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Check back later for available props'}
            </Text>
          </View>
        ) : null}
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

function PropCard({ prop, onPress }) {
  const getIcon = (propType) => {
    switch (propType) {
      case 'passing':
        return 'football-helmet';
      case 'rushing':
        return 'run';
      case 'receiving':
        return 'hand-front-right';
      default:
        return 'account';
    }
  };

  const getPropTypeName = (propType) => {
    switch (propType) {
      case 'passing':
        return 'Passing Yards';
      case 'rushing':
        return 'Rushing Yards';
      case 'receiving':
        return 'Receiving Yards';
      default:
        return propType;
    }
  };

  const confidence = prop.confidence || 0.5;
  const confidenceColor = confidence > 0.7 ? colors.success :
                         confidence > 0.55 ? colors.warning : colors.placeholder;

  return (
    <TouchableOpacity style={styles.propCard} onPress={onPress}>
      {/* Header */}
      <View style={styles.propHeader}>
        <View style={styles.playerInfo}>
          <Icon name={getIcon(prop.propType)} size={20} color={colors.primary} />
          <View style={styles.playerText}>
            <Text style={styles.playerName}>{prop.playerName || 'Unknown Player'}</Text>
            <Text style={styles.team}>{prop.team || 'N/A'}</Text>
          </View>
        </View>
        <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor }]}>
          <Text style={styles.confidenceText}>
            {(confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Prop Details */}
      <View style={styles.propDetails}>
        <View style={styles.propRow}>
          <Text style={styles.propLabel}>{getPropTypeName(prop.propType)}</Text>
          <Text style={styles.propValue}>{prop.line || 'N/A'}</Text>
        </View>

        <View style={styles.predictionContainer}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Predicted</Text>
            <Text style={[styles.predictionValue, { color: colors.primary }]}>
              {prop.prediction || 'N/A'}
            </Text>
          </View>

          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Recommendation</Text>
            <Text style={[
              styles.predictionValue,
              { color: prop.recommendation === 'OVER' ? colors.success : colors.error }
            ]}>
              {prop.recommendation || 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Key Factors */}
      {prop.keyFactors && prop.keyFactors.length > 0 && (
        <View style={styles.factors}>
          <Text style={styles.factorsTitle}>Key Factors:</Text>
          {prop.keyFactors.slice(0, 2).map((factor, idx) => (
            <View key={idx} style={styles.factor}>
              <Icon name="checkbox-marked-circle" size={12} color={colors.success} />
              <Text style={styles.factorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
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
  propCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerText: {
    marginLeft: spacing.md,
  },
  playerName: {
    ...typography.h3,
    marginBottom: 2,
  },
  team: {
    color: colors.placeholder,
    fontSize: 12,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  propDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  propRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  propLabel: {
    color: colors.placeholder,
  },
  propValue: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  predictionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  predictionItem: {
    alignItems: 'center',
  },
  predictionLabel: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  factors: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  factorsTitle: {
    color: colors.placeholder,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  factorText: {
    color: colors.text,
    fontSize: 11,
    marginLeft: spacing.sm,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  errorText: {
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
