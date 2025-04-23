const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class EmailVerificationToken extends Model {}

EmailVerificationToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      validate: {
        len: [32, 255]
      }
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isAfterCreation(value) {
          if (new Date(value) <= new Date()) {
            throw new Error('Expiry date must be in the future');
          }
        }
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize,
    modelName: 'EmailVerificationToken',
    tableName: 'email_verification_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_email_verification_tokens_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_email_verification_tokens_token',
        unique: true,
        fields: ['token'],
      },
      {
        name: 'idx_email_verification_tokens_expires_at',
        fields: ['expires_at'],
      }
    ],
  }
);

// Define associations
EmailVerificationToken.associate = (models) => {
  EmailVerificationToken.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'CASCADE'
  });
};

module.exports = EmailVerificationToken; 