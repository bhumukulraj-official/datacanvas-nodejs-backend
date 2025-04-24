/**
 * Backup Service
 * Handles database backup, restore, and backup management
 * Uses a file-based registry to track backups without database dependencies
 */
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../../config/database');
const logger = require('../../../shared/utils/logger');
const asyncLock = require('async-lock');

const execPromise = util.promisify(exec);

// Lock for synchronizing access to the backup registry file
const lock = new asyncLock();

// Define backup storage locations
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const REGISTRY_FILE = path.join(BACKUP_DIR, 'backup-registry.json');

// Ensure backup directory exists
const ensureBackupDirExists = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    logger.error(`Failed to create backup directory: ${error.message}`);
    throw new Error('Failed to create backup directory');
  }
};

// Initialize backup registry if it doesn't exist
const initializeRegistry = async () => {
  try {
    await ensureBackupDirExists();
    
    try {
      await fs.access(REGISTRY_FILE);
    } catch (error) {
      // Registry file doesn't exist, create it
      await fs.writeFile(REGISTRY_FILE, JSON.stringify({ backups: [] }));
      logger.info('Created new backup registry file');
    }
  } catch (error) {
    logger.error(`Failed to initialize backup registry: ${error.message}`);
    throw new Error('Failed to initialize backup system');
  }
};

// Read the backup registry
const readRegistry = async () => {
  try {
    const data = await fs.readFile(REGISTRY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // If the file doesn't exist, initialize it
      await initializeRegistry();
      return { backups: [] };
    }
    logger.error(`Failed to read backup registry: ${error.message}`);
    throw new Error('Failed to read backup registry');
  }
};

// Write to the backup registry (with locking to prevent race conditions)
const writeRegistry = async (registry) => {
  return lock.acquire('registry', async () => {
    try {
      await fs.writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
    } catch (error) {
      logger.error(`Failed to write backup registry: ${error.message}`);
      throw new Error('Failed to update backup registry');
    }
  });
};

/**
 * Create a database backup
 * @param {Object} options - Backup options
 * @param {string} options.description - Backup description
 * @param {number} options.createdBy - ID of user creating the backup
 * @returns {Object} Backup details
 */
