const express = require('express');
const router = express.Router();
const { SkillController } = require('../../controllers/content');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.get('/highlighted', SkillController.getHighlightedSkills);
router.get('/category/:category', SkillController.getSkillsByCategory);

// Authenticated admin routes
router.use(authenticate, authorize(['admin']));

router.put('/:id/proficiency', SkillController.updateSkillProficiency);

module.exports = router; 