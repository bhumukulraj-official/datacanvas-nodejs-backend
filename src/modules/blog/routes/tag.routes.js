const express = require('express');
const tagController = require('../controllers/tag.controller');
const validator = require('../validators/tag.validator');
const auth = require('../../../shared/middleware/auth.middleware');

const router = express.Router();

/**
 * Public routes - accessible without authentication
 */
router.get('/', tagController.listTags);
router.get('/with-count', tagController.getTagsWithCount);
router.get('/:slug', validator.getTag, tagController.getTag);

/**
 * Admin routes - require authentication
 * These routes shouldn't be directly exposed, but rather mounted
 * under an admin route in the API router
 */
router.post('/', auth.requireAuth, validator.createTag, tagController.createTag);
router.put('/:id', auth.requireAuth, validator.updateTag, tagController.updateTag);
router.delete('/:id', auth.requireAuth, validator.deleteTag, tagController.deleteTag);

module.exports = router; 