exports.createBackup = async ({ description, createdBy }) => {
  // Generate unique ID and filename for the backup
  const backupId = uuidv4();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const filename = `backup-${timestamp}-${backupId}.sql`;
  const backupPath = path.join(BACKUP_DIR, filename);
  
  try {
    await ensureBackupDirExists();
    
    const dbConfig = sequelize.config;
    const dbName = dbConfig.database;
    const dbHost = dbConfig.host;
    const dbPort = dbConfig.port;
    const dbUser = dbConfig.username;
    const dbPassword = dbConfig.password;
    
    // Execute pg_dump to create backup
    logger.info(`Creating database backup: ${filename}`);
    
    // Use environment variables for password to avoid it appearing in process list
    process.env.PGPASSWORD = dbPassword;
    
    const command = `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F p -b -v -f "${backupPath}" ${dbName}`;
    
    const { stderr } = await execPromise(command);
    
    // Log any warnings but don't fail
    if (stderr) {
      logger.warn(`pg_dump warnings: ${stderr}`);
    }
    
    // Get file size
    const stats = await fs.stat(backupPath);
    const sizeInBytes = stats.size;
    
    // Create backup registry entry
    const backup = {
      id: backupId,
      filename,
      description: description || `Backup created on ${new Date().toISOString()}`,
      createdBy,
      createdAt: new Date().toISOString(),
      size: formatBytes(sizeInBytes),
      sizeInBytes,
      path: backupPath
    };
    
    // Update registry
    const registry = await readRegistry();
    registry.backups.push(backup);
    await writeRegistry(registry);
    
    return backup;
  } catch (error) {
    logger.error(`Backup creation failed: ${error.message}`);
    // Attempt to clean up failed backup file
    try {
      await fs.access(backupPath);
      await fs.unlink(backupPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to create backup: ${error.message}`);
  } finally {
    // Clear environment variable
    delete process.env.PGPASSWORD;
  }
};

/**
 * Restore database from backup
 * @param {Object} options - Restore options
 * @param {string} options.backupId - ID of backup to restore
 * @param {number} options.restoredBy - ID of user performing restore
 * @returns {Object} Restore result
 */
exports.restoreFromBackup = async ({ backupId, restoredBy }) => {
  const registry = await readRegistry();
  const backup = registry.backups.find(b => b.id === backupId);
  
  if (!backup) {
    throw new Error(`Backup with ID ${backupId} not found`);
  }
  
  const backupPath = backup.path;
  
  try {
    // Check if backup file exists
    await fs.access(backupPath);
    
    const dbConfig = sequelize.config;
    const dbName = dbConfig.database;
    const dbHost = dbConfig.host;
    const dbPort = dbConfig.port;
    const dbUser = dbConfig.username;
    const dbPassword = dbConfig.password;
    
    logger.info(`Restoring database from backup: ${backup.filename}`);
    
    // Use environment variables for password to avoid it appearing in process list
    process.env.PGPASSWORD = dbPassword;
    
    // First, disconnect all existing connections except ours
    await sequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid()
    `);
    
    // Drop and recreate database to ensure clean state
    await sequelize.query(`DROP DATABASE IF EXISTS ${dbName}_temp`);
    await sequelize.query(`CREATE DATABASE ${dbName}_temp`);
    
    // Restore into temporary database first to validate backup integrity
    const restoreCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName}_temp -f "${backupPath}"`;
    
    const { stderr } = await execPromise(restoreCommand);
    
    // Log any warnings
    if (stderr) {
      logger.warn(`psql restore warnings: ${stderr}`);
    }
    
    // Swap the databases
    await sequelize.query(`DROP DATABASE IF EXISTS ${dbName}_old`);
    
    // Disconnect all users from main database
    await sequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${dbName}'
      AND pid <> pg_backend_pid()
    `);
    
    await sequelize.query(`ALTER DATABASE ${dbName} RENAME TO ${dbName}_old`);
    await sequelize.query(`ALTER DATABASE ${dbName}_temp RENAME TO ${dbName}`);
    
    // Update backup registry
    const restoreInfo = {
      backupId,
      restoredBy,
      restoredAt: new Date().toISOString(),
      successful: true
    };
    
    // Add restore information to the backup entry
    const backupIndex = registry.backups.findIndex(b => b.id === backupId);
    registry.backups[backupIndex].lastRestored = restoreInfo;
    
    await writeRegistry(registry);
    
    logger.info(`Database restored successfully from backup: ${backup.filename}`);
    
    return {
      backup,
      restore: restoreInfo
    };
  } catch (error) {
    logger.error(`Database restore failed: ${error.message}`);
    throw new Error(`Failed to restore database: ${error.message}`);
  } finally {
    // Clear environment variable
    delete process.env.PGPASSWORD;
  }
};

/**
 * Get list of available backups with pagination
 * @param {Object} options - List options
 * @param {number} options.limit - Number of backups to return
 * @param {number} options.offset - Number of backups to skip
 * @returns {Object} Paginated backups with total count
 */
exports.getBackups = async ({ limit = 20, offset = 0 }) => {
  const registry = await readRegistry();
  
  // Sort backups by creation date (newest first) and apply pagination
  const sortedBackups = registry.backups
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const paginatedBackups = sortedBackups.slice(offset, offset + limit);
  
  // Return with pagination metadata
  return {
    backups: paginatedBackups,
    total: registry.backups.length,
    limit,
    offset
  };
};

/**
 * Delete a backup
 * @param {string} backupId - ID of backup to delete
 * @returns {boolean} Success status
 */
