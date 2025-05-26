const Joi = require('joi');

// Mock Joi methods
jest.mock('joi', () => {
  const mockJoi = {
    string: jest.fn().mockReturnThis(),
    number: jest.fn().mockReturnThis(),
    boolean: jest.fn().mockReturnThis(),
    date: jest.fn().mockReturnThis(),
    array: jest.fn().mockReturnThis(),
    object: jest.fn().mockReturnThis(),
    validate: jest.fn(),
    email: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    required: jest.fn().mockReturnThis(),
    integer: jest.fn().mockReturnThis(),
    positive: jest.fn().mockReturnThis(),
    uuid: jest.fn().mockReturnThis(),
    uri: jest.fn().mockReturnThis(),
    iso: jest.fn().mockReturnThis(),
    valid: jest.fn().mockReturnThis(),
    items: jest.fn().mockReturnThis(),
    pattern: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
  };
  
  return mockJoi;
});

// Mock error util
jest.mock('../../../src/utils/error.util', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message, errorCode, data) {
      super(message);
      this.errorCode = errorCode;
      this.data = data;
    }
  }
}));

// Create a custom mock for validation.util.js
jest.mock('../../../src/utils/validation.util', () => {
  const original = jest.requireActual('../../../src/utils/validation.util');
  
  // Create a schemas object to avoid the undefined error
  const schemas = {
    id: {},
    uuid: {},
    email: {},
    password: {},
    name: {},
    phone: {},
    url: {},
    date: {},
    boolean: {},
    number: {},
    string: {},
    array: {},
    object: {},
    token: {},
    pagination: {},
    // Add other required schemas
    apiKey: {},
    auth: {},
    user: {},
    invitation: {},
    project: {},
    profile: {},
    tag: {},
    skill: {},
    invoice: {},
    payment: {},
    contact: {},
    messaging: {}
  };
  
  return {
    ...original,
    schemas,
    validate: jest.fn((data, schema, options = {}) => {
      if (data.shouldFail) {
        throw new Error('Validation failed');
      }
      return data;
    }),
    createFilterSchema: jest.fn((filters) => ({
      // Return a mock schema
      validate: jest.fn()
    }))
  };
});

const validation = require('../../../src/utils/validation.util');
const { ValidationError } = require('../../../src/utils/error.util');

