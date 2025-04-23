/**
 * Skill routes
 */
const express = require('express');
const { skillController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { skillValidator } = require('../validators');

const router = express.Router();

// Public routes (no auth required)
// Get public skills for a specific user
router.get(
  '/public/user/:userId',
  validate(skillValidator.getUserPublicSkills),
  skillController.getUserPublicSkills
);

// Apply auth middleware to all remaining routes
router.use(auth());

// Get all skills (paginated/filtered)
router.get(
  '/',
  validate(skillValidator.getSkills),
  skillController.getAllSkills
);

// Advanced search for skills
router.get(
  '/search',
  skillController.advancedSkillSearch
);

// Get highlighted skills
router.get(
  '/highlighted',
  skillController.getHighlightedSkills
);

// Get user statistics
router.get(
  '/statistics',
  skillController.getSkillStatistics
);

// Export skills
router.get(
  '/export',
  skillController.exportSkills
);

// Get highlighted skills for a specific user
router.get(
  '/user/:userId/highlighted',
  skillController.getHighlightedSkills
);

// Get skill categories
router.get(
  '/categories',
  skillController.getSkillCategories
);

// Get related skills for a skill
router.get(
  '/:id/related',
  skillController.getRelatedSkills
);

// Bulk delete skills
router.delete(
  '/bulk',
  validate(skillValidator.bulkDeleteSkills),
  skillController.bulkDeleteSkills
);

// Import skills (bulk create)
router.post(
  '/import',
  validate(skillValidator.importSkills),
  skillController.importSkills
);

// Get skill by ID - must come after other specific routes
router.get(
  '/:id',
  validate(skillValidator.getSkillById),
  skillController.getSkillById
);

// Create new skill
router.post(
  '/',
  validate(skillValidator.createSkill),
  skillController.createSkill
);

// Update skill
router.patch(
  '/:id',
  validate(skillValidator.updateSkill),
  skillController.updateSkill
);

// Delete skill
router.delete(
  '/:id',
  validate(skillValidator.deleteSkill),
  skillController.deleteSkill
);

// Update skill order
router.post(
  '/order',
  validate(skillValidator.updateSkillOrder),
  skillController.updateSkillOrder
);

module.exports = router; 