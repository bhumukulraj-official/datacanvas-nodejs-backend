const { 
  validateVersion, 
  addVersionHeaders, 
  addDeprecationWarning,
  SUPPORTED_VERSIONS,
  DEFAULT_VERSION
} = require('../../../../src/shared/middleware/version.middleware');
const { AppError } = require('../../../../src/shared/errors');

describe('Version Middleware', () => {
  describe('validateVersion', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        params: {},
        get: jest.fn()
      };
      res = {};
      next = jest.fn();
    });

    it('should set default version if no version specified', () => {
      validateVersion(req, res, next);
      
      expect(req.apiVersion).toBe(DEFAULT_VERSION);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should accept version from URL parameter', () => {
      req.params.version = 'v1';
      validateVersion(req, res, next);
      
      expect(req.apiVersion).toBe('v1');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should accept version from Accept-Version header', () => {
      req.get.mockReturnValue('v1');
      validateVersion(req, res, next);
      
      expect(req.apiVersion).toBe('v1');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should prefer URL version over header version', () => {
      req.params.version = 'v1';
      req.get.mockReturnValue('v2'); // This would be ignored
      validateVersion(req, res, next);
      
      expect(req.apiVersion).toBe('v1');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should add "v" prefix to version if missing', () => {
      req.params.version = '1';
      validateVersion(req, res, next);
      
      expect(req.apiVersion).toBe('v1');
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should reject unsupported versions with an error', () => {
      req.params.version = 'v999';
      validateVersion(req, res, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].statusCode).toBe(400);
      expect(next.mock.calls[0][0].code).toBe('API_001');
    });
  });

  describe('addVersionHeaders', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        apiVersion: 'v1'
      };
      res = {
        setHeader: jest.fn()
      };
      next = jest.fn();
    });

    it('should add version headers to response', () => {
      addVersionHeaders(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Version', 'v1');
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Latest-Version', expect.any(String));
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should add deprecation headers if version is deprecated', () => {
      // Modify the VERSION_DEPRECATION private object for testing
      const middleware = require('../../../../src/shared/middleware/version.middleware');
      const originalVersionDeprecation = Object.getOwnPropertyDescriptor(
        middleware, 'VERSION_DEPRECATION'
      );
      
      // Mock private property for testing
      Object.defineProperty(middleware, 'VERSION_DEPRECATION', {
        value: { 'v1': '2099-01-01' },
        configurable: true
      });
      
      addVersionHeaders(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-API-Deprecation-Date', '2099-01-01');
      expect(next).toHaveBeenCalledTimes(1);
      
      // Restore original property
      if (originalVersionDeprecation) {
        Object.defineProperty(middleware, 'VERSION_DEPRECATION', originalVersionDeprecation);
      } else {
        delete middleware.VERSION_DEPRECATION;
      }
    });
  });

  describe('addDeprecationWarning', () => {
    let req, res, next, originalJson;

    beforeEach(() => {
      req = {
        apiVersion: 'v1'
      };
      originalJson = jest.fn();
      res = {
        json: originalJson
      };
      next = jest.fn();
    });

    it('should override json method to add deprecation warning', () => {
      // Modify the VERSION_DEPRECATION private object for testing
      const middleware = require('../../../../src/shared/middleware/version.middleware');
      const originalVersionDeprecation = Object.getOwnPropertyDescriptor(
        middleware, 'VERSION_DEPRECATION'
      );
      
      // Mock private property for testing
      Object.defineProperty(middleware, 'VERSION_DEPRECATION', {
        value: { 'v1': '2099-01-01' },
        configurable: true
      });
      
      addDeprecationWarning(req, res, next);
      
      // Original json method should be replaced
      expect(res.json).not.toBe(originalJson);
      
      // Call the new json method
      const responseObj = { success: true, data: { test: 'value' } };
      res.json(responseObj);
      
      // Verify warning was added
      expect(originalJson).toHaveBeenCalledWith(expect.objectContaining({
        warning: expect.objectContaining({
          message: expect.stringContaining('will be deprecated on 2099-01-01'),
          deprecationDate: '2099-01-01'
        })
      }));
      
      // Restore original property
      if (originalVersionDeprecation) {
        Object.defineProperty(middleware, 'VERSION_DEPRECATION', originalVersionDeprecation);
      } else {
        delete middleware.VERSION_DEPRECATION;
      }
    });

    it('should not add warnings to error responses', () => {
      // Modify the VERSION_DEPRECATION private object for testing
      const middleware = require('../../../../src/shared/middleware/version.middleware');
      const originalVersionDeprecation = Object.getOwnPropertyDescriptor(
        middleware, 'VERSION_DEPRECATION'
      );
      
      // Mock private property for testing
      Object.defineProperty(middleware, 'VERSION_DEPRECATION', {
        value: { 'v1': '2099-01-01' },
        configurable: true
      });
      
      addDeprecationWarning(req, res, next);
      
      // Call the new json method with an error response
      const errorObj = { 
        success: false, 
        error: { message: 'Test error' } 
      };
      res.json(errorObj);
      
      // Verify error object was not modified
      expect(originalJson).toHaveBeenCalledWith(errorObj);
      expect(originalJson).toHaveBeenCalledWith(expect.not.objectContaining({
        warning: expect.any(Object)
      }));
      
      // Restore original property
      if (originalVersionDeprecation) {
        Object.defineProperty(middleware, 'VERSION_DEPRECATION', originalVersionDeprecation);
      } else {
        delete middleware.VERSION_DEPRECATION;
      }
    });
  });
}); 