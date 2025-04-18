const { DataTypes, Model } = require('sequelize');
const { sequelize, redisPublish } = require('../../../shared/database');

class BlogPost extends Model {}

BlogPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    featured_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'blog_categories',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    status: {
      type: DataTypes.STRING(10),
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published']],
      },
    },
    published_at: {
      type: DataTypes.DATE,
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
  },
  {
    sequelize,
    modelName: 'BlogPost',
    tableName: 'blog_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_blog_posts_author',
        fields: ['author_id'],
      },
      {
        name: 'idx_blog_posts_category',
        fields: ['category_id'],
      },
      {
        name: 'idx_blog_posts_status',
        fields: ['status'],
      },
      {
        name: 'idx_blog_posts_slug',
        fields: ['slug'],
        unique: true,
      },
      {
        name: 'idx_blog_posts_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_blog_posts_published_at',
        fields: ['published_at'],
      },
    ],
    hooks: {
      afterUpdate: async (post) => {
        try {
          await redisPublish('cache_invalidate', `blog_posts:${post.id}`);
          await redisPublish('cache_invalidate', `blog_posts:slug:${post.slug}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterCreate: async (post) => {
        try {
          await redisPublish('cache_invalidate', 'blog_posts:list');
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
      afterDestroy: async (post) => {
        try {
          await redisPublish('cache_invalidate', `blog_posts:${post.id}`);
          await redisPublish('cache_invalidate', `blog_posts:slug:${post.slug}`);
          await redisPublish('cache_invalidate', 'blog_posts:list');
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      },
    },
  }
);

module.exports = BlogPost; 