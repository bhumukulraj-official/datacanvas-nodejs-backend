const auditService = require('../services/audit.service');

/**
 * Get all audit logs with pagination and filtering
 */
exports.listAuditLogs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      action, 
      entity_type, 
      entity_id, 
      user_id, 
      start_date, 
      end_date 
    } = req.query;
    
    const result = await auditService.getAuditLogs({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      action,
      entity_type,
      entity_id: entity_id ? parseInt(entity_id, 10) : undefined,
      user_id: user_id ? parseInt(user_id, 10) : undefined,
      start_date,
      end_date
    });
    
    return res.status(200).json({
      success: true,
      data: result,
      message: 'Audit logs retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new audit log entry
 * Note: This should generally not be called directly, but through the audit service
 */
exports.createAuditLog = async (req, res, next) => {
  try {
    const logData = {
      ...req.body,
      user_id: req.user.id,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent')
    };
    
    const auditLog = await auditService.logAction(logData);
    
    return res.status(201).json({
      success: true,
      data: auditLog,
      message: 'Audit log created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get security events summary
 */
exports.getSecuritySummary = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Start date and end date are required',
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString()
      });
    }
    
    const summary = await auditService.getSecuritySummary(start_date, end_date);
    
    return res.status(200).json({
      success: true,
      data: summary,
      message: 'Security summary retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}; 