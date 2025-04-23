/**
 * Skill Service
 * Handles business logic for skill operations
 */
const { Skill } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');
const { tagUtils } = require('../utils');

/**
 * Get all skills with optional filtering
 */
exports.getAllSkills = async (filters = {}, options = {}) => {
  const { userId, category, isHighlighted, search, tags, matchAllTags } = filters;
  const { limit = 50, offset = 0, order = [['display_order', 'ASC'], ['created_at', 'DESC']], includeTags = false } = options;

  const whereClause = {};
  
  // Add filters if provided
  if (userId) whereClause.user_id = userId;
  if (category) whereClause.category = category;
  if (isHighlighted !== undefined) whereClause.is_highlighted = isHighlighted;
  
  // Add search functionality if provided
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { category: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Fetch skills from database
  const result = await Skill.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order
  });

  // Handle tag filtering if needed
  if (tags && tags.length > 0) {
    // Filter skills by tags
    const filteredSkills = tagUtils.filterSkillsByTags(result.rows, tags, matchAllTags);
    result.rows = filteredSkills;
    result.count = filteredSkills.length; // Adjust count for filtered results
  }

  // Format skills with tags if requested
  if (includeTags) {
    result.rows = result.rows.map(skill => tagUtils.formatSkillWithTags(skill));
  }

  return result;
};

/**
 * Get skill by ID
 */
exports.getSkillById = async (id) => {
  const skill = await Skill.findByPk(id);
  
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  
  return skill;
};

/**
 * Create a new skill
 */
exports.createSkill = async (skillData) => {
  const skill = await Skill.create(skillData);
  return skill;
};

/**
 * Update an existing skill
 */
exports.updateSkill = async (id, skillData) => {
  const skill = await Skill.findByPk(id);
  
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  
  // Update skill
  await skill.update(skillData);
  
  return skill;
};

/**
 * Delete a skill (soft delete)
 */
exports.deleteSkill = async (id, transaction = null) => {
  const skill = await Skill.findByPk(id);
  
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  
  await skill.destroy({ transaction });
  return { success: true };
};

/**
 * Get skills by category
 */
exports.getSkillsByCategory = async (userId, category) => {
  if (!category) {
    throw new BadRequestError('Category is required');
  }
  
  const skills = await Skill.findAll({
    where: {
      user_id: userId,
      category
    },
    order: [
      ['display_order', 'ASC'], 
      ['name', 'ASC']
    ]
  });
  
  return skills;
};

/**
 * Update skill display order
 */
exports.updateSkillOrder = async (skillsOrder = []) => {
  if (!Array.isArray(skillsOrder) || skillsOrder.length === 0) {
    throw new BadRequestError('Skills order data is invalid');
  }

  // Use a transaction to ensure all updates happen atomically
  const result = await sequelize.transaction(async (transaction) => {
    const updatePromises = skillsOrder.map(({ id, displayOrder }) => 
      Skill.update(
        { display_order: displayOrder },
        { where: { id }, transaction }
      )
    );
    
    await Promise.all(updatePromises);
    return true;
  });

  return { success: result };
};

/**
 * Get highlighted skills
 */
exports.getHighlightedSkills = async (userId) => {
  const skills = await Skill.findAll({
    where: {
      user_id: userId,
      is_highlighted: true
    },
    order: [
      ['display_order', 'ASC'],
      ['name', 'ASC']
    ]
  });
  
  return skills;
};

/**
 * Import skills for a user (bulk create)
 */
exports.importSkills = async (userId, skillsData) => {
  if (!Array.isArray(skillsData)) {
    throw new BadRequestError('Skills data must be an array');
  }
  
  // Add user_id to each skill
  const skillsWithUserId = skillsData.map(skill => ({
    ...skill,
    user_id: userId
  }));
  
  const skills = await Skill.bulkCreate(skillsWithUserId);
  return skills;
};

/**
 * Get skill categories for a user
 */
