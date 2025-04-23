const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class BlogCategory extends Model {}

BlogCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'blog_categories',
        key: 'id',
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    modelName: 'BlogCategory',
    tableName: 'blog_categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_blog_categories_slug',
        fields: ['slug'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_blog_categories_name',
        fields: ['name'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_blog_categories_parent_id',
        fields: ['parent_id'],
      },
      {
        name: 'idx_blog_categories_created_by',
        fields: ['created_by'],
      },
      {
        name: 'idx_blog_categories_deleted_at',
        fields: ['deleted_at'],
      },
    ],
  }
);

// Define associations
BlogCategory.associate = (models) => {
  // Self association for hierarchical categories
  BlogCategory.belongsTo(BlogCategory, {
    foreignKey: 'parent_id',
    as: 'parent'
  });
  
  BlogCategory.hasMany(BlogCategory, {
    foreignKey: 'parent_id',
    as: 'children'
  });
  
  // Association with blog posts
  BlogCategory.hasMany(models.BlogPost, {
    foreignKey: 'category_id',
    as: 'posts'
  });
  
  // Association with user who created the category
  BlogCategory.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = BlogCategory; 