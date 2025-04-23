/**
 * Skill Routes
 */
const express = require('express');
const router = express.Router();

const { skillController } = require('../controllers');
const { skillValidator } = require('../validators');
const { authenticate, authorize } = require('../../../shared/middleware');

// Public routes
router.get('/public/highlighted', skillController.getHighlightedSkills);
router.get('/public/category/:category', skillController.getSkillsByCategory);

// Protected routes
router.use(authenticate); // Require authentication for all routes below

// Get all skills (with filtering)
router.get('/', skillController.getAllSkills);

// Get skill by ID
router.get('/:id', skillController.getSkillById);

// Create new skill
router.post('/', 
  skillValidator.validateCreateSkill,
  skillController.createSkill
);

// Update skill
router.put('/:id', 
  skillValidator.validateUpdateSkill,
  skillController.updateSkill
);

// Delete skill
router.delete('/:id', skillController.deleteSkill);

// Get skills by category
router.get('/category/:category', skillController.getSkillsByCategory);

// Get highlighted skills
router.get('/highlighted', skillController.getHighlightedSkills);

// Update skill order
router.put('/order', 
  skillValidator.validateUpdateSkillOrder,
  skillController.updateSkillOrder
);

// Import skills
router.post('/import', 
  skillValidator.validateImportSkills,
  skillController.importSkills
);

module.exports = router;

/**
 * Export routes
 */
const skillRoutes = require('./skill.routes');

module.exports = {
  skillRoutes
}; 