const Joi = require('joi');
const { ValidationError } = require('./error.util');

/**
 * Common validation functions
 */
const validation = {
  /**
   * Validate data against a schema
   * @param {Object} data - Data to validate
   * @param {Joi.Schema} schema - Joi schema to validate against
   * @param {Object} options - Joi validation options
   * @returns {Object} Validated data
   * @throws {ValidationError} If validation fails
   */
  validate: (data, schema, options = {}) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));
      
      throw new ValidationError('Validation failed', 'VALIDATION_ERROR', { errors: details });
    }

    return value;
  },

  /**
   * Common Joi schemas for reuse
   */
  schemas: {
    id: Joi.number().integer().positive().required(),
    uuid: Joi.string().uuid().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/),
    url: Joi.string().uri(),
    date: Joi.date().iso(),
    boolean: Joi.boolean(),
    number: Joi.number(),
    string: Joi.string(),
    array: Joi.array(),
    object: Joi.object(),
    
    // Pagination schema
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(25),
      sort: Joi.string(),
      order: Joi.string().valid('asc', 'desc').default('asc'),
    }),
    
    // API Key schema
    apiKey: {
      create: Joi.object({
        name: validation.schemas.name.required()
      }),
      rotate: Joi.object({
        keyId: validation.schemas.id.required()
      })
    },
    
    // Token schema
    token: Joi.string().required(),
    
    // Auth schemas
    auth: {
      login: Joi.object({
        email: validation.schemas.email.required(),
        password: validation.schemas.password.required()
      }),
      logout: Joi.object({
        refreshToken: validation.schemas.token.required()
      }),
      refreshToken: Joi.object({
        refreshToken: validation.schemas.token.required()
      }),
      requestPasswordReset: Joi.object({
        email: validation.schemas.email.required()
      }),
      resetPassword: Joi.object({
        token: validation.schemas.token.required(),
        newPassword: validation.schemas.password.required()
      })
    },
    
    // User schemas
    user: {
      register: Joi.object({
        email: validation.schemas.email.required(),
        password: validation.schemas.password.required(),
        name: validation.schemas.name.required()
      }),
      updateProfile: Joi.object({
        name: validation.schemas.name,
        avatar: validation.schemas.string
      })
    },
    
    // Invitation schemas
    invitation: {
      create: Joi.object({
        email: validation.schemas.email.required()
      }),
      accept: Joi.object({
        token: validation.schemas.token.required()
      })
    },
    
    // Project schemas
    project: {
      create: Joi.object({
        title: validation.schemas.string.required(),
        description: validation.schemas.string.required(),
        category: validation.schemas.string.valid('web', 'mobile', 'design').required()
      }),
      update: Joi.object({
        title: validation.schemas.string,
        description: validation.schemas.string,
        status: validation.schemas.string.valid('draft', 'published', 'archived')
      })
    },
    
    // Profile schemas
    profile: {
      socialLinks: Joi.object({
        github: validation.schemas.url,
        linkedin: validation.schemas.url,
        twitter: validation.schemas.url
      })
    },
    
    // Tag schemas
    tag: {
      create: Joi.object({
        name: Joi.string().required(),
        category: Joi.string().valid('technology', 'design', 'methodology').required(),
        is_technology: Joi.boolean()
      }),
      update: Joi.object({
        name: Joi.string(),
        category: Joi.string().valid('technology', 'design', 'methodology'),
        is_technology: Joi.boolean()
      })
    },
    
    // Skill schemas
    skill: {
      updateProficiency: Joi.object({
        proficiency: Joi.number().min(1).max(5).required()
      })
    },
    
    // Invoice schemas
    invoice: {
      create: Joi.object({
        client_id: Joi.string().required(),
        due_date: Joi.date().required(),
        items: Joi.array().items(
          Joi.object({
            description: Joi.string().required(),
            amount: Joi.number().positive().required(),
            quantity: Joi.number().positive().required()
          })
        ).min(1)
      }),
      updateStatus: Joi.object({
        status: Joi.string().valid('paid', 'pending', 'overdue').required()
      })
    },
    
    // Payment schemas
    payment: {
      process: Joi.object({
        invoice_id: Joi.string().required(),
        amount: Joi.number().positive().required(),
        payment_method: Joi.string().required()
      })
    }
  },

  /**
   * Create a schema for search filters
   * @param {Object} filters - Object with field names and their validation schemas
   * @returns {Joi.Schema} Schema for validating search filters
   */
  createFilterSchema: (filters) => {
    return Joi.object({
      ...filters,
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(25),
      sort: Joi.string().default('created_at'),
      order: Joi.string().valid('asc', 'desc').default('desc'),
    });
  },
  
  /**
   * Check if a string is a valid UUID
   * @param {string} str - String to validate
   * @returns {boolean} Whether the string is a valid UUID
   */
  isUuid: (str) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  },
  
  /**
   * Check if a string is a valid email
   * @param {string} email - Email to validate
   * @returns {boolean} Whether the email is valid
   */
  isEmail: (email) => {
    const { error } = Joi.string().email().validate(email);
    return !error;
  },
  
  /**
   * Sanitize a string for safe use in HTML
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHtml: (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  
  /**
   * Convert a string to a slug
   * @param {string} str - String to convert
   * @returns {string} Slug
   */
  slugify: (str) => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

module.exports = validation; 