const axios = require('axios');
const { getPostgresPool } = require('../config/database');
const logger = require('../utils/logger');
const espnApiService = require('./espn-api.service');

/**
 * NFL Data Service
 * Fetches NFL data from ESPN API and other sources
 * Now uses dedicated ESPNApiService for all ESPN API interactions
 */
class NFLDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  }

  async refreshWeekData(season, week, options = {}) {
    if (!this.mlServiceUrl) {
      return null;
    }

    const payload = {
      season,
      week,
      include_weather: options.includeWeather !== false,
      include_odds: options.includeOdds !== false
    };

    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/api/data/update/all`,
        payload,
        { timeout: parseInt(process.env.DATA_REFRESH_TIMEOUT_MS, 10) || 60000 }
      );
      return response.data?.details || response.data;
    } catch (error) {
      logger.warn('ML data refresh failed: %s', error.message);
      return null;
    }
  }

  async queryGamesByWeek(season, week) {
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT
         g.*,
         ht.abbreviation AS home_abbr,
         at.abbreviation AS away_abbr
       FROM games g
       LEFT JOIN teams ht ON g.home_team_id = ht.id
       LEFT JOIN teams at ON g.away_team_id = at.id
       WHERE g.season = $1 AND g.week = $2
       ORDER BY g.game_date ASC`,
      [season, week]
    );
    return result.rows.map(row => this.formatGameRow(row));
  }

  formatGameRow(row) {
    if (!row) {
      return null;
    }

    const toTeam = (prefix) => ({
      id: row[`${prefix}_team_id`],
      name: row[`${prefix}_team`],
      abbreviation: row[`${prefix}_abbr`],
      logo: null,
      score: row[`${prefix}_score`],
      record: null
    });

    return {
      espnId: row.espn_game_id,
      name: `${row.away_team} at ${row.home_team}`,
      shortName: `${row.away_team?.split(' ').pop() || row.away_team} @ ${row.home_team?.split(' ').pop() || row.home_team}`,
      season: row.season,
      week: row.week,
      gameDate: row.game_date,
      status: row.status,
      homeTeam: toTeam('home'),
      awayTeam: toTeam('away'),
      venue: {
        name: row.venue_name,
        city: row.venue,
        state: null,
        indoor: null
      },
      odds: {
        spread: row.spread,
        overUnder: row.over_under
      },
      weather: row.weather_conditions,
      attendance: row.attendance,
      broadcast: null
    };
  }

  /**
   * Get current NFL season and week
   */
  async getCurrentSeasonInfo() {
    try {
      const games = await espnApiService.getCurrentWeekGames();
      if (games.length > 0) {
        return {
          season: games[0].season,
          week: games[0].week,
          seasonType: 2 // Regular season
        };
      }

      // Fallback to current date
      const now = new Date();
      return {
        season: now.getFullYear(),
        week: 1,
        seasonType: 2 // Regular season
      };
    } catch (error) {
      logger.error('Error fetching season info:', error);
      // Fallback to current date
      const now = new Date();
      return {
        season: now.getFullYear(),
        week: 1,
        seasonType: 2 // Regular season
      };
    }
  }

  /**
   * Get upcoming games for a specific week
   */
  async getUpcomingGames(season, week) {
    const cacheKey = `games_${season}_${week}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let games = await this.queryGamesByWeek(season, week);

      if (!games.length) {
        await this.refreshWeekData(season, week);
        games = await this.queryGamesByWeek(season, week);
      }

      if (!games.length) {
        // Fallback to direct ESPN fetch if database is empty
        games = await espnApiService.getGamesForWeek(season, week);

        if (games.length) {
          await this.saveGamesToDatabase(games);
          games = await this.queryGamesByWeek(season, week);
        }
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: games,
        timestamp: Date.now()
      });

      return games;
    } catch (error) {
      logger.error(`Error fetching games for week ${week}:`, error);
      return [];
    }
  }

  /**
   * Get game details by ID
   */
  async getGameDetails(espnGameId) {
    try {
      const pool = getPostgresPool();
      const result = await pool.query(
        `SELECT
           g.*,
           ht.abbreviation AS home_abbr,
           at.abbreviation AS away_abbr
         FROM games g
         LEFT JOIN teams ht ON g.home_team_id = ht.id
         LEFT JOIN teams at ON g.away_team_id = at.id
         WHERE g.espn_game_id = $1
         LIMIT 1`,
        [espnGameId]
      );

      if (result.rows.length) {
        const row = result.rows[0];
        return {
          espnId: espnGameId,
          season: row.season,
          week: row.week,
          status: row.status,
          gameDate: row.game_date,
          venue: {
            name: row.venue_name,
            city: row.venue
          },
          attendance: row.attendance,
          odds: {
            spread: row.spread,
            overUnder: row.over_under
          },
          weather: row.weather_conditions,
          homeTeam: {
            id: row.home_team_id,
            name: row.home_team,
            abbreviation: row.home_abbr,
            score: row.home_score
          },
          awayTeam: {
            id: row.away_team_id,
            name: row.away_team,
            abbreviation: row.away_abbr,
            score: row.away_score
          },
          updatedAt: row.updated_at
        };
      }

      // Fallback to ESPN summary if game not yet in database
      const gameDetails = await espnApiService.getGameDetails(espnGameId);
      return gameDetails;
    } catch (error) {
      logger.error(`Error fetching game details ${espnGameId}:`, error);
      return null;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId, season) {
    try {
      // Use team schedule to calculate stats
      const games = await espnApiService.getTeamSchedule(teamId, season);

      return {
        teamId: teamId,
        season: season,
        gamesPlayed: games.length,
        games: games
      };
    } catch (error) {
      logger.error(`Error fetching team stats for ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get team roster with injury info
   */
  async getTeamRoster(teamId) {
    try {
      return await espnApiService.getTeamRoster(teamId);
    } catch (error) {
      logger.error(`Error fetching roster for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get all NFL teams
   */
  async getAllTeams() {
    const cacheKey = 'all_teams';

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout * 12) { // Cache for 1 hour
        return cached.data;
      }
    }

    try {
      const teams = await espnApiService.getTeams();

      this.cache.set(cacheKey, {
        data: teams,
        timestamp: Date.now()
      });

      return teams;
    } catch (error) {
      logger.error('Error fetching all teams:', error);
      return [];
    }
  }

  /**
   * Save games to database
   */
  async saveGamesToDatabase(games) {
    const pool = getPostgresPool();
    let saved = 0;

    for (const game of games) {
      try {
        // Check if game already exists
        const existing = await pool.query(
          'SELECT id FROM games WHERE espn_game_id = $1',
          [game.espnId]
        );

        const homeTeamResult = await pool.query(
          'SELECT id FROM teams WHERE abbreviation = $1',
          [game.homeTeam.abbreviation]
        );
        const awayTeamResult = await pool.query(
          'SELECT id FROM teams WHERE abbreviation = $1',
          [game.awayTeam.abbreviation]
        );

        const homeTeamId = homeTeamResult.rows[0]?.id || null;
        const awayTeamId = awayTeamResult.rows[0]?.id || null;

        const spreadValue = typeof game.odds?.spread === 'number'
          ? game.odds.spread
          : parseFloat(String(game.odds?.spread || '').split(' ').pop());
        const overUnderValue = typeof game.odds?.overUnder === 'number'
          ? game.odds.overUnder
          : parseFloat(game.odds?.overUnder);

        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO games (
              espn_game_id, season, week, game_type,
              game_date, status,
              home_team_id, away_team_id, home_team, away_team,
              home_score, away_score,
              venue, venue_name,
              spread, over_under,
              weather_conditions
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6,
              $7, $8, $9, $10,
              $11, $12,
              $13, $14,
              $15, $16,
              $17
            )`,
            [
              game.espnId,
              game.season,
              game.week,
              'regular',
              game.gameDate,
              game.status,
              homeTeamId,
              awayTeamId,
              game.homeTeam.name,
              game.awayTeam.name,
              game.homeTeam.score || null,
              game.awayTeam.score || null,
              game.venue?.city || null,
              game.venue?.name || null,
              Number.isFinite(spreadValue) ? spreadValue : null,
              Number.isFinite(overUnderValue) ? overUnderValue : null,
              null
            ]
          );
          saved++;
        } else {
          // Update existing game
          await pool.query(
            `UPDATE games SET
              status = $1,
              home_score = $2,
              away_score = $3,
              spread = $4,
              over_under = $5,
              game_date = $6
             WHERE espn_game_id = $7`,
            [
              game.status,
              game.homeTeam.score || null,
              game.awayTeam.score || null,
              Number.isFinite(spreadValue) ? spreadValue : null,
              Number.isFinite(overUnderValue) ? overUnderValue : null,
              game.gameDate,
              game.espnId
            ]
          );
        }
      } catch (error) {
        logger.error(`Error saving game ${game.espnId}:`, error);
      }
    }

    logger.info(`Saved ${saved} new games to database`);
    return saved;
  }

  /**
   * Fetch and save current week's games
   */
  async syncCurrentWeek() {
    try {
      const seasonInfo = await this.getCurrentSeasonInfo();
      logger.info(`Syncing games for ${seasonInfo.season} week ${seasonInfo.week}`);

      const ingestResult = await this.refreshWeekData(seasonInfo.season, seasonInfo.week);
      const games = await this.queryGamesByWeek(seasonInfo.season, seasonInfo.week);

      if (!games.length) {
        // As a last resort, hit the direct API and persist
        const fallbackGames = await this.getUpcomingGames(seasonInfo.season, seasonInfo.week);
        return {
          season: seasonInfo.season,
          week: seasonInfo.week,
          gamesFound: fallbackGames.length,
          gamesInserted: ingestResult?.games?.inserted || 0,
          gamesUpdated: ingestResult?.games?.updated || 0,
          viaFallback: true
        };
      }

      return {
        season: seasonInfo.season,
        week: seasonInfo.week,
        gamesFound: games.length,
        gamesInserted: ingestResult?.games?.inserted || 0,
        gamesUpdated: ingestResult?.games?.updated || 0,
        details: ingestResult
      };
    } catch (error) {
      logger.error('Error syncing current week:', error);
      throw error;
    }
  }

  /**
   * Fetch historical data for ML training
   */
  async fetchHistoricalData(startSeason, endSeason) {
    logger.info(`Fetching historical data from ${startSeason} to ${endSeason}`);
    let totalInserted = 0;
    let totalUpdated = 0;

    for (let season = startSeason; season <= endSeason; season++) {
      for (let week = 1; week <= 18; week++) {
        try {
          const ingestResult = await this.refreshWeekData(season, week, { includeOdds: false });
          const inserted = ingestResult?.games?.inserted || 0;
          const updated = ingestResult?.games?.updated || 0;
          totalInserted += inserted;
          totalUpdated += updated;

          // Ensure games are cached locally for downstream calls
          await this.queryGamesByWeek(season, week);

          logger.info(`Season ${season} Week ${week}: ${inserted} inserted, ${updated} updated`);

          // Rate limiting - wait 2 seconds between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          logger.error(`Error fetching season ${season} week ${week}:`, error);
        }
      }
    }

    logger.info(`Historical data fetch complete. Inserted: ${totalInserted}, Updated: ${totalUpdated}`);
    return {
      inserted: totalInserted,
      updated: totalUpdated
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('NFL data cache cleared');
  }
}

module.exports = new NFLDataService();
