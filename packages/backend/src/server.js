require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectPostgres, connectMongoDB, connectRedis } = require('./config/database');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const scheduler = require('./jobs/scheduler');

const app = express();
const PORT = process.env.PORT || 4100;

// Trust proxy (required for Railway and other cloud platforms)
app.set('trust proxy', 1);

// Security middleware (relaxed CSP for admin dashboard)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for admin dashboard
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      connectSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", "http://localhost:4100", "http://localhost:5000"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
// CORS configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['https://nfly.netlify.app']; // Default to Netlify domain

// Always allow the Netlify domain
if (!allowedOrigins.includes('https://nfly.netlify.app')) {
  allowedOrigins.push('https://nfly.netlify.app');
}

// Allow localhost for development
if (process.env.NODE_ENV !== 'production') {
  const devOrigins = ['http://localhost:8100', 'http://localhost:8101', 'http://localhost:3000', 'http://localhost:19006'];
  devOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Webhook route BEFORE body parsing (needs raw body)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Serve static files (admin dashboard)
app.use(express.static('public'));

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NFL Predictor API Documentation'
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connections and server start
async function startServer() {
  try {
    // Connect to databases
    await connectPostgres();
    await connectMongoDB();
    
    // Only connect to Redis in production or if REDIS_URL is set
    if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
      await connectRedis();
    } else {
      logger.info('⚠️  Redis disabled in development (caching disabled)');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 NFL Predictor Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);

      // Start automated job scheduler
      if (process.env.ENABLE_SCHEDULER !== 'false') {
        scheduler.start();
        logger.info('✅ Job scheduler started');
      } else {
        logger.info('⚠️  Job scheduler disabled');
      }
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

startServer();

module.exports = app;
