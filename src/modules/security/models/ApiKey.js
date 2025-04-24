const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class ApiKey extends Model {}

ApiKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
      }
    },
    key_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [32, 255],
      }
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'revoked'),
      allowNull: false,
      defaultValue: 'active',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isValidExpiry(value) {
          if (value && value <= this.created_at) {
            throw new Error('Expiry date must be after creation date');
          }
        }
      }
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ApiKey',
    tableName: 'api_keys',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_api_keys_key_hash',
        fields: ['key_hash'],
        unique: true,
      },
      {
        name: 'idx_api_keys_status',
        fields: ['status'],
      },
    ],
  }
);

module.exports = ApiKey; 