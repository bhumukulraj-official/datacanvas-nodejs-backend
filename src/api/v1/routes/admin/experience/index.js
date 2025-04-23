/**
 * Admin Experience Routes
 */
const express = require('express');
const router = express.Router();

const { experienceController } = require('../../../../../modules/experience/controllers');
const { experienceValidator } = require('../../../../../modules/experience/validators');
const { experienceService } = require('../../../../../modules/experience/services');
const { authorize } = require('../../../../../shared/middleware');

// All routes require admin role
router.use(authorize('admin'));

// Get all experiences across all users
router.get('/all', async (req, res) => {
  const { search } = req.query;
  const { limit, offset, order } = req.query;

  const filters = {
    // No userId filter, get all experiences
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  try {
    const { count, rows } = await experienceService.getAllExperiences(filters, options);
    
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
        message: error.message || 'An error occurred while fetching experiences'
      }
    });
  }
});

// Get experiences by user ID
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const { search } = req.query;
  const { limit, offset, order } = req.query;

  const filters = {
    userId: parseInt(userId, 10),
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  try {
    const { count, rows } = await experienceService.getAllExperiences(filters, options);
    
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
        message: error.message || 'An error occurred while fetching experiences'
      }
    });
  }
});

// Create experience for a specific user
router.post('/user/:userId', 
  experienceValidator.validateCreateExperience,
  async (req, res) => {
    const { userId } = req.params;
    
    // Add user_id to the experience data
    const experienceData = {
      ...req.body,
      user_id: parseInt(userId, 10)
    };
    
    try {
      const experience = await experienceService.createExperience(experienceData);
      
      res.status(201).json({
        success: true,
        data: experience
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An error occurred while creating experience'
        }
      });
    }
  }
);

// Other admin routes
router.put('/:id', experienceValidator.validateUpdateExperience, experienceController.updateExperience);
router.delete('/:id', experienceController.deleteExperience);

module.exports = router; 