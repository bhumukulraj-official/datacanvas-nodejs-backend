const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class BlogPostTag extends Model {}

BlogPostTag.init(
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
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'blog_tags',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
  },
  {
    sequelize,
    modelName: 'BlogPostTag',
    tableName: 'blog_posts_tags',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_blog_posts_tags_post_id',
        fields: ['post_id'],
      },
      {
        name: 'idx_blog_posts_tags_tag_id',
        fields: ['tag_id'],
      },
      {
        name: 'uq_blog_posts_tags_post_tag',
        unique: true,
        fields: ['post_id', 'tag_id'],
      },
    ],
  }
);

// Define associations
BlogPostTag.associate = (models) => {
  // This is a junction table, so we define its relationships with both models
  BlogPostTag.belongsTo(models.BlogPost, {
    foreignKey: 'post_id',
    as: 'post'
  });
  
  BlogPostTag.belongsTo(models.BlogTag, {
    foreignKey: 'tag_id',
    as: 'tag'
  });
};

module.exports = BlogPostTag; 