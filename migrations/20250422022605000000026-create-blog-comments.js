'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_comments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      post_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_posts',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      author_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      author_email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      author_website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'spam', 'rejected'),
        defaultValue: 'pending',
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'blog_comments',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes
    await queryInterface.addIndex('blog_comments', ['post_id'], {
      name: 'idx_blog_comments_post_id',
    });
    await queryInterface.addIndex('blog_comments', ['status'], {
      name: 'idx_blog_comments_status',
    });
    await queryInterface.addIndex('blog_comments', ['parent_id'], {
      name: 'idx_blog_comments_parent_id',
    });
    await queryInterface.addIndex('blog_comments', ['user_id'], {
      name: 'idx_blog_comments_user_id',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blog_comments');
  }
}; 