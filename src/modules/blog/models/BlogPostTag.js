const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../shared/database');

class BlogPostTag extends Model {}

BlogPostTag.init(
  {
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'blog_posts',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    tag_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'blog_tags',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'BlogPostTag',
    tableName: 'blog_posts_tags',
    timestamps: false,
    indexes: [
      {
        name: 'idx_blog_posts_tags_post_id',
        fields: ['post_id'],
      },
      {
        name: 'idx_blog_posts_tags_tag_id',
        fields: ['tag_id'],
      },
    ],
  }
);

module.exports = BlogPostTag; 