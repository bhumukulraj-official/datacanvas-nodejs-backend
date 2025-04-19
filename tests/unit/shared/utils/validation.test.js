const { validationChains, validateRequest, customValidators } = require('../../../../src/shared/utils/validation');
const { ValidationError } = require('../../../../src/shared/errors');

// Mock express-validator
jest.mock('express-validator', () => {
  const originalModule = jest.requireActual('express-validator');
  
  return {
    ...originalModule,
    body: jest.fn().mockReturnValue({
      isEmail: jest.fn().mockReturnThis(),
      isLength: jest.fn().mockReturnThis(),
      matches: jest.fn().mockReturnThis(),
      isString: jest.fn().mockReturnThis(),
      isArray: jest.fn().mockReturnThis(),
      isURL: jest.fn().mockReturnThis(),
      optional: jest.fn().mockReturnThis(),
      withMessage: jest.fn().mockReturnThis(),
      normalizeEmail: jest.fn().mockReturnThis(),
      isInt: jest.fn().mockReturnThis(),
      toInt: jest.fn().mockReturnThis(),
      custom: jest.fn().mockReturnThis()
    }),
    param: jest.fn().mockReturnValue({
      isUUID: jest.fn().mockReturnThis(),
      withMessage: jest.fn().mockReturnThis()
    }),
    query: jest.fn().mockReturnValue({
      optional: jest.fn().mockReturnThis(),
      isInt: jest.fn().mockReturnThis(),
      withMessage: jest.fn().mockReturnThis(),
      toInt: jest.fn().mockReturnThis()
    }),
    validationResult: jest.fn().mockReturnValue({
      isEmpty: jest.fn(),
      array: jest.fn().mockReturnValue([{ msg: 'Error message', param: 'field' }])
    })
  };
});

// Mock Sequelize model for custom validators
const mockModel = {
  findOne: jest.fn()
};

describe('Validation Utilities', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateRequest middleware', () => {
    test('should call next() when validation passes', () => {
      // Mock isEmpty to return true (no validation errors)
      const { validationResult } = require('express-validator');
      validationResult().isEmpty.mockReturnValueOnce(true);
      
      // Create mock Express request, response, and next
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Call the middleware
      validateRequest(req, res, next);
      
      // Verify next() was called without errors
      expect(next).toHaveBeenCalledWith();
      expect(validationResult).toHaveBeenCalledWith(req);
    });

    test('should throw ValidationError when validation fails', () => {
      // Mock isEmpty to return false (validation errors exist)
      const { validationResult } = require('express-validator');
      validationResult().isEmpty.mockReturnValueOnce(false);
      
      // Create mock Express request, response, and next
      const req = {};
      const res = {};
      const next = jest.fn();
      
      // Call the middleware and expect error
      expect(() => validateRequest(req, res, next)).toThrow(ValidationError);
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validationChains', () => {
    test('should have validation chain for ID', () => {
      const { param } = require('express-validator');
      
      // Call the chain
      validationChains.id;
      
      // Verify param was called with correct field
      expect(param).toHaveBeenCalledWith('id');
    });

    test('should have validation chain for email', () => {
      const { body } = require('express-validator');
      
      // Call the chain
      validationChains.email;
      
      // Verify body was called with correct field
      expect(body).toHaveBeenCalledWith('email');
    });

    test('should have validation chain for pagination', () => {
      const { query } = require('express-validator');
      
      // Call the chain
      validationChains.pagination;
      
      // Verify query was called with correct fields
      expect(query).toHaveBeenCalledWith('page');
      expect(query).toHaveBeenCalledWith('limit');
    });

    test('string validator should set optional flag when required is false', () => {
      const { body } = require('express-validator');
      
      // Call the chain with optional parameter
      validationChains.string('field', { required: false });
      
      // Verify body was called with correct field and optional was called
      expect(body).toHaveBeenCalledWith('field');
      expect(body().optional).toHaveBeenCalled();
    });

    test('array validator should set optional flag when required is false', () => {
      const { body } = require('express-validator');
      
      // Call the chain with optional parameter
      validationChains.array('field', { required: false });
      
      // Verify body was called with correct field and optional was called
      expect(body).toHaveBeenCalledWith('field');
      expect(body().optional).toHaveBeenCalled();
    });
  });

  describe('customValidators', () => {
    test('matches validator should check if fields match', () => {
      const { body } = require('express-validator');
      
      // Call the validator
      customValidators.matches('password', 'passwordConfirm', 'Passwords must match');
      
      // Verify body.custom was called
      expect(body).toHaveBeenCalledWith('password');
      expect(body().custom).toHaveBeenCalled();
      
      // Get the validator function
      const validatorFn = body().custom.mock.calls[0][0];
      
      // Test the validator function with matching values
      const req = { body: { password: 'secret', passwordConfirm: 'secret' } };
      expect(validatorFn('secret', { req })).toBe(true);
      
      // Test the validator function with non-matching values
      req.body.passwordConfirm = 'different';
      expect(() => validatorFn('secret', { req })).toThrow();
    });

    test('exists validator should check if record exists', async () => {
      const { body } = require('express-validator');
      
      // Call the validator
      customValidators.exists(mockModel, 'email', 'userEmail', 'User not found');
      
      // Verify body.custom was called
      expect(body).toHaveBeenCalledWith('userEmail');
      expect(body().custom).toHaveBeenCalled();
      
      // Get the validator function
      const validatorFn = body().custom.mock.calls[0][0];
      
      // Mock findOne to return a record
      mockModel.findOne.mockResolvedValueOnce({ id: 1, email: 'test@example.com' });
      
      // Test the validator function with existing value
      await expect(validatorFn('test@example.com')).resolves.toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      
      // Mock findOne to return null (record not found)
      mockModel.findOne.mockResolvedValueOnce(null);
      
      // Test the validator function with non-existing value
      await expect(validatorFn('nonexistent@example.com')).rejects.toThrow();
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
    });

    test('unique validator should check if value is unique', async () => {
      const { body } = require('express-validator');
      
      // Call the validator
      customValidators.unique(mockModel, 'email', 'userEmail', 'Email already exists');
      
      // Verify body.custom was called
      expect(body).toHaveBeenCalledWith('userEmail');
      expect(body().custom).toHaveBeenCalled();
      
      // Get the validator function
      const validatorFn = body().custom.mock.calls[0][0];
      
      // Mock findOne to return null (email is unique)
      mockModel.findOne.mockResolvedValueOnce(null);
      
      // Test the validator function with unique value
      await expect(validatorFn('unique@example.com')).resolves.toBe(true);
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: { email: 'unique@example.com' } });
      
      // Mock findOne to return a record (email already exists)
      mockModel.findOne.mockResolvedValueOnce({ id: 1, email: 'exists@example.com' });
      
      // Test the validator function with existing value
      await expect(validatorFn('exists@example.com')).rejects.toThrow();
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: { email: 'exists@example.com' } });
    });
  });
}); 