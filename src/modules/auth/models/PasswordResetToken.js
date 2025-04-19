const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class PasswordResetToken extends Model {}

PasswordResetToken.init(
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'PasswordResetToken',
    tableName: 'password_reset_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_password_reset_tokens_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_password_reset_tokens_token',
        fields: ['token'],
      },
    ],
  }
);

module.exports = PasswordResetToken; 