'use strict';

const express = require('express');
const router = express.Router();
const websocketRoutes = require('./websocket.routes');

// Mount routes
router.use('/', websocketRoutes);

module.exports = router; 