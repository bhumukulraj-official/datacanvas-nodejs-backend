'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_posts_tags', {
      post_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'blog_posts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: 'blog_tags',
          key: 'id'
        },
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
    });

    // Add indexes
    await queryInterface.addIndex('blog_posts_tags', ['post_id'], { name: 'idx_blog_posts_tags_post_id' });
    await queryInterface.addIndex('blog_posts_tags', ['tag_id'], { name: 'idx_blog_posts_tags_tag_id' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blog_posts_tags');
  }
};
