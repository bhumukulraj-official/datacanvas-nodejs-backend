'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('rate_limits', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      endpoint: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      request_count: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
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
        type: Sequelize.STRING,
        defaultValue: 'public',
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: {},
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: {},
      },
    });

    // Add indexes
    await queryInterface.addIndex('rate_limits', ["ip_address","endpoint"], { name: 'idx_rate_limits_ip_endpoint' });
    await queryInterface.addIndex('rate_limits', ["window_start","window_end"], { name: 'idx_rate_limits_window' });
    await queryInterface.addIndex('rate_limits', ["api_type"], { name: 'idx_rate_limits_api_type' });
    await queryInterface.addIndex('rate_limits', ["user_id"], { name: 'idx_rate_limits_user_id' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('rate_limits');
  }
};
