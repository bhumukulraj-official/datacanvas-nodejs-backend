const { Sequelize } = require('sequelize');
const config = require('../config/database');
const Redis = require('ioredis');
const logger = require('../utils/logger') || console;

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

// Redis configuration
const REDIS_RECONNECT_INITIAL_DELAY = 1000; // 1 second
const REDIS_RECONNECT_MAX_DELAY = 30000; // 30 seconds
const REDIS_MAX_RECONNECT_ATTEMPTS = 10;
const REDIS_HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Message queue for storing messages when Redis is unavailable
const messageQueue = [];
const MAX_QUEUE_SIZE = 1000;

// Redis client and connection state
let redisClient = null;
let redisConnectionAttempts = 0;
let redisReconnectTimer = null;
let redisIsConnected = false;
let redisHealthCheckInterval = null;

// Initialize Redis connection with reconnection strategy
const initRedisConnection = () => {
  if (process.env.REDIS_URL) {
    try {
      // Configure Redis client with options
      redisClient = new Redis(process.env.REDIS_URL, {
        retryStrategy: (times) => {
          // Don't retry here - we're handling reconnection manually
          return null;
        },
        enableOfflineQueue: true,
        maxRetriesPerRequest: 3
      });

      // Redis connection successful
      redisClient.on('connect', () => {
        redisIsConnected = true;
        redisConnectionAttempts = 0;
        logger.info('Redis connection established successfully');
        
        // Process any queued messages
        processMessageQueue();
        
        // Setup health check
        setupRedisHealthCheck();
      });

      // Connection ready (after connect)
      redisClient.on('ready', () => {
        logger.info('Redis client ready for commands');
      });

      // Handle connection errors
      redisClient.on('error', (err) => {
        logger.error(`Redis connection error: ${err.message}`, { 
          error: err, 
          redisUrl: process.env.REDIS_URL.replace(/redis:\/\/(.*):(.*)@/, 'redis://****:****@'), // Hide credentials
          attempts: redisConnectionAttempts
        });

        if (redisIsConnected) {
          redisIsConnected = false;
          logger.warn('Redis connection lost, will attempt to reconnect');
        }
      });

      // Handle disconnect events
      redisClient.on('end', () => {
        redisIsConnected = false;
        clearInterval(redisHealthCheckInterval);
        logger.warn('Redis connection closed');
        
        // Attempt reconnection with exponential backoff
        attemptRedisReconnection();
      });

      return redisClient;
    } catch (error) {
      logger.error('Failed to initialize Redis client', { error });
      attemptRedisReconnection();
      return null;
    }
  } else {
    logger.info('REDIS_URL not provided, Redis functionality will be disabled');
    return null;
  }
};

