const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth');
const postController = require('../../controllers/post.controller');
const categoryController = require('../../controllers/category.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Admin blog post routes
router.post('/posts', postController.createPost);
router.put('/posts/:id', postController.updatePost);
router.delete('/posts/:id', postController.deletePost);
router.patch('/posts/:id/status', postController.updatePostStatus);
router.patch('/posts/:id/featured', postController.updatePostFeatured);

// Admin blog category routes
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.patch('/categories/:id/status', categoryController.updateCategoryStatus);

module.exports = router; 