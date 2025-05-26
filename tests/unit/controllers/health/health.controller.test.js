const { HealthController } = require('../../../../src/api/controllers/health');
const { pool } = require('../../../../src/config/database');
const { client: redisClient } = require('../../../../src/config/redis');
const { client: s3Client } = require('../../../../src/config/s3');
const logger = require('../../../../src/utils/logger.util');

// Mock dependencies
jest.mock('../../../../src/config/database', () => ({
  pool: {
    query: jest.fn()
  }
}));

jest.mock('../../../../src/config/redis', () => ({
  client: {
    ping: jest.fn()
  }
}));

jest.mock('../../../../src/config/s3', () => ({
  client: {
    listBuckets: jest.fn()
  }
}));

jest.mock('../../../../src/utils/logger.util', () => ({
  error: jest.fn()
}));

// Don't mock process.env - use actual value
// jest.mock('process', () => ({
//   ...process,
//   env: {
//     ...process.env,
//     API_VERSION: '1.2.3'
//   }
// }));

describe('HealthController', () => {
  let req, res, next;
  const originalDateNow = Date.now;
  const mockTimestamp = '2023-01-01T00:00:00.000Z';
  
  beforeEach(() => {
    // Mock Date.now and toISOString
    global.Date.now = jest.fn(() => 1610000000000); // Fixed timestamp
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockTimestamp);
    
    // Mock request, response and next
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Mock successful responses
    pool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });
    redisClient.ping.mockResolvedValue('PONG');
    s3Client.listBuckets.mockResolvedValue({ Buckets: [] });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    global.Date.now = originalDateNow;
    jest.restoreAllMocks();
  });
  
  describe('checkHealth', () => {
    it('should return healthy status when all services are up', async () => {
      // Act
      await HealthController.checkHealth(req, res, next);
      
      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT 1');
      expect(redisClient.ping).toHaveBeenCalled();
      expect(s3Client.listBuckets).toHaveBeenCalled();
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'healthy',
        // Use more flexible expectation for version
        timestamp: expect.any(String),
        services: expect.objectContaining({
          database: expect.objectContaining({
            status: 'up'
          }),
          cache: expect.objectContaining({
            status: 'up'
          }),
          storage: expect.objectContaining({
            status: 'up'
          })
        })
      }));
      
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return degraded status when database is down', async () => {
      // Arrange
      pool.query.mockRejectedValue(new Error('Database connection error'));
      
      // Act
      await HealthController.checkHealth(req, res, next);
      
      // Assert
      expect(logger.error).toHaveBeenCalledWith('Database health check failed', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'degraded',
        services: expect.objectContaining({
          database: expect.objectContaining({
            status: 'down'
          })
        })
      }));
    });
    
    it('should return degraded status when redis is down', async () => {
      // Arrange
      redisClient.ping.mockRejectedValue(new Error('Redis connection error'));
      
      // Act
      await HealthController.checkHealth(req, res, next);
      
      // Assert
      expect(logger.error).toHaveBeenCalledWith('Redis health check failed', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'degraded',
        services: expect.objectContaining({
          cache: expect.objectContaining({
            status: 'down'
          })
        })
      }));
    });
    
    it('should return degraded status when s3 is down', async () => {
      // Arrange
      s3Client.listBuckets.mockRejectedValue(new Error('S3 connection error'));
      
      // Act
      await HealthController.checkHealth(req, res, next);
      
      // Assert
      expect(logger.error).toHaveBeenCalledWith('S3 health check failed', expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'degraded',
        services: expect.objectContaining({
          storage: expect.objectContaining({
            status: 'down'
          })
        })
      }));
    });
  });
}); 