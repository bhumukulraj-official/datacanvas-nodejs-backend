'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
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
    });

    // Add indexes
    await queryInterface.addIndex('rate_limits', ["ip_address","endpoint"], { 
      name: 'idx_rate_limits_ip_endpoint' 
    });
    
    await queryInterface.addIndex('rate_limits', ["window_start","window_end"], { 
      name: 'idx_rate_limits_window' 
    });
    
    await queryInterface.addIndex('rate_limits', ["api_type"], { 
      name: 'idx_rate_limits_api_type' 
    });
    
    await queryInterface.addIndex('rate_limits', ["user_id"], { 
      name: 'idx_rate_limits_user_id' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE rate_limits
      ADD CONSTRAINT check_ip_address_format
      CHECK (ip_address ~* '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' OR ip_address ~* '^[0-9a-fA-F:]+$');
      
      ALTER TABLE rate_limits
      ADD CONSTRAINT check_endpoint_format
      CHECK (endpoint ~* '^[a-zA-Z0-9_\\-\\/]+$');
      
      ALTER TABLE rate_limits
      ADD CONSTRAINT check_window_dates
      CHECK (window_end > window_start);
      
      ALTER TABLE rate_limits
      ADD CONSTRAINT check_request_count
      CHECK (request_count >= 0);
      
      ALTER TABLE rate_limits
      ADD CONSTRAINT check_api_type_values
      CHECK (api_type IN ('public', 'private', 'admin'));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rate_limits');
  }
};
