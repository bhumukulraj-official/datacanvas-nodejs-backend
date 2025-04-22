'use strict';

// Import utility function for constraints and table partitioning
const { addConstraints, addTablePartitioning } = require('../src/utils/migrationUtils');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Check if using PostgreSQL - we'll handle partitioning differently
      const isPostgres = queryInterface.sequelize.getDialect() === 'postgres';

      if (!isPostgres) {
        // For non-PostgreSQL databases, create a normal table
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
        }, { transaction });
      } else {
        // For PostgreSQL, create a partitioned table as per fix-migration-issues.js
        await queryInterface.sequelize.query(`
          CREATE TABLE websocket_messages (
            id SERIAL,
            type message_type NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}',
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            connection_id VARCHAR(100) NOT NULL REFERENCES websocket_connections(connection_id) ON DELETE CASCADE ON UPDATE CASCADE,
            message_id VARCHAR(100) NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivered_at TIMESTAMP WITH TIME ZONE,
            read_at TIMESTAMP WITH TIME ZONE,
            delivery_status message_delivery_status NOT NULL DEFAULT 'pending',
            retry_count INTEGER NOT NULL DEFAULT 0,
            last_retry_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP WITH TIME ZONE,
            PRIMARY KEY (id, delivery_status),
            UNIQUE (message_id, delivery_status)
          ) PARTITION BY LIST (delivery_status);
        `, { transaction });

        // Create partitions for different delivery statuses
        await queryInterface.sequelize.query(`
          CREATE TABLE websocket_messages_pending 
            PARTITION OF websocket_messages 
            FOR VALUES IN ('pending');
          
          CREATE TABLE websocket_messages_delivered 
            PARTITION OF websocket_messages 
            FOR VALUES IN ('delivered');
          
          CREATE TABLE websocket_messages_failed 
            PARTITION OF websocket_messages 
            FOR VALUES IN ('failed');
        `, { transaction });
      }

      // Add indexes - different approach for PostgreSQL partitioned tables
      if (!isPostgres) {
        await queryInterface.addIndex('websocket_messages', ["user_id"], { 
          name: 'idx_websocket_messages_user_id',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('websocket_messages', ["connection_id"], { 
          name: 'idx_websocket_messages_connection_id',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('websocket_messages', ["message_id"], { 
          name: 'idx_websocket_messages_message_id', 
          unique: true,
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('websocket_messages', ["type"], { 
          name: 'idx_websocket_messages_type',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('websocket_messages', ["delivery_status"], { 
          name: 'idx_websocket_messages_delivery_status',
          where: {
            deleted_at: null
          },
          transaction
        });
        
        await queryInterface.addIndex('websocket_messages', ["deleted_at"], { 
          name: 'idx_websocket_messages_deleted_at',
          transaction
        });
      } else {
        // Create indexes for the partitioned table in PostgreSQL
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_websocket_messages_user_id 
            ON websocket_messages (user_id) 
            WHERE deleted_at IS NULL;
          
          CREATE INDEX idx_websocket_messages_connection_id 
            ON websocket_messages (connection_id) 
            WHERE deleted_at IS NULL;
          
          CREATE INDEX idx_websocket_messages_type 
            ON websocket_messages (type) 
            WHERE deleted_at IS NULL;
          
          CREATE INDEX idx_websocket_messages_delivery_status 
            ON websocket_messages (delivery_status) 
            WHERE deleted_at IS NULL;
          
          CREATE INDEX idx_websocket_messages_deleted_at 
            ON websocket_messages (deleted_at);
        `, { transaction });
      }

      // Add constraints using the utility function
      await addConstraints(queryInterface, 'websocket_messages', {
        'check_message_id_length': 'char_length(message_id) >= 10 AND char_length(message_id) <= 100',
        'check_retry_count': 'retry_count >= 0',
        'check_delivery_dates': "(delivered_at IS NULL OR delivered_at >= sent_at) AND (read_at IS NULL OR read_at >= delivered_at)"
      }, transaction);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('websocket_messages', { transaction });
    });
  }
};
