/**
 * Skill routes
 */
const express = require('express');
const { skillController } = require('../controllers');
const { auth, validate } = require('../../../middleware');
const { skillValidator } = require('../validators');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth());

// Get all skills (paginated/filtered)
router.get(
  '/',
  validate(skillValidator.getSkills),
  skillController.getAllSkills
);

// Get skill by ID
router.get(
  '/:id',
  validate(skillValidator.getSkillById),
  skillController.getSkillById
);

// Get highlighted skills
router.get(
  '/highlighted',
  skillController.getHighlightedSkills
);

// Get highlighted skills for a specific user (public route)
router.get(
  '/user/:userId/highlighted',
  skillController.getHighlightedSkills
);

// Get skill categories
router.get(
  '/categories',
  skillController.getSkillCategories
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