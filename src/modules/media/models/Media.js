const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

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
      type: DataTypes.STRING(10), // Using STRING to represent ENUM 'media_type'
      allowNull: false,
      validate: {
        isIn: [['image', 'video', 'document', 'audio']],
      },
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
      type: DataTypes.STRING(20),
      defaultValue: 'public',
      allowNull: false,
      validate: {
        isIn: [['public', 'private']],
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    status: {
      type: DataTypes.STRING(10), // Using STRING to represent ENUM 'media_status'
      defaultValue: 'ready',
      allowNull: false,
      validate: {
        isIn: [['processing', 'ready', 'failed', 'deleted']],
      },
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

module.exports = Media; 