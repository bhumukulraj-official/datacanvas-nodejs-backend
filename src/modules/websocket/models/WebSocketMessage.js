/**
 * WebSocket message model
 */
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class WebSocketMessage extends Model {}

WebSocketMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('text', 'notification', 'command', 'error'),
      allowNull: false
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    connection_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [10, 100]
      }
    },
    message_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [10, 100]
      }
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfterDelivered(value) {
          if (value && this.delivered_at && value < this.delivered_at) {
            throw new Error('Read time must be after delivered time');
          }
        }
      }
    },
    delivery_status: {
      type: DataTypes.ENUM('pending', 'delivered', 'read', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    last_retry_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'WebSocketMessage',
    tableName: 'websocket_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_websocket_messages_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_websocket_messages_connection_id',
        fields: ['connection_id']
      },
      {
        name: 'idx_websocket_messages_message_id',
        fields: ['message_id']
      },
      {
        name: 'idx_websocket_messages_delivery_status',
        fields: ['delivery_status']
      }
    ]
  }
);

module.exports = WebSocketMessage; 