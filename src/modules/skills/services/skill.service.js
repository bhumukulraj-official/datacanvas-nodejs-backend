/**
 * Skill Service
 * Handles business logic for skill operations
 */
const { Skill } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all skills with optional filtering
 */
exports.getAllSkills = async (filters = {}, options = {}) => {
  const { userId, category, isHighlighted, search } = filters;
  const { limit = 50, offset = 0, order = [['display_order', 'ASC'], ['created_at', 'DESC']] } = options;

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

  const skills = await Skill.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order
  });

  return skills;
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
exports.deleteSkill = async (id) => {
  const skill = await Skill.findByPk(id);
  
  if (!skill) {
    throw new NotFoundError('Skill not found');
  }
  
  await skill.destroy();
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