/**
 * Audit Log Service
 * Handles business logic for audit log operations
 */
const { Op } = require('sequelize');
const AuditLog = require('../models/AuditLog');
const { AppError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Create a new audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Promise<Object>} Created audit log
 */
exports.createAuditLog = async (logData) => {
  try {
    const auditLog = await AuditLog.create({
      user_id: logData.userId,
      action: logData.action,
      entity_type: logData.entityType,
      entity_id: logData.entityId,
      description: logData.description,
      metadata: logData.metadata || {}
    });
    
    return auditLog;
  } catch (error) {
    logger.error('Error creating audit log', { error, logData });
    throw error;
  }
};

/**
 * Get audit logs with pagination and filters
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Audit logs with pagination info
 */
exports.getAuditLogs = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'DESC'
  } = options;
  
  const offset = (page - 1) * limit;
  const where = {};
  
  // Apply filters
  if (userId) {
    where.user_id = userId;
  }
  
  if (action) {
    where.action = action;
  }
  
  if (entityType) {
    where.entity_type = entityType;
  }
  
  if (entityId) {
    where.entity_id = entityId;
  }
  
  // Apply date range filter
  if (startDate || endDate) {
    where.created_at = {};
    
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    
    if (endDate) {
      where.created_at[Op.lte] = new Date(endDate);
    }
  }
  
  // Determine sort order
  const order = [[sortBy, sortOrder]];
  
  try {
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      order,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });
    
    return {
      auditLogs: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error retrieving audit logs', { error, options });
    throw error;
  }
};

/**
 * Get audit log by ID
 * @param {number} id - Audit log ID
 * @returns {Promise<Object>} Audit log
 */
exports.getAuditLogById = async (id) => {
  try {
    const auditLog = await AuditLog.findByPk(id, {
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });
    
    if (!auditLog) {
      throw new AppError('Audit log not found', 404, 'AUDIT_001');
    }
    
    return auditLog;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    logger.error('Error retrieving audit log', { error, id });
    throw error;
  }
};

/**
 * Get entity audit history
 * @param {string} entityType - Entity type
 * @param {number} entityId - Entity ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Audit logs for entity
 */
exports.getEntityAuditHistory = async (entityType, entityId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sortOrder = 'DESC'
  } = options;
  
  const offset = (page - 1) * limit;
  
  try {
    const { count, rows } = await AuditLog.findAndCountAll({
      where: {
        entity_type: entityType,
        entity_id: entityId
      },
      limit,
      offset,
      order: [['created_at', sortOrder]],
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ]
    });
    
    return {
      auditLogs: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error retrieving entity audit history', { error, entityType, entityId });
    throw error;
  }
};

/**
 * Get user activity logs
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User activity logs
 */
exports.getUserActivityLogs = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    action,
    startDate,
    endDate,
    sortOrder = 'DESC'
  } = options;
  
  const offset = (page - 1) * limit;
  const where = { user_id: userId };
  
  if (action) {
    where.action = action;
  }
  
  if (startDate || endDate) {
    where.created_at = {};
    
    if (startDate) {
      where.created_at[Op.gte] = new Date(startDate);
    }
    
    if (endDate) {
      where.created_at[Op.lte] = new Date(endDate);
    }
  }
  
  try {
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', sortOrder]]
    });
    
    return {
      auditLogs: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('Error retrieving user activity logs', { error, userId });
    throw error;
  }
};

/**
 * Get available audit log actions
 * @returns {Promise<Array>} List of audit log actions
 */
exports.getAuditLogActions = async () => {
  try {
    const actions = await AuditLog.findAll({
      attributes: ['action'],
      group: ['action'],
      raw: true
    });
    
    return actions.map(a => a.action);
  } catch (error) {
    logger.error('Error retrieving audit log actions', { error });
    throw error;
  }
};

/**
 * Get available entity types
 * @returns {Promise<Array>} List of entity types
 */
exports.getEntityTypes = async () => {
  try {
    const entityTypes = await AuditLog.findAll({
      attributes: ['entity_type'],
      where: {
        entity_type: {
          [Op.ne]: null
        }
      },
      group: ['entity_type'],
      raw: true
    });
    
    return entityTypes.map(e => e.entity_type);
  } catch (error) {
    logger.error('Error retrieving entity types', { error });
    throw error;
  }
}; 