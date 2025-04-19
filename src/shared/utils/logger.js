const winston = require('winston');
const config = require('../config');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Define console format with colors
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    
    if (metadata.stack) {
      metaStr = `\n${metadata.stack}`;
      delete metadata.stack;
    }
    
    if (Object.keys(metadata).length > 0) {
      const meta = JSON.stringify(metadata, null, 2);
      if (meta !== '{}') {
        metaStr += `\n${meta}`;
      }
    }
    
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  levels,
  format: logFormat,
  defaultMeta: { 
    service: 'portfolio-api',
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: consoleFormat
    }),
    // File transports for production
    ...(config.env === 'production' ? [
      // Error log
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true
      }),
      // Combined log
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true
      }),
      // HTTP log
      new winston.transports.File({
        filename: path.join(logDir, 'http.log'),
        level: 'http',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        tailable: true
      })
    ] : [])
  ],
  // Don't exit on handled exceptions
  exitOnError: false
});

// Add request context to all log entries
logger.requestContext = (req) => {
  return {
    requestId: req.id || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user ? req.user.id : 'unauthenticated'
  };
};

// Create a stream object for Express/Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger; 