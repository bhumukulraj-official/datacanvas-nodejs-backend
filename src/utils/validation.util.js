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
  schemas: {}
};

// Define basic schemas first
validation.schemas.id = Joi.number().integer().positive().required();
validation.schemas.uuid = Joi.string().uuid().required();
validation.schemas.email = Joi.string().email().required();
validation.schemas.password = Joi.string().min(8).required();
validation.schemas.name = Joi.string().min(2).max(100).required();
validation.schemas.phone = Joi.string().pattern(/^\+?[0-9]{10,15}$/);
validation.schemas.url = Joi.string().uri();
validation.schemas.date = Joi.date().iso();
validation.schemas.boolean = Joi.boolean();
validation.schemas.number = Joi.number();
validation.schemas.string = Joi.string();
validation.schemas.array = Joi.array();
validation.schemas.object = Joi.object();
validation.schemas.token = Joi.string().required();

// Define pagination schema
validation.schemas.pagination = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  sort: Joi.string(),
  order: Joi.string().valid('asc', 'desc').default('asc'),
});

// Define complex schemas after the basic ones
validation.schemas.apiKey = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
  }),
  rotate: Joi.object({
    keyId: Joi.number().integer().positive().required()
  })
};

validation.schemas.auth = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  }),
  logout: Joi.object({
    refreshToken: Joi.string().required()
  }),
  refreshToken: Joi.object({
    refreshToken: Joi.string().required()
  }),
  verifyEmail: Joi.object({
    token: Joi.string().required()
  }),
  resendVerification: Joi.object({
    email: Joi.string().email().required()
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),
  requestPasswordReset: Joi.object({
    email: Joi.string().email().required()
  }),
  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  })
};

validation.schemas.user = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).max(100).required()
  }),
  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    avatar: Joi.string()
  })
};

validation.schemas.invitation = {
  create: Joi.object({
    email: Joi.string().email().required()
  }),
  accept: Joi.object({
    token: Joi.string().required()
  })
};

validation.schemas.project = {
  create: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().valid('web', 'mobile', 'design').required()
  }),
  update: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    status: Joi.string().valid('draft', 'published', 'archived')
  }),
  projectUpdate: {
    create: Joi.object({
      title: Joi.string().max(200).required(),
      content: Joi.string().required(),
      is_featured: Joi.boolean().default(false)
    }),
    update: Joi.object({
      title: Joi.string().max(200),
      content: Joi.string(),
      is_featured: Joi.boolean()
    })
  }
};

validation.schemas.profile = {
  socialLinks: Joi.object({
    github: Joi.string().uri(),
    linkedin: Joi.string().uri(),
    twitter: Joi.string().uri()
  })
};

validation.schemas.tag = {
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
};

validation.schemas.skill = {
  updateProficiency: Joi.object({
    proficiency: Joi.number().min(1).max(5).required()
  })
};

validation.schemas.invoice = {
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
};

validation.schemas.payment = {
  process: Joi.object({
    invoice_id: Joi.string().required(),
    amount: Joi.number().positive().required(),
    payment_method: Joi.string().required()
  })
};

validation.schemas.contact = {
  submit: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    subject: Joi.string().min(3).max(200).required(),
    message: Joi.string().min(10).max(5000).required(),
    recaptchaToken: Joi.string().optional()
  })
};

validation.schemas.messaging = {
  conversation: {
    create: Joi.object({
      participants: Joi.array().items(Joi.string().uuid()).min(1).required(),
      projectId: Joi.string().uuid().optional()
    }),
    updateRead: Joi.object({
      messageId: Joi.string().uuid().required()
    })
  },
  message: {
    create: Joi.object({
      content: Joi.string().required(),
      attachments: Joi.array().items(
        Joi.object({
          url: Joi.string().uri().required(),
          type: Joi.string().valid('image', 'file', 'video').required()
        })
      ).optional()
    })
  }
};

/**
 * Create a schema for search filters
 * @param {Object} filters - Object with field names and their validation schemas
 * @returns {Joi.Schema} Schema for validating search filters
 */
validation.createFilterSchema = (filters) => {
  return Joi.object({
    ...filters,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(25),
    sort: Joi.string().default('created_at'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  });
};

/**
 * Check if a string is a valid UUID
 * @param {string} str - String to validate
 * @returns {boolean} Whether the string is a valid UUID
 */
validation.isUuid = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Check if a string is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
validation.isEmail = (email) => {
  const { error } = Joi.string().email().validate(email);
  return !error;
};

/**
 * Sanitize a string for safe use in HTML
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
validation.sanitizeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Convert a string to a slug
 * @param {string} str - String to convert
 * @returns {string} Slug
 */
validation.slugify = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = validation; 