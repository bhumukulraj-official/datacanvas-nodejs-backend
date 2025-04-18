const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class WebSocketMessage extends Model {}

WebSocketMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['notification', 'message', 'status', 'error']],
      },
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    connection_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'websocket_connections',
        key: 'connection_id',
      },
      onDelete: 'CASCADE',
    },
    message_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delivery_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'sent', 'delivered', 'read', 'failed']],
      },
    },
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_retry_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WebSocketMessage',
    tableName: 'websocket_messages',
    timestamps: false,
    indexes: [
      {
        name: 'idx_websocket_messages_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_websocket_messages_connection_id',
        fields: ['connection_id'],
      },
      {
        name: 'idx_websocket_messages_message_id',
        fields: ['message_id'],
        unique: true,
      },
      {
        name: 'idx_websocket_messages_type',
        fields: ['type'],
      },
      {
        name: 'idx_websocket_messages_delivery_status',
        fields: ['delivery_status'],
      },
    ],
  }
);

module.exports = WebSocketMessage; 