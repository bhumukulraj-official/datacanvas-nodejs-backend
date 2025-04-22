'use strict';

const { 
  withTransaction,
  optimizeIndexes,
  addIpAddressValidation,
  addTablePartitioning,
  addConstraints,
  addJsonValidationConstraint
} = require('../src/utils/migrationUtils');

/**
 * Migration to fix various issues identified in the migration analysis report
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return withTransaction(queryInterface, async (transaction) => {
      try {
        // 1. Fix SQLite enum implementation for better performance
        if (queryInterface.sequelize.getDialect() === 'sqlite') {
          // Add indexes to enum reference tables
          const enumTables = [
            'enum_user_role',
            'enum_user_status',
            'enum_post_status',
            'enum_post_visibility',
            'enum_notification_priority',
            'enum_notification_type',
            'enum_notification_status',
            'enum_media_type',
            'enum_media_status',
            'enum_api_key_status',
            'enum_rate_limit_period',
            'enum_connection_status',
            'enum_message_type',
            'enum_project_status',
            'enum_testimonial_status',
            'enum_message_delivery_status'
          ];
          
          for (const tableName of enumTables) {
            await queryInterface.addIndex(tableName, ['value'], {
              name: `idx_${tableName}_value`,
              unique: true,
              transaction
            });
          }
        }

        // 2. Fix schema constraints in users table
        await addConstraints(queryInterface, 'users', {
          'chk_users_username': "username ~ '^[a-zA-Z0-9_-]{3,50}$'",
          'chk_users_password': "char_length(password) >= 60",
          'chk_users_email_verified': "is_email_verified IN (true, false)"
        }, transaction);

        // 3. Fix blog_posts table issues
        // Add proper state transition constraints
        await addConstraints(queryInterface, 'blog_posts', {
          'chk_blog_posts_status': "status IN ('draft', 'published', 'archived', 'deleted')"
        }, transaction);

        // Optimize indexes
        await optimizeIndexes(queryInterface, 'blog_posts', {
          'idx_blog_posts_status': {
            fields: ['status'],
            where: { deleted_at: null }
          },
          'idx_blog_posts_published': {
            fields: ['published_at'],
            where: { status: 'published', deleted_at: null }
          }
        }, transaction);

        // 4. Fix profiles table issues
        // Add proper regex validation for URLs
        await addConstraints(queryInterface, 'profiles', {
          'chk_profiles_website': "website ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_profiles_avatar_url': "avatar_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'"
        }, transaction);

        // 5. Fix projects table issues
        // Add proper schema constraints
        await addConstraints(queryInterface, 'projects', {
          'chk_projects_title': "char_length(title) >= 3 AND char_length(title) <= 200",
          'chk_projects_description': "char_length(description) >= 10",
          'chk_projects_slug': "slug ~ '^[a-z0-9-]+$'",
          'chk_projects_github_url': "github_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_projects_live_url': "live_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'"
        }, transaction);

        // 6. Fix media table issues
        // Add proper schema constraints
        await addConstraints(queryInterface, 'media', {
          'chk_media_size': 'size >= 0',
          'chk_media_optimized_size': 'optimized_size IS NULL OR optimized_size >= 0',
          'chk_media_url': "url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_media_optimized_url': "optimized_url IS NULL OR optimized_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_media_thumbnail_url': "thumbnail_url IS NULL OR thumbnail_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'"
        }, transaction);

        // 7. Fix refresh_tokens table
        // Add proper token validation and expiry constraints
        await addConstraints(queryInterface, 'refresh_tokens', {
          'chk_refresh_tokens_expiry': 'expires_at > created_at'
        }, transaction);

        // 8. Fix api_keys table
        // Add proper key validation and expiry constraints
        await addConstraints(queryInterface, 'api_keys', {
          'chk_api_keys_expiry': 'expires_at IS NULL OR expires_at > created_at',
          'chk_api_keys_last_used': 'last_used_at IS NULL OR last_used_at <= CURRENT_TIMESTAMP'
        }, transaction);

        // 9. Fix rate_limits table
        // Add proper rate limit constraints
        await addConstraints(queryInterface, 'rate_limits', {
          'chk_rate_limits_window': 'window_end > window_start',
          'chk_rate_limits_request_count': 'request_count >= 0'
        }, transaction);

        // 10. Fix audit_logs table
        // Add proper IP address validation
        await addIpAddressValidation(queryInterface, 'audit_logs', 'ip_address', transaction);

        // Handle partitioning for high-volume tables
        if (queryInterface.sequelize.getDialect() === 'postgres') {
          // For websocket_messages, we need to:
          // 1. Create a new partitioned table
          // 2. Copy data
          // 3. Drop old table
          // 4. Rename new table

          // Create new partitioned table with composite primary key
          await queryInterface.sequelize.query(`
            CREATE TABLE websocket_messages_new (
              id SERIAL,
              type message_type NOT NULL,
              payload JSONB NOT NULL DEFAULT '{}',
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
              connection_id VARCHAR(100) NOT NULL REFERENCES websocket_connections(connection_id) ON DELETE CASCADE ON UPDATE CASCADE,
              message_id VARCHAR(100) NOT NULL,
              sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              delivered_at TIMESTAMP WITH TIME ZONE,
              read_at TIMESTAMP WITH TIME ZONE,
              delivery_status message_delivery_status NOT NULL DEFAULT 'pending',
              retry_count INTEGER NOT NULL DEFAULT 0,
              last_retry_at TIMESTAMP WITH TIME ZONE,
              error_message TEXT,
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
              deleted_at TIMESTAMP WITH TIME ZONE,
              PRIMARY KEY (id, delivery_status),
              UNIQUE (message_id, delivery_status)
            ) PARTITION BY LIST (delivery_status);
          `, { transaction });

          // Create partitions for different delivery statuses
          await queryInterface.sequelize.query(`
            CREATE TABLE websocket_messages_pending 
              PARTITION OF websocket_messages_new 
              FOR VALUES IN ('pending');
            
            CREATE TABLE websocket_messages_delivered 
              PARTITION OF websocket_messages_new 
              FOR VALUES IN ('delivered');
            
            CREATE TABLE websocket_messages_failed 
              PARTITION OF websocket_messages_new 
              FOR VALUES IN ('failed');
          `, { transaction });

          // Copy data from old table to new partitioned table
          await queryInterface.sequelize.query(`
            INSERT INTO websocket_messages_new 
            SELECT * FROM websocket_messages;
          `, { transaction });

          // Drop old table and rename new table
          await queryInterface.sequelize.query(`
            DROP TABLE websocket_messages;
            ALTER TABLE websocket_messages_new RENAME TO websocket_messages;
          `, { transaction });

          // Recreate indexes on the partitioned table
          await queryInterface.sequelize.query(`
            CREATE INDEX idx_websocket_messages_user_id 
              ON websocket_messages (user_id) 
              WHERE deleted_at IS NULL;
            
            CREATE INDEX idx_websocket_messages_connection_id 
              ON websocket_messages (connection_id) 
              WHERE deleted_at IS NULL;
            
            CREATE INDEX idx_websocket_messages_type 
              ON websocket_messages (type) 
              WHERE deleted_at IS NULL;
            
            CREATE INDEX idx_websocket_messages_delivery_status 
              ON websocket_messages (delivery_status) 
              WHERE deleted_at IS NULL;
            
            CREATE INDEX idx_websocket_messages_deleted_at 
              ON websocket_messages (deleted_at);
          `, { transaction });
        }
      } catch (error) {
        throw error;
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Implement the down migration if needed
  }
};