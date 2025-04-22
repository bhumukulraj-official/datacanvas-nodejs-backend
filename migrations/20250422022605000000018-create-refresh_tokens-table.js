'use strict';

// Import utility function for constraints
const { addConstraints } = require('../src/utils/migrationUtils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('refresh_tokens', {
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

      // Add indexes
      await queryInterface.addIndex('refresh_tokens', ['user_id'], { 
        name: 'idx_refresh_tokens_user_id',
        transaction
      });
      
      await queryInterface.addIndex('refresh_tokens', ['token'], { 
        name: 'idx_refresh_tokens_token',
        unique: true,
        transaction
      });
      
      await queryInterface.addIndex('refresh_tokens', ['expires_at'], { 
        name: 'idx_refresh_tokens_expires_at',
        transaction
      });

      // Add constraints using the utility function
      await addConstraints(queryInterface, 'refresh_tokens', {
        'check_token_length': 'char_length(token) >= 32 AND char_length(token) <= 255',
        'chk_refresh_tokens_expiry': 'expires_at > created_at'
      }, transaction);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('refresh_tokens');
  }
};
