const cache = require('../../../src/shared/utils/cache');
const redis = require('../../../src/shared/config/redis');

// Mock Redis for cache tests
jest.mock('../../../src/shared/config/redis', () => ({
  get: jest.fn(),
  set: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue(['key1', 'key2']),
  mget: jest.fn(),
  ttl: jest.fn().mockResolvedValue(3600),
  multi: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(['OK', 'OK'])
  })
}));

// Mock logger
jest.mock('../../../src/shared/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Cache Integration Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    test('should retrieve cached data', async () => {
      // Mock Redis get to return cached data
      const cachedData = JSON.stringify({ id: 1, name: 'Test User' });
      redis.get.mockResolvedValueOnce(cachedData);
      
      // Call cache get method
      const result = await cache.get('user:1');
      
      // Verify result
      expect(redis.get).toHaveBeenCalledWith('user:1');
      expect(result).toEqual({ id: 1, name: 'Test User' });
    });

    test('should return null for cache miss', async () => {
      // Mock Redis get to return null (cache miss)
      redis.get.mockResolvedValueOnce(null);
      
      // Call cache get method
      const result = await cache.get('user:nonexistent');
      
      // Verify result
      expect(redis.get).toHaveBeenCalledWith('user:nonexistent');
      expect(result).toBeNull();
    });

    test('should handle Redis errors', async () => {
      // Mock Redis get to throw error
      redis.get.mockRejectedValueOnce(new Error('Redis error'));
      
      // Call cache get method
      const result = await cache.get('user:1');
      
      // Verify result
      expect(redis.get).toHaveBeenCalledWith('user:1');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    test('should store data in cache with default TTL', async () => {
      // Data to cache
      const data = { id: 1, name: 'Test User' };
      
      // Call cache set method
      await cache.set('user:1', data);
      
      // Verify Redis set was called correctly
      expect(redis.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(data),
        'EX',
        3600 // Default TTL (1 hour)
      );
    });

    test('should store data with custom TTL', async () => {
      // Data to cache
      const data = { id: 1, name: 'Test User' };
      
      // Call cache set method with custom TTL
      await cache.set('user:1', data, 60); // 60 seconds
      
      // Verify Redis set was called correctly
      expect(redis.set).toHaveBeenCalledWith(
        'user:1',
        JSON.stringify(data),
        'EX',
        60
      );
    });

    test('should handle Redis errors', async () => {
      // Mock Redis set to throw error
      redis.set.mockRejectedValueOnce(new Error('Redis error'));
      
      // Data to cache
      const data = { id: 1, name: 'Test User' };
      
      // Call cache set method
      await cache.set('user:1', data);
      
      // Verify Redis set was called
      expect(redis.set).toHaveBeenCalled();
      
      // Verify error was handled (should not throw)
      // This is an implicit test - if the error wasn't handled, the test would fail
    });
  });

  describe('del', () => {
    test('should delete data from cache', async () => {
      // Call cache del method
      await cache.del('user:1');
      
      // Verify Redis del was called correctly
      expect(redis.del).toHaveBeenCalledWith('user:1');
    });

    test('should handle Redis errors', async () => {
      // Mock Redis del to throw error
      redis.del.mockRejectedValueOnce(new Error('Redis error'));
      
      // Call cache del method
      await cache.del('user:1');
      
      // Verify Redis del was called
      expect(redis.del).toHaveBeenCalled();
      
      // Verify error was handled (should not throw)
    });
  });

  describe('delByPattern', () => {
    test('should delete multiple keys matching pattern', async () => {
      // Mock Redis keys to return matching keys
      redis.keys.mockResolvedValueOnce(['users:1', 'users:2']);
      
      // Call cache delByPattern method
      await cache.delByPattern('users:*');
      
      // Verify Redis operations
      expect(redis.keys).toHaveBeenCalledWith('users:*');
      expect(redis.del).toHaveBeenCalledWith(['users:1', 'users:2']);
    });

    test('should not call del when no keys match', async () => {
      // Mock Redis keys to return empty array (no matches)
      redis.keys.mockResolvedValueOnce([]);
      
      // Call cache delByPattern method
      await cache.delByPattern('nonexistent:*');
      
      // Verify Redis operations
      expect(redis.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('cacheWrapper', () => {
    test('should return cached data on cache hit', async () => {
      // Mock original function
      const originalFn = jest.fn().mockResolvedValue({ id: 1, result: 'original' });
      
      // Mock cache hit
      const cachedResult = { id: 1, result: 'cached' };
      redis.get.mockResolvedValueOnce(JSON.stringify(cachedResult));
      
      // Create wrapped function
      const wrappedFn = cache.cacheWrapper(originalFn, 'test:function');
      
      // Call wrapped function
      const result = await wrappedFn(1, 'arg2');
      
      // Verify cache was checked
      expect(redis.get).toHaveBeenCalled();
      
      // Verify original function was not called
      expect(originalFn).not.toHaveBeenCalled();
      
      // Verify cached result was returned
      expect(result).toEqual(cachedResult);
    });

    test('should call original function on cache miss and store result', async () => {
      // Mock original function
      const originalResult = { id: 1, result: 'original' };
      const originalFn = jest.fn().mockResolvedValue(originalResult);
      
      // Mock cache miss
      redis.get.mockResolvedValueOnce(null);
      
      // Create wrapped function
      const wrappedFn = cache.cacheWrapper(originalFn, 'test:function', 120); // 2 minutes TTL
      
      // Call wrapped function
      const result = await wrappedFn(1, 'arg2');
      
      // Verify cache was checked
      expect(redis.get).toHaveBeenCalled();
      
      // Verify original function was called
      expect(originalFn).toHaveBeenCalledWith(1, 'arg2');
      
      // Verify result was cached
      expect(redis.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(originalResult),
        'EX',
        120
      );
      
      // Verify original result was returned
      expect(result).toEqual(originalResult);
    });

    test('should generate cache key based on function arguments', async () => {
      // Mock original function
      const originalFn = jest.fn().mockResolvedValue({ result: 'test' });
      
      // Mock cache miss
      redis.get.mockResolvedValueOnce(null);
      
      // Create wrapped function
      const wrappedFn = cache.cacheWrapper(originalFn, 'users:get');
      
      // Call wrapped function with specific arguments
      await wrappedFn(42, { name: 'test' });
      
      // Get the key used to check cache
      const cacheKey = redis.get.mock.calls[0][0];
      
      // Verify key includes prefix and arguments
      expect(cacheKey).toContain('users:get');
      expect(cacheKey).toContain('42');
      expect(cacheKey).toContain('test');
    });
  });

  describe('generateKey', () => {
    test('should generate key from prefix and string arguments', () => {
      const key = cache.generateKey('users', '123', 'profile');
      expect(key).toBe('users:123:profile');
    });

    test('should convert object arguments to strings', () => {
      const key = cache.generateKey('search', { query: 'test', page: 1 });
      expect(key).toContain('users');
      expect(key).toContain('query');
      expect(key).toContain('test');
      expect(key).toContain('page');
      expect(key).toContain('1');
    });
  });

  describe('clearEntityCache', () => {
    test('should clear specific entity by ID', async () => {
      // Call clearEntityCache with ID
      await cache.clearEntityCache('users', '123');
      
      // Verify cache operations
      expect(redis.del).toHaveBeenCalledWith('users:123');
      expect(redis.delByPattern).toHaveBeenCalledWith('users:list:*');
    });

    test('should clear entity list cache when no ID provided', async () => {
      // Call clearEntityCache without ID
      await cache.clearEntityCache('users');
      
      // Verify cache operations
      expect(redis.del).not.toHaveBeenCalled();
      expect(redis.delByPattern).toHaveBeenCalledWith('users:list:*');
    });
  });

  describe('mget', () => {
    test('should retrieve multiple keys at once', async () => {
      // Mock mget response
      redis.mget.mockResolvedValueOnce([
        JSON.stringify({ id: 1, name: 'User 1' }),
        JSON.stringify({ id: 2, name: 'User 2' }),
        null
      ]);
      
      // Call mget
      const result = await cache.mget(['users:1', 'users:2', 'users:3']);
      
      // Verify Redis mget was called
      expect(redis.mget).toHaveBeenCalledWith(['users:1', 'users:2', 'users:3']);
      
      // Verify results were parsed
      expect(result).toEqual([
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
        null
      ]);
    });
  });

  describe('getTTL', () => {
    test('should return TTL for a key', async () => {
      // Mock ttl response
      redis.ttl.mockResolvedValueOnce(3600);
      
      // Call getTTL
      const result = await cache.getTTL('users:1');
      
      // Verify Redis ttl was called
      expect(redis.ttl).toHaveBeenCalledWith('users:1');
      
      // Verify result
      expect(result).toBe(3600);
    });
  });
}); 