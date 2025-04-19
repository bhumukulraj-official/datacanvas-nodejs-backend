const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class RefreshToken extends Model {}

RefreshToken.init(
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
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP address that created this token',
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'User agent string for device tracking',
    },
    device_info: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Additional device information',
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'If the token has been explicitly revoked',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RefreshToken',
    tableName: 'refresh_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_refresh_tokens_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_refresh_tokens_token',
        fields: ['token'],
      },
      {
        name: 'idx_refresh_tokens_is_revoked',
        fields: ['is_revoked'],
      },
    ],
  }
);

module.exports = RefreshToken; 