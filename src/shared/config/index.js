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
    database: process.env.DB_NAME || 'portfolio_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dialect: 'postgres'
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'portfolio:'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    accessExpiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES_IN || '3600', 10), // 1 hour
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '604800', 10) // 7 days
  },
  
  // File upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10), // 5MB
    baseUrl: process.env.UPLOAD_BASE_URL || '/uploads',
    path: process.env.UPLOAD_PATH || 'uploads/'
  },
  
  // Cors
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
}; 