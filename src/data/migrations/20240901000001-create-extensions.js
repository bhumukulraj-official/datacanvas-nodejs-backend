'use strict';

/**
 * Migration: Create Extensions
 * Purpose: Sets up PostgreSQL extensions required by the application
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if the extension is already installed
        const [results] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM pg_extension WHERE extname = 'uuid-ossp';
        `, { transaction: t });
        
        const extensionExists = parseInt(results[0].count) > 0;
        
        if (!extensionExists) {
          console.log('Installing uuid-ossp extension...');
          // Add UUID extension for generating UUIDs
          await queryInterface.sequelize.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          `, { transaction: t });
          console.log('uuid-ossp extension installed successfully.');
        } else {
          console.log('uuid-ossp extension already exists, skipping installation.');
        }
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in create-extensions migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Proper down migration with proper error handling
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if any tables depend on this extension first
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM pg_depend d
          JOIN pg_extension e ON d.refobjid = e.oid
          WHERE e.extname = 'uuid-ossp' AND d.deptype = 'n';
        `, { transaction: t });
        
        if (parseInt(dependencies[0].count) > 0) {
          console.warn('Warning: Tables depend on uuid-ossp extension. Skipping drop to avoid data loss.');
          return Promise.resolve();
        }
        
        console.log('Dropping uuid-ossp extension...');
        // Drop UUID extension if it exists and no dependencies
        await queryInterface.sequelize.query(`
          DROP EXTENSION IF EXISTS "uuid-ossp";
        `, { transaction: t });
        console.log('uuid-ossp extension dropped successfully.');
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in create-extensions down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 