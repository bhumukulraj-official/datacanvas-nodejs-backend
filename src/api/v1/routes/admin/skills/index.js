/**
 * Admin Skills Routes
 */
const express = require('express');
const router = express.Router();

const { skillController } = require('../../../../../modules/skills/controllers');
const { skillValidator } = require('../../../../../modules/skills/validators');
const { skillService } = require('../../../../../modules/skills/services');
const { authorize } = require('../../../../../shared/middleware');

// All routes require admin role
router.use(authorize('admin'));

// Get all skills across all users
router.get('/all', async (req, res) => {
  // Override the user filter in the controller
  const originalUserId = req.user.id;
  const { category, highlighted, search } = req.query;
  const { limit, offset, order } = req.query;

  const filters = {
    // No userId filter, get all skills
    category: category || null,
    isHighlighted: highlighted === 'true',
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  try {
    const { count, rows } = await skillService.getAllSkills(filters, options);
    
    res.status(200).json({
      success: true,
      data: rows,
      metadata: {
        total: count,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'An error occurred while fetching skills'
      }
    });
  }
});

// Get skills by user ID
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { category, highlighted, search } = req.query;
  const { limit, offset, order } = req.query;

  const filters = {
    userId: parseInt(userId, 10),
    category: category || null,
    isHighlighted: highlighted === 'true',
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  try {
    const { count, rows } = await skillService.getAllSkills(filters, options);
    
    res.status(200).json({
      success: true,
      data: rows,
      metadata: {
        total: count,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'An error occurred while fetching skills'
      }
    });
  }
});

// Create skill for a specific user
router.post('/user/:userId', 
  skillValidator.validateCreateSkill,
  async (req, res) => {
    const { userId } = req.params;
    
    // Add user_id to the skill data
    const skillData = {
      ...req.body,
      user_id: parseInt(userId, 10)
    };
    
    try {
      const skill = await skillService.createSkill(skillData);
      
      res.status(201).json({
        success: true,
        data: skill
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An error occurred while creating skill'
        }
      });
    }
  }
);

// Other admin routes
router.put('/:id', skillValidator.validateUpdateSkill, skillController.updateSkill);
router.delete('/:id', skillController.deleteSkill);
router.put('/order', skillValidator.validateUpdateSkillOrder, skillController.updateSkillOrder);

module.exports = router; 