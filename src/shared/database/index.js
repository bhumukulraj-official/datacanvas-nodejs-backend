const { Sequelize } = require('sequelize');
const config = require('../config/database');
const Redis = require('ioredis');

// Environment
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Redis client for cache invalidation
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL);
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
    redisClient = null; // Reset on error
  });
}

// Function to publish cache invalidation events
const redisPublish = async (channel, message) => {
  if (redisClient) {
    try {
      await redisClient.publish(channel, message);
      return true;
    } catch (error) {
      console.error('Redis publish error:', error);
      return false;
    }
  }
  return false;
};

// Initialize database and setup associations
const initDatabase = async () => {
  try {
    // Import associations
    const setupAssociations = require('./associations');
    
    // Setup model associations
    setupAssociations();
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    return { success: true };
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return { success: false, error };
  }
};

module.exports = {
  sequelize,
  Sequelize,
  redisClient,
  redisPublish,
  initDatabase,
}; 