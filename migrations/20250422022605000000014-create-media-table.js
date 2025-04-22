'use strict';

// Import utility functions for consistent cross-dialect operations
const { addConstraints, addJsonValidationConstraint } = require('../src/utils/migrationUtils');

/**
 * Migration to create the media table
 * 
 * This table stores metadata for uploaded files including:
 * - References to the file's location in storage
 * - File type validation
 * - Size constraints
 * - Processing status tracking
 * - Ownership and visibility controls
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Create the table
        await queryInterface.createTable('media', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
          },
          url: {
            type: Sequelize.STRING(255),
            allowNull: false,
          },
          // Storage configuration reference
          storage_provider: {
            type: Sequelize.STRING(50),
            allowNull: false,
            defaultValue: 'local',
            comment: 'Storage provider (local, s3, cloudinary, etc.)'
          },
          storage_bucket: {
            type: Sequelize.STRING(100),
            allowNull: true,
            comment: 'Storage bucket or container name'
          },
          storage_path: {
            type: Sequelize.STRING(255),
            allowNull: true,
            comment: 'Path within the storage location'
          },
          type: {
            type: 'media_type',
            allowNull: false,
          },
          mime_type: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: 'MIME type of the file (e.g., image/jpeg, application/pdf)'
          },
          file_extension: {
            type: Sequelize.STRING(10),
            allowNull: false,
            comment: 'File extension without the dot (e.g., jpg, pdf)'
          },
          size: {
            type: Sequelize.INTEGER,
            allowNull: false,
            comment: 'File size in bytes'
          },
          filename: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          visibility: {
            type: Sequelize.STRING(20),
            defaultValue: 'public',
            allowNull: false,
          },
          metadata: {
            type: Sequelize.JSONB,
            defaultValue: {},
          },
          status: {
            type: 'media_status',
            defaultValue: 'ready',
            allowNull: false,
          },
          optimized_url: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          optimized_size: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          optimization_metadata: {
            type: Sequelize.JSONB,
            defaultValue: {},
          },
          thumbnail_url: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          uploaded_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true,
          }
        }, { transaction });

        console.log('Successfully created media table');

        // Add indexes for efficient querying
        
        // User index
        await queryInterface.addIndex('media', ["user_id"], { 
          name: 'idx_media_user_id',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Media type index
        await queryInterface.addIndex('media', ["type"], { 
          name: 'idx_media_type',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // File extension index for filtering by file type
        await queryInterface.addIndex('media', ["file_extension"], { 
          name: 'idx_media_file_extension',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // MIME type index for content type filtering
        await queryInterface.addIndex('media', ["mime_type"], { 
          name: 'idx_media_mime_type',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Storage provider index
        await queryInterface.addIndex('media', ["storage_provider"], { 
          name: 'idx_media_storage_provider',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Visibility index
        await queryInterface.addIndex('media', ["visibility"], { 
          name: 'idx_media_visibility',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Status index
        await queryInterface.addIndex('media', ["status"], { 
          name: 'idx_media_status',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Soft delete index
        await queryInterface.addIndex('media', ["deleted_at"], { 
          name: 'idx_media_deleted_at',
          transaction
        });
        
        // Composite indexes for common query patterns
        
        // User + Type (for listing user's media by type)
        await queryInterface.addIndex('media', ["user_id", "type"], { 
          name: 'idx_media_user_type',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Type + Status (for processing queues by media type)
        await queryInterface.addIndex('media', ["type", "status"], { 
          name: 'idx_media_type_status',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        // Storage + Type (for maintenance operations)
        await queryInterface.addIndex('media', ["storage_provider", "type"], { 
          name: 'idx_media_storage_type',
          where: {
            deleted_at: null
          },
          transaction
        });

        console.log('Successfully added indexes to media table');

        // Add constraints with dialect-specific handling
        const constraints = {
          // Validate file size limits
          'check_file_size': 'size >= 0 AND size <= 104857600', // Max 100MB (100 * 1024 * 1024)
          
          // Ensure optimized size is smaller than original
          'check_optimized_size': 'optimized_size IS NULL OR (optimized_size >= 0 AND optimized_size <= size)',
          
          // Validate filename length
          'check_filename_length': 'filename IS NULL OR length(filename) <= 255',
          
          // Add constraints from fix-migration-issues.js
          'chk_media_size': 'size >= 0',
          'chk_media_optimized_size': 'optimized_size IS NULL OR optimized_size >= 0',
          'chk_media_url': "url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_media_optimized_url': "optimized_url IS NULL OR optimized_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'",
          'chk_media_thumbnail_url': "thumbnail_url IS NULL OR thumbnail_url ~ '^https?://[\\w.-]+(?:\\.[\\w.-]+)+[\\w\\-._~:/?#[\\]@!$&''()*+,;=]*$'"
        };
        
        await addConstraints(queryInterface, 'media', constraints, transaction);
        
        // Add JSON validation to metadata fields
        await addJsonValidationConstraint(queryInterface, 'media', 'metadata', transaction);
        await addJsonValidationConstraint(queryInterface, 'media', 'optimization_metadata', transaction);

        console.log('Successfully added constraints to media table');
      } catch (error) {
        console.error(`Error creating media table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Drop table and all associated constraints/indexes
        await queryInterface.dropTable('media', { transaction });
        console.log('Successfully dropped media table');
      } catch (error) {
        console.error(`Error dropping media table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  }
};
