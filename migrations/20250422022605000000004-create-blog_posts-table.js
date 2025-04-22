'use strict';

// Import utility functions for consistent cross-dialect operations
const { 
  addConstraints, 
  addTextSearchCapabilities,
  addStateTransitionValidation,
  dropStateTransitionValidation,
  optimizeIndexes
} = require('../src/utils/migrationUtils');

/**
 * Migration to create the blog_posts table
 * 
 * This migration creates the blog posts table with proper references, indexes and constraints.
 * It includes:
 * 1. Text search capabilities for title and content
 * 2. Status transition validation to enforce proper workflow
 * 3. Comprehensive indexing strategy for performance
 * 4. Data validation constraints
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.createTable('blog_posts', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: false
          },
          slug: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          content: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          excerpt: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          featured_image: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          category_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'blog_categories',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          author_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
          },
          status: {
            type: Sequelize.ENUM('draft', 'published', 'archived', 'deleted'),
            allowNull: false,
            defaultValue: 'draft'
          },
          visibility: {
            type: Sequelize.ENUM('public', 'private', 'password_protected'),
            allowNull: false,
            defaultValue: 'public'
          },
          password: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          published_at: {
            type: Sequelize.DATE,
            allowNull: true
          },
          meta_title: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          meta_description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          view_count: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          comment_count: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          deleted_at: {
            type: Sequelize.DATE,
            allowNull: true
          }
        }, { transaction });

        console.log('Successfully created blog_posts table');

        // 1. Add regular indexes

        // Slug index for URL lookup (unique with soft delete consideration)
        await queryInterface.addIndex('blog_posts', ['slug'], {
          name: 'idx_blog_posts_slug',
          unique: true,
          where: {
            deleted_at: null
          },
          transaction
        });

        // Foreign key indexes
        await queryInterface.addIndex('blog_posts', ['category_id'], {
          name: 'idx_blog_posts_category',
          transaction
        });

        await queryInterface.addIndex('blog_posts', ['author_id'], {
          name: 'idx_blog_posts_author',
          transaction
        });

        // Status and visibility for filtering
        await queryInterface.addIndex('blog_posts', ['status'], {
          name: 'idx_blog_posts_status',
          transaction
        });

        await queryInterface.addIndex('blog_posts', ['visibility'], {
          name: 'idx_blog_posts_visibility',
          transaction
        });

        // Published date for ordering
        await queryInterface.addIndex('blog_posts', ['published_at'], {
          name: 'idx_blog_posts_published',
          transaction
        });

        // Soft delete
        await queryInterface.addIndex('blog_posts', ['deleted_at'], {
          name: 'idx_blog_posts_deleted_at',
          transaction
        });

        // Title index for basic title search
        await queryInterface.addIndex('blog_posts', ['title'], {
          name: 'idx_blog_posts_title',
          transaction
        });

        // 2. Add composite indexes for common query patterns
        
        // Status + Published date (for listing posts by status with date ordering)
        await queryInterface.addIndex('blog_posts', ['status', 'published_at'], {
          name: 'idx_blog_posts_status_published',
          transaction
        });
        
        // Author + Status (for listing author's posts by status)
        await queryInterface.addIndex('blog_posts', ['author_id', 'status'], {
          name: 'idx_blog_posts_author_status',
          transaction
        });
        
        // Category + Status (for listing category posts by status)
        await queryInterface.addIndex('blog_posts', ['category_id', 'status'], {
          name: 'idx_blog_posts_category_status',
          transaction
        });

        console.log('Successfully added standard indexes to blog_posts table');

        // 3. Add text search capabilities for title and content
        await addTextSearchCapabilities(
          queryInterface, 
          'blog_posts', 
          ['title', 'content'],
          transaction
        );

        // 4. Add standard constraints
        const constraints = {
          // Ensure title has reasonable length
          'check_post_title_length': 'length(title) >= 3 AND length(title) <= 255',
          
          // Ensure slug has proper format (simplified version)
          'check_post_slug_format': "slug NOT LIKE '% %'",
          
          // Ensure content has minimum length
          'check_post_content_length': 'length(content) >= 10',
          
          // Ensure password has sufficient length when required
          'check_post_password_required': 
            "visibility != 'password_protected' OR (visibility = 'password_protected' AND password IS NOT NULL AND length(password) >= 8)",
          
          // Ensure published_at is set for published posts
          'check_post_published_at': 
            "status != 'published' OR (status = 'published' AND published_at IS NOT NULL)",
          
          // Validate view and comment counts
          'check_post_counts': 'view_count >= 0 AND comment_count >= 0',
          
          // Add status constraint as defined in fix-migration-issues.js
          'chk_blog_posts_status': "status IN ('draft', 'published', 'archived', 'deleted')"
        };
        
        await addConstraints(queryInterface, 'blog_posts', constraints, transaction);

        console.log('Successfully added constraints to blog_posts table');

        // Optimize indexes as defined in fix-migration-issues.js
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

        // 5. Add state transition validation for post status
        
        // Define valid status transitions
        const validStatusTransitions = {
          // From draft, can publish or archive
          'draft': ['draft', 'published', 'archived', 'deleted'],
          
          // From published, can archive or delete
          'published': ['published', 'archived', 'deleted'],
          
          // From archived, can restore to draft or delete
          'archived': ['draft', 'deleted'],
          
          // Can't transition from deleted (terminal state)
          'deleted': ['deleted']
        };
        
        await addStateTransitionValidation(
          queryInterface, 
          'blog_posts', 
          'status', 
          validStatusTransitions,
          transaction
        );
        
        console.log('Successfully created blog_posts table with all enhancements');
      } catch (error) {
        console.error(`Error creating blog_posts table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // First remove the state transition validation
        await dropStateTransitionValidation(
          queryInterface, 
          'blog_posts', 
          'status',
          transaction
        );
        
        // Then drop the table and all associated indexes/constraints
        await queryInterface.dropTable('blog_posts', { transaction });
        
        console.log('Successfully dropped blog_posts table and all associated resources');
      } catch (error) {
        console.error(`Error dropping blog_posts table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  }
};
