const { DataTypes } = require('sequelize');
const BaseModel = require('../BaseModel');


module.exports = class RefreshToken extends BaseModel {
  static init(sequelize) {
    return super.init({
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      device_info: {
        type: DataTypes.JSONB,
        defaultValue: {}
      },
      is_revoked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      sequelize,
      tableName: 'refresh_tokens',
      schema: 'auth',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false, // No updated_at in migration
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token'] },
        { fields: ['is_revoked'] },
        { name: 'idx_refresh_tokens_device_info', fields: ['device_info'], using: 'gin' }
      ]
    });
  }

  static associate({ User }) {
    this.belongsTo(User, { foreignKey: 'user_id' });
  }
}; 