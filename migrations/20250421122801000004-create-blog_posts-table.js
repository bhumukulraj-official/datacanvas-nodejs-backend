'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_posts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      featured_image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'blog_categories',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'draft',
        validate: {
          isIn: [['draft', 'published']]
        }
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('blog_posts', ['author_id'], { name: 'idx_blog_posts_author' });
    await queryInterface.addIndex('blog_posts', ['category_id'], { name: 'idx_blog_posts_category' });
    await queryInterface.addIndex('blog_posts', ['status'], { name: 'idx_blog_posts_status' });
    await queryInterface.addIndex('blog_posts', ['slug'], { name: 'idx_blog_posts_slug' });
    await queryInterface.addIndex('blog_posts', ['created_at'], { name: 'idx_blog_posts_created_at' });
    await queryInterface.addIndex('blog_posts', ['published_at'], { name: 'idx_blog_posts_published_at' });
    
    // Add full-text search index
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_blog_posts_content_search ON blog_posts USING GIN(to_tsvector('english', title || ' ' || content));
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blog_posts');
  }
};
