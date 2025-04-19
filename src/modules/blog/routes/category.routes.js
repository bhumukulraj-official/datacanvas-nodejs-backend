const express = require('express');
const categoryController = require('../controllers/category.controller');
const validator = require('../validators/category.validator');
const auth = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */
router.get('/', categoryController.listCategories);
router.get('/with-count', categoryController.getCategoriesWithCount);
router.get('/:slug', validator.getCategory, categoryController.getCategory);

/**
 * Admin routes - require authentication
 * These routes shouldn't be directly exposed, but rather mounted
 * under an admin route in the API router
 */
router.post('/', auth.requireAuth, validator.createCategory, categoryController.createCategory);
router.put('/:id', auth.requireAuth, validator.updateCategory, categoryController.updateCategory);
router.delete('/:id', auth.requireAuth, validator.deleteCategory, categoryController.deleteCategory);

module.exports = router; 