exports.getSkillCategories = async (userId) => {
  const categories = await Skill.findAll({
    attributes: ['category'],
    where: {
      user_id: userId,
      category: {
        [Op.not]: null
      }
    },
    group: ['category'],
    order: [['category', 'ASC']]
  });
  
  return categories.map(cat => cat.category);
};

/**
 * Bulk delete skills
 */
exports.bulkDeleteSkills = async (userId, skillIds) => {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    throw new BadRequestError('Skill IDs must be a non-empty array');
  }

  // Use a transaction to ensure all deletes happen atomically
  const result = await sequelize.transaction(async (transaction) => {
    const deleteCount = await Skill.destroy({
      where: {
        id: {
          [Op.in]: skillIds
        },
        user_id: userId
      },
      transaction
    });
    
    return deleteCount;
  });

  return { 
    success: true,
    deletedCount: result 
  };
};

/**
 * Get public skills for a user
 * @param {number} userId - The user ID whose skills to retrieve
 * @param {Object} options - Additional options (limit, offset, etc.)
 */
exports.getUserPublicSkills = async (userId, options = {}) => {
  const { limit = 50, offset = 0 } = options;
  
  const skills = await Skill.findAndCountAll({
    where: {
      user_id: userId,
      // Only return non-sensitive information for public view
      is_highlighted: true
    },
    attributes: [
      'id', 'name', 'category', 'proficiency', 'icon', 
      'description', 'years_of_experience', 'certification_url'
    ],
    limit,
    offset,
    order: [
      ['display_order', 'ASC'],
      ['name', 'ASC']
    ]
  });
  
  return skills;
};

/**
 * Advanced search with full text capabilities
 * This uses the existing database schema but with more complex queries
 */
exports.advancedSkillSearch = async (userId, searchParams, options = {}) => {
  const { query, categories = [], minProficiency, maxProficiency, hasDescription } = searchParams;
  const { limit = 50, offset = 0, sortBy = 'name', sortOrder = 'ASC' } = options;
  
  const whereClause = { user_id: userId };
  
  // Add text search
  if (query) {
    whereClause[Op.or] = [
      { name: { [Op.iLike]: `%${query}%` } },
      { description: { [Op.iLike]: `%${query}%` } },
      { category: { [Op.iLike]: `%${query}%` } }
    ];
  }
  
  // Filter by categories if provided
  if (categories.length > 0) {
    whereClause.category = {
      [Op.in]: categories
    };
  }
  
  // Filter by proficiency range
  if (minProficiency !== undefined || maxProficiency !== undefined) {
    whereClause.proficiency = {};
    
    if (minProficiency !== undefined) {
      whereClause.proficiency[Op.gte] = minProficiency;
    }
    
    if (maxProficiency !== undefined) {
      whereClause.proficiency[Op.lte] = maxProficiency;
    }
  }
  
  // Filter by having a description
  if (hasDescription === true) {
    whereClause.description = {
      [Op.not]: null,
      [Op.ne]: ''
    };
  }
  
  // Process sort options
  let order = [];
  if (sortBy && sortOrder) {
    // Map API-friendly parameter names to actual column names
    const columnMap = {
      'name': 'name',
      'category': 'category',
      'proficiency': 'proficiency',
      'experience': 'years_of_experience',
      'lastUsed': 'last_used_date',
      'displayOrder': 'display_order',
      'created': 'created_at'
    };
    
    const column = columnMap[sortBy] || 'name';
    order.push([column, sortOrder.toUpperCase()]);
  }
  
  // Always add a secondary sort by name to ensure consistent ordering
  if (sortBy !== 'name') {
    order.push(['name', 'ASC']);
  }
  
  const skills = await Skill.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order
  });
  
  return skills;
};

/**
 * Get skill statistics for a user
 */
