const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class UserActivityLog extends BaseModel {
  static init() {
    return super.init({
      action_type: DataTypes.STRING(50),
      entity_type: DataTypes.STRING(50),
      entity_id: DataTypes.INTEGER,
      details: DataTypes.JSONB,
      ip_address: {
        type: DataTypes.STRING(45),
        validate: { isIP: true }
      },
      user_agent: DataTypes.TEXT
    }, {
      sequelize,
      tableName: 'user_activity_logs',
      schema: 'metrics',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['action_type'] },
        { fields: ['entity_type'] },
        { fields: ['created_at'] },
        { 
          name: 'idx_user_activity_logs_details',
          fields: ['details'],
          using: 'gin'
        }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User);
  }
}; 