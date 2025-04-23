const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

/**
 * PushSubscription model
 * Stores web push notification subscription details for users
 */
class PushSubscription extends Model {}

PushSubscription.init(
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
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    p256dh: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'User public key',
    },
    auth: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'User auth secret',
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of device (browser, mobile, etc)',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    sequelize,
    modelName: 'PushSubscription',
    tableName: 'push_subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_push_subscriptions_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_push_subscriptions_endpoint',
        fields: ['endpoint'],
        unique: true,
      },
      {
        name: 'idx_push_subscriptions_is_active',
        fields: ['is_active'],
      },
    ],
  }
);

module.exports = PushSubscription; 