/**
 * WebSocket connection model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../../../shared/database').getSequelize();

/**
 * WebSocketConnection model
 */
const WebSocketConnection = sequelize.define(
  'websocket_connection',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    connection_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    client_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    connected_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    disconnected_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    tableName: 'websocket_connections',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['connection_id']
      },
      {
        fields: ['is_active']
      }
    ]
  }
);

module.exports = WebSocketConnection; 