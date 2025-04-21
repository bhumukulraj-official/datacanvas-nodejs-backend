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
        type: 'message_type',
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
        type: Sequelize.STRING(100),
        allowNull: false,
        references: {
          model: 'websocket_connections',
          key: 'connection_id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      message_id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      delivery_status: {
        type: 'message_delivery_status',
        defaultValue: 'pending',
        allowNull: false,
      },
      retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      last_retry_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
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
    });

    // Add indexes
    await queryInterface.addIndex('websocket_messages', ["user_id"], { 
      name: 'idx_websocket_messages_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_messages', ["connection_id"], { 
      name: 'idx_websocket_messages_connection_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_messages', ["message_id"], { 
      name: 'idx_websocket_messages_message_id', 
      unique: true,
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_messages', ["type"], { 
      name: 'idx_websocket_messages_type',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_messages', ["delivery_status"], { 
      name: 'idx_websocket_messages_delivery_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_messages', ["deleted_at"], { 
      name: 'idx_websocket_messages_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE websocket_messages
      ADD CONSTRAINT check_message_id_length
      CHECK (char_length(message_id) >= 10 AND char_length(message_id) <= 100);
      
      ALTER TABLE websocket_messages
      ADD CONSTRAINT check_retry_count
      CHECK (retry_count >= 0);
      
      ALTER TABLE websocket_messages
      ADD CONSTRAINT check_delivery_dates
      CHECK (
        (delivered_at IS NULL OR delivered_at >= sent_at)
        AND
        (read_at IS NULL OR read_at >= delivered_at)
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('websocket_messages');
  }
};
