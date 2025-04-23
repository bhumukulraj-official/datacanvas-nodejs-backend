/**
 * WebSocket connection model
 */
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class WebSocketConnection extends Model {}

WebSocketConnection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
      unique: true,
      validate: {
        len: [10, 100]
      }
    },
    status: {
      type: DataTypes.ENUM('connected', 'disconnected', 'idle'),
      allowNull: false,
      defaultValue: 'connected'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      validate: {
        is: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^[0-9a-fA-F:]+$/i
      }
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    connected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    last_heartbeat: {
      type: DataTypes.DATE,
      allowNull: true
    },
    disconnected_at: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfterConnected(value) {
          if (value && this.connected_at && value < this.connected_at) {
            throw new Error('Disconnected time must be after connected time');
          }
        }
      }
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
    modelName: 'WebSocketConnection',
    tableName: 'websocket_connections',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_websocket_connections_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_websocket_connections_connection_id',
        fields: ['connection_id'],
        unique: true
      },
      {
        name: 'idx_websocket_connections_status',
        fields: ['status']
      },
      {
        name: 'idx_websocket_connections_connected_at',
        fields: ['connected_at']
      }
    ]
  }
);

module.exports = WebSocketConnection; 