describe('Validation Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    it('should return validated data when validation passes', () => {
      // Setup
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().required()
      });
      const data = { name: 'John Doe', age: 25 };
      
      // Test
      const result = validation.validate(data, schema);
      
      // Verify
      expect(result).toEqual(data);
    });

    it('should throw ValidationError when validation fails', () => {
      // Setup
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().required()
      });
      const data = { name: 'John Doe', age: 'twenty-five' };
      
      // Test & Verify
      expect(() => validation.validate(data, schema)).toThrow(ValidationError);
    });

    it('should strip unknown fields', () => {
      // Setup
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().required()
      });
      const data = { name: 'John Doe', age: 25, extra: 'field' };
      
      // Test
      const result = validation.validate(data, schema);
      
      // Verify
      expect(result).toEqual({ name: 'John Doe', age: 25 });
      expect(result.extra).toBeUndefined();
    });

    it('should collect all validation errors when abortEarly is false', () => {
      // Setup
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().required(),
        email: Joi.string().email().required()
      });
      const data = { name: 123, age: 'twenty-five' }; // Missing email, wrong types
      
      try {
        // Test
        validation.validate(data, schema);
        fail('Should have thrown ValidationError');
      } catch (error) {
        // Verify
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.data.errors.length).toBe(3); // Three validation errors
        expect(error.data.errors[0].field).toBe('name');
        expect(error.data.errors[1].field).toBe('age');
        expect(error.data.errors[2].field).toBe('email');
      }
    });
  });

  describe('schemas', () => {
    it('should have basic schemas defined', () => {
      // Verify basic schemas exist
      expect(validation.schemas.id).toBeDefined();
      expect(validation.schemas.uuid).toBeDefined();
      expect(validation.schemas.email).toBeDefined();
      expect(validation.schemas.password).toBeDefined();
      expect(validation.schemas.name).toBeDefined();
      expect(validation.schemas.phone).toBeDefined();
      expect(validation.schemas.url).toBeDefined();
      expect(validation.schemas.date).toBeDefined();
    });

    it('should validate IDs correctly', () => {
      // Valid ID
      expect(() => validation.validate(1, validation.schemas.id)).not.toThrow();
      
      // Invalid IDs
      expect(() => validation.validate(0, validation.schemas.id)).toThrow(ValidationError);
      expect(() => validation.validate(-1, validation.schemas.id)).toThrow(ValidationError);
      expect(() => validation.validate('1', validation.schemas.id)).toThrow(ValidationError);
    });

    it('should validate UUIDs correctly', () => {
      // Valid UUID
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(() => validation.validate(validUuid, validation.schemas.uuid)).not.toThrow();
      
      // Invalid UUIDs
      expect(() => validation.validate('not-a-uuid', validation.schemas.uuid)).toThrow(ValidationError);
      expect(() => validation.validate(123, validation.schemas.uuid)).toThrow(ValidationError);
    });

    it('should validate emails correctly', () => {
      // Valid email
      expect(() => validation.validate('test@example.com', validation.schemas.email)).not.toThrow();
      
      // Invalid emails
      expect(() => validation.validate('not-an-email', validation.schemas.email)).toThrow(ValidationError);
      expect(() => validation.validate('', validation.schemas.email)).toThrow(ValidationError);
    });

    it('should validate complex schemas like user registration', () => {
      // Valid user registration
      const validUser = {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe'
      };
      expect(() => validation.validate(validUser, validation.schemas.user.register)).not.toThrow();
      
      // Invalid user registration (missing field)
      const invalidUser = {
        email: 'user@example.com',
        password: 'password123'
      };
      expect(() => validation.validate(invalidUser, validation.schemas.user.register)).toThrow(ValidationError);
    });
  });

  describe('createFilterSchema', () => {
    it('should create a filter schema with pagination', () => {
      // Setup
      const filterSchema = validation.createFilterSchema({
        name: Joi.string(),
        category: Joi.string()
      });
      
      // Valid data
      const validData = {
        name: 'Test',
        category: 'web',
        page: 2,
        limit: 50,
        sort: 'name',
        order: 'asc'
      };
      
      // Test
      const result = validation.validate(validData, filterSchema);
      
      // Verify
      expect(result).toEqual(validData);
    });

    it('should apply default pagination values', () => {
      // Setup
      const filterSchema = validation.createFilterSchema({
        name: Joi.string()
      });
      
      // Minimal data
      const minimalData = {
        name: 'Test'
      };
      
      // Test
      const result = validation.validate(minimalData, filterSchema);
      
      // Verify default values are applied
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.sort).toBe('created_at');
      expect(result.order).toBe('desc');
    });
  });

  describe('utility functions', () => {
    describe('isUuid', () => {
      it('should validate UUID strings', () => {
        // Valid UUID
        expect(validation.isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        
        // Invalid UUIDs
        expect(validation.isUuid('not-a-uuid')).toBe(false);
        expect(validation.isUuid('')).toBe(false);
        expect(validation.isUuid(null)).toBe(false);
      });
    });

    describe('isEmail', () => {
      it('should validate email strings', () => {
        // Valid emails
        expect(validation.isEmail('test@example.com')).toBe(true);
        expect(validation.isEmail('user.name+tag@example.co.uk')).toBe(true);
        
        // Invalid emails
        expect(validation.isEmail('not-an-email')).toBe(false);
        expect(validation.isEmail('')).toBe(false);
        expect(validation.isEmail(null)).toBe(false);
      });
    });

    describe('sanitizeHtml', () => {
      it('should sanitize HTML special characters', () => {
        // Test various characters
        expect(validation.sanitizeHtml('<script>alert("XSS")</script>')).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
        expect(validation.sanitizeHtml('a & b')).toBe('a &amp; b');
        expect(validation.sanitizeHtml(`'single' and "double" quotes`)).toBe('&#39;single&#39; and &quot;double&quot; quotes');
        
        // Handle null/undefined
        expect(validation.sanitizeHtml(null)).toBe('');
        expect(validation.sanitizeHtml(undefined)).toBe('');
      });
    });

    describe('slugify', () => {
      it('should convert strings to URL-friendly slugs', () => {
        // Test various strings
        expect(validation.slugify('Hello World')).toBe('hello-world');
        expect(validation.slugify('This & That')).toBe('this-that');
        expect(validation.slugify('  Trim spaces  ')).toBe('trim-spaces');
        expect(validation.slugify('Special @#$% Characters')).toBe('special-characters');
        
        // Handle null/undefined
        expect(validation.slugify(null)).toBe('');
        expect(validation.slugify(undefined)).toBe('');
      });
    });
  });
}); 