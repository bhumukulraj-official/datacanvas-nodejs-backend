'use strict';

// Import utility functions for constraints and IP address validation
const { addConstraints, addIpAddressValidation } = require('../src/utils/migrationUtils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        action: {
          type: Sequelize.STRING(100),
          allowNull: false
        },
        entity_type: {
          type: Sequelize.STRING(50),
          allowNull: true
        },
        entity_id: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true
        },
        user_agent: {
          type: Sequelize.STRING(255),
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
        }
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('audit_logs', ['user_id'], { 
        name: 'idx_audit_logs_user_id',
        transaction
      });
      
      await queryInterface.addIndex('audit_logs', ['action'], { 
        name: 'idx_audit_logs_action',
        transaction
      });
      
      await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id'], { 
        name: 'idx_audit_logs_entity',
        transaction
      });
      
      await queryInterface.addIndex('audit_logs', ['created_at'], { 
        name: 'idx_audit_logs_created_at',
        transaction
      });

      // Add constraints using the utility function
      await addConstraints(queryInterface, 'audit_logs', {
        'check_action_length': 'char_length(action) >= 2 AND char_length(action) <= 100',
        'check_entity_type_length': 'entity_type IS NULL OR char_length(entity_type) <= 50'
      }, transaction);

      // Add IP address validation using the specialized utility function
      await addIpAddressValidation(queryInterface, 'audit_logs', 'ip_address', transaction);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
  }
};
