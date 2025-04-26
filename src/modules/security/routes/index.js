'use strict';

const express = require('express');
const router = express.Router();
const apiKeyRoutes = require('./apiKey.routes');
const securityRoutes = require('./security.routes');

// Mount routes
router.use('/api-keys', apiKeyRoutes);
router.use('/', securityRoutes);

module.exports = router; 