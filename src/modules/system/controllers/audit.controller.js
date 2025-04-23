/**
 * Audit controller
 * Handles HTTP requests for audit log operations
 */
const auditService = require('../services/audit.service');
const { catchAsync } = require('../../../shared/utils/errors');

/**
 * Get audit logs with filtering and pagination
 * @route GET /api/v1/admin/system/audit
 */
exports.getAuditLogs = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    sortBy,
    sortOrder
  } = req.query;
  
  const result = await auditService.getAuditLogs({
    page,
    limit,
    userId,
    action,
    entityType,
    entityId,
    startDate,
    endDate,
    sortBy,
    sortOrder
  });
  
  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: result
  });
});

/**
 * Get audit log by ID
 * @route GET /api/v1/admin/system/audit/:id
 */
exports.getAuditLogById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const auditLog = await auditService.getAuditLogById(id);
  
  res.status(200).json({
    success: true,
    message: 'Audit log retrieved successfully',
    data: auditLog
  });
});

/**
 * Create an audit log entry (manual logging)
 * @route POST /api/v1/admin/system/audit
 */
exports.createAuditLog = catchAsync(async (req, res) => {
  const { action, entityType, entityId, details } = req.body;
  const userId = req.user.id;
  
  const auditLog = await auditService.logAction({
    userId,
    action,
    entityType,
    entityId,
    details
  });
  
  res.status(201).json({
    success: true,
    message: 'Audit log created successfully',
    data: auditLog
  });
});

/**
 * Get audit summary statistics
 * @route GET /api/v1/admin/system/audit/summary
 */
exports.getAuditSummary = catchAsync(async (req, res) => {
  const summary = await auditService.getAuditSummary();
  
  res.status(200).json({
    success: true,
    message: 'Audit summary retrieved successfully',
    data: summary
  });
}); 