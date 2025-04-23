const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class Notification extends Model {}

Notification.init(
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
    type: {
      type: DataTypes.ENUM('system', 'user', 'security', 'content', 'account', 'project', 'billing', 'social'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
    },
    status: {
      type: DataTypes.ENUM('unread', 'read', 'archived'),
      defaultValue: 'unread',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
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
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_notifications_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_notifications_read',
        fields: ['read'],
      },
      {
        name: 'idx_notifications_category',
        fields: ['category'],
      },
      {
        name: 'idx_notifications_status',
        fields: ['status'],
      },
      {
        name: 'idx_notifications_type',
        fields: ['type'],
      },
    ],
  }
);

module.exports = { Notification }; 