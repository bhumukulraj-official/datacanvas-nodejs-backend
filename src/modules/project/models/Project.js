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
      validate: {
        len: [3, 200]
      }
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/i
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, Infinity]
      }
    },
    thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value || []));
      }
    },
    technologies: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('technologies');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('technologies', JSON.stringify(value || []));
      }
    },
    github_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    live_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfterStartDate(value) {
          if (value && this.start_date && value < this.start_date) {
            throw new Error('End date must be after start date');
          }
        }
      }
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'in_progress', 'completed', 'archived'),
      defaultValue: 'draft',
    },
    meta_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.STRING(200),
      allowNull: true,
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
    modelName: 'Project',
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
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
        name: 'idx_projects_slug',
        fields: ['slug'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_projects_display_order',
        fields: ['display_order'],
      },
      {
        name: 'idx_projects_deleted_at',
        fields: ['deleted_at'],
      }
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