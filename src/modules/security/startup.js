/**
 * Security Module Startup
 * Initializes the security module and registers required services
 */
const logger = require('../../shared/utils/logger');

/**
 * Initialize the security module
 */
const initialize = async () => {
  try {
    logger.info('Initializing security module...');
    
    // Check for duplicate API keys and fix
    await cleanupDuplicateApiKeys();
    
    // Fix any active but expired API keys
    await markExpiredApiKeys();
    
    logger.info('Security module initialized successfully');
  } catch (error) {
    logger.error(`Error initializing security module: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Check for and fix any duplicate API keys
 */
const cleanupDuplicateApiKeys = async () => {
  try {
    const { ApiKey } = require('./models/ApiKey');
    const { Op } = require('sequelize');
    
    // Find API keys with duplicate key_hash values
    const duplicateKeys = await ApiKey.findAll({
      attributes: ['key_hash', [ApiKey.sequelize.fn('COUNT', ApiKey.sequelize.col('key_hash')), 'count']],
      group: ['key_hash'],
      having: ApiKey.sequelize.literal('COUNT(key_hash) > 1')
    });
    
    if (duplicateKeys.length > 0) {
      logger.warn(`Found ${duplicateKeys.length} duplicate API keys, cleaning up...`);
      
      for (const duplicate of duplicateKeys) {
        // Find all instances with this key_hash, ordered by created_at
        const instances = await ApiKey.findAll({
          where: { key_hash: duplicate.key_hash },
          order: [['created_at', 'ASC']]
        });
        
        // Keep the oldest one, mark others as revoked
        for (let i = 1; i < instances.length; i++) {
          await instances[i].update({
            status: 'revoked',
            key_hash: `${instances[i].key_hash}_duplicate_${i}`
          });
          
          logger.info(`Marked duplicate API key ${instances[i].id} as revoked`);
        }
      }
    }
  } catch (error) {
    logger.error(`Error cleaning up duplicate API keys: ${error.message}`);
  }
};

/**
 * Mark any active but expired API keys as inactive
 */
const markExpiredApiKeys = async () => {
  try {
    const { ApiKey } = require('./models/ApiKey');
    const { Op } = require('sequelize');
    
    const now = new Date();
    
    // Find active keys that are expired
    const expiredKeys = await ApiKey.findAll({
      where: {
        status: 'active',
        expires_at: {
          [Op.lt]: now
        }
      }
    });
    
    if (expiredKeys.length > 0) {
      logger.info(`Found ${expiredKeys.length} expired API keys, updating status...`);
      
      for (const key of expiredKeys) {
        await key.update({
          status: 'inactive'
        });
        
        logger.info(`Marked expired API key ${key.id} as inactive`);
      }
    }
  } catch (error) {
    logger.error(`Error marking expired API keys: ${error.message}`);
  }
};

module.exports = {
  initialize
}; 