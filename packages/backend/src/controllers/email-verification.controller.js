/**
 * Email Verification Controller
 * Handles email verification for new signups
 */

const crypto = require('crypto');
const { getPostgresPool } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * Send verification email to user
 */
exports.sendVerificationEmail = async (userId, userEmail, userName) => {
  try {
    const pool = getPostgresPool();

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await emailService.sendEmail(
      userEmail,
      'Verify Your Email - NFL Predictor',
      `
        <h2>Welcome to NFL Predictor, ${userName}!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <p>Click the link below to verify your email:</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with NFL Predictor, please ignore this email.</p>
      `
    );

    logger.info(`Verification email sent to user ${userId}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Verify email with token
 * @route GET /api/auth/verify-email/:token
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const pool = getPostgresPool();

    // Find token
    const tokenResult = await pool.query(
      `SELECT user_id, expires_at, used_at
       FROM email_verification_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return next(new AppError('Invalid verification token', 400));
    }

    const tokenData = tokenResult.rows[0];

    // Check if already used
    if (tokenData.used_at) {
      return next(new AppError('This verification link has already been used', 400));
    }

    // Check if expired
    if (new Date() > new Date(tokenData.expires_at)) {
      return next(new AppError('This verification link has expired', 400));
    }

    // Mark user as verified
    await pool.query(
      `UPDATE users SET email_verified = true WHERE id = $1`,
      [tokenData.user_id]
    );

    // Mark token as used
    await pool.query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE token = $1`,
      [token]
    );

    logger.info(`Email verified for user ${tokenData.user_id}`);

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    logger.error('Error verifying email:', error);
    next(error);
  }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const pool = getPostgresPool();

    if (!email) {
      return next(new AppError('Email is required', 400));
    }

    // Find user
    const userResult = await pool.query(
      `SELECT id, email, first_name, email_verified FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.'
      });
    }

    const user = userResult.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.json({
        success: true,
        message: 'This email is already verified.'
      });
    }

    // Delete old tokens for this user
    await pool.query(
      `DELETE FROM email_verification_tokens WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );

    // Send new verification email
    await exports.sendVerificationEmail(user.id, user.email, user.first_name);

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.'
    });
  } catch (error) {
    logger.error('Error resending verification:', error);
    next(error);
  }
};
