/**
 * ESPN API Service
 * Fetches real NFL game data from ESPN's public API
 */

const axios = require('axios');
const logger = require('../utils/logger');

const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

class ESPNApiService {
  /**
   * Get current week's games
   */
  async getCurrentWeekGames() {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/scoreboard`);
      const { events } = response.data;

      return events.map(event => this.parseGame(event));
    } catch (error) {
      logger.error(`ESPN API error (scoreboard): ${error.message}`);
      throw new Error('Failed to fetch games from ESPN');
    }
  }

  /**
   * Get games for specific week and season
   */
  async getGamesForWeek(season, week) {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/scoreboard`, {
        params: {
          dates: season,
          seasontype: 2, // Regular season
          week: week
        }
      });

      const { events } = response.data;
      return events.map(event => this.parseGame(event));
    } catch (error) {
      logger.error(`ESPN API error (week ${week}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Get team information
   */
  async getTeams() {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/teams`);
      const { sports } = response.data;

      const teams = [];
      if (sports && sports[0] && sports[0].leagues && sports[0].leagues[0]) {
        const league = sports[0].leagues[0];
        if (league.teams) {
          league.teams.forEach(teamWrapper => {
            if (teamWrapper.team) {
              teams.push(this.parseTeam(teamWrapper.team));
            }
          });
        }
      }

      return teams;
    } catch (error) {
      logger.error(`ESPN API error (teams): ${error.message}`);
      throw error;
    }
  }

  /**
   * Get team roster with injury information
   */
  async getTeamRoster(teamId) {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/teams/${teamId}/roster`);
      const athletes = response.data.athletes || [];

      return athletes.map(athlete => ({
        id: athlete.id,
        name: athlete.fullName || athlete.displayName,
        position: athlete.position?.abbreviation,
        jerseyNumber: athlete.jersey,
        status: athlete.status?.type,
        injuries: athlete.injuries || []
      }));
    } catch (error) {
      logger.error(`ESPN API error (roster ${teamId}): ${error.message}`);
      return [];
    }
  }

  /**
   * Get detailed game information
   */
  async getGameDetails(gameId) {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/summary`, {
        params: { event: gameId }
      });

      return this.parseGameDetails(response.data);
    } catch (error) {
      logger.error(`ESPN API error (game ${gameId}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse game data from ESPN format
   */
  parseGame(event) {
    const competition = event.competitions[0];
    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

    return {
      espnId: event.id,
      name: event.name,
      shortName: event.shortName,
      season: event.season?.year,
      week: event.week?.number,
      gameDate: new Date(event.date),
      status: event.status?.type?.state, // scheduled, in, post

      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.team.displayName,
        abbreviation: homeTeam.team.abbreviation,
        logo: homeTeam.team.logo,
        score: parseInt(homeTeam.score) || 0,
        record: homeTeam.records?.[0]?.summary,
      },

      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.team.displayName,
        abbreviation: awayTeam.team.abbreviation,
        logo: awayTeam.team.logo,
        score: parseInt(awayTeam.score) || 0,
        record: awayTeam.records?.[0]?.summary,
      },

      venue: {
        name: competition.venue?.fullName,
        city: competition.venue?.address?.city,
        state: competition.venue?.address?.state,
        indoor: competition.venue?.indoor,
      },

      odds: competition.odds?.[0] ? {
        spread: competition.odds[0].details,
        overUnder: competition.odds[0].overUnder,
        provider: competition.odds[0].provider?.name
      } : null,

      weather: competition.weather ? {
        temperature: competition.weather.temperature,
        conditions: competition.weather.displayValue,
        link: competition.weather.link
      } : null,

      broadcasts: competition.broadcasts?.map(b => ({
        network: b.media?.shortName,
        name: b.names?.[0]
      })) || [],

      headlines: event.competitions[0].headlines?.map(h => ({
        description: h.description,
        shortLinkText: h.shortLinkText
      })) || []
    };
  }

  /**
   * Parse team data
   */
  parseTeam(team) {
    return {
      espnId: team.id,
      name: team.displayName,
      abbreviation: team.abbreviation,
      shortName: team.shortDisplayName,
      nickname: team.nickname,
      location: team.location,
      color: team.color,
      alternateColor: team.alternateColor,
      logo: team.logos?.[0]?.href,
      conference: team.groups?.conference,
      division: team.groups?.division,
      standingSummary: team.standingSummary,
      links: team.links?.map(l => ({
        text: l.text,
        href: l.href
      }))
    };
  }

  /**
   * Parse detailed game information
   */
  parseGameDetails(data) {
    const event = data.header?.competitions?.[0];
    const boxscore = data.boxscore;

    return {
      ...this.parseGame({ ...data.header, competitions: [event] }),

      // Team statistics
      teamStats: boxscore?.teams?.map(team => ({
        teamId: team.team.id,
        teamName: team.team.displayName,
        statistics: team.statistics?.reduce((acc, stat) => {
          acc[stat.name] = stat.displayValue;
          return acc;
        }, {})
      })),

      // Player statistics
      playerStats: boxscore?.players?.map(playerGroup => ({
        teamId: playerGroup.team.id,
        players: playerGroup.statistics?.[0]?.athletes?.map(athlete => ({
          id: athlete.athlete.id,
          name: athlete.athlete.displayName,
          position: athlete.athlete.position?.abbreviation,
          stats: athlete.stats
        }))
      })),

      // Game notes and insights
      notes: data.notes || [],

      // Predictor information if available
      predictor: data.predictor ? {
        homeTeamChance: data.predictor.homeTeam?.gameProjection,
        awayTeamChance: data.predictor.awayTeam?.gameProjection
      } : null
    };
  }

  /**
   * Get standings
   */
  async getStandings(season) {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/standings`, {
        params: { season }
      });

      return response.data;
    } catch (error) {
      logger.error(`ESPN API error (standings): ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for games by team
   */
  async getTeamSchedule(teamId, season) {
    try {
      const response = await axios.get(`${ESPN_API_BASE}/teams/${teamId}/schedule`, {
        params: { season }
      });

      const events = response.data.events || [];
      return events.map(event => this.parseGame(event));
    } catch (error) {
      logger.error(`ESPN API error (team schedule ${teamId}): ${error.message}`);
      return [];
    }
  }
}

module.exports = new ESPNApiService();
