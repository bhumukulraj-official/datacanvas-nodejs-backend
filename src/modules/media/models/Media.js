const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

// Media type and status values matching the database ENUMs
const MEDIA_TYPES = ['image', 'video', 'document', 'audio'];
const MEDIA_STATUSES = ['processing', 'ready', 'failed', 'deleted'];
const VISIBILITY_TYPES = ['public', 'private'];

class Media extends Model {}

Media.init(
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
    url: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    storage_provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'local',
    },
    storage_bucket: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    storage_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM(...MEDIA_TYPES),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    file_extension: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
        max: 104857600, // 100MB max size
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    visibility: {
      type: DataTypes.ENUM(...VISIBILITY_TYPES),
      defaultValue: 'public',
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM(...MEDIA_STATUSES),
      defaultValue: 'ready',
      allowNull: false,
    },
    optimized_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    optimized_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    optimization_metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
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
    modelName: 'Media',
    tableName: 'media',
    timestamps: true,
    paranoid: true, // Enables soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      {
        name: 'idx_media_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_media_type',
        fields: ['type'],
      },
      {
        name: 'idx_media_visibility',
        fields: ['visibility'],
      },
      {
        name: 'idx_media_status',
        fields: ['status'],
      },
      {
        name: 'idx_media_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_media_type_status',
        fields: ['type', 'status'],
      },
    ],
  }
);

// Export constants for use in validators and services
Media.MEDIA_TYPES = MEDIA_TYPES;
Media.MEDIA_STATUSES = MEDIA_STATUSES;
Media.VISIBILITY_TYPES = VISIBILITY_TYPES;

module.exports = Media; 