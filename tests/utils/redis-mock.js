// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue('OK'),
    pipeline: jest.fn().mockReturnValue({
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([])
    })
  };

  return jest.fn(() => mockRedis);
});

// Exported mock client for easier reference in tests
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushdb: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
  pipeline: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  })
};

module.exports = mockRedisClient; 