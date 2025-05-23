require('dotenv').config();

// CORS Configuration
const corsOptions = {
  origin: parseOrigins(process.env.ALLOWED_ORIGINS || '*'),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours in seconds
};

// Helmet Configuration
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 15552000, // 180 days
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
  noSniff: true,
};

// Rate limiting configuration
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: 'Too many requests, please try again later.',
  },
};

// JWT Configuration
const jwtConfig = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m', // 15 minutes
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d', // 7 days
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-key-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key-change-in-production',
  issuer: process.env.JWT_ISSUER || 'portfolio-app',
  audience: process.env.JWT_AUDIENCE || 'portfolio-app-clients',
};

// Cookie Settings
const cookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  domain: process.env.COOKIE_DOMAIN || undefined,
  path: '/',
};

// Password policy
const passwordPolicy = {
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
  requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== 'false',
};

// Function to parse CORS origins from environment variable
function parseOrigins(originsEnv) {
  if (originsEnv === '*') {
    return '*';
  }
  
  return originsEnv.split(',').map(origin => origin.trim());
}

module.exports = {
  cors: corsOptions,
  helmet: helmetOptions,
  rateLimit: rateLimitOptions,
  jwt: jwtConfig,
  cookie: cookieConfig,
  passwordPolicy,
  
  // Security constants
  constants: {
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    TOKEN_TYPES: {
      ACCESS: 'access',
      REFRESH: 'refresh',
      RESET_PASSWORD: 'reset',
      VERIFY_EMAIL: 'verify-email',
      API_KEY: 'api-key',
    },
  },
}; 