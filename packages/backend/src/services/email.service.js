/**
 * Email Service
 * Send transactional emails using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'NFL Predictor <noreply@nflpredictor.com>';
    this.init();
  }

  /**
   * Initialize email transporter
   */
  init() {
    // Use SMTP or a service like SendGrid, Mailgun, etc.
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // If no SMTP configured, use ethereal for testing
    if (!process.env.SMTP_USER) {
      logger.warn('No SMTP credentials configured. Emails will be logged only.');
      this.transporter = null;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(config);
      logger.info('Email service initialized');
    } catch (error) {
      logger.error(`Failed to initialize email service: ${error.message}`);
      this.transporter = null;
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
      logger.info(`[EMAIL] Body: ${text || html.substring(0, 100)}...`);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to NFL Predictor!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Welcome to NFL Predictor, ${name}!</h1>
        <p>Thank you for joining our community of smart NFL bettors.</p>

        <h2>What's Next?</h2>
        <ul>
          <li>Get 3 free predictions per day</li>
          <li>Explore our gematria analysis</li>
          <li>Check out the transparency dashboard</li>
          <li>Upgrade for unlimited predictions</li>
        </ul>

        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/predictions"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Get Your First Prediction
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Questions? Reply to this email or visit our support page.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const subject = 'Reset Your Password';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Reset Your Password</h1>
        <p>You requested to reset your password. Click the button below to continue:</p>

        <p style="margin: 30px 0;">
          <a href="${resetUrl}"
             style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>

        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour.
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send subscription confirmation email
   */
  async sendSubscriptionConfirmation(email, tier, amount) {
    const subject = `Subscription Confirmed - ${tier.toUpperCase()} Plan`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Subscription Confirmed!</h1>
        <p>Your ${tier.toUpperCase()} subscription is now active.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Subscription Details</h2>
          <p><strong>Plan:</strong> ${tier.toUpperCase()}</p>
          <p><strong>Amount:</strong> $${(amount / 100).toFixed(2)}/month</p>
          <p><strong>Status:</strong> Active</p>
        </div>

        <h2>What You Get:</h2>
        <ul>
          ${tier === 'starter' ? '<li>20 predictions per day</li><li>ML predictions</li><li>Email alerts</li>' : ''}
          ${tier === 'premium' ? '<li>Unlimited predictions</li><li>Player props</li><li>API access</li><li>Custom alerts</li>' : ''}
          ${tier === 'pro' ? '<li>Everything in Premium</li><li>Live predictions</li><li>Advanced stats</li><li>Discord community</li>' : ''}
        </ul>

        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/account"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Manage Subscription
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          You can cancel anytime from your account settings.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send payment failed email
   */
  async sendPaymentFailedEmail(email) {
    const subject = 'Payment Failed - Update Your Payment Method';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f44336;">Payment Failed</h1>
        <p>We couldn't process your subscription payment.</p>

        <p>To continue enjoying your subscription benefits, please update your payment method.</p>

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/account/billing"
             style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Update Payment Method
          </a>
        </p>

        <p style="color: #666; font-size: 14px;">
          Your subscription will be cancelled if payment isn't received within 7 days.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send weekly prediction summary
   */
  async sendWeeklySummary(email, predictions, accuracy) {
    const subject = 'Your Weekly Prediction Summary';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">This Week's Predictions</h1>
        <p>Here's how your predictions performed this week:</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Performance</h2>
          <p style="font-size: 24px; color: #4CAF50; margin: 10px 0;">
            <strong>${accuracy}%</strong> Accuracy
          </p>
          <p>${predictions.correct} correct out of ${predictions.total} predictions</p>
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/history"
             style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Detailed History
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Don't want these emails? <a href="${process.env.FRONTEND_URL}/account/settings">Update your email preferences</a>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send game alert (for custom alerts)
   */
  async sendGameAlert(email, game, prediction) {
    const subject = `Game Alert: ${game.homeTeam} vs ${game.awayTeam}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Game Starting Soon!</h1>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${game.homeTeam} vs ${game.awayTeam}</h2>
          <p><strong>Time:</strong> ${game.startTime}</p>
          <p><strong>Our Prediction:</strong> ${prediction.winner}</p>
          <p><strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(0)}%</p>
        </div>

        <p style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/game/${game.id}"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Full Prediction
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 10px; color: #999;">
          Gamble responsibly. Must be 21+ to bet.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send new predictions available email
   */
  async sendNewPredictionsEmail(email, week, season, gameCount) {
    const subject = `Week ${week} Predictions Now Available`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">New Predictions Available!</h1>
        <p>Our NFL predictions for Week ${week} of the ${season} season are ready.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 48px; margin: 10px 0; color: #4CAF50;"><strong>${gameCount}</strong></p>
          <p style="font-size: 18px; margin: 0;">Games This Week</p>
        </div>

        <p>Get ahead of the game with ML-powered predictions and gematria analysis.</p>

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/predictions"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View This Week's Predictions
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Don't want these alerts? <a href="${process.env.FRONTEND_URL}/account/settings">Update your preferences</a>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send favorite team game alert
   */
  async sendFavoriteTeamAlert(email, teamName, game, prediction) {
    const subject = `${teamName} Plays Today!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">${teamName} Game Today!</h1>
        <p>Your favorite team has a game coming up.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">${game.awayTeam} @ ${game.homeTeam}</h2>
          <p><strong>Kickoff:</strong> ${new Date(game.gameDate).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${game.venue?.name || 'TBD'}</p>
          ${prediction ? `
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;">
            <p><strong>Our Prediction:</strong> ${prediction.predictedWinner}</p>
            <p><strong>Confidence:</strong> ${(prediction.confidence * 100).toFixed(0)}%</p>
            <p><strong>Spread:</strong> ${prediction.spread}</p>
          ` : ''}
        </div>

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/game/${game.espnId}"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Full Analysis
          </a>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send high confidence prediction alert
   */
  async sendHighConfidencePrediction(email, games) {
    const subject = `🔥 High Confidence Picks Available!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">🔥 High Confidence Predictions!</h1>
        <p>We've identified ${games.length} high-confidence predictions for this week.</p>

        ${games.map(game => `
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50;">
            <h3 style="margin-top: 0;">${game.matchup}</h3>
            <p><strong>Prediction:</strong> ${game.prediction}</p>
            <p><strong>Confidence:</strong> <span style="color: #4CAF50; font-size: 18px;">${game.confidence}%</span></p>
            <p style="font-size: 12px; color: #666;">${game.keyFactor}</p>
          </div>
        `).join('')}

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/predictions"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View All Predictions
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 10px; color: #999;">
          High confidence picks are 75%+ confidence. Past performance does not guarantee future results.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send prediction accuracy milestone email
   */
  async sendAccuracyMilestone(email, name, accuracy, totalPredictions) {
    const subject = `🎯 Milestone Achieved: ${accuracy}% Accuracy!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">🎯 Congratulations, ${name}!</h1>
        <p>You've reached a new accuracy milestone!</p>

        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="font-size: 64px; margin: 0;"><strong>${accuracy}%</strong></p>
          <p style="font-size: 24px; margin: 10px 0;">Overall Accuracy</p>
          <p style="font-size: 16px; opacity: 0.9;">${totalPredictions} predictions tracked</p>
        </div>

        <p>Keep up the great work! Your prediction skills are paying off.</p>

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/statistics"
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Your Stats
          </a>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  /**
   * Send subscription cancellation confirmation
   */
  async sendSubscriptionCancelled(email, tier, endDate) {
    const subject = 'Subscription Cancelled';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Subscription Cancelled</h1>
        <p>Your ${tier.toUpperCase()} subscription has been cancelled.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Access Until:</strong> ${new Date(endDate).toLocaleDateString()}</p>
          <p>You'll continue to have ${tier.toUpperCase()} access until the end of your billing period.</p>
        </div>

        <p>We're sorry to see you go! If you change your mind, you can reactivate anytime.</p>

        <p style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/account/subscription"
             style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reactivate Subscription
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Got feedback? We'd love to hear from you: support@nflpredictor.com
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
