const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');
const sequelize = require('../../../config/database');

module.exports = class RefreshToken extends BaseModel {
  static init() {
    return super.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING(255),
        unique: true
      },
      expires_at: DataTypes.DATE,
      device_info: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      created_at: DataTypes.DATE
    }, {
      sequelize,
      tableName: 'refresh_tokens',
      schema: 'auth',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] },
        { fields: ['is_revoked'] },
        { name: 'idx_refresh_tokens_device_info', fields: ['device_info'], using: 'gin' },
        { fields: ['created_at'] }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 