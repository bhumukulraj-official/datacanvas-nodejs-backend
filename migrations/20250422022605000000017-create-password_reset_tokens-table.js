'use strict';

// Import utility functions for consistent cross-dialect operations
const { addConstraints } = require('../src/utils/migrationUtils');

/**
 * Migration to create the password reset tokens table
 * 
 * This migration creates a table to store password reset tokens with
 * proper indexing and constraints. It includes validation for token length
 * and expiration date to ensure security best practices.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use a transaction for database consistency
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Create the table
        await queryInterface.createTable('password_reset_tokens', {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          user_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
              model: 'users',
              key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          },
          token: {
            type: Sequelize.STRING(255),
            allowNull: false,
            unique: true
          },
          expires_at: {
            type: Sequelize.DATE,
            allowNull: false
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
          }
        }, { transaction });

        console.log('Successfully created password_reset_tokens table');

        // Add indexes
        await queryInterface.addIndex('password_reset_tokens', ['user_id'], { 
          name: 'idx_password_reset_tokens_user_id',
          transaction
        });
        
        await queryInterface.addIndex('password_reset_tokens', ['token'], { 
          name: 'idx_password_reset_tokens_token',
          unique: true,
          transaction
        });
        
        await queryInterface.addIndex('password_reset_tokens', ['expires_at'], { 
          name: 'idx_password_reset_tokens_expires_at',
          transaction
        });

        console.log('Successfully added indexes to password_reset_tokens table');

        // Add standardized constraints using utility functions
        // These constraints ensure token security and proper expiration timing
        const constraints = {
          // Ensure token has sufficient length for security (min 32 chars)
          'check_token_length': 'length(token) >= 32 AND length(token) <= 255',
          
          // Ensure expiration date is in the future relative to creation date
          'check_expires_at': 'expires_at > created_at'
        };
        
        await addConstraints(queryInterface, 'password_reset_tokens', constraints, transaction);
        
        console.log('Successfully added constraints to password_reset_tokens table');
      } catch (error) {
        console.error(`Error creating password_reset_tokens table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // First drop indexes (although dropTable usually handles this automatically)
        // This ensures clean cleanup even if the database doesn't cascade drops
        try {
          await queryInterface.removeIndex('password_reset_tokens', 'idx_password_reset_tokens_user_id', { transaction });
          await queryInterface.removeIndex('password_reset_tokens', 'idx_password_reset_tokens_token', { transaction });
          await queryInterface.removeIndex('password_reset_tokens', 'idx_password_reset_tokens_expires_at', { transaction });
        } catch (indexError) {
          // If indexes don't exist or can't be removed, continue with table drop
          console.log(`Note: Could not remove indexes: ${indexError.message}`);
        }
        
        // Then drop the table
        await queryInterface.dropTable('password_reset_tokens', { transaction });
        console.log('Successfully dropped password_reset_tokens table and all associated resources');
      } catch (error) {
        console.error(`Error dropping password_reset_tokens table: ${error.message}`);
        throw error; // Rethrow to trigger transaction rollback
      }
    });
  }
};
