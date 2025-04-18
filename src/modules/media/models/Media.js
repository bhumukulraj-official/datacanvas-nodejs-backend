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
    },
    type: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['image', 'document', 'video']],
      },
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
      type: DataTypes.STRING(10),
      defaultValue: 'public',
      validate: {
        isIn: [['public', 'private']],
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    optimization_status: {
      type: DataTypes.STRING(10),
      defaultValue: 'none',
      validate: {
        isIn: [['none', 'in_progress', 'completed']],
      },
    },
    optimized_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    optimized_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    optimization_metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Media',
    tableName: 'media',
    timestamps: false,
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
    ],
  }
);

module.exports = Media; 