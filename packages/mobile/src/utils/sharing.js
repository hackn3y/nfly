import { Share, Platform } from 'react-native';

/**
 * Share a game prediction
 * @param {Object} prediction - The prediction object
 * @param {string} prediction.home_team - Home team name
 * @param {string} prediction.away_team - Away team name
 * @param {string} prediction.predicted_winner - Predicted winner
 * @param {number} prediction.confidence - Confidence score (0-1)
 */
export const sharePrediction = async (prediction) => {
  try {
    const { home_team, away_team, predicted_winner, confidence } = prediction;
    const confidencePercent = ((confidence || 0.5) * 100).toFixed(0);

    const message = `🏈 NFL Predictor AI Pick:\n\n${home_team} vs ${away_team}\n\nPick: ${predicted_winner}\nConfidence: ${confidencePercent}%\n\nGet AI-powered NFL predictions at nflpredictor.com`;

    const result = await Share.share({
      message,
      ...(Platform.OS === 'ios' && { url: 'https://nflpredictor.com' }),
    });

    if (result.action === Share.sharedAction) {
      return { success: true, platform: result.activityType || 'unknown' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing prediction:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share a parlay
 * @param {Array} picks - Array of game picks
 * @param {Object} parlayResult - Parlay analysis result
 */
export const shareParlay = async (picks, parlayResult) => {
  try {
    const picksList = picks
      .map((pick, index) => `${index + 1}. ${pick.predicted_winner}`)
      .join('\n');

    const odds = parlayResult.combined_odds > 0
      ? `+${parlayResult.combined_odds}`
      : parlayResult.combined_odds;

    const winProb = (parlayResult.win_probability * 100).toFixed(1);

    const message = `🎯 ${picks.length}-Leg Parlay\n\n${picksList}\n\nOdds: ${odds}\nWin Probability: ${winProb}%\n\nBuilt with NFL Predictor AI\nnflpredictor.com`;

    const result = await Share.share({
      message,
      ...(Platform.OS === 'ios' && { url: 'https://nflpredictor.com' }),
    });

    if (result.action === Share.sharedAction) {
      return { success: true, platform: result.activityType || 'unknown' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing parlay:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share user stats/achievements
 * @param {Object} stats - User statistics
 */
export const shareStats = async (stats) => {
  try {
    const { totalPredictions, correctPredictions, accuracy, rank } = stats;
    const accuracyPercent = (accuracy * 100).toFixed(1);

    const message = `📊 My NFL Predictor Stats:\n\n🎯 Accuracy: ${accuracyPercent}%\n📈 ${correctPredictions}/${totalPredictions} Correct\n🏆 Rank: #${rank}\n\nJoin me at nflpredictor.com`;

    const result = await Share.share({
      message,
      ...(Platform.OS === 'ios' && { url: 'https://nflpredictor.com' }),
    });

    if (result.action === Share.sharedAction) {
      return { success: true, platform: result.activityType || 'unknown' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing stats:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share a win/correct prediction
 * @param {Object} prediction - The winning prediction
 */
export const shareWin = async (prediction) => {
  try {
    const { home_team, away_team, predicted_winner, confidence } = prediction;
    const confidencePercent = ((confidence || 0.5) * 100).toFixed(0);

    const message = `✅ Another Win!\n\n${home_team} vs ${away_team}\n\nCalled it: ${predicted_winner} ✓\nConfidence: ${confidencePercent}%\n\n🤖 Powered by NFL Predictor AI\nnflpredictor.com`;

    const result = await Share.share({
      message,
      ...(Platform.OS === 'ios' && { url: 'https://nflpredictor.com' }),
    });

    if (result.action === Share.sharedAction) {
      return { success: true, platform: result.activityType || 'unknown' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing win:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share the app with referral (if referral system is implemented)
 * @param {string} referralCode - Optional referral code
 */
export const shareApp = async (referralCode = null) => {
  try {
    const url = referralCode
      ? `https://nflpredictor.com?ref=${referralCode}`
      : 'https://nflpredictor.com';

    const message = `🏈 Check out NFL Predictor!\n\nGet AI-powered NFL game predictions with 54-55% accuracy.\n\n✓ Machine Learning Models\n✓ Gematria Analysis\n✓ Live Game Tracking\n✓ Parlay Builder\n\n${url}`;

    const result = await Share.share({
      message,
      ...(Platform.OS === 'ios' && { url }),
    });

    if (result.action === Share.sharedAction) {
      return { success: true, platform: result.activityType || 'unknown' };
    } else if (result.action === Share.dismissedAction) {
      return { success: false, dismissed: true };
    }
  } catch (error) {
    console.error('Error sharing app:', error);
    return { success: false, error: error.message };
  }
};
