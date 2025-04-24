/**
 * Log Service
 * Manages application logs and provides log query functionality
 */
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const logger = require('../../../shared/utils/logger');
const configService = require('./config.service');

// Define log directory location (adjust based on your logger configuration)
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

/**
 * Get available log files
 * @returns {Array} List of log files
 */
exports.getLogFiles = async () => {
  try {
    // Ensure log directory exists
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create log directory: ${error.message}`);
    }
    
    // Get all files in log directory
    const files = await fs.readdir(LOG_DIR);
    
    // Get file stats
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(LOG_DIR, file);
        try {
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            modified: stats.mtime,
            created: stats.birthtime
          };
        } catch (error) {
          return null;
        }
      })
    );
    
    // Filter out files that couldn't be stat'ed
    return fileStats.filter(fileStat => fileStat !== null);
  } catch (error) {
    logger.error(`Failed to get log files: ${error.message}`);
    return [];
  }
};

/**
 * Get log file content
 * @param {string} fileName - Log file name
 * @param {Object} options - Query options
 * @param {number} options.tail - Number of lines to read from the end
 * @param {string} options.filter - Text to filter lines by
 * @param {string} options.level - Log level to filter by (error, warn, info, debug)
 * @param {string} options.startDate - Start date/time to filter logs
 * @param {string} options.endDate - End date/time to filter logs
 * @returns {Object} Log file content and metadata
 */
exports.getLogContent = async (fileName, options = {}) => {
  try {
    const { tail = 100, filter, level, startDate, endDate } = options;
    
    // Security check to prevent path traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(LOG_DIR, sanitizedFileName);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`Log file '${sanitizedFileName}' not found`);
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    
    let content;
    let command = '';
    
    // For large files, use system commands for better performance
    if (stats.size > 1024 * 1024 * 10) { // 10MB
      // Start with tail command
      command = `tail -n ${tail} "${filePath}"`;
      
      // Add grep filter if provided
      if (filter) {
        command += ` | grep -i "${filter.replace(/"/g, '\\"')}"`;
      }
      
      // Add level filter if provided
      if (level) {
        // Adjust pattern based on your log format
        command += ` | grep -i "${level.toUpperCase()}"`;
      }
      
      // Execute command
      const { stdout, stderr } = await exec(command);
      
      if (stderr) {
        logger.warn(`Warning while reading log file: ${stderr}`);
      }
      
      content = stdout;
    } else {
      // For smaller files, read directly
      content = await fs.readFile(filePath, 'utf8');
      
      // Split into lines and process
      let lines = content.split(/\r?\n/);
      
      // Apply filters
      if (filter) {
        const filterLower = filter.toLowerCase();
        lines = lines.filter(line => line.toLowerCase().includes(filterLower));
      }
      
      if (level) {
        const levelUpper = level.toUpperCase();
        lines = lines.filter(line => line.includes(levelUpper));
      }
      
      // Apply date filters if provided
      if (startDate || endDate) {
        lines = filterLinesByDate(lines, startDate, endDate);
      }
      
      // Apply tail
      if (tail) {
        lines = lines.slice(-tail);
      }
      
      content = lines.join('\n');
    }
    
    return {
      fileName: sanitizedFileName,
      path: filePath,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      modified: stats.mtime,
      created: stats.birthtime,
      content
    };
  } catch (error) {
    logger.error(`Failed to read log file: ${error.message}`);
    throw new Error(`Failed to read log file: ${error.message}`);
  }
};

/**
 * Change logging level dynamically
 * @param {string} level - New logging level
 * @returns {boolean} Success status
 */
exports.setLoggingLevel = async (level) => {
  try {
    await configService.setLoggingLevel(level);
    return true;
  } catch (error) {
    logger.error(`Failed to set logging level: ${error.message}`);
    throw error;
  }
};

/**
 * Get current logging configuration
 * @returns {Object} Logging configuration
 */
exports.getLoggingConfig = async () => {
  try {
    const config = await configService.getConfigSection('system');
    return config.logging || {
      level: 'info',
      enableFileLogging: true,
      enableConsoleLogging: true
    };
  } catch (error) {
    logger.error(`Failed to get logging config: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a log file
 * @param {string} fileName - Log file name to delete
 * @returns {boolean} Success status
 */
exports.deleteLogFile = async (fileName) => {
  try {
    // Security check to prevent path traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(LOG_DIR, sanitizedFileName);
    
    // Check if file exists and is within logs directory
    if (!filePath.startsWith(LOG_DIR)) {
      throw new Error('Invalid log file path');
    }
    
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    logger.error(`Failed to delete log file: ${error.message}`);
    throw new Error(`Failed to delete log file: ${error.message}`);
  }
};

/**
 * Archive log files older than specified days
 * @param {number} days - Days to keep logs before archiving
 * @returns {Object} Archive result
 */
exports.archiveOldLogs = async (days = 30) => {
  try {
    const files = await exports.getLogFiles();
    
    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - days));
    
    const archiveDir = path.join(LOG_DIR, 'archive');
    await fs.mkdir(archiveDir, { recursive: true });
    
    const result = {
      archived: [],
      errors: [],
      total: 0
    };
    
    for (const file of files) {
      if (file.modified < cutoffDate) {
        try {
          const archivePath = path.join(archiveDir, file.name);
          await fs.rename(file.path, archivePath);
          result.archived.push(file.name);
          result.total++;
        } catch (error) {
          result.errors.push({
            file: file.name,
            error: error.message
          });
        }
      }
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to archive logs: ${error.message}`);
    throw new Error(`Failed to archive logs: ${error.message}`);
  }
};

/**
 * Filter log lines by date range
 * @param {Array} lines - Log lines
 * @param {string} startDate - Start date
 * @param {string} endDate - End date
 * @returns {Array} Filtered lines
 */
const filterLinesByDate = (lines, startDate, endDate) => {
  // This implementation assumes ISO date format in logs
  // Adjust the regex pattern based on your log format
  const dateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  
  return lines.filter(line => {
    const match = line.match(dateRegex);
    
    if (!match) {
      return false;
    }
    
    const lineDate = new Date(match[0]);
    
    if (start && lineDate < start) {
      return false;
    }
    
    if (end && lineDate > end) {
      return false;
    }
    
    return true;
  });
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