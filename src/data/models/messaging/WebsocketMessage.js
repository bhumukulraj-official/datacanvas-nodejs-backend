const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class WebsocketMessage extends BaseModel {
  static init() {
    return super.init({
      connection_id: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      message_id: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
      },
      message_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      direction: {
        type: DataTypes.STRING(10),
        validate: {
          isIn: [['incoming', 'outgoing']]
        }
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'sent',
        validate: {
          isIn: [['sent', 'received', 'error']]
        }
      },
      error_details: DataTypes.TEXT,
      encryption_type: {
        type: DataTypes.STRING(20),
        defaultValue: 'TLS1.3'
      }
    }, {
      sequelize,
      tableName: 'websocket_messages',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [
        { fields: ['connection_id'] },
        { fields: ['message_type'] },
        { fields: ['direction'] },
        { fields: ['created_at'] }
      ]
    });
  }

  static associate({ WebsocketConnection }) {
    this.belongsTo(WebsocketConnection, { foreignKey: 'connection_id', targetKey: 'connection_id' });
  }
}; 