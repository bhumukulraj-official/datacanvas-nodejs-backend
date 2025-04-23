/**
 * Admin Education Routes
 */
const express = require('express');
const router = express.Router();

const { educationController } = require('../../../../../modules/education/controllers');
const { educationValidator } = require('../../../../../modules/education/validators');
const { educationService } = require('../../../../../modules/education/services');
const { authorize } = require('../../../../../shared/middleware');

// All routes require admin role
router.use(authorize('admin'));

// Get all education entries across all users
router.get('/all', async (req, res) => {
  const { search } = req.query;
  const { limit, offset, order } = req.query;

  const filters = {
    // No userId filter, get all education entries
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
  try {
    const { count, rows } = await educationService.getAllEducation(filters, options);
    
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
        message: error.message || 'An error occurred while fetching education entries'
      }
    });
  }
});

// Get education entries by user ID
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
    const { count, rows } = await educationService.getAllEducation(filters, options);
    
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
        message: error.message || 'An error occurred while fetching education entries'
      }
    });
  }
});

// Create education entry for a specific user
router.post('/user/:userId', 
  educationValidator.validateCreateEducation,
  async (req, res) => {
    const { userId } = req.params;
    
    // Add user_id to the education data
    const educationData = {
      ...req.body,
      user_id: parseInt(userId, 10)
    };
    
    try {
      const education = await educationService.createEducation(educationData);
      
      res.status(201).json({
        success: true,
        data: education
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message || 'An error occurred while creating education entry'
        }
      });
    }
  }
);

// Other admin routes
router.put('/:id', educationValidator.validateUpdateEducation, educationController.updateEducation);
router.delete('/:id', educationController.deleteEducation);

module.exports = router; 