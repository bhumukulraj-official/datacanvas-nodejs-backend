const httpMocks = require('node-mocks-http');

// Clear any previous mocks
jest.resetModules();

// Mock functions
const mockHttpFn = jest.fn();
const mockExistsSyncFn = jest.fn();
const mockMkdirSyncFn = jest.fn();
const mockReadFileFn = jest.fn().mockResolvedValue(JSON.stringify({ level: 'info' }));

// Mock winston
jest.doMock('winston', () => ({
  format: {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    errors: jest.fn().mockReturnThis(),
    splat: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    printf: jest.fn(formatter => formatter)
  },
  createLogger: jest.fn().mockReturnValue({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: mockHttpFn,
    debug: jest.fn(),
    stream: {
      write: jest.fn()
    }
  }),
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  },
  addColors: jest.fn()
}));

// Mock fs
jest.doMock('fs', () => ({
  existsSync: mockExistsSyncFn,
  mkdirSync: mockMkdirSyncFn,
  promises: {
    readFile: mockReadFileFn
  }
}));

// Mock path
jest.doMock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/to/logs')
}));

// Mock config
jest.doMock('../../../src/config', () => ({
  logging: {
    level: 'debug'
  }
}));

describe('Logger Utility', () => {
  let logger;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Configuration', () => {
    it('should create logs directory if it does not exist', () => {
      // Set up the mock to return false (directory doesn't exist)
      mockExistsSyncFn.mockReturnValue(false);
      
      // Reload the module to trigger the directory check
      jest.isolateModules(() => {
        logger = require('../../../src/utils/logger.util');
      });
      
      // Verify the checks were made
      expect(mockExistsSyncFn).toHaveBeenCalled();
      expect(mockMkdirSyncFn).toHaveBeenCalled();
    });

    it('should not create logs directory if it already exists', () => {
      // Set up the mock to return true (directory exists)
      mockExistsSyncFn.mockReturnValue(true);
      
      // Reload the module
      jest.isolateModules(() => {
        logger = require('../../../src/utils/logger.util');
      });
      
      // Verify only the check was made, not the directory creation
      expect(mockExistsSyncFn).toHaveBeenCalled();
      expect(mockMkdirSyncFn).not.toHaveBeenCalled();
    });
  });

  describe('Logger Methods', () => {
    beforeEach(() => {
      // Ensure logger is loaded
      jest.isolateModules(() => {
        logger = require('../../../src/utils/logger.util');
      });
    });
    
    it('should expose standard logging methods', () => {
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.http).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should provide a stream for Morgan integration', () => {
      expect(logger.stream).toBeDefined();
      expect(typeof logger.stream.write).toBe('function');
      
      // Test the stream.write method
      const message = 'Test HTTP log';
      logger.stream.write(message);
      
      // Verify http was called with the trimmed message
      expect(mockHttpFn).toHaveBeenCalledWith(message.trim());
    });
  });

  describe('Request Logger Middleware', () => {
    beforeEach(() => {
      // Ensure logger is loaded
      jest.isolateModules(() => {
        logger = require('../../../src/utils/logger.util');
      });
    });
    
    it('should set up event listener for request completion', () => {
      // Create mocks
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/test',
        ip: '127.0.0.1',
        headers: {
          'user-agent': 'Jest Test'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Mock the 'on' method to capture the finish listener
      const originalOn = res.on;
      const onMock = jest.fn();
      res.on = onMock;
      
      // Call the middleware
      logger.logRequest(req, res, next);
      
      // Verify next was called
      expect(next).toHaveBeenCalled();
      
      // Verify event listener was set up for 'finish' event
      expect(onMock).toHaveBeenCalledWith('finish', expect.any(Function));
      
      // Restore original on method
      res.on = originalOn;
    });
  });
}); 