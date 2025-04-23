/**
 * Audit service
 * Provides centralized audit logging functionality
 */
const logger = require('../../../shared/utils/logger');
const { sequelize } = require('../../../shared/database');

/**
 * Log an audit event
 * @param {Object} data - Audit data
 * @param {String} data.userId - User ID who performed the action
 * @param {String} data.action - Action performed
 * @param {String} data.entityType - Type of entity affected
 * @param {String} data.entityId - ID of entity affected
 * @param {Object} data.details - Additional details
 * @returns {Promise<Object>} Created audit log
 */
const logAction = async (data) => {
  try {
    const {
      userId,
      action,
      entityType,
      entityId,
      details = {}
    } = data;
    
    // Validate required fields
    if (!action) {
      throw new Error('Action is required for audit logging');
    }
    
    // Log action to database
    const [auditId] = await sequelize.query(`
      INSERT INTO audit_logs
      (user_id, action, entity_type, entity_id, details, created_at)
      VALUES
      (:userId, :action, :entityType, :entityId, :details, :createdAt)
      RETURNING id
    `, {
      replacements: {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId ? entityId.toString() : null,
        details: JSON.stringify(details),
        createdAt: new Date()
      },
      type: sequelize.QueryTypes.INSERT
    });
    
    logger.info(`Audit log created: ${action}`, {
      userId,
      action,
      entityType,
      entityId
    });
    
    return {
      id: Array.isArray(auditId) && auditId[0] ? auditId[0].id : null,
      userId,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date()
    };
  } catch (error) {
    logger.error(`Failed to create audit log: ${error.message}`, { 
      error, 
      data 
    });
    
    // Still return a value even if DB insertion failed
    return {
      id: null,
      ...data,
      createdAt: new Date(),
      error: error.message
    };
  }
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} options - Query options
 * @param {Number} options.page - Page number (default: 1)
 * @param {Number} options.limit - Items per page (default: 20)
 * @param {String} options.userId - Filter by user ID
 * @param {String} options.action - Filter by action
 * @param {String} options.entityType - Filter by entity type
 * @param {String} options.entityId - Filter by entity ID
 * @param {String} options.startDate - Filter by start date
 * @param {String} options.endDate - Filter by end date
 * @returns {Promise<Object>} Paginated audit logs
 */
const getAuditLogs = async (options = {}) => {
  try {
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
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const replacements = {
      limit: parseInt(limit),
      offset
    };
    
    if (userId) {
      whereClause += ' AND user_id = :userId';
      replacements.userId = userId;
    }
    
    if (action) {
      whereClause += ' AND action = :action';
      replacements.action = action;
    }
    
    if (entityType) {
      whereClause += ' AND entity_type = :entityType';
      replacements.entityType = entityType;
    }
    
    if (entityId) {
      whereClause += ' AND entity_id = :entityId';
      replacements.entityId = entityId;
    }
    
    if (startDate) {
      whereClause += ' AND created_at >= :startDate';
      replacements.startDate = new Date(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND created_at <= :endDate';
      replacements.endDate = new Date(endDate);
    }
    
    // Build ORDER BY clause
    const allowedSortFields = ['id', 'user_id', 'action', 'entity_type', 'created_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    const total = parseInt(countResult.total);
    
    // Get audit logs
    const auditLogs = await sequelize.query(`
      SELECT *
      FROM audit_logs
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    // Parse details field
    auditLogs.forEach(log => {
      try {
        if (log.details) {
          log.details = JSON.parse(log.details);
        }
      } catch (error) {
        logger.warn(`Failed to parse audit log details: ${error.message}`);
      }
    });
    
    return {
      auditLogs,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    };
  } catch (error) {
    logger.error(`Failed to get audit logs: ${error.message}`, { error });
    throw new Error(`Failed to retrieve audit logs: ${error.message}`);
  }
};

/**
 * Get audit log by ID
 * @param {Number} id - Audit log ID
 * @returns {Promise<Object>} Audit log details
 */
const getAuditLogById = async (id) => {
  try {
    const [auditLog] = await sequelize.query(`
      SELECT *
      FROM audit_logs
      WHERE id = :id
    `, {
      replacements: { id },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!auditLog) {
      throw new Error(`Audit log with ID ${id} not found`);
    }
    
    // Parse details field
    try {
      if (auditLog.details) {
        auditLog.details = JSON.parse(auditLog.details);
      }
    } catch (error) {
      logger.warn(`Failed to parse audit log details: ${error.message}`);
    }
    
    return auditLog;
  } catch (error) {
    logger.error(`Failed to get audit log: ${error.message}`, { id, error });
    throw new Error(`Failed to retrieve audit log: ${error.message}`);
  }
};

/**
 * Get summary of audit logs
 * @returns {Promise<Object>} Audit log summary
 */
const getAuditSummary = async () => {
  try {
    // Get action counts
    const actionCounts = await sequelize.query(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get entity type counts
    const entityCounts = await sequelize.query(`
      SELECT entity_type, COUNT(*) as count
      FROM audit_logs
      WHERE entity_type IS NOT NULL
      GROUP BY entity_type
      ORDER BY count DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get user counts
    const userCounts = await sequelize.query(`
      SELECT user_id, COUNT(*) as count
      FROM audit_logs
      WHERE user_id IS NOT NULL
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get daily count for the last 30 days
    const dailyCounts = await sequelize.query(`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });
    
    return {
      actions: actionCounts,
      entityTypes: entityCounts,
      topUsers: userCounts,
      dailyActivity: dailyCounts
    };
  } catch (error) {
    logger.error(`Failed to get audit summary: ${error.message}`, { error });
    throw new Error(`Failed to retrieve audit summary: ${error.message}`);
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getAuditLogById,
  getAuditSummary
}; 