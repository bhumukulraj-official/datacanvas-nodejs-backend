/**
 * WebSocket message model
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../../../shared/database').getSequelize();

/**
 * WebSocketMessage model
 */
const WebSocketMessage = sequelize.define(
  'websocket_message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    connection_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    message_type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    message_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    is_processed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: 'websocket_messages',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['connection_id']
      },
      {
        fields: ['message_type']
      },
      {
        fields: ['created_at']
      }
    ]
  }
);

module.exports = WebSocketMessage; 