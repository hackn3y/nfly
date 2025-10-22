/**
 * Swagger/OpenAPI Configuration
 * API Documentation Setup
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NFL Predictor API',
      version: '1.0.0',
      description: 'AI-powered NFL game predictions API with machine learning and gematria analysis',
      contact: {
        name: 'API Support',
        email: 'support@nflpredictor.com',
      },
      license: {
        name: 'Proprietary',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:4100',
        description: 'Development server',
      },
      {
        url: 'https://api.nflpredictor.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            subscriptionTier: {
              type: 'string',
              enum: ['free', 'starter', 'premium', 'pro'],
            },
            emailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Game: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            home_team: { type: 'string' },
            away_team: { type: 'string' },
            game_time: { type: 'string', format: 'date-time' },
            week: { type: 'integer' },
            season: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['scheduled', 'in_progress', 'final', 'postponed'],
            },
            home_score: { type: 'integer' },
            away_score: { type: 'integer' },
            winner: { type: 'string' },
          },
        },
        Prediction: {
          type: 'object',
          properties: {
            game_id: { type: 'integer' },
            home_team: { type: 'string' },
            away_team: { type: 'string' },
            game_time: { type: 'string', format: 'date-time' },
            predicted_winner: { type: 'string' },
            confidence: {
              type: 'number',
              format: 'float',
              minimum: 0,
              maximum: 1,
            },
            spread_prediction: { type: 'number', format: 'float' },
            total_prediction: { type: 'number', format: 'float' },
            win_probability_home: { type: 'number', format: 'float' },
            win_probability_away: { type: 'number', format: 'float' },
            model_ensemble: {
              type: 'object',
              properties: {
                random_forest: { type: 'number' },
                xgboost: { type: 'number' },
                neural_net: { type: 'number' },
              },
            },
          },
        },
        Gematria: {
          type: 'object',
          properties: {
            game_id: { type: 'integer' },
            home_team: { type: 'string' },
            away_team: { type: 'string' },
            home_gematria_values: {
              type: 'object',
              properties: {
                english: { type: 'integer' },
                simple: { type: 'integer' },
                jewish: { type: 'integer' },
                pythagorean: { type: 'integer' },
              },
            },
            away_gematria_values: {
              type: 'object',
              properties: {
                english: { type: 'integer' },
                simple: { type: 'integer' },
                jewish: { type: 'integer' },
                pythagorean: { type: 'integer' },
              },
            },
            prediction: { type: 'string' },
            patterns: { type: 'array', items: { type: 'string' } },
          },
        },
        Parlay: {
          type: 'object',
          properties: {
            games: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  game_id: { type: 'integer' },
                  pick: { type: 'string' },
                  confidence: { type: 'number' },
                },
              },
            },
            combined_odds: { type: 'integer' },
            win_probability: { type: 'number', format: 'float' },
            expected_value: { type: 'number', format: 'float' },
            confidence: { type: 'number', format: 'float' },
            recommendation: {
              type: 'string',
              enum: ['STRONG_BET', 'MODERATE_BET', 'RISKY', 'AVOID'],
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions or subscription tier required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and account management',
      },
      {
        name: 'Predictions',
        description: 'AI-powered game predictions',
      },
      {
        name: 'Gematria',
        description: 'Numerological analysis and predictions',
      },
      {
        name: 'Users',
        description: 'User profile and preferences',
      },
      {
        name: 'Subscriptions',
        description: 'Subscription management and billing',
      },
      {
        name: 'NFL Data',
        description: 'NFL teams, schedules, and stats',
      },
      {
        name: 'Leaderboard',
        description: 'User rankings and competition',
      },
      {
        name: 'Notifications',
        description: 'Push and email notifications',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
