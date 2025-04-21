'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('websocket_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
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
        references: {
          model: 'websocket_connections',
          key: 'connection_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      message_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      delivered_at: {
        type: Sequelize.DATE,
      },
      read_at: {
        type: Sequelize.DATE,
      },
      delivery_status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      last_retry_at: {
        type: Sequelize.DATE,
      },
      error_message: {
        type: Sequelize.TEXT,
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
    await queryInterface.addIndex('websocket_messages', ["user_id"], { name: 'idx_websocket_messages_user_id' });
    await queryInterface.addIndex('websocket_messages', ["connection_id"], { name: 'idx_websocket_messages_connection_id' });
    await queryInterface.addIndex('websocket_messages', ["message_id"], { name: 'idx_websocket_messages_message_id', unique: true });
    await queryInterface.addIndex('websocket_messages', ["type"], { name: 'idx_websocket_messages_type' });
    await queryInterface.addIndex('websocket_messages', ["delivery_status"], { name: 'idx_websocket_messages_delivery_status' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('websocket_messages');
  }
};
