const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const routes = require('./api/routes/v1');

// Load environment variables
require('dotenv').config();

const app = express();

// Load all documentation files
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/swagger.yaml'));
const docsPath = path.join(__dirname, '../docs/api-endpoints');

// Load all YAML files from api-endpoints directory
fs.readdirSync(docsPath).forEach(file => {
  if (file.endsWith('.yaml')) {
    const endpointDoc = YAML.load(path.join(docsPath, file));
    Object.assign(swaggerDocument.paths, endpointDoc.paths);
    if (endpointDoc.components) {
      Object.assign(swaggerDocument.components.schemas, endpointDoc.components.schemas);
    }
  }
});

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:']
    }
  }
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API Routes
routes(app);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (to be implemented)
// app.use(errorHandler);

module.exports = app; 