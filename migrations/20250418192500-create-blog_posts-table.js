'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      excerpt: {
        type: Sequelize.STRING,
      },
      featured_image: {
        type: Sequelize.STRING,
      },
      author_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'blog_categories',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'draft',
      },
      published_at: {
        type: Sequelize.DATE,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: {},
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: {},
      },
    });

    // Add indexes
    await queryInterface.addIndex('blog_posts', ["author_id"], { name: 'idx_blog_posts_author' });
    await queryInterface.addIndex('blog_posts', ["category_id"], { name: 'idx_blog_posts_category' });
    await queryInterface.addIndex('blog_posts', ["status"], { name: 'idx_blog_posts_status' });
    await queryInterface.addIndex('blog_posts', ["slug"], { name: 'idx_blog_posts_slug', unique: true });
    await queryInterface.addIndex('blog_posts', ["created_at"], { name: 'idx_blog_posts_created_at' });
    await queryInterface.addIndex('blog_posts', ["published_at"], { name: 'idx_blog_posts_published_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blog_posts');
  }
};
