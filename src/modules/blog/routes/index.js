const express = require('express');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');

const router = express.Router();

// Mount blog post routes
router.use('/posts', postRoutes);

// Mount category routes
router.use('/categories', categoryRoutes);

module.exports = router; 