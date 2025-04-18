'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('websocket_connections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      connection_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      user_agent: {
        type: Sequelize.TEXT,
      },
      connected_at: {
        type: Sequelize.DATE,
        defaultValue: {},
      },
      last_heartbeat: {
        type: Sequelize.DATE,
      },
      disconnected_at: {
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('websocket_connections', ["user_id"], { name: 'idx_websocket_connections_user_id' });
    await queryInterface.addIndex('websocket_connections', ["connection_id"], { name: 'idx_websocket_connections_connection_id', unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('websocket_connections');
  }
};
