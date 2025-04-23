/**
 * Audit middleware
 * Automatically logs actions to the audit log
 */
const { logAction } = require('../../modules/system/services/audit.service');
const logger = require('../utils/logger');

/**
 * Create audit log middleware factory
 * @param {String} action - Action being performed
 * @param {Function} getEntityInfo - Function to extract entity info from request
 * @returns {Function} Express middleware
 */
const auditAction = (action, getEntityInfo = () => ({})) => {
  return async (req, res, next) => {
    try {
      // Run the next middleware first
      next();
      
      // Extract entity info from request
      const entityInfo = getEntityInfo(req);
      const { entityType, entityId, details } = entityInfo;
      
      // Extract user ID from request
      const userId = req.user ? req.user.id : null;
      
      // Log the action
      await logAction({
        userId,
        action,
        entityType,
        entityId,
        details
      });
    } catch (error) {
      // Just log the error, don't disrupt the request flow
      logger.error(`Failed to log audit action: ${error.message}`, {
        error,
        action,
        userId: req.user ? req.user.id : null
      });
      
      // Don't call next() again since we already called it
    }
  };
};

/**
 * Audit middleware for CRUD operations
 */
module.exports = {
  /**
   * Log create action
   * @param {String} entityType - Type of entity created
   * @param {Function} getEntityId - Function to extract entity ID from response
   * @returns {Function} Express middleware
   */
  create: (entityType, getEntityId = (req) => req.params.id) => {
    return auditAction(`${entityType}:create`, (req) => ({
      entityType,
      entityId: getEntityId(req),
      details: { body: req.body }
    }));
  },
  
  /**
   * Log read action
   * @param {String} entityType - Type of entity read
   * @returns {Function} Express middleware
   */
  read: (entityType) => {
    return auditAction(`${entityType}:read`, (req) => ({
      entityType,
      entityId: req.params.id,
      details: { query: req.query }
    }));
  },
  
  /**
   * Log update action
   * @param {String} entityType - Type of entity updated
   * @returns {Function} Express middleware
   */
  update: (entityType) => {
    return auditAction(`${entityType}:update`, (req) => ({
      entityType,
      entityId: req.params.id,
      details: { body: req.body }
    }));
  },
  
  /**
   * Log delete action
   * @param {String} entityType - Type of entity deleted
   * @returns {Function} Express middleware
   */
  delete: (entityType) => {
    return auditAction(`${entityType}:delete`, (req) => ({
      entityType,
      entityId: req.params.id
    }));
  },
  
  /**
   * Log custom action
   * @param {String} action - Action name
   * @param {String} entityType - Type of entity
   * @param {Function} getEntityInfo - Function to extract entity info from request
   * @returns {Function} Express middleware
   */
  custom: (action, entityType, getEntityInfo) => {
    return auditAction(action, (req) => {
      const info = getEntityInfo ? getEntityInfo(req) : {};
      return { entityType, ...info };
    });
  }
}; 