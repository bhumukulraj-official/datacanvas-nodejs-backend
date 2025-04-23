/**
 * Backup controller
 * Handles HTTP requests for backup and restore operations
 */
const backupService = require('../services/backup.service');
const { catchAsync } = require('../../../shared/utils/errors');

/**
 * Create a database backup
 * @route POST /api/v1/admin/system/backup
 */
exports.createBackup = catchAsync(async (req, res) => {
  const { description } = req.body;
  const userId = req.user.id;
  
  const backup = await backupService.createBackup({
    description,
    createdBy: userId
  });
  
  res.status(200).json({
    success: true,
    message: 'Database backup created successfully',
    data: backup
  });
});

/**
 * Restore database from backup
 * @route POST /api/v1/admin/system/restore
 */
exports.restoreFromBackup = catchAsync(async (req, res) => {
  const { backupId } = req.body;
  const userId = req.user.id;
  
  const result = await backupService.restoreFromBackup({
    backupId,
    restoredBy: userId
  });
  
  res.status(200).json({
    success: true,
    message: 'Database restored successfully',
    data: result
  });
});

/**
 * Get list of available backups
 * @route GET /api/v1/admin/system/backup
 */
exports.getBackups = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const offset = (parseInt(page) - 1) * parseInt(limit);
  
  const backups = await backupService.getBackups({
    limit: parseInt(limit),
    offset
  });
  
  res.status(200).json({
    success: true,
    message: 'Backups retrieved successfully',
    data: {
      backups,
      page: parseInt(page),
      limit: parseInt(limit),
      total: backups.length, // This is just the page total, ideally we'd have the grand total
    }
  });
});

/**
 * Delete a backup
 * @route DELETE /api/v1/admin/system/backup/:backupId
 */
exports.deleteBackup = catchAsync(async (req, res) => {
  const { backupId } = req.params;
  
  await backupService.deleteBackup(backupId);
  
  res.status(200).json({
    success: true,
    message: 'Backup deleted successfully'
  });
}); 