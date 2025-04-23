/**
 * Backup service
 * Handles database backup and restore operations
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../shared/utils/logger');
const config = require('../../../shared/config');
const { sequelize } = require('../../../shared/database');

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);

// Create backup directory if it doesn't exist
const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a database backup
 * @param {Object} options - Backup options
 * @param {String} options.description - Backup description
 * @param {String} options.createdBy - User ID who created the backup
 * @returns {Promise<Object>} Backup details
 */
const createBackup = async (options = {}) => {
  try {
    const { description = 'Manual backup', createdBy = 'system' } = options;

    // Generate backup file name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = uuidv4().slice(0, 8);
    const fileName = `backup-${timestamp}-${backupId}.sql.gz`;
    const filePath = path.join(BACKUP_DIR, fileName);

    // Get database connection details from config
    const dbConfig = config.database;
    const { database, username, password, host, port } = dbConfig;

    // Create command with password handling
    let command;

    if (password) {
      // Use PGPASSWORD environment variable to avoid password in command
      command = `PGPASSWORD='${password}' pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists | gzip > ${filePath}`;
    } else {
      command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} --clean --if-exists | gzip > ${filePath}`;
    }

    // Execute backup command
    logger.info(`Starting database backup to ${fileName}`);
    await execPromise(command);

    // Check if backup file was created and get size
    const stats = fs.statSync(filePath);
    const fileSizeBytes = stats.size;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    const backupDetails = {
      id: backupId,
      fileName,
      filePath,
      fileSizeBytes,
      fileSizeMB: `${fileSizeMB} MB`,
      timestamp: new Date().toISOString(),
      description,
      createdBy
    };

    logger.info(`Database backup completed: ${fileName} (${fileSizeMB} MB)`);

    // Save backup record to database
    await sequelize.query(`
      INSERT INTO backup_history
      (backup_id, file_name, file_path, file_size_bytes, description, created_by, created_at)
      VALUES
      (:backup_id, :file_name, :file_path, :file_size_bytes, :description, :created_by, :created_at)
    `, {
      replacements: {
        backup_id: backupId,
        file_name: fileName,
        file_path: filePath,
        file_size_bytes: fileSizeBytes,
        description,
        created_by: createdBy,
        created_at: new Date()
      },
      type: sequelize.QueryTypes.INSERT
    }).catch(error => {
      // If table doesn't exist yet, just log it
      logger.warn(`Failed to record backup history: ${error.message}`);
    });

    return backupDetails;
  } catch (error) {
    logger.error(`Backup failed: ${error.message}`, { error });
    throw new Error(`Backup operation failed: ${error.message}`);
  }
};

/**
 * Restore database from backup
 * @param {Object} options - Restore options
 * @param {String} options.backupId - Backup ID to restore
 * @param {String} options.restoredBy - User ID who performed the restore
 * @returns {Promise<Object>} Restore operation details
 */
const restoreFromBackup = async (options = {}) => {
  try {
    const { backupId, restoredBy = 'system' } = options;
    
    if (!backupId) {
      throw new Error('Backup ID is required');
    }

    // Find backup record
    let backupRecord;
    
    try {
      // Try to get record from database
      const result = await sequelize.query(`
        SELECT * FROM backup_history
        WHERE backup_id = :backup_id
        ORDER BY created_at DESC
        LIMIT 1
      `, {
        replacements: { backup_id: backupId },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (result && result.length > 0) {
        backupRecord = result[0];
      }
    } catch (error) {
      // If table doesn't exist, we'll try to find file manually
      logger.warn(`Failed to query backup history: ${error.message}`);
    }
    
    // If record not found, try to find file manually
    if (!backupRecord) {
      // Find backup file by ID in filename
      const files = fs.readdirSync(BACKUP_DIR);
      const backupFile = files.find(file => file.includes(backupId));
      
      if (!backupFile) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }
      
      backupRecord = {
        file_path: path.join(BACKUP_DIR, backupFile)
      };
    }

    // Check if backup file exists
    if (!fs.existsSync(backupRecord.file_path)) {
      throw new Error(`Backup file not found: ${backupRecord.file_path}`);
    }

    // Get database connection details from config
    const dbConfig = config.database;
    const { database, username, password, host, port } = dbConfig;

    // Create restore command
    let command;

    if (password) {
      // Use PGPASSWORD environment variable to avoid password in command
      command = `gunzip -c ${backupRecord.file_path} | PGPASSWORD='${password}' psql -h ${host} -p ${port} -U ${username} -d ${database}`;
    } else {
      command = `gunzip -c ${backupRecord.file_path} | psql -h ${host} -p ${port} -U ${username} -d ${database}`;
    }

    // Execute restore command
    logger.info(`Starting database restore from ${path.basename(backupRecord.file_path)}`);
    await execPromise(command);

    // Log restore operation
    const restoreDetails = {
      backupId,
      timestamp: new Date().toISOString(),
      success: true,
      restoredBy
    };

    logger.info(`Database restore completed successfully from backup ${backupId}`);

    // Save restore record to database
    await sequelize.query(`
      INSERT INTO restore_history
      (backup_id, restored_by, restored_at, status)
      VALUES
      (:backup_id, :restored_by, :restored_at, 'successful')
    `, {
      replacements: {
        backup_id: backupId,
        restored_by: restoredBy,
        restored_at: new Date()
      },
      type: sequelize.QueryTypes.INSERT
    }).catch(error => {
      // If table doesn't exist yet, just log it
      logger.warn(`Failed to record restore history: ${error.message}`);
    });

    return restoreDetails;
  } catch (error) {
    logger.error(`Restore failed: ${error.message}`, { error });
    
    // Log failed restore attempt
    try {
      await sequelize.query(`
        INSERT INTO restore_history
        (backup_id, restored_by, restored_at, status, error_message)
        VALUES
        (:backup_id, :restored_by, :restored_at, 'failed', :error_message)
      `, {
        replacements: {
          backup_id: options.backupId || 'unknown',
          restored_by: options.restoredBy || 'system',
          restored_at: new Date(),
          error_message: error.message
        },
        type: sequelize.QueryTypes.INSERT
      }).catch(() => {
        // Ignore errors if table doesn't exist
      });
    } catch (logError) {
      logger.warn(`Failed to log restore failure: ${logError.message}`);
    }
    
    throw new Error(`Restore operation failed: ${error.message}`);
  }
};

/**
 * Get list of available backups
 * @param {Object} options - Query options
 * @param {Number} options.limit - Maximum number of backups to return
 * @param {Number} options.offset - Number of backups to skip
 * @returns {Promise<Array>} List of backups
 */
const getBackups = async (options = {}) => {
  try {
    const { limit = 20, offset = 0 } = options;
    
    // Try to get backups from database
    try {
      const result = await sequelize.query(`
        SELECT * FROM backup_history
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
      `, {
        replacements: { limit, offset },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (result && result.length > 0) {
        return result;
      }
    } catch (error) {
      // If table doesn't exist, fallback to file system
      logger.warn(`Failed to query backup history: ${error.message}`);
    }
    
    // Fallback to file system if database table doesn't exist
    const files = fs.readdirSync(BACKUP_DIR).filter(file => file.startsWith('backup-') && file.endsWith('.sql.gz'));
    
    // Sort by modification time (newest first)
    files.sort((a, b) => {
      const statA = fs.statSync(path.join(BACKUP_DIR, a));
      const statB = fs.statSync(path.join(BACKUP_DIR, b));
      return statB.mtime.getTime() - statA.mtime.getTime();
    });
    
    // Apply limit and offset
    const paginatedFiles = files.slice(offset, offset + limit);
    
    // Map files to backup objects
    return paginatedFiles.map(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      const fileSizeBytes = stats.size;
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);
      
      // Extract backup ID from filename (format: backup-timestamp-id.sql.gz)
      const parts = file.split('-');
      const backupId = parts[parts.length - 1].replace('.sql.gz', '');
      
      return {
        backup_id: backupId,
        file_name: file,
        file_path: path.join(BACKUP_DIR, file),
        file_size_bytes: fileSizeBytes,
        file_size_mb: `${fileSizeMB} MB`,
        created_at: stats.mtime.toISOString(),
        description: 'System backup',
        created_by: 'system'
      };
    });
  } catch (error) {
    logger.error(`Failed to get backups: ${error.message}`, { error });
    throw new Error(`Failed to retrieve backups: ${error.message}`);
  }
};

/**
 * Delete a backup
 * @param {String} backupId - Backup ID to delete
 * @returns {Promise<Boolean>} Success status
 */
const deleteBackup = async (backupId) => {
  try {
    if (!backupId) {
      throw new Error('Backup ID is required');
    }
    
    // Find backup record
    let backupRecord;
    
    try {
      // Try to get record from database
      const result = await sequelize.query(`
        SELECT * FROM backup_history
        WHERE backup_id = :backup_id
        LIMIT 1
      `, {
        replacements: { backup_id: backupId },
        type: sequelize.QueryTypes.SELECT
      });
      
      if (result && result.length > 0) {
        backupRecord = result[0];
      }
    } catch (error) {
      // If table doesn't exist, we'll try to find file manually
      logger.warn(`Failed to query backup history: ${error.message}`);
    }
    
    // If record not found, try to find file manually
    if (!backupRecord) {
      // Find backup file by ID in filename
      const files = fs.readdirSync(BACKUP_DIR);
      const backupFile = files.find(file => file.includes(backupId));
      
      if (!backupFile) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }
      
      backupRecord = {
        file_path: path.join(BACKUP_DIR, backupFile),
        file_name: backupFile
      };
    }
    
    // Check if backup file exists
    if (fs.existsSync(backupRecord.file_path)) {
      // Delete the backup file
      fs.unlinkSync(backupRecord.file_path);
    }
    
    // Delete from database if record exists
    try {
      await sequelize.query(`
        DELETE FROM backup_history
        WHERE backup_id = :backup_id
      `, {
        replacements: { backup_id: backupId },
        type: sequelize.QueryTypes.DELETE
      });
    } catch (error) {
      // Ignore if table doesn't exist
      logger.debug(`Failed to delete from backup history: ${error.message}`);
    }
    
    logger.info(`Backup deleted: ${backupRecord.file_name}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete backup: ${error.message}`, { error });
    throw new Error(`Failed to delete backup: ${error.message}`);
  }
};

module.exports = {
  createBackup,
  restoreFromBackup,
  getBackups,
  deleteBackup
}; 