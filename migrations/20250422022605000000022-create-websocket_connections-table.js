'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('websocket_connections', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
        unique: true,
      },
      status: {
        type: 'connection_status',
        defaultValue: 'connected',
        allowNull: false,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      connected_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      last_heartbeat: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      disconnected_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('websocket_connections', ["user_id"], { 
      name: 'idx_websocket_connections_user_id',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_connections', ["connection_id"], { 
      name: 'idx_websocket_connections_connection_id', 
      unique: true,
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_connections', ["status"], { 
      name: 'idx_websocket_connections_status',
      where: {
        deleted_at: null
      }
    });
    
    await queryInterface.addIndex('websocket_connections', ["deleted_at"], { 
      name: 'idx_websocket_connections_deleted_at' 
    });

    // Add constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE websocket_connections
      ADD CONSTRAINT check_connection_id_length
      CHECK (char_length(connection_id) >= 10 AND char_length(connection_id) <= 100);
      
      ALTER TABLE websocket_connections
      ADD CONSTRAINT check_ip_address_format
      CHECK (ip_address IS NULL OR ip_address ~* '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$' OR ip_address ~* '^[0-9a-fA-F:]+$');
      
      ALTER TABLE websocket_connections
      ADD CONSTRAINT check_disconnected_at
      CHECK (disconnected_at IS NULL OR disconnected_at >= connected_at);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('websocket_connections');
  }
};
