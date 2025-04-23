const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class BlogComment extends Model {}

BlogComment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    author_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    author_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    author_website: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'spam', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'blog_comments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    modelName: 'BlogComment',
    tableName: 'blog_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_blog_comments_post_id',
        fields: ['post_id'],
      },
      {
        name: 'idx_blog_comments_status',
        fields: ['status'],
      },
      {
        name: 'idx_blog_comments_parent_id',
        fields: ['parent_id'],
      },
      {
        name: 'idx_blog_comments_user_id',
        fields: ['user_id'],
      },
    ],
  }
);

// Define associations
BlogComment.associate = (models) => {
  // Parent-child relationship for nested comments
  BlogComment.belongsTo(BlogComment, {
    foreignKey: 'parent_id',
    as: 'parent',
  });
  
  BlogComment.hasMany(BlogComment, {
    foreignKey: 'parent_id',
    as: 'replies',
  });
  
  // Relationship with blog post
  BlogComment.belongsTo(models.BlogPost, {
    foreignKey: 'post_id',
    as: 'post',
  });
  
  // Optional relationship with user (if logged in)
  BlogComment.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
  });
};

module.exports = BlogComment; 