/**
 * Skill Controller
 * Handles HTTP requests for skill-related operations
 */
const { skillService } = require('../services');
const { catchAsync } = require('../../../shared/utils');

/**
 * Get all skills with filtering options
 */
exports.getAllSkills = catchAsync(async (req, res) => {
  const { category, is_highlighted, search } = req.query;
  const { limit, offset, order } = req.query;
  
  const filters = {
    userId: req.user.id,
    category: category || null,
    isHighlighted: is_highlighted === 'true',
    search: search || null
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined
  };
  
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
});

/**
 * Get skill by ID
 */
exports.getSkillById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const skill = await skillService.getSkillById(id);
  
  // Check if skill belongs to the user
  if (skill.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this skill'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: skill
  });
});

/**
 * Create a new skill
 */
exports.createSkill = catchAsync(async (req, res) => {
  // Add user_id to the skill data
  const skillData = {
    ...req.body,
    user_id: req.user.id
  };
  
  const skill = await skillService.createSkill(skillData);
  
  res.status(201).json({
    success: true,
    data: skill
  });
});

/**
 * Update an existing skill
 */
exports.updateSkill = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if skill belongs to the user
  const existingSkill = await skillService.getSkillById(id);
  if (existingSkill.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this skill'
      }
    });
  }
  
  const skill = await skillService.updateSkill(id, req.body);
  
  res.status(200).json({
    success: true,
    data: skill
  });
});

/**
 * Delete a skill
 */
exports.deleteSkill = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if skill belongs to the user
  const existingSkill = await skillService.getSkillById(id);
  if (existingSkill.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this skill'
      }
    });
  }
  
  await skillService.deleteSkill(id);
  
  res.status(200).json({
    success: true,
    data: {
      message: 'Skill deleted successfully'
    }
  });
});

/**
 * Get skills by category
 */
exports.getSkillsByCategory = catchAsync(async (req, res) => {
  const { category } = req.params;
  const userId = req.user.id;
  
  const skills = await skillService.getSkillsByCategory(userId, category);
  
  res.status(200).json({
    success: true,
    data: skills
  });
});

/**
 * Update skill display order
 */
exports.updateSkillOrder = catchAsync(async (req, res) => {
  const { skillsOrder } = req.body;
  
  const result = await skillService.updateSkillOrder(skillsOrder);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get highlighted skills
 */
exports.getHighlightedSkills = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const skills = await skillService.getHighlightedSkills(userId);
  
  res.status(200).json({
    success: true,
    data: skills
  });
});

/**
 * Import skills (bulk create)
 */
exports.importSkills = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { skills } = req.body;
  
  const result = await skillService.importSkills(userId, skills);
  
  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Get skill categories
 */
exports.getSkillCategories = catchAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  
  const categories = await skillService.getSkillCategories(userId);
  
  res.status(200).json({
    success: true,
    data: categories
  });
}); 