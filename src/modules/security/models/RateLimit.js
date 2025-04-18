const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class RateLimit extends Model {}

RateLimit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    request_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    window_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    window_end: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    api_type: {
      type: DataTypes.STRING(10),
      defaultValue: 'public',
      validate: {
        isIn: [['public', 'admin', 'websocket']],
      },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'RateLimit',
    tableName: 'rate_limits',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_rate_limits_ip_endpoint',
        fields: ['ip_address', 'endpoint'],
      },
      {
        name: 'idx_rate_limits_window',
        fields: ['window_start', 'window_end'],
      },
      {
        name: 'idx_rate_limits_api_type',
        fields: ['api_type'],
      },
      {
        name: 'idx_rate_limits_user_id',
        fields: ['user_id'],
      },
    ],
  }
);

module.exports = RateLimit; 