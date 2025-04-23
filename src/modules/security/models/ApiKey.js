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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    secret_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'revoked', 'expired']]
      }
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rate_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    rate_limit_period: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'minute',
      validate: {
        isIn: [['second', 'minute', 'hour', 'day']]
      }
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
        name: 'idx_api_keys_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_api_keys_key',
        fields: ['key'],
        unique: true,
      },
      {
        name: 'idx_api_keys_status',
        fields: ['status'],
      },
    ],
  }
);

ApiKey.associate = (models) => {
  ApiKey.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = ApiKey; 