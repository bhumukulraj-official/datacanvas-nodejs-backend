const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class RateLimitConfig extends BaseModel {
  static init(sequelize) {
    return super.init({
      endpoint_pattern: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      requests_limit: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      window_size_seconds: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      entity_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [['ip', 'user', 'api_key']]
        }
      },
      description: DataTypes.TEXT,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      sequelize,
      tableName: 'rate_limit_configs',
      schema: 'public_api',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['endpoint_pattern'] },
        { fields: ['entity_type'] },
        { fields: ['is_active'] }
      ]
    });
  }
}; 