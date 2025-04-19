const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const apiV1Router = require('./api/v1/routes');
const errorHandler = require('./shared/middleware/error.middleware');
const requestLogger = require('./shared/middleware/logger.middleware');
const logger = require('./shared/utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(compression());

// Logging middleware
app.use(requestLogger); // Add request context and log requests
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use(`/api/${process.env.API_VERSION || 'v1'}`, apiV1Router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 404 handler - for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_002',
      message: `Cannot find ${req.originalUrl} on this server`,
      timestamp: new Date().toISOString()
    }
  });
});

// Error handling - must be the last middleware
app.use(errorHandler);

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason,
    stack: reason.stack,
    promise
  });
  // Don't exit in production, but log it
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  // In production we might want to gracefully shutdown after logging
  if (process.env.NODE_ENV === 'production') {
    logger.error('Process will exit due to uncaught exception');
    process.exit(1);
  }
});

module.exports = app; 