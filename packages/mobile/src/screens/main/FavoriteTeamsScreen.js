import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

const NFL_TEAMS = [
  // AFC East
  { id: 'BUF', name: 'Buffalo Bills', division: 'AFC East' },
  { id: 'MIA', name: 'Miami Dolphins', division: 'AFC East' },
  { id: 'NE', name: 'New England Patriots', division: 'AFC East' },
  { id: 'NYJ', name: 'New York Jets', division: 'AFC East' },
  // AFC North
  { id: 'BAL', name: 'Baltimore Ravens', division: 'AFC North' },
  { id: 'CIN', name: 'Cincinnati Bengals', division: 'AFC North' },
  { id: 'CLE', name: 'Cleveland Browns', division: 'AFC North' },
  { id: 'PIT', name: 'Pittsburgh Steelers', division: 'AFC North' },
  // AFC South
  { id: 'HOU', name: 'Houston Texans', division: 'AFC South' },
  { id: 'IND', name: 'Indianapolis Colts', division: 'AFC South' },
  { id: 'JAX', name: 'Jacksonville Jaguars', division: 'AFC South' },
  { id: 'TEN', name: 'Tennessee Titans', division: 'AFC South' },
  // AFC West
  { id: 'DEN', name: 'Denver Broncos', division: 'AFC West' },
  { id: 'KC', name: 'Kansas City Chiefs', division: 'AFC West' },
  { id: 'LV', name: 'Las Vegas Raiders', division: 'AFC West' },
  { id: 'LAC', name: 'Los Angeles Chargers', division: 'AFC West' },
  // NFC East
  { id: 'DAL', name: 'Dallas Cowboys', division: 'NFC East' },
  { id: 'NYG', name: 'New York Giants', division: 'NFC East' },
  { id: 'PHI', name: 'Philadelphia Eagles', division: 'NFC East' },
  { id: 'WAS', name: 'Washington Commanders', division: 'NFC East' },
  // NFC North
  { id: 'CHI', name: 'Chicago Bears', division: 'NFC North' },
  { id: 'DET', name: 'Detroit Lions', division: 'NFC North' },
  { id: 'GB', name: 'Green Bay Packers', division: 'NFC North' },
  { id: 'MIN', name: 'Minnesota Vikings', division: 'NFC North' },
  // NFC South
  { id: 'ATL', name: 'Atlanta Falcons', division: 'NFC South' },
  { id: 'CAR', name: 'Carolina Panthers', division: 'NFC South' },
  { id: 'NO', name: 'New Orleans Saints', division: 'NFC South' },
  { id: 'TB', name: 'Tampa Bay Buccaneers', division: 'NFC South' },
  // NFC West
  { id: 'ARI', name: 'Arizona Cardinals', division: 'NFC West' },
  { id: 'LAR', name: 'Los Angeles Rams', division: 'NFC West' },
  { id: 'SF', name: 'San Francisco 49ers', division: 'NFC West' },
  { id: 'SEA', name: 'Seattle Seahawks', division: 'NFC West' },
];

export default function FavoriteTeamsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await api.get('/users/favorites');
      if (response.data.success) {
        setFavorites(response.data.favorites.map(f => f.team_id || f.teamId));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (teamId) => {
    const isFavorite = favorites.includes(teamId);

    try {
      if (isFavorite) {
        await api.delete(`/users/favorites/${teamId}`);
        setFavorites(favorites.filter(id => id !== teamId));
      } else {
        await api.post(`/users/favorites/${teamId}`);
        setFavorites([...favorites, teamId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const groupedTeams = NFL_TEAMS.reduce((acc, team) => {
    if (!acc[team.division]) {
      acc[team.division] = [];
    }
    acc[team.division].push(team);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Favorite Teams</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoCard}>
        <Icon name="information" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Select your favorite teams to get personalized predictions and updates
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {Object.entries(groupedTeams).map(([division, teams]) => (
          <View key={division} style={styles.divisionSection}>
            <Text style={styles.divisionTitle}>{division}</Text>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={styles.teamItem}
                onPress={() => toggleFavorite(team.id)}
              >
                <Text style={styles.teamName}>{team.name}</Text>
                <Icon
                  name={favorites.includes(team.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={favorites.includes(team.id) ? colors.error : colors.placeholder}
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.md,
  },
  infoText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  divisionSection: {
    marginBottom: spacing.lg,
  },
  divisionTitle: {
    ...typography.h4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  teamItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  teamName: {
    ...typography.body,
  },
});
