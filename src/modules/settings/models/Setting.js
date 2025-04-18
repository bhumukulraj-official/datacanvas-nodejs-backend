const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class Setting extends Model {}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    site_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    site_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    favicon_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    theme: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    contact_info: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    social_links: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    seo_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    analytics_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    theme_options: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    privacy_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    notification_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    caching_settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    security_settings: {
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
  },
  {
    sequelize,
    modelName: 'Setting',
    tableName: 'settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Setting; 