const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class WebSocketConnection extends Model {}

WebSocketConnection.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
      unique: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    connected_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_heartbeat: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    disconnected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'WebSocketConnection',
    tableName: 'websocket_connections',
    timestamps: false,
    indexes: [
      {
        name: 'idx_websocket_connections_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_websocket_connections_connection_id',
        fields: ['connection_id'],
        unique: true,
      },
    ],
  }
);

module.exports = WebSocketConnection; 