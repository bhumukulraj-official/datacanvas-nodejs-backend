'use strict';

// Import the utility functions for dialect-specific operations
const { createEnumTypes, dropEnumTypes } = require('../src/utils/migrationUtils');

/**
 * Migration to create enum types for the application
 * 
 * This migration creates all the necessary enum types that will be used throughout
 * the application. Different database dialects handle enums differently:
 * 
 * - PostgreSQL: Creates native ENUM types (most efficient)
 * - MySQL/MariaDB: Enums are handled within table column definitions
 * - SQLite: Creates reference tables to simulate enum behavior
 * - Other dialects: Uses CHECK constraints or application-level validation
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction for database consistency
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Define all enum values
        const enumDefinitions = {
          // User related enums
          user_role: ['admin', 'editor', 'user'],
          user_status: ['active', 'inactive', 'suspended', 'banned'],
          
          // Blog related enums
          post_status: ['draft', 'published', 'archived', 'deleted'],
          post_visibility: ['public', 'private', 'password_protected'],
          
          // Notification related enums
          notification_priority: ['low', 'medium', 'high', 'critical'],
          notification_type: ['system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social'],
          notification_status: ['unread', 'read', 'archived'],
          
          // Media related enums
          media_type: ['image', 'video', 'document', 'audio'],
          media_status: ['processing', 'ready', 'failed', 'deleted'],
          
          // API related enums
          api_key_status: ['active', 'inactive', 'revoked'],
          rate_limit_period: ['second', 'minute', 'hour', 'day', 'month'],
          
          // WebSocket related enums
          connection_status: ['connected', 'disconnected', 'idle'],
          message_type: ['text', 'notification', 'command', 'error'],
          
          // Project related enums
          project_status: ['draft', 'in_progress', 'completed', 'archived'],
          
          // Testimonial related enums
          testimonial_status: ['pending', 'approved', 'rejected'],
          
          // Message related enums
          message_delivery_status: ['pending', 'delivered', 'read', 'failed']
        };

        // Use the utility function to create enum types based on dialect
        await createEnumTypes(queryInterface, Sequelize, enumDefinitions, transaction);
        
        console.log('Successfully created all enum types');
      } catch (error) {
        console.error(`Error in enum types creation: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Define all enum types to drop
        const enumTypes = [
          'user_role',
          'user_status',
          'post_status',
          'post_visibility',
          'notification_priority',
          'notification_type',
          'notification_status',
          'media_type',
          'media_status',
          'api_key_status',
          'rate_limit_period',
          'connection_status',
          'message_type',
          'project_status',
          'testimonial_status',
          'message_delivery_status'
        ];
        
        // Use the utility function to drop enum types based on dialect
        // This handles the CASCADE option for PostgreSQL to safely drop types still in use
        await dropEnumTypes(queryInterface, enumTypes, transaction);
        
        console.log('Successfully dropped all enum types');
      } catch (error) {
        console.error(`Error in enum types removal: ${error.message}`);
        // Depending on the specific error, we might want different handling
        // For now, we'll rethrow to trigger the transaction rollback
        throw error;
      }
    });
  }
};
