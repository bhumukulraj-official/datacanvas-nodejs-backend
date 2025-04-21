'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('blog_posts_tags', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        post_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'blog_posts',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        tag_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'blog_tags',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Add unique constraint for post_id and tag_id combination
      await queryInterface.addConstraint('blog_posts_tags', {
        fields: ['post_id', 'tag_id'],
        type: 'unique',
        name: 'uq_blog_posts_tags_post_tag',
        transaction
      });

      // Add indexes
      await queryInterface.addIndex('blog_posts_tags', ['post_id'], {
        name: 'idx_blog_posts_tags_post',
        transaction
      });

      await queryInterface.addIndex('blog_posts_tags', ['tag_id'], {
        name: 'idx_blog_posts_tags_tag',
        transaction
      });

      // Add composite index for common queries
      await queryInterface.addIndex('blog_posts_tags', ['post_id', 'tag_id'], {
        name: 'idx_blog_posts_tags_post_tag',
        transaction
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_posts_tags', { transaction });
    });
  }
};
