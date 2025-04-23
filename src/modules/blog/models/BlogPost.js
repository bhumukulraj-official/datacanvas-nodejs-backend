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
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [3, 255]
      }
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, Infinity]
      }
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    featured_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'deleted'),
      defaultValue: 'draft',
      allowNull: false,
      validate: {
        validateStatusTransition(value) {
          // Skip validation for new records
          if (this.isNewRecord) return;
          
          // Skip validation if status hasn't changed
          if (this.previous('status') === value) return;

          // Define valid transitions
          const transitions = {
            'draft': ['draft', 'published', 'archived', 'deleted'],
            'published': ['published', 'archived', 'deleted'],
            'archived': ['draft', 'deleted'],
            'deleted': ['deleted']
          };

          // Check if the transition is valid
          const validNextStates = transitions[this.previous('status')] || [];
          if (!validNextStates.includes(value)) {
            throw new Error(`Invalid state transition from ${this.previous('status')} to ${value}`);
          }
        }
      }
    },
    visibility: {
      type: DataTypes.ENUM('public', 'private', 'password_protected'),
      defaultValue: 'public',
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        passwordRequiredForProtected(value) {
          if (this.visibility === 'password_protected' && (!value || value.length < 8)) {
            throw new Error('Password is required and must be at least 8 characters for password-protected posts');
          }
        }
      }
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        publishedAtRequiredForPublished(value) {
          if (this.status === 'published' && !value) {
            throw new Error('Published date is required for published posts');
          }
        }
      }
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    comment_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    searchVector: {
      type: DataTypes.TSVECTOR,
      allowNull: true
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
    modelName: 'BlogPost',
    tableName: 'blog_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
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
        name: 'idx_blog_posts_visibility',
        fields: ['visibility'],
      },
      {
        name: 'idx_blog_posts_slug',
        fields: ['slug'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_blog_posts_published_at',
        fields: ['published_at'],
      },
      {
        name: 'idx_blog_posts_deleted_at',
        fields: ['deleted_at'],
      },
    ],
    hooks: {
      beforeUpdate: async (post) => {
        // If post is being published and published_at is not set, set it now
        if (post.status === 'published' && post.changed('status') && !post.published_at) {
          post.published_at = new Date();
        }
      },
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

// Define associations
BlogPost.associate = (models) => {
  BlogPost.belongsTo(models.User, {
    foreignKey: 'author_id',
    as: 'author'
  });
  
  BlogPost.belongsTo(models.BlogCategory, {
    foreignKey: 'category_id',
    as: 'category'
  });
  
  BlogPost.belongsToMany(models.BlogTag, {
    through: models.BlogPostTag,
    foreignKey: 'post_id',
    otherKey: 'tag_id',
    as: 'tags'
  });

  // Add comment relationship
  BlogPost.hasMany(models.BlogComment, {
    foreignKey: 'post_id',
    as: 'comments'
  });
};

module.exports = BlogPost; 