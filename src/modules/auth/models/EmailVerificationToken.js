const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class EmailVerificationToken extends Model {}

EmailVerificationToken.init(
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EmailVerificationToken',
    tableName: 'email_verification_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_email_verification_tokens_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_email_verification_tokens_token',
        fields: ['token'],
      },
    ],
  }
);

module.exports = EmailVerificationToken; 