const apiKeyService = require('../services/api-key.service');
const { AuthenticationError } = require('../../../shared/errors');
const logger = require('../../../shared/utils/logger');

/**
 * Middleware to authenticate requests using API key
 * Extracts API key from x-api-key header and validates it
 */
const requireApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('x-api-key');
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }
    
    const apiKeyObj = await apiKeyService.validateApiKey(apiKey);
    
    if (!apiKeyObj) {
      logger.warn('Invalid API key provided', { 
        ip: req.ip || req.connection.remoteAddress,
        endpoint: req.originalUrl
      });
      throw new AuthenticationError('Invalid API key');
    }
    
    // Attach API key info to request for further use
    req.apiKey = {
      id: apiKeyObj.id,
      name: apiKeyObj.name,
      permissions: apiKeyObj.permissions
    };
    
    logger.info(`Request authenticated with API key: ${apiKeyObj.id}`);
    
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: {
          message: error.message,
          code: 'AUTH_004'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    logger.error(`API key authentication error: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_005'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware to check API key permissions
 * @param {Array|String} requiredPermissions - Required permissions
 */
const requirePermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return (req, res, next) => {
    try {
      if (!req.apiKey) {
        throw new AuthenticationError('API key is required');
      }
      
      const hasPermission = permissions.some(permission => 
        req.apiKey.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        logger.warn('API key permission denied', {
          keyId: req.apiKey.id,
          requiredPermissions: permissions,
          actualPermissions: req.apiKey.permissions
        });
        
        return res.status(403).json({
          success: false,
          error: {
            message: 'You do not have the required permissions',
            code: 'AUTH_006'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(401).json({
          success: false,
          error: {
            message: error.message,
            code: 'AUTH_007'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      logger.error(`API key permission error: ${error.message}`);
      
      return res.status(500).json({
        success: false,
        error: {
          message: 'Permission check failed',
          code: 'AUTH_008'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
};

module.exports = {
  requireApiKey,
  requirePermission
}; 