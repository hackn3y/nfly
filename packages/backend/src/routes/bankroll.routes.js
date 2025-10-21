/**
 * Bankroll Tracker Routes
 * Pro tier feature for tracking bets and managing bankroll
 */

const express = require('express');
const router = express.Router();
const bankrollController = require('../controllers/bankroll.controller');
const { protect } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscriptionCheck');

// All routes require authentication
router.use(protect);

// Bankroll overview (available to all logged-in users)
router.get('/', bankrollController.getBankroll);

// Initialize bankroll (available to all logged-in users)
router.post('/initialize', bankrollController.initializeBankroll);

// Pro tier features
router.post('/bet', requireSubscription('pro'), bankrollController.placeBet);
router.get('/bets', requireSubscription('pro'), bankrollController.getBets);
router.get('/bets/:id', requireSubscription('pro'), bankrollController.getBet);
router.put('/bets/:id/settle', requireSubscription('pro'), bankrollController.settleBet);
router.delete('/bets/:id', requireSubscription('pro'), bankrollController.cancelBet);
router.get('/history', requireSubscription('pro'), bankrollController.getBankrollHistory);
router.post('/adjust', requireSubscription('pro'), bankrollController.adjustBankroll);
router.get('/analytics', requireSubscription('pro'), bankrollController.getAnalytics);

module.exports = router;
