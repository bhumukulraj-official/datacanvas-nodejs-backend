'use strict';

// Import utility functions for consistent cross-dialect operations
const { addConstraints, addEmailValidationConstraint } = require('../src/utils/migrationUtils');

/**
 * Migration to create the users table
 * 
 * This migration creates the core users table with authentication and profile fields.
 * It implements standardized constraints across all database dialects and uses
 * proper error handling.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction for database consistency
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Create the table
        await queryInterface.createTable('users', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          username: {
            type: Sequelize.STRING(50),
            allowNull: false,
            unique: true
          },
          email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          password: {
            type: Sequelize.STRING(255),
            allowNull: false
            // Password validation will be added via constraints
          },
          password_salt: {
            type: Sequelize.STRING(64),
            allowNull: false
          },
          first_name: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          last_name: {
            type: Sequelize.STRING(50),
            allowNull: true
          },
          bio: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          avatar: {
            type: Sequelize.STRING(255),
            allowNull: true
          },
          role: {
            type: Sequelize.ENUM('admin', 'editor', 'user'),
            allowNull: false,
            defaultValue: 'user'
          },
          status: {
            type: Sequelize.ENUM('active', 'inactive', 'suspended', 'banned'),
            allowNull: false,
            defaultValue: 'active'
          },
          is_email_verified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          last_login: {
            type: Sequelize.DATE,
            allowNull: true
          },
          login_attempts: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          locked_until: {
            type: Sequelize.DATE,
            allowNull: true
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

        // Add indexes
        await queryInterface.addIndex('users', ['email'], { 
          name: 'idx_users_email',
          unique: true,
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('users', ['username'], { 
          name: 'idx_users_username',
          unique: true,
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('users', ['role'], { 
          name: 'idx_users_role',
          transaction
        });
        
        await queryInterface.addIndex('users', ['status'], { 
          name: 'idx_users_status',
          transaction
        });
        
        await queryInterface.addIndex('users', ['deleted_at'], { 
          name: 'idx_users_deleted_at',
          transaction
        });

        // Add standardized constraints using utility functions
        const constraints = {
          'check_password_length': 'length(password) >= 8',
          'check_username_length': 'length(username) >= 3 AND length(username) <= 50',
          'check_login_attempts': 'login_attempts >= 0'
        };
        
        await addConstraints(queryInterface, 'users', constraints, transaction);
        
        // Add email format validation
        await addEmailValidationConstraint(queryInterface, 'users', 'email', transaction);
        
        console.log('Successfully created users table with all constraints and indexes');
      } catch (error) {
        console.error(`Error creating users table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Drop the table and all associated constraints
        await queryInterface.dropTable('users', { transaction });
        console.log('Successfully dropped users table');
      } catch (error) {
        console.error(`Error dropping users table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  }
};
