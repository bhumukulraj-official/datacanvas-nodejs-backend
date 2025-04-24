/**
 * Main application file
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { join } = require('path');
const errorHandler = require('./shared/middleware/error.middleware');
const { logger } = require('./shared/utils');
const apiV1Routes = require('./api/v1/routes');

// Import system services
const { services: systemServices } = require('./modules/system');

// Import maintenance middleware
const maintenanceMiddleware = require('./shared/middleware/maintenance.middleware');

// Initialize app
const app = express();

// Set up monitoring middleware
app.use(systemServices.monitoring.apiMetricsMiddleware());

// Set security headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Enable gzip compression
app.use(compression());

// Request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Check for maintenance mode
app.use(maintenanceMiddleware.maintenanceCheck);

// Mount API routes
app.use('/api/v1', apiV1Routes);

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Handle errors
app.use(errorHandler);

module.exports = app; 