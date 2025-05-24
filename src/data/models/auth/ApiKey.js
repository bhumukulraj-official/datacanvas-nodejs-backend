const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');

module.exports = class ApiKey extends BaseModel {
  static init(sequelize) {
    return super.init({
      key: DataTypes.STRING(64),
      key_hash: DataTypes.STRING(255),
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      scopes: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      rate_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 1000
      },
      user_id: DataTypes.INTEGER,
      expires_at: DataTypes.DATE,
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      previous_key: DataTypes.STRING(64),
      rotation_interval: {
        type: DataTypes.STRING, // Using STRING to store PostgreSQL INTERVAL
        defaultValue: '90 days'  // Match the INTERVAL DEFAULT '90 days' in migration
      },
      last_rotated_at: DataTypes.DATE
    }, {
      sequelize,
      tableName: 'api_keys',
      schema: 'auth',
      indexes: [
        { fields: ['key'] },
        { fields: ['user_id'] },
        { fields: ['is_active'] }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 