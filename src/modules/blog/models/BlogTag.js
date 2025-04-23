const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class BlogTag extends Model {}

BlogTag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50]
      }
    },
    slug: {
      type: DataTypes.STRING(50),
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
    modelName: 'BlogTag',
    tableName: 'blog_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    indexes: [
      {
        name: 'idx_blog_tags_slug',
        fields: ['slug'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_blog_tags_name',
        fields: ['name'],
        unique: true,
        where: {
          deleted_at: null
        }
      },
      {
        name: 'idx_blog_tags_created_by',
        fields: ['created_by'],
      },
      {
        name: 'idx_blog_tags_deleted_at',
        fields: ['deleted_at'],
      },
    ],
  }
);

// Define associations
BlogTag.associate = (models) => {
  // Many-to-many with blog posts
  BlogTag.belongsToMany(models.BlogPost, {
    through: models.BlogPostTag,
    foreignKey: 'tag_id',
    otherKey: 'post_id',
    as: 'posts'
  });
  
  // Creator relationship
  BlogTag.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator'
  });
};

module.exports = BlogTag; 