const { pool } = require('../../../config/database');
const { client: redisClient } = require('../../../config/redis');
const { client: s3Client } = require('../../../config/s3');
const logger = require('../../../utils/logger.util');

class HealthController {
  async checkHealth(req, res, next) {
    try {
      const timestamp = new Date().toISOString();
      const response = {
        status: 'healthy',
        version: process.env.API_VERSION || '1.0.0',
        timestamp,
        services: {
          database: {
            status: 'checking',
            latency: null,
            lastChecked: timestamp
          },
          cache: {
            status: 'checking',
            latency: null,
            lastChecked: timestamp
          },
          storage: {
            status: 'checking',
            latency: null,
            lastChecked: timestamp
          }
        }
      };

      // Check database health
      try {
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        response.services.database.status = 'up';
        response.services.database.latency = Date.now() - dbStart;
      } catch (error) {
        logger.error('Database health check failed', { error: error.message });
        response.services.database.status = 'down';
        response.status = 'degraded';
      }

      // Check Redis health
      try {
        const redisStart = Date.now();
        await redisClient.ping();
        response.services.cache.status = 'up';
        response.services.cache.latency = Date.now() - redisStart;
      } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        response.services.cache.status = 'down';
        response.status = 'degraded';
      }

      // Check S3/storage health
      try {
        const s3Start = Date.now();
        await s3Client.listBuckets();
        response.services.storage.status = 'up';
        response.services.storage.latency = Date.now() - s3Start;
      } catch (error) {
        logger.error('S3 health check failed', { error: error.message });
        response.services.storage.status = 'down';
        response.status = 'degraded';
      }

      // If any service is down, set appropriate status code
      const statusCode = response.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      next(error);
    }
  }
}

module.exports = new HealthController(); 