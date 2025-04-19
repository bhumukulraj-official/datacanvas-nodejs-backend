const express = require('express');
const postController = require('../controllers/post.controller');
const validator = require('../validators/blog.validator');
const auth = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */
router.get('/', validator.listPosts, postController.listPosts);
router.get('/search', validator.searchPosts, postController.searchPosts);
router.get('/:slug', validator.getPost, postController.getPost);

/**
 * Admin routes - require authentication
 * These routes shouldn't be directly exposed, but rather mounted
 * under an admin route in the API router
 */
router.post('/', auth.requireAuth, validator.createPost, postController.createPost);
router.put('/:id', auth.requireAuth, validator.updatePost, postController.updatePost);
router.delete('/:id', auth.requireAuth, validator.deletePost, postController.deletePost);

module.exports = router; 