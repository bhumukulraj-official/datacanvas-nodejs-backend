'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('blog_posts', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        slug: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        excerpt: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        featured_image: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        category_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'blog_categories',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        author_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
        },
        status: {
          type: Sequelize.ENUM('draft', 'published', 'archived', 'deleted'),
          allowNull: false,
          defaultValue: 'draft'
        },
        visibility: {
          type: Sequelize.ENUM('public', 'private', 'password_protected'),
          allowNull: false,
          defaultValue: 'public'
        },
        password: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        published_at: {
          type: Sequelize.DATE,
          allowNull: true
        },
        meta_title: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        meta_description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        view_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        comment_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
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
        },
        deleted_at: {
          type: Sequelize.DATE,
          allowNull: true
        }
      }, { transaction });

      // Add indexes
      await queryInterface.addIndex('blog_posts', ['slug'], {
        name: 'idx_blog_posts_slug',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });

      await queryInterface.addIndex('blog_posts', ['category_id'], {
        name: 'idx_blog_posts_category',
        transaction
      });

      await queryInterface.addIndex('blog_posts', ['author_id'], {
        name: 'idx_blog_posts_author',
        transaction
      });

      await queryInterface.addIndex('blog_posts', ['status'], {
        name: 'idx_blog_posts_status',
        transaction
      });

      await queryInterface.addIndex('blog_posts', ['published_at'], {
        name: 'idx_blog_posts_published',
        transaction
      });

      await queryInterface.addIndex('blog_posts', ['deleted_at'], {
        name: 'idx_blog_posts_deleted_at',
        transaction
      });

      // Add composite indexes
      await queryInterface.addIndex('blog_posts', ['status', 'published_at'], {
        name: 'idx_blog_posts_status_published',
        transaction
      });

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE blog_posts
          ADD CONSTRAINT check_post_title_length
          CHECK (char_length(title) >= 3 AND char_length(title) <= 255);
          
          ALTER TABLE blog_posts
          ADD CONSTRAINT check_post_slug_format
          CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$');
          
          ALTER TABLE blog_posts
          ADD CONSTRAINT check_post_content_length
          CHECK (char_length(content) >= 10);
          
          ALTER TABLE blog_posts
          ADD CONSTRAINT check_post_password_length
          CHECK (password IS NULL OR char_length(password) >= 8);
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_posts', { transaction });
    });
  }
};
