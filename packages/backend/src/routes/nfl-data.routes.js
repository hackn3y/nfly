const express = require('express');
const router = express.Router();
const nflDataService = require('../services/nfl-data.service');
const { protect, restrictTo } = require('../middleware/auth');

/**
 * @route   GET /api/nfl-data/sync
 * @desc    Sync current week's NFL games
 * @access  Admin only
 */
router.get('/sync', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const result = await nflDataService.syncCurrentWeek();
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfl-data/games/current
 * @desc    Get current week's games
 * @access  Public
 */
router.get('/games/current', async (req, res, next) => {
  try {
    const seasonInfo = await nflDataService.getCurrentSeasonInfo();
    const games = await nflDataService.getUpcomingGames(
      seasonInfo.season,
      seasonInfo.week
    );

    res.json({
      success: true,
      data: {
        season: seasonInfo.season,
        week: seasonInfo.week,
        games: games
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfl-data/games/:season/:week
 * @desc    Get games for specific week
 * @access  Public
 */
router.get('/games/:season/:week', async (req, res, next) => {
  try {
    const { season, week } = req.params;
    const games = await nflDataService.getUpcomingGames(
      parseInt(season),
      parseInt(week)
    );

    res.json({
      success: true,
      data: games
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfl-data/game/:espnId
 * @desc    Get detailed game info
 * @access  Public
 */
router.get('/game/:espnId', async (req, res, next) => {
  try {
    const { espnId } = req.params;
    const gameDetails = await nflDataService.getGameDetails(espnId);

    res.json({
      success: true,
      data: gameDetails
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfl-data/teams
 * @desc    Get all NFL teams
 * @access  Public
 */
router.get('/teams', async (req, res, next) => {
  try {
    const teams = await nflDataService.getAllTeams();

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/nfl-data/team/:teamId/roster
 * @desc    Get team roster with injury info
 * @access  Public
 */
router.get('/team/:teamId/roster', async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const roster = await nflDataService.getTeamRoster(teamId);

    res.json({
      success: true,
      data: roster
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/nfl-data/historical
 * @desc    Fetch historical data for ML training
 * @access  Admin only
 */
router.post('/historical', protect, restrictTo('admin'), async (req, res, next) => {
  try {
    const { startSeason, endSeason } = req.body;

    // Start async process
    nflDataService.fetchHistoricalData(
      parseInt(startSeason || 2015),
      parseInt(endSeason || 2024)
    ).catch(error => {
      console.error('Historical data fetch error:', error);
    });

    res.json({
      success: true,
      message: 'Historical data fetch started in background',
      data: {
        startSeason,
        endSeason
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/nfl-data/cache
 * @desc    Clear NFL data cache
 * @access  Admin only
 */
router.delete('/cache', protect, restrictTo('admin'), (req, res) => {
  nflDataService.clearCache();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

module.exports = router;