exports.getSkillStatistics = async (userId) => {
  // Use raw queries for more complex statistics
  const statistics = await sequelize.query(`
    SELECT 
      COUNT(*) as total_skills,
      COUNT(*) FILTER (WHERE is_highlighted = true) as highlighted_skills,
      COUNT(DISTINCT category) as total_categories,
      AVG(proficiency) as average_proficiency,
      MAX(proficiency) as max_proficiency,
      MIN(proficiency) as min_proficiency,
      AVG(years_of_experience) as average_years_experience,
      MAX(years_of_experience) as max_years_experience,
      COUNT(*) FILTER (WHERE certification_url IS NOT NULL) as certified_skills,
      MAX(last_used_date) as most_recent_skill_use
    FROM skills
    WHERE user_id = :userId AND deleted_at IS NULL
  `, {
    replacements: { userId },
    type: sequelize.QueryTypes.SELECT
  });
  
  return statistics[0];
};

/**
 * Find related skills for a given skill
 * This uses existing data to suggest related skills based on common categories
 */
exports.getRelatedSkills = async (skillId, limit = 5) => {
  const skill = await Skill.findByPk(skillId);
  
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  
  // Find skills in the same category (excluding the current skill)
  const relatedByCategory = await Skill.findAll({
    where: {
      id: { [Op.ne]: skillId },
      user_id: skill.user_id,
      category: skill.category,
      // Only include skills with the same category if category exists
      ...(skill.category ? {} : { [Op.or]: [{ id: 0 }] }) // Force empty result if no category
    },
    limit,
    order: [
      ['proficiency', 'DESC'],
      ['name', 'ASC']
    ]
  });
  
  // If we don't have enough related skills by category, find more by name similarity
  if (relatedByCategory.length < limit && skill.name) {
    const nameWords = skill.name.toLowerCase().split(/\s+/);
    
    if (nameWords.length > 0) {
      const nameConditions = nameWords.map(word => ({
        name: { [Op.iLike]: `%${word}%` }
      }));
      
      const relatedByName = await Skill.findAll({
        where: {
          id: { 
            [Op.ne]: skillId,
            [Op.notIn]: relatedByCategory.map(s => s.id)
          },
          user_id: skill.user_id,
          [Op.or]: nameConditions
        },
        limit: limit - relatedByCategory.length,
        order: [
          ['proficiency', 'DESC'],
          ['name', 'ASC']
        ]
      });
      
      return [...relatedByCategory, ...relatedByName];
    }
  }
  
  return relatedByCategory;
};

/**
 * Auto-adjust display order when creating, updating or deleting skills
 */
exports.reorderSkills = async (userId, category = null, transaction = null) => {
  const whereClause = { user_id: userId };
  if (category) {
    whereClause.category = category;
  }
  
  // Get all skills in the specified category ordered by current display_order
  const skills = await Skill.findAll({
    where: whereClause,
    order: [
      ['display_order', 'ASC'],
      ['created_at', 'DESC']
    ],
    transaction
  });
  
  // Reassign display_order sequentially
  const updatePromises = skills.map((skill, index) => 
    Skill.update(
      { display_order: index + 1 },
      { 
        where: { id: skill.id },
        transaction
      }
    )
  );
  
  await Promise.all(updatePromises);
  return true;
};

/**
 * Export skills for a user in various formats
 */
exports.exportSkills = async (userId, format = 'json') => {
  const skills = await Skill.findAll({
    where: {
      user_id: userId
    },
    order: [
      ['category', 'ASC'],
      ['display_order', 'ASC'],
      ['name', 'ASC']
    ],
    raw: true
  });
  
  if (format === 'csv') {
    // Convert to CSV format
    if (skills.length === 0) {
      return 'No skills found';
    }
    
    const headers = Object.keys(skills[0])
      .filter(key => !['deleted_at', 'user_id'].includes(key))
      .join(',');
      
    const rows = skills.map(skill => 
      Object.entries(skill)
        .filter(([key]) => !['deleted_at', 'user_id'].includes(key))
        .map(([_, value]) => {
          if (value === null) return '';
          if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  }
  
  // Default to JSON format
  return skills;
}; 