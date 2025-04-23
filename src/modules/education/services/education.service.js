/**
 * Education Service
 * Handles business logic for education operations
 */
const { Education } = require('../models');
const { NotFoundError, BadRequestError } = require('../../../shared/errors');
const { Op } = require('sequelize');
const sequelize = require('../../../shared/database');

/**
 * Get all education entries with sorting and pagination
 */
exports.getAllEducation = async (options = {}) => {
  const { userId, limit = 50, offset = 0, sortBy = 'start_date', order = 'DESC' } = options;
  
  const orderMapping = {
    start_date: 'start_date',
    end_date: 'end_date',
    institution: 'institution',
    degree: 'degree'
  };
  
  const sortField = orderMapping[sortBy] || 'start_date';
  
  const education = await Education.findAndCountAll({
    where: {
      user_id: userId
    },
    limit,
    offset,
    order: [[sortField, order]]
  });

  return education;
};

/**
 * Filter and search education entries
 */
exports.filterEducation = async (filters = {}) => {
  const { 
    userId, 
    institution, 
    degree,
    field_of_study,
    start_date_from,
    start_date_to,
    end_date_from,
    end_date_to,
    is_current,
    search,
    limit = 50, 
    offset = 0, 
    sortBy = 'start_date', 
    order = 'DESC'
  } = filters;
  
  const orderMapping = {
    start_date: 'start_date',
    end_date: 'end_date',
    institution: 'institution',
    degree: 'degree'
  };
  
  const sortField = orderMapping[sortBy] || 'start_date';
  
  // Build where clause based on filters
  const whereClause = { user_id: userId };
  
  if (institution) {
    whereClause.institution = { [Op.iLike]: `%${institution}%` };
  }
  
  if (degree) {
    whereClause.degree = { [Op.iLike]: `%${degree}%` };
  }
  
  if (field_of_study) {
    whereClause.field_of_study = { [Op.iLike]: `%${field_of_study}%` };
  }
  
  if (start_date_from) {
    whereClause.start_date = { 
      ...whereClause.start_date,
      [Op.gte]: start_date_from 
    };
  }
  
  if (start_date_to) {
    whereClause.start_date = { 
      ...whereClause.start_date,
      [Op.lte]: start_date_to 
    };
  }
  
  if (end_date_from) {
    whereClause.end_date = { 
      ...whereClause.end_date,
      [Op.gte]: end_date_from 
    };
  }
  
  if (end_date_to) {
    whereClause.end_date = { 
      ...whereClause.end_date,
      [Op.lte]: end_date_to 
    };
  }
  
  if (is_current !== undefined) {
    whereClause.is_current = is_current;
  }
  
  // Add search functionality
  if (search) {
    whereClause[Op.or] = [
      { institution: { [Op.iLike]: `%${search}%` } },
      { degree: { [Op.iLike]: `%${search}%` } },
      { field_of_study: { [Op.iLike]: `%${search}%` } },
      { location: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { activities: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  const education = await Education.findAndCountAll({
    where: whereClause,
    limit,
    offset,
    order: [[sortField, order]]
  });

  return education;
};

/**
 * Get education by ID
 */
exports.getEducationById = async (id) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  return education;
};

/**
 * Create a new education entry
 */
exports.createEducation = async (educationData) => {
  // Handle is_current flag logic
  if (educationData.is_current === true) {
    educationData.end_date = null;
  }
  
  const education = await Education.create(educationData);
  return education;
};

/**
 * Update an existing education entry
 */
exports.updateEducation = async (id, educationData) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  // Handle is_current flag logic
  if (educationData.is_current === true) {
    educationData.end_date = null;
  }
  
  // Update education
  await education.update(educationData);
  
  return education;
};

/**
 * Delete an education entry (soft delete)
 */
exports.deleteEducation = async (id) => {
  const education = await Education.findByPk(id);
  
  if (!education) {
    throw new NotFoundError('Education record not found');
  }
  
  await education.destroy();
  return { success: true };
};

/**
 * Get current education (where is_current is true)
 */
exports.getCurrentEducation = async (userId) => {
  const education = await Education.findAll({
    where: {
      user_id: userId,
      is_current: true
    },
    order: [['start_date', 'DESC']]
  });
  
  return education;
};

/**
 * Get education history chronologically ordered
 */
exports.getEducationHistory = async (userId) => {
  const education = await Education.findAll({
    where: {
      user_id: userId
    },
    order: [['start_date', 'DESC']]
  });
  
  return education;
};

/**
 * Import education entries for a user (bulk create)
 */
exports.importEducation = async (userId, educationData) => {
  if (!Array.isArray(educationData)) {
    throw new BadRequestError('Education data must be an array');
  }
  
  // Add user_id to each education entry
  const educationWithUserId = educationData.map(education => ({
    ...education,
    user_id: userId,
    // Handle is_current flag for each item
    end_date: education.is_current === true ? null : education.end_date
  }));
  
  const education = await Education.bulkCreate(educationWithUserId);
  return education;
};

/**
 * Bulk update education entries
 */
exports.bulkUpdateEducation = async (userId, educationUpdates) => {
  if (!Array.isArray(educationUpdates)) {
    throw new BadRequestError('Education updates must be an array');
  }
  
  // Check if all education entries belong to the user
  const educationIds = educationUpdates.map(update => update.id);
  
  const existingEducation = await Education.findAll({
    where: {
      id: { [Op.in]: educationIds }
    }
  });
  
  // Map existing education IDs to their user_id for verification
  const educationUserMap = existingEducation.reduce((map, edu) => {
    map[edu.id] = edu.user_id;
    return map;
  }, {});
  
  // Verify ownership of all education entries
  const unauthorizedEntries = educationUpdates.filter(
    update => educationUserMap[update.id] !== userId
  );
  
  if (unauthorizedEntries.length > 0) {
    throw new BadRequestError('You do not have permission to update one or more of these education records');
  }
  
  // Process updates in a transaction
  const result = await sequelize.transaction(async (t) => {
    const updatePromises = educationUpdates.map(async (update) => {
      // Handle is_current flag
      if (update.is_current === true) {
        update.end_date = null;
      }
      
      const [updateCount] = await Education.update(update, {
        where: { id: update.id },
        transaction: t
      });
      
      return { id: update.id, updated: updateCount > 0 };
    });
    
    return Promise.all(updatePromises);
  });
  
  return result;
};

/**
 * Bulk delete education entries
 */
exports.bulkDeleteEducation = async (userId, educationIds) => {
  if (!Array.isArray(educationIds)) {
    throw new BadRequestError('Education IDs must be an array');
  }
  
  // Check if all education entries belong to the user
  const existingEducation = await Education.findAll({
    where: {
      id: { [Op.in]: educationIds }
    }
  });
  
  // Verify ownership of all education entries
  const unauthorizedEntries = existingEducation.filter(
    edu => edu.user_id !== userId
  );
  
  if (unauthorizedEntries.length > 0) {
    throw new BadRequestError('You do not have permission to delete one or more of these education records');
  }
  
  // Process deletes
  const deletedCount = await Education.destroy({
    where: {
      id: { [Op.in]: educationIds }
    }
  });
  
  return { 
    success: true, 
    deletedCount,
    totalRequested: educationIds.length
  };
};

/**
 * Generate education statistics for a user
 */
exports.getEducationStatistics = async (userId) => {
  // Get total education count
  const totalCount = await Education.count({
    where: { user_id: userId }
  });
  
  // Get current education count
  const currentCount = await Education.count({
    where: { 
      user_id: userId,
      is_current: true
    }
  });
  
  // Get degree distribution
  const degreeDistribution = await Education.findAll({
    attributes: [
      'degree',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    where: { user_id: userId },
    group: ['degree'],
    order: [[sequelize.literal('count'), 'DESC']]
  });
  
  // Get education duration stats
  const educationWithDuration = await Education.findAll({
    attributes: [
      'id',
      'start_date',
      'end_date',
      'is_current'
    ],
    where: { 
      user_id: userId,
      end_date: { [Op.not]: null }
    }
  });
  
  // Calculate durations in months
  const durations = educationWithDuration.map(edu => {
    const startDate = new Date(edu.start_date);
    const endDate = new Date(edu.end_date);
    
    const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (endDate.getMonth() - startDate.getMonth());
    
    return monthDiff;
  });
  
  // Calculate average duration
  const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
  const averageDuration = durations.length > 0 ? totalDuration / durations.length : 0;
  
  return {
    totalCount,
    currentCount,
    degreeDistribution,
    averageDurationMonths: Math.round(averageDuration * 10) / 10,
    longestDurationMonths: durations.length > 0 ? Math.max(...durations) : 0,
    shortestDurationMonths: durations.length > 0 ? Math.min(...durations) : 0
  };
};

/**
 * Export education data
 */
exports.exportEducation = async (userId, format = 'json') => {
  // Get all education records for the user
  const education = await Education.findAll({
    where: { user_id: userId },
    order: [['start_date', 'DESC']]
  });
  
  if (format === 'json') {
    return education;
  }
  
  // For CSV format, convert to simple object array
  if (format === 'csv') {
    return education.map(edu => {
      const plainEdu = edu.get({ plain: true });
      return {
        id: plainEdu.id,
        institution: plainEdu.institution,
        degree: plainEdu.degree,
        field_of_study: plainEdu.field_of_study || '',
        start_date: plainEdu.start_date,
        end_date: plainEdu.end_date || '',
        is_current: plainEdu.is_current ? 'Yes' : 'No',
        grade: plainEdu.grade || '',
        location: plainEdu.location || '',
        activities: plainEdu.activities || '',
        description: plainEdu.description || ''
      };
    });
  }
  
  // For PDF format, return the same data (actual PDF generation handled in controller)
  return education;
}; 