exports.deleteBackup = async (backupId) => {
  const registry = await readRegistry();
  const backup = registry.backups.find(b => b.id === backupId);
  
  if (!backup) {
    throw new Error(`Backup with ID ${backupId} not found`);
  }
  
  try {
    // Delete the actual backup file
    await fs.unlink(backup.path);
    
    // Update registry
    registry.backups = registry.backups.filter(b => b.id !== backupId);
    await writeRegistry(registry);
    
    logger.info(`Backup deleted: ${backup.filename}`);
    
    return true;
  } catch (error) {
    logger.error(`Failed to delete backup: ${error.message}`);
    throw new Error(`Failed to delete backup: ${error.message}`);
  }
};

/**
 * Schedule a backup
 * @param {Object} options - Schedule options
 * @param {string} options.cronExpression - Cron expression for scheduling
 * @param {string} options.description - Backup description
 * @param {number} options.userId - ID of user scheduling the backup
 * @param {number} options.retentionCount - Number of backups to retain
 * @returns {Object} Schedule details
 */
exports.scheduleBackup = async ({ cronExpression, description, userId, retentionCount = 5 }) => {
  // This implementation stores schedule in the file registry
  // A production system would use a proper job scheduler like node-cron or a dedicated task queue
  
  // Read current registry
  const registry = await readRegistry();
  
  // Initialize schedules array if it doesn't exist
  if (!registry.schedules) {
    registry.schedules = [];
  }
  
  // Create schedule entry
  const scheduleId = uuidv4();
  const schedule = {
    id: scheduleId,
    cronExpression,
    description,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    retentionCount,
    isActive: true
  };
  
  // Add to registry
  registry.schedules.push(schedule);
  await writeRegistry(registry);
  
  logger.info(`Backup schedule created: ${description}`);
  
  // In a real implementation, we would register this with a scheduler
  // For this example, we just store the configuration
  
  return schedule;
};

/**
 * Get list of backup schedules
 * @returns {Array} List of backup schedules
 */
exports.getBackupSchedules = async () => {
  const registry = await readRegistry();
  return registry.schedules || [];
};

/**
 * Verify a backup is valid
 * @param {string} backupId - ID of backup to verify
 * @returns {Object} Verification result
 */
exports.verifyBackup = async (backupId) => {
  const registry = await readRegistry();
  const backup = registry.backups.find(b => b.id === backupId);
  
  if (!backup) {
    throw new Error(`Backup with ID ${backupId} not found`);
  }
  
  try {
    // Check if backup file exists
    await fs.access(backup.path);
    
    // Verify file integrity by checking if it's a valid PostgreSQL dump
    // This is a simplified check - it just ensures the file starts with PostgreSQL dump header
    const fileHeader = await readFileHeader(backup.path, 100);
    const isValidDump = fileHeader.includes('PostgreSQL database dump');
    
    const verificationResult = {
      id: backupId,
      filename: backup.filename,
      verifiedAt: new Date().toISOString(),
      isValid: isValidDump,
      message: isValidDump ? 'Backup file is valid' : 'Backup file format is invalid'
    };
    
    // Update registry with verification result
    const backupIndex = registry.backups.findIndex(b => b.id === backupId);
    registry.backups[backupIndex].lastVerified = verificationResult;
    
    await writeRegistry(registry);
    
    return verificationResult;
  } catch (error) {
    logger.error(`Backup verification failed: ${error.message}`);
    
    // Record the failed verification
    const verificationResult = {
      id: backupId,
      filename: backup.filename,
      verifiedAt: new Date().toISOString(),
      isValid: false,
      message: `Verification failed: ${error.message}`
    };
    
    // Update registry with verification result
    const backupIndex = registry.backups.findIndex(b => b.id === backupId);
    registry.backups[backupIndex].lastVerified = verificationResult;
    
    await writeRegistry(registry);
    
    return verificationResult;
  }
};

/**
 * Read the beginning of a file
 * @param {string} filePath - Path to file
 * @param {number} bytes - Number of bytes to read
 * @returns {string} File header
 */
const readFileHeader = async (filePath, bytes) => {
  const fileHandle = await fs.open(filePath, 'r');
  const buffer = Buffer.alloc(bytes);
  
  try {
    await fileHandle.read(buffer, 0, bytes, 0);
    return buffer.toString();
  } finally {
    await fileHandle.close();
  }
};

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}; 