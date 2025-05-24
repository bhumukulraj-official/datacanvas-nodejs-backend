const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class UserActivityLog extends BaseModel {
  static init(sequelize) {
    return super.init({
      user_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      action_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      entity_type: DataTypes.STRING(50),
      entity_id: DataTypes.INTEGER,
      details: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      ip_address: {
        type: DataTypes.STRING(45),
        validate: { isIP: true }
      },
      user_agent: DataTypes.TEXT,
      retention_period: {
        type: DataTypes.STRING, // PostgreSQL INTERVAL is represented as STRING in Sequelize
        defaultValue: '365 days'
      }
    }, {
      sequelize,
      tableName: 'user_activity_logs',
      schema: 'metrics',
      timestamps: true,
      updatedAt: false, // Only has created_at in the migration
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
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 