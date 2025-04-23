/**
 * Audit middleware
 * Automatically logs actions to the audit log
 */
const { logAction } = require('../../modules/system/services/audit.service');
const logger = require('../utils/logger');
const AuditLog = require('../../modules/auth/models/AuditLog');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

/**
 * Paths that should not be audited to avoid excessive logging
 */
const EXCLUDED_PATHS = [
  '/health',
  '/api/health',
  '/favicon.ico'
];

/**
 * Sensitive paths that require detailed auditing
 */
const SENSITIVE_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/change-password',
  '/api/v1/auth/reset-password'
];

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

/**
 * Enhanced Audit logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 * @param {Function} next - Express next middleware function
 */
exports.auditLog = async (req, res, next) => {
  // Skip logging for excluded paths
  if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Store original end function to wrap it
  const originalEnd = res.end;
  const startTime = new Date();
  
  // Get geolocation info from IP
  const ip = req.headers['x-forwarded-for'] || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress || 
             req.ip || '0.0.0.0';
  
  // Clean up IP if it contains multiple addresses
  const clientIp = ip.includes(',') ? ip.split(',')[0].trim() : ip;
  
  // Get geolocation data if available
  const geo = geoip.lookup(clientIp) || {};
  
  // Parse user agent
  const userAgent = req.headers['user-agent'] || '';
  const uaParser = new UAParser(userAgent);
  const uaParsed = uaParser.getResult();
  
  // Override the end function to log after response is sent
  res.end = function(chunk, encoding) {
    // Restore original end
    res.end = originalEnd;
    
    // Call original end
    res.end(chunk, encoding);
    
    // Calculate request duration
    const endTime = new Date();
    const duration = endTime - startTime;
    
    // Store masked request body (remove sensitive data)
    const maskedBody = { ...req.body };
    
    // Mask sensitive fields
    if (maskedBody.password) maskedBody.password = '[REDACTED]';
    if (maskedBody.currentPassword) maskedBody.currentPassword = '[REDACTED]';
    if (maskedBody.newPassword) maskedBody.newPassword = '[REDACTED]';
    if (maskedBody.token) maskedBody.token = maskedBody.token.substring(0, 10) + '...';
    if (maskedBody.refreshToken) maskedBody.refreshToken = maskedBody.refreshToken.substring(0, 10) + '...';
    
    // Enhanced metadata for authentication event tracking
    const metadata = {
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      responseTime: duration,
      geo: {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone
      },
      device: {
        browser: uaParsed.browser.name,
        browserVersion: uaParsed.browser.version,
        os: uaParsed.os.name,
        osVersion: uaParsed.os.version,
        deviceType: uaParsed.device.type || 'desktop',
        deviceVendor: uaParsed.device.vendor,
        deviceModel: uaParsed.device.model
      }
    };
    
    // Only include body in sensitive paths
    if (SENSITIVE_PATHS.some(path => req.path.includes(path))) {
      metadata.body = maskedBody;
    }
    
    // Determine entity type and ID based on path
    let entityType = null;
    let entityId = null;
    let action = req.method;
    
    // Map path to entity type and action
    if (req.path.includes('/auth/login')) {
      entityType = 'user';
      action = 'USER_LOGIN';
      entityId = req.user?.id;
    } else if (req.path.includes('/auth/register')) {
      entityType = 'user';
      action = 'USER_REGISTER';
      // entityId will be added later after user creation
    } else if (req.path.includes('/auth/logout')) {
      entityType = 'user';
      action = 'USER_LOGOUT';
      entityId = req.user?.id;
    } else if (req.path.includes('/auth/refresh')) {
      entityType = 'token';
      action = 'TOKEN_REFRESH';
      entityId = req.user?.id;
    } else if (req.path.includes('/auth/change-password')) {
      entityType = 'user';
      action = 'PASSWORD_CHANGE';
      entityId = req.user?.id;
    } else if (req.path.includes('/auth/reset-password')) {
      entityType = 'user';
      action = 'PASSWORD_RESET_REQUEST';
      // entityId will be determined later
    } else if (req.path.includes('/auth/verify-email')) {
      entityType = 'user';
      action = 'EMAIL_VERIFICATION';
      // entityId will be determined later
    }
    
    // Create the audit log entry
    try {
      AuditLog.create({
        user_id: req.user?.id || null,
        action: action,
        entity_type: entityType,
        entity_id: entityId,
        description: `${req.method} ${req.path}`,
        metadata: metadata,
        ip_address: clientIp,
        user_agent: userAgent
      });
    } catch (error) {
      // Log error but don't affect request processing
      console.error('Audit log error:', error);
    }
  };
  
  next();
};

/**
 * Explicitly audit significant security events
 * @param {string} userId - User ID
 * @param {string} action - Action performed
 * @param {string} entityType - Type of entity 
 * @param {number|string} entityId - ID of entity
 * @param {string} description - Description of event
 * @param {Object} metadata - Additional metadata
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent string
 */
exports.auditSecurityEvent = async (
  userId, 
  action, 
  entityType, 
  entityId, 
  description, 
  metadata = {}, 
  ipAddress = null, 
  userAgent = null
) => {
  try {
    await AuditLog.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Security audit log error:', error);
  }
}; 