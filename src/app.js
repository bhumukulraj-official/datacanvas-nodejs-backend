const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const apiRouter = require('./api'); // Updated to use the new version router
const errorHandler = require('./shared/middleware/error.middleware');
const requestLogger = require('./shared/middleware/logger.middleware');
const { securityHeaders, corsConfig, csrfProtection } = require('./shared/middleware/security.middleware');
const { auditLog } = require('./shared/middleware/audit.middleware');
const logger = require('./shared/utils/logger');

// Import project routes
const projectRoutes = require('./modules/projects/routes');

// Import security routes
const securityRoutes = require('./modules/security/routes');

// Import settings routes
const settingsRoutes = require('./modules/settings/routes');

// Import websocket routes
const websocketRoutes = require('./modules/websocket/routes');

const app = express();

// Enhanced security middleware
app.use(securityHeaders());
app.use(corsConfig());
app.use(csrfProtection);
app.use(compression());

// Logging middleware
app.use(requestLogger); // Add request context and log requests
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logging

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced audit logging
app.use(auditLog);

// Serve uploaded files statically
const uploadsPath = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// API Routes - using the new versioning router
app.use('/api', apiRouter);

// Register project routes
app.use('/api/projects', projectRoutes);

// Register security routes
app.use('/api/security', securityRoutes);

// Register settings routes
app.use('/api/settings', settingsRoutes);

// Register websocket routes
app.use('/api/websocket', websocketRoutes);

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