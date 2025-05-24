const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class WebsocketConnection extends BaseModel {
  static init(sequelize) {
    return super.init({
      connection_id: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false
      },
      user_id: DataTypes.INTEGER,
      ip_address: {
        type: DataTypes.STRING(45),
        validate: {
          isIP: true
        }
      },
      user_agent: DataTypes.TEXT,
      connection_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'connected',
        validate: {
          isIn: [['connected', 'disconnected', 'idle']]
        }
      },
      last_ping_at: DataTypes.DATE,
      connected_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      disconnected_at: DataTypes.DATE,
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      tls_enforced: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      tableName: 'websocket_connections',
      schema: 'messaging',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['connection_status'] },
        { fields: ['last_ping_at'] },
        { fields: ['metadata'], using: 'gin' }
      ]
    });
  }

  static associate({ User, WebsocketMessage }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
    this.hasMany(WebsocketMessage, { foreignKey: 'connection_id', sourceKey: 'connection_id' });
  }
}; 