const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../../../shared/middleware/auth');
const postController = require('../../controllers/post.controller');
const categoryController = require('../../controllers/category.controller');
const tagController = require('../../controllers/tag.controller');
const commentController = require('../../controllers/comment.controller');

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Admin blog post routes
router.post('/posts', postController.createPost);
router.put('/posts/:id', postController.updatePost);
router.delete('/posts/:id', postController.deletePost);
router.patch('/posts/:id/status', postController.updatePostStatus);
router.patch('/posts/:id/featured', postController.updatePostFeatured);
router.post('/posts/:id/schedule', postController.schedulePost);

// Admin blog category routes
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.patch('/categories/:id/status', categoryController.updateCategoryStatus);

// Admin blog tag routes
router.post('/tags', tagController.createTag);
router.put('/tags/:id', tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);

// Admin comment management routes
router.get('/comments', commentController.getAdminComments);
router.patch('/comments/:id/status', commentController.updateCommentStatus);
router.delete('/comments/:id', commentController.deleteComment);

// Publish scheduled posts endpoint
router.post('/publish-scheduled', postController.publishScheduledPosts);

module.exports = router; 