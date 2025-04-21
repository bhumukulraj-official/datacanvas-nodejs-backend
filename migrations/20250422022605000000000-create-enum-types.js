'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if PostgreSQL is being used
    const dialect = queryInterface.sequelize.getDialect();
    
    if (dialect === 'postgres') {
      // Use a transaction for database consistency
      return queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(`
          -- User related enums
          CREATE TYPE user_role AS ENUM ('admin', 'editor', 'user');
          CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'banned');
          
          -- Blog related enums
          CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived', 'deleted');
          CREATE TYPE post_visibility AS ENUM ('public', 'private', 'password_protected');
          
          -- Notification related enums
          CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
          CREATE TYPE notification_type AS ENUM ('system', 'user', 'security', 'content');
          CREATE TYPE notification_status AS ENUM ('unread', 'read', 'archived');
          
          -- Media related enums
          CREATE TYPE media_type AS ENUM ('image', 'video', 'document', 'audio');
          CREATE TYPE media_status AS ENUM ('processing', 'ready', 'failed', 'deleted');
          
          -- API related enums
          CREATE TYPE api_key_status AS ENUM ('active', 'inactive', 'revoked');
          CREATE TYPE rate_limit_period AS ENUM ('second', 'minute', 'hour', 'day', 'month');
          
          -- WebSocket related enums
          CREATE TYPE connection_status AS ENUM ('connected', 'disconnected', 'idle');
          CREATE TYPE message_type AS ENUM ('text', 'notification', 'command', 'error');
          
          -- Project related enums
          CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');
          
          -- Testimonial related enums
          CREATE TYPE testimonial_status AS ENUM ('pending', 'approved', 'rejected');
          
          -- Message related enums
          CREATE TYPE message_delivery_status AS ENUM ('pending', 'delivered', 'read', 'failed');
        `, { transaction });
      });
    } else {
      // For other databases like MySQL, SQLite, etc. that don't support ENUM types
      console.log('This database does not support PostgreSQL ENUM types. Creating alternative structures...');
      // No action needed as Sequelize will handle ENUMs appropriately for each dialect
      return Promise.resolve();
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();
    
    if (dialect === 'postgres') {
      return queryInterface.sequelize.transaction(async (transaction) => {
        await queryInterface.sequelize.query(`
          DROP TYPE IF EXISTS user_role;
          DROP TYPE IF EXISTS user_status;
          DROP TYPE IF EXISTS post_status;
          DROP TYPE IF EXISTS post_visibility;
          DROP TYPE IF EXISTS notification_priority;
          DROP TYPE IF EXISTS notification_type;
          DROP TYPE IF EXISTS notification_status;
          DROP TYPE IF EXISTS media_type;
          DROP TYPE IF EXISTS media_status;
          DROP TYPE IF EXISTS api_key_status;
          DROP TYPE IF EXISTS rate_limit_period;
          DROP TYPE IF EXISTS connection_status;
          DROP TYPE IF EXISTS message_type;
          DROP TYPE IF EXISTS project_status;
          DROP TYPE IF EXISTS testimonial_status;
          DROP TYPE IF EXISTS message_delivery_status;
        `, { transaction });
      });
    } else {
      return Promise.resolve();
    }
  }
};
