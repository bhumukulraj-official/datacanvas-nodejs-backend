/**
 * Skill Controller
 * Handles HTTP requests for skill-related operations
 */
const { skillService } = require('../services');
const { catchAsync } = require('../../../shared/utils');
const sequelize = require('../../../shared/database');

/**
 * Get all skills with filtering options
 */
exports.getAllSkills = catchAsync(async (req, res) => {
  const { category, is_highlighted, search, tags, match_all_tags } = req.query;
  const { limit, offset, order } = req.query;
  
  const filters = {
    userId: req.user.id,
    category: category || null,
    isHighlighted: is_highlighted === 'true',
    search: search || null,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : null,
    matchAllTags: match_all_tags === 'true'
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    order: order ? JSON.parse(order) : undefined,
    includeTags: true // Flag to format skills with tags
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
  // Validate icon URL if provided
  if (req.body.icon) {
    const iconUrl = req.body.icon;
    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const urlExtension = iconUrl.split('?')[0].toLowerCase().match(/\.(jpg|jpeg|png|gif|svg|webp)$/);
    
    if (!urlExtension) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE_URL',
          message: 'Icon URL must point to a valid image file (jpg, jpeg, png, gif, svg, webp)'
        }
      });
    }
  }
  
  // Add user_id to the skill data
  const skillData = {
    ...req.body,
    user_id: req.user.id
  };
  
  // Use a transaction to ensure consistent data
  const skill = await sequelize.transaction(async (transaction) => {
    // Create the skill
    const newSkill = await skillService.createSkill(skillData);
    
    // Reorder skills in the same category if needed
    if (skillData.category) {
      await skillService.reorderSkills(req.user.id, skillData.category, transaction);
    }
    
    return newSkill;
  });
  
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
  
  // Validate icon URL if provided
  if (req.body.icon) {
    const iconUrl = req.body.icon;
    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    const urlExtension = iconUrl.split('?')[0].toLowerCase().match(/\.(jpg|jpeg|png|gif|svg|webp)$/);
    
    if (!urlExtension) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMAGE_URL',
          message: 'Icon URL must point to a valid image file (jpg, jpeg, png, gif, svg, webp)'
        }
      });
    }
  }
  
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
  
  // Store the original category to check if it changes
  const originalCategory = existingSkill.category;
  
  // Use a transaction to ensure consistent data
  const skill = await sequelize.transaction(async (transaction) => {
    // Update the skill
    const updatedSkill = await skillService.updateSkill(id, req.body);
    
    // If category changed, reorder skills in both old and new categories
    if (req.body.category && req.body.category !== originalCategory) {
      if (originalCategory) {
        await skillService.reorderSkills(req.user.id, originalCategory, transaction);
      }
      await skillService.reorderSkills(req.user.id, req.body.category, transaction);
    }
    
    return updatedSkill;
  });
  
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
  
  // Store the category to reorder after deletion
  const categoryToReorder = existingSkill.category;
  
  // Use a transaction for consistent data
  await sequelize.transaction(async (transaction) => {
    // Delete the skill
    await skillService.deleteSkill(id, transaction);
    
    // Reorder the remaining skills in the same category
    if (categoryToReorder) {
      await skillService.reorderSkills(req.user.id, categoryToReorder, transaction);
    }
  });
  
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
  
  // Check if skills data is valid
  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Skills data must be a non-empty array'
      }
    });
  }
  
  // Process and sanitize incoming skills data
  const processedSkills = skills.map(skill => {
    // Basic required fields
    const sanitizedSkill = {
      name: skill.name,
      category: skill.category || null,
      proficiency: skill.proficiency || null,
      is_highlighted: skill.is_highlighted || false
    };
    
    // Optional fields
    if (skill.icon) sanitizedSkill.icon = skill.icon;
    if (skill.description) sanitizedSkill.description = skill.description;
    if (skill.years_of_experience) sanitizedSkill.years_of_experience = skill.years_of_experience;
    if (skill.last_used_date) sanitizedSkill.last_used_date = skill.last_used_date;
    if (skill.certification_url) sanitizedSkill.certification_url = skill.certification_url;
    if (skill.display_order !== undefined) sanitizedSkill.display_order = skill.display_order;
    
    return sanitizedSkill;
  });
  
  const result = await skillService.importSkills(userId, processedSkills);
  
  // After importing, run the reordering process to ensure proper display_order
  await skillService.reorderSkills(userId);
  
  res.status(201).json({
    success: true,
    data: {
      count: result.length,
      message: `Successfully imported ${result.length} skills`
    }
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

/**
 * Bulk delete skills
 */
exports.bulkDeleteSkills = catchAsync(async (req, res) => {
  const { skillIds } = req.body;
  const userId = req.user.id;
  
  const result = await skillService.bulkDeleteSkills(userId, skillIds);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get public skills for a specific user
 * This endpoint is for public access (no auth required)
 */
exports.getUserPublicSkills = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { limit, offset } = req.query;
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0
  };
  
  const { count, rows } = await skillService.getUserPublicSkills(userId, options);
  
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
 * Advanced search for skills
 */
exports.advancedSkillSearch = catchAsync(async (req, res) => {
  const {
    query,
    categories,
    minProficiency,
    maxProficiency,
    hasDescription,
    sortBy,
    sortOrder,
    limit,
    offset
  } = req.query;
  
  const searchParams = {
    query: query || null,
    categories: categories ? categories.split(',') : [],
    minProficiency: minProficiency ? parseInt(minProficiency, 10) : undefined,
    maxProficiency: maxProficiency ? parseInt(maxProficiency, 10) : undefined,
    hasDescription: hasDescription === 'true'
  };
  
  const options = {
    limit: parseInt(limit, 10) || 50,
    offset: parseInt(offset, 10) || 0,
    sortBy: sortBy || 'name',
    sortOrder: sortOrder || 'ASC'
  };
  
  const { count, rows } = await skillService.advancedSkillSearch(req.user.id, searchParams, options);
  
  res.status(200).json({
    success: true,
    data: rows,
    metadata: {
      total: count,
      limit: options.limit,
      offset: options.offset,
      filters: searchParams,
      sort: {
        field: options.sortBy,
        order: options.sortOrder
      }
    }
  });
});

/**
 * Get skill statistics for a user
 */
exports.getSkillStatistics = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const statistics = await skillService.getSkillStatistics(userId);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
});

/**
 * Get related skills for a skill
 */
exports.getRelatedSkills = catchAsync(async (req, res) => {
  const { id: skillId } = req.params;
  const { limit } = req.query;
  
  const relatedSkills = await skillService.getRelatedSkills(
    skillId,
    parseInt(limit, 10) || 5
  );
  
  res.status(200).json({
    success: true,
    data: relatedSkills
  });
});

/**
 * Export skills
 */
exports.exportSkills = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { format } = req.query;
  
  const result = await skillService.exportSkills(userId, format);
  
  // Handle different export formats
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="skills_export.csv"');
    return res.status(200).send(result);
  }
  
  // Default to JSON
  res.status(200).json({
    success: true,
    data: result
  });
}); 