'use strict';

// Import utility function for constraints
const { addConstraints } = require('../src/utils/migrationUtils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('rate_limits', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: false,
        },
        endpoint: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        request_count: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false,
        },
        window_start: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        window_end: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        api_type: {
          type: Sequelize.STRING(20),
          defaultValue: 'public',
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
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
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('rate_limits', ["ip_address","endpoint"], { 
        name: 'idx_rate_limits_ip_endpoint',
        transaction
      });
      
      await queryInterface.addIndex('rate_limits', ["window_start","window_end"], { 
        name: 'idx_rate_limits_window',
        transaction
      });
      
      await queryInterface.addIndex('rate_limits', ["api_type"], { 
        name: 'idx_rate_limits_api_type',
        transaction
      });
      
      await queryInterface.addIndex('rate_limits', ["user_id"], { 
        name: 'idx_rate_limits_user_id',
        transaction
      });

      // Add constraints using the utility function
      await addConstraints(queryInterface, 'rate_limits', {
        'check_ip_address_format': "ip_address ~* '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' OR ip_address ~* '^[0-9a-fA-F:]+$'",
        'check_endpoint_format': "endpoint ~* '^[a-zA-Z0-9_\\-\\/]+$'",
        'check_window_dates': 'window_end > window_start',
        'check_request_count': 'request_count >= 0',
        'check_api_type_values': "api_type IN ('public', 'private', 'admin')",
        // Adding constraints from fix-migration-issues.js
        'chk_rate_limits_window': 'window_end > window_start',
        'chk_rate_limits_request_count': 'request_count >= 0'
      }, transaction);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rate_limits');
  }
};
