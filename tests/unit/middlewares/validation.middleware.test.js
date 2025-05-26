const httpMocks = require('node-mocks-http');

// Create a mock ValidationError class
class MockValidationError extends Error {
  constructor(message, code, data) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.errorCode = code || 'VALIDATION_ERROR';
    this.data = data;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      data: this.data
    };
  }
}

// Mock dependencies before importing the module
jest.mock('../../../src/utils/error.util', () => ({
  ValidationError: MockValidationError
}));

// Mock the logger
jest.mock('../../../src/utils/logger.util', () => ({
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock the validation utility
jest.mock('../../../src/utils/validation.util', () => ({
  validation: {
    validate: jest.fn(),
    schemas: {}
  }
}));

// Mock Joi
jest.mock('joi', () => {
  const mockJoiMethod = () => {
    const methods = {
      integer: () => methods,
      positive: () => methods,
      min: () => methods,
      max: () => methods,
      email: () => methods,
      required: () => methods,
      uuid: () => methods,
      pattern: () => methods,
      uri: () => methods,
      iso: () => methods,
      valid: () => methods,
      default: () => methods,
      items: () => methods
    };
    return methods;
  };

  return {
    object: jest.fn().mockImplementation(() => ({
      validate: jest.fn((data, options) => {
        if (data.shouldFail) {
          return {
            error: {
              details: [
                { path: ['email'], message: 'Email is required', type: 'any.required' }
              ]
            }
          };
        }
        
        if (data.multipleErrors) {
          return {
            error: {
              details: [
                { path: ['username'], message: 'Username must be at least 3 characters', type: 'string.min' },
                { path: ['password'], message: 'Password must be at least 8 characters', type: 'string.min' },
                { path: ['age'], message: 'Age must be at least 18', type: 'number.min' }
              ]
            }
          };
        }
        
        if (data.nestedError) {
          return {
            error: {
              details: [
                { path: ['user', 'contact', 'email'], message: 'Email must be valid', type: 'string.email' }
              ]
            }
          };
        }
        
        // Simulate validation conversions
        if (data.age && data.age === '25') {
          return {
            value: { ...data, age: 25 }
          };
        }
        
        // Return successful validation
        return { value: data };
      }),
      describe: jest.fn().mockReturnValue({})
    })),
    string: mockJoiMethod,
    number: mockJoiMethod,
    boolean: mockJoiMethod,
    array: mockJoiMethod,
    date: mockJoiMethod
  };
});

// Import dependencies after mocks are defined
const { ValidationError } = require('../../../src/utils/error.util');
const logger = require('../../../src/utils/logger.util');
const validate = require('../../../src/api/middlewares/validation.middleware');

describe('Validation Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    next = jest.fn();
    
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should pass validation and call next() with valid data', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ value: { name: 'Test User', email: 'test@example.com' } }),
      describe: jest.fn().mockReturnValue({})
    };
    req.body = {
      name: 'Test User',
      email: 'test@example.com'
    };

    // Test
    validate(schema)(req, res, next);
    
    // Verify
    expect(logger.debug).toHaveBeenCalled(); 
    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should validate data from specified location (query)', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ value: { search: 'test', page: 1 } }),
      describe: jest.fn().mockReturnValue({})
    };
    req.query = {
      search: 'test',
      page: 1
    };

    // Test
    validate(schema, 'query')(req, res, next);
    
    // Verify
    expect(logger.debug).toHaveBeenCalled();
    expect(schema.validate).toHaveBeenCalledWith(req.query, expect.any(Object));
    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should validate data from specified location (params)', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ value: { id: 123 } }),
      describe: jest.fn().mockReturnValue({})
    };
    req.params = {
      id: 123
    };

    // Test
    validate(schema, 'params')(req, res, next);
    
    // Verify
    expect(logger.debug).toHaveBeenCalled();
    expect(schema.validate).toHaveBeenCalledWith(req.params, expect.any(Object));
    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should replace original data with validated data', () => {
    // Setup
    const validatedData = { age: 25 };
    const schema = { 
      validate: jest.fn().mockReturnValue({ value: validatedData }),
      describe: jest.fn().mockReturnValue({})
    };
    req.body = {
      age: '25',  // String that will be converted to number
      extraField: 'should be removed'
    };

    // Test
    validate(schema)(req, res, next);
    
    // Verify
    expect(req.body).toBe(validatedData);  // Reference should be replaced
    expect(next).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalledWith(expect.any(Error));
  });

  it('should pass validation error to next() when validation fails', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ 
        error: {
          details: [{ path: ['email'], message: 'Email is required', type: 'any.required' }]
        }
      }),
      describe: jest.fn().mockReturnValue({})
    };
    req.body = {
      shouldFail: true,
      name: 'Test User'
      // Missing email
    };

    // Test
    validate(schema)(req, res, next);
    
    // Verify
    expect(logger.warn).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    expect(next.mock.calls[0][0].data).toEqual(
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email is required'
          })
        ])
      })
    );
  });

  it('should handle validation of multiple fields', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ 
        error: {
          details: [
            { path: ['username'], message: 'Username must be at least 3 characters', type: 'string.min' },
            { path: ['password'], message: 'Password must be at least 8 characters', type: 'string.min' },
            { path: ['age'], message: 'Age must be at least 18', type: 'number.min' }
          ]
        }
      }),
      describe: jest.fn().mockReturnValue({})
    };

    req.body = {
      multipleErrors: true,
      username: 'ab',  // Too short
      password: 'weak',  // Too short
      age: 16  // Too young
    };

    // Test
    validate(schema)(req, res, next);
    
    // Verify
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    expect(next.mock.calls[0][0].data.errors.length).toBe(3);
  });

  it('should handle nested fields validation', () => {
    // Setup
    const schema = { 
      validate: jest.fn().mockReturnValue({ 
        error: {
          details: [
            { path: ['user', 'contact', 'email'], message: 'Email must be valid', type: 'string.email' }
          ]
        }
      }),
      describe: jest.fn().mockReturnValue({})
    };

    req.body = {
      nestedError: true,
      user: {
        name: 'Test User',
        contact: {
          email: 'invalid-email'  // Invalid email
        }
      }
    };

    // Test
    validate(schema)(req, res, next);
    
    // Verify
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
    expect(next.mock.calls[0][0].data.errors[0].field).toBe('user.contact.email');
  });
}); 