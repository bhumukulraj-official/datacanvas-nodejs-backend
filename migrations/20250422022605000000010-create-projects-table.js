'use strict';

// Import utility functions for consistent cross-dialect operations
const { 
  addConstraints, 
  addUrlValidationConstraints, 
  addJsonValidationConstraint 
} = require('../src/utils/migrationUtils');

/**
 * Migration to create the projects table
 * 
 * This migration creates the projects table with proper references and validation.
 * It uses a consistent JSON approach for arrays (tags, technologies) across all dialects
 * and implements standardized constraints for all supported database types.
 * 
 * Design decisions:
 * 1. Tags/technologies are stored as JSON strings in all dialects for consistency
 *    - This enables seamless database migration between different dialects
 *    - Application code will handle parsing/stringifying JSON consistently
 * 
 * 2. Constraints are implemented in a dialect-specific way but with consistent behavior
 *    - Date validations ensure end_date is after start_date
 *    - Text length validations ensure proper content sizing
 *    - URL validations ensure valid format for github_url and live_url
 *    - JSON validation ensures tags and technologies contain valid JSON
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction for database consistency
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Define project status values
        const projectStatusValues = ['draft', 'in_progress', 'completed', 'archived'];
        
        // Use JSON (TEXT) type consistently across all dialects
        // Application code will handle serialization/deserialization
        const jsonType = Sequelize.TEXT;
        const jsonDefaultValue = '[]';
        
        await queryInterface.createTable('projects', {
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
          title: {
            type: Sequelize.STRING(200),
            allowNull: false,
          },
          slug: {
            type: Sequelize.STRING(200),
            allowNull: false,
            unique: true,
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: false,
          },
          thumbnail_url: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          // Store as JSON string consistently across all dialects
          tags: {
            type: jsonType,
            allowNull: false,
            defaultValue: jsonDefaultValue,
            comment: 'JSON array of tag strings'
          },
          // Store as JSON string consistently across all dialects
          technologies: {
            type: jsonType,
            allowNull: false,
            defaultValue: jsonDefaultValue,
            comment: 'JSON array of technology strings'
          },
          github_url: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          live_url: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          start_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
          },
          end_date: {
            type: Sequelize.DATEONLY,
            allowNull: true,
          },
          is_featured: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          display_order: {
            type: Sequelize.INTEGER,
            allowNull: true,
          },
          status: {
            type: Sequelize.ENUM(...projectStatusValues),
            allowNull: false,
            defaultValue: 'draft',
          },
          meta_title: {
            type: Sequelize.STRING(100),
            allowNull: true,
          },
          meta_description: {
            type: Sequelize.STRING(200),
            allowNull: true,
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

        console.log('Successfully created projects table');

        // Add indexes
        await queryInterface.addIndex('projects', ["user_id"], { 
          name: 'idx_projects_user_id',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["slug"], { 
          name: 'idx_projects_slug',
          unique: true,
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["status"], { 
          name: 'idx_projects_status',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["is_featured"], { 
          name: 'idx_projects_is_featured',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["display_order"], { 
          name: 'idx_projects_display_order',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["deleted_at"], { 
          name: 'idx_projects_deleted_at',
          transaction
        });
        
        // Add composite indexes
        await queryInterface.addIndex('projects', ["user_id", "status"], { 
          name: 'idx_projects_user_status',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('projects', ["user_id", "is_featured"], { 
          name: 'idx_projects_user_featured',
          where: {
            deleted_at: null
          },
          transaction
        });

        console.log('Successfully added all indexes to projects table');

        // Add standardized constraints using utility functions
        
        // 1. Basic length and date constraints - consistent across dialects
        const constraints = {
          // Ensure end_date is after or equal to start_date when both are provided
          'check_dates': 'end_date IS NULL OR start_date IS NULL OR end_date >= start_date',
          
          // Title length validation - enforce minimum and maximum lengths
          'check_title_length': 'length(title) >= 3 AND length(title) <= 200',
          
          // Description length validation - ensure minimum content
          'check_description_length': 'length(description) >= 10',
          
          // Slug format validation (simpler version handled at DB level)
          // More complex regex patterns will be handled by application code
          'check_slug_format': "slug NOT LIKE '% %'"
        };
        
        await addConstraints(queryInterface, 'projects', constraints, transaction);
        
        // 2. URL validation for github_url and live_url
        await addUrlValidationConstraints(
          queryInterface, 
          'projects', 
          ['github_url', 'live_url'],
          transaction
        );
        
        // 3. JSON validation for tags and technologies
        await addJsonValidationConstraint(queryInterface, 'projects', 'tags', transaction);
        await addJsonValidationConstraint(queryInterface, 'projects', 'technologies', transaction);
        
        console.log('Successfully added all constraints to projects table');
      } catch (error) {
        console.error(`Error creating projects table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.dropTable('projects', { transaction });
        console.log('Successfully dropped projects table');
      } catch (error) {
        console.error(`Error dropping projects table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  }
};
