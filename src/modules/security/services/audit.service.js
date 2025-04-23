const { AuditLog } = require('../models/AuditLog');
const logger = require('../../../shared/utils/logger');
const { Op, sequelize } = require('sequelize');

/**
 * Log a security-related action
 * @param {Object} data - Audit log data
 * @param {string} data.action - Action performed
 * @param {string} data.entity_type - Type of entity
 * @param {number} data.entity_id - ID of entity
 * @param {string} data.description - Description of action
 * @param {Object} data.metadata - Additional metadata
 * @param {number} data.user_id - ID of user who performed the action
 * @param {string} data.ip_address - IP address of the client
 * @param {string} data.user_agent - User agent of the client
 * @returns {Object} Created audit log
 */
const logAction = async (data) => {
  try {
    const auditLog = await AuditLog.create({
      user_id: data.user_id,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      description: data.description,
      metadata: data.metadata || {},
      ip_address: data.ip_address,
      user_agent: data.user_agent
    });

    logger.info(`Audit log created: ${auditLog.id}, Action: ${data.action}`, {
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id
    });
    
    return auditLog;
  } catch (error) {
    logger.error(`Error creating audit log: ${error.message}`, { data });
    // Don't throw the error, just log it - audit logs should never break functionality
    return null;
  }
};

/**
 * Get all audit logs with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Number of items per page
 * @param {string} options.action - Filter by action
 * @param {string} options.entity_type - Filter by entity type
 * @param {number} options.entity_id - Filter by entity ID
 * @param {number} options.user_id - Filter by user ID
 * @param {Date} options.start_date - Filter by start date
 * @param {Date} options.end_date - Filter by end date
 * @returns {Object} Audit logs with pagination info
 */
const getAuditLogs = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    action,
    entity_type,
    entity_id,
    user_id,
    start_date,
    end_date
  } = options;
  
  const offset = (page - 1) * limit;
  
  const query = {
    limit,
    offset,
    order: [['created_at', 'DESC']],
    where: {}
  };
  
  // Add filters
  if (action) {
    query.where.action = action;
  }
  
  if (entity_type) {
    query.where.entity_type = entity_type;
  }
  
  if (entity_id) {
    query.where.entity_id = entity_id;
  }
  
  if (user_id) {
    query.where.user_id = user_id;
  }
  
  if (start_date && end_date) {
    query.where.created_at = {
      [Op.between]: [new Date(start_date), new Date(end_date)]
    };
  } else if (start_date) {
    query.where.created_at = {
      [Op.gte]: new Date(start_date)
    };
  } else if (end_date) {
    query.where.created_at = {
      [Op.lte]: new Date(end_date)
    };
  }
  
  const { rows, count } = await AuditLog.findAndCountAll(query);
  
  return {
    audit_logs: rows,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_items: count,
      items_per_page: limit
    }
  };
};

/**
 * Get security events summarized by type, useful for dashboards
 * @param {Date} startDate - Start date for the summary
 * @param {Date} endDate - End date for the summary
 * @returns {Object} Summary of security events
 */
const getSecuritySummary = async (startDate, endDate) => {
  try {
    // Get count of events by action
    const actionCounts = await AuditLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      group: ['action'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    // Get count of events by entity type
    const entityTypeCounts = await AuditLog.findAll({
      attributes: [
        'entity_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        },
        entity_type: {
          [Op.ne]: null
        }
      },
      group: ['entity_type'],
      order: [[sequelize.literal('count'), 'DESC']]
    });

    return {
      period: {
        start_date: startDate,
        end_date: endDate
      },
      actions: actionCounts.map(item => ({
        action: item.action,
        count: parseInt(item.get('count'), 10)
      })),
      entity_types: entityTypeCounts.map(item => ({
        entity_type: item.entity_type,
        count: parseInt(item.get('count'), 10)
      }))
    };
  } catch (error) {
    logger.error(`Error getting security summary: ${error.message}`);
    throw error;
  }
};

module.exports = {
  logAction,
  getAuditLogs,
  getSecuritySummary
}; 