// Attempt reconnection with exponential backoff
const attemptRedisReconnection = () => {
  if (redisReconnectTimer) {
    clearTimeout(redisReconnectTimer);
  }
  
  if (redisConnectionAttempts >= REDIS_MAX_RECONNECT_ATTEMPTS) {
    logger.error(`Maximum Redis reconnection attempts (${REDIS_MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    return;
  }
  
  // Calculate backoff delay with exponential increase and jitter
  const delay = Math.min(
    REDIS_RECONNECT_INITIAL_DELAY * Math.pow(2, redisConnectionAttempts) + Math.random() * 1000,
    REDIS_RECONNECT_MAX_DELAY
  );
  
  redisConnectionAttempts++;
  
  logger.info(`Attempting Redis reconnection in ${Math.round(delay/1000)}s (attempt ${redisConnectionAttempts}/${REDIS_MAX_RECONNECT_ATTEMPTS})`);
  
  redisReconnectTimer = setTimeout(() => {
    logger.info('Attempting to reconnect to Redis...');
    
    // Close existing connection if it exists
    if (redisClient) {
      redisClient.disconnect();
    }
    
    // Reinitialize connection
    initRedisConnection();
  }, delay);
};

// Setup Redis health check
const setupRedisHealthCheck = () => {
  if (redisHealthCheckInterval) {
    clearInterval(redisHealthCheckInterval);
  }
  
  redisHealthCheckInterval = setInterval(async () => {
    try {
      if (redisClient && redisIsConnected) {
        const pong = await redisClient.ping();
        if (pong !== 'PONG') {
          logger.warn('Redis health check failed: Invalid response from ping');
          redisIsConnected = false;
          attemptRedisReconnection();
        }
      }
    } catch (error) {
      logger.error('Redis health check failed', { error: error.message });
      redisIsConnected = false;
      attemptRedisReconnection();
    }
  }, REDIS_HEALTH_CHECK_INTERVAL);
};

// Check if Redis is available
const isRedisAvailable = () => {
  return redisClient && redisIsConnected;
};

// Process queued messages
const processMessageQueue = async () => {
  if (!isRedisAvailable() || messageQueue.length === 0) return;
  
  logger.info(`Processing ${messageQueue.length} queued Redis messages`);
  
  while (messageQueue.length > 0 && isRedisAvailable()) {
    const { channel, message, resolve, reject, attempts } = messageQueue.shift();
    
    try {
      await redisClient.publish(channel, message);
      if (resolve) resolve(true);
    } catch (error) {
      logger.error(`Failed to process queued Redis message`, { channel, error: error.message });
      
      // If we haven't exceeded max retry attempts, requeue the message
      if (attempts < 3) {
        messageQueue.unshift({ channel, message, resolve, reject, attempts: attempts + 1 });
      } else if (reject) {
        reject(error);
      }
    }
  }
};

// Function to publish cache invalidation events with retry and queue
const redisPublish = async (channel, message, options = {}) => {
  const { priority = false, maxAttempts = 3 } = options;
  
  return new Promise((resolve, reject) => {
    if (isRedisAvailable()) {
      redisClient.publish(channel, message)
        .then(() => resolve(true))
        .catch((error) => {
          logger.error(`Redis publish error: ${error.message}`, { channel, error });
          
          // If Redis failed on direct publish, queue the message
          if (messageQueue.length < MAX_QUEUE_SIZE) {
            messageQueue[priority ? 'unshift' : 'push']({ 
              channel, 
              message, 
              resolve, 
              reject, 
              attempts: 1 
            });
          } else {
            logger.error('Redis message queue is full, dropping message', { channel });
            reject(new Error('Redis unavailable and message queue is full'));
          }
        });
    } else {
      // Redis is unavailable, queue the message for later
      if (messageQueue.length < MAX_QUEUE_SIZE) {
        messageQueue[priority ? 'unshift' : 'push']({ 
          channel, 
          message, 
          resolve, 
          reject, 
          attempts: 0 
        });
        
        logger.info(`Redis unavailable, queued message for channel: ${channel}`);
        
        // If this is the first message in the queue, try reconnecting
        if (messageQueue.length === 1 && !redisReconnectTimer && !redisIsConnected) {
          attemptRedisReconnection();
        }
      } else {
        logger.error('Redis message queue is full, dropping message', { channel });
        reject(new Error('Redis unavailable and message queue is full'));
      }
    }
  });
};

// Graceful shutdown for Redis connection
const shutdownRedis = async () => {
  if (redisHealthCheckInterval) {
    clearInterval(redisHealthCheckInterval);
  }
  
  if (redisReconnectTimer) {
    clearTimeout(redisReconnectTimer);
  }
  
  if (redisClient && redisIsConnected) {
    logger.info('Gracefully disconnecting from Redis');
    return redisClient.quit();
  }
  
  return Promise.resolve();
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
    logger.info('Database connection has been established successfully.');
    
    // Initialize Redis
    initRedisConnection();
    
    return { success: true };
  } catch (error) {
    logger.error('Unable to connect to the database', { error: error.message, stack: error.stack });
    return { success: false, error };
  }
};

// Initialize Redis on module load if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initRedisConnection();
}

module.exports = {
  sequelize,
  Sequelize,
  redisClient,
  redisPublish,
  initDatabase,
  isRedisAvailable,
  shutdownRedis
}; 