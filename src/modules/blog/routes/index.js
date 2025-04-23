const express = require('express');
const postRoutes = require('./post.routes');
const categoryRoutes = require('./category.routes');
const tagRoutes = require('./tag.routes');
const postController = require('../controllers/post.controller');

const router = express.Router();

// Mount blog post routes
router.use('/posts', postRoutes);

// Mount category routes
router.use('/categories', categoryRoutes);

// Mount tag routes
router.use('/tags', tagRoutes);

// RSS and Atom feeds
router.get('/feed.xml', postController.getRssFeed);
router.get('/feed.atom', postController.getAtomFeed);

module.exports = router; 