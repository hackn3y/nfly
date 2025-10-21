const { Pool } = require('pg');
const mongoose = require('mongoose');
const redis = require('redis');
const logger = require('../utils/logger');

// PostgreSQL connection
let pgPool;

async function connectPostgres() {
  try {
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: process.env.PG_POOL_MAX || 20,
      min: process.env.PG_POOL_MIN || 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      // Enable prepared statements for performance
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    // Test connection
    const client = await pgPool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ PostgreSQL connected successfully');
    return pgPool;
  } catch (error) {
    logger.error('❌ PostgreSQL connection error:', error);
    throw error;
  }
}

// MongoDB connection
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
    return mongoose.connection;
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Redis connection
let redisClient;

async function connectRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return new Error('Redis reconnection limit exceeded');
          }
          return retries * 1000;
        }
      }
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('✅ Redis connected successfully'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error('❌ Redis connection error:', error);
    throw error;
  }
}

// Get connection instances
function getPostgresPool() {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  return pgPool;
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
}

module.exports = {
  connectPostgres,
  connectMongoDB,
  connectRedis,
  getPostgresPool,
  getRedisClient,
  pgPool: () => pgPool,
  redisClient: () => redisClient
};
