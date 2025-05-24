const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class RateLimit extends BaseModel {
  static init(sequelize) {
    return super.init({
      entity_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['ip', 'user', 'api_key']]
        }
      },
      entity_identifier: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      endpoint: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      requests_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      window_start: {
        type: DataTypes.DATE,
        allowNull: false
      },
      window_size_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      is_authenticated: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'rate_limits',
      schema: 'public_api',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['entity_type', 'entity_identifier'] },
        { fields: ['endpoint'] },
        { fields: ['window_start'] }
      ]
    });
  }
}; 