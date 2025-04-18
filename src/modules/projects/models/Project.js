const { DataTypes, Model } = require('sequelize');
const { sequelize, redisPublish } = require('../../../shared/database');

class Project extends Model {}

Project.init(
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    technologies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    github_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    live_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published']],
      },
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
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_projects_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_projects_status',
        fields: ['status'],
      },
      {
        name: 'idx_projects_is_featured',
        fields: ['is_featured'],
      },
      {
        name: 'idx_projects_created_at',
        fields: ['created_at'],
      },
    ],
    hooks: {
      afterUpdate: async (project) => {
        try {
          await redisPublish('cache_invalidate', `projects:${project.id}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterCreate: async (project) => {
        try {
          await redisPublish('cache_invalidate', 'projects:list');
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterDestroy: async (project) => {
        try {
          await redisPublish('cache_invalidate', `projects:${project.id}`);
          await redisPublish('cache_invalidate', 'projects:list');
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
    },
  }
);

module.exports = Project; 