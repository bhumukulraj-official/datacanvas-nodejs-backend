const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  // Database
  db: {
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'datacanvas',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres',
    // Test database config
    test: {
      host: process.env.DB_TEST_HOST || 'localhost',
      port: process.env.DB_TEST_PORT || 5432,
      database: process.env.DB_TEST_NAME || 'portfolio_test',
      username: process.env.DB_TEST_USER || 'postgres',
      password: process.env.DB_TEST_PASSWORD || 'postgres',
      dialect: 'postgres'
    }
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'portfolio:',
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRATION || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },
  
  // File upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB
    baseUrl: process.env.UPLOAD_BASE_URL || '/uploads',
    path: process.env.UPLOAD_PATH || 'uploads/'
  },
  
  // Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    local: {
      path: process.env.STORAGE_LOCAL_PATH || 'storage'
    },
    s3: {
      bucket: process.env.STORAGE_S3_BUCKET,
      region: process.env.STORAGE_S3_REGION || 'us-east-1',
      accessKey: process.env.STORAGE_S3_ACCESS_KEY,
      secretKey: process.env.STORAGE_S3_SECRET_KEY
    }
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
    websocket: {
      windowMs: parseInt(process.env.WS_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
      maxMessages: parseInt(process.env.WS_RATE_LIMIT_MAX_MESSAGES || '50', 10) // 50 messages per minute
    }
  },
  
  // Email
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from: process.env.MAIL_FROM || 'noreply@example.com',
    secure: process.env.MAIL_SECURE === 'true'
  },
  
  // WebSocket
  websocket: {
    path: process.env.WS_PATH || '/api/v1/ws',
    maxPayloadSize: parseInt(process.env.WS_MAX_PAYLOAD_SIZE || '1048576', 10), // 1MB
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10) // 30 seconds
  },
  
  // Security
  security: {
    recaptcha: {
      secretKey: process.env.RECAPTCHA_SECRET_KEY,
      siteKey: process.env.RECAPTCHA_SITE_KEY
    }
  },
  
  // SSL (for production)
  ssl: {
    enabled: process.env.NODE_ENV === 'production' && !!process.env.SSL_CERT_PATH,
    certPath: process.env.SSL_CERT_PATH,
    keyPath: process.env.SSL_KEY_PATH
  }
}; 