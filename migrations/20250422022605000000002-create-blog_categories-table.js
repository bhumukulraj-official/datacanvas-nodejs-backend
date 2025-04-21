'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('blog_categories', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        slug: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        parent_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'blog_categories',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT'
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
      await queryInterface.addIndex('blog_categories', ['name'], {
        name: 'idx_blog_categories_name',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });

      await queryInterface.addIndex('blog_categories', ['slug'], {
        name: 'idx_blog_categories_slug',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });

      await queryInterface.addIndex('blog_categories', ['parent_id'], {
        name: 'idx_blog_categories_parent_id',
        transaction
      });

      await queryInterface.addIndex('blog_categories', ['created_by'], {
        name: 'idx_blog_categories_created_by',
        transaction
      });

      await queryInterface.addIndex('blog_categories', ['deleted_at'], {
        name: 'idx_blog_categories_deleted_at',
        transaction
      });

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE blog_categories
          ADD CONSTRAINT check_category_name_length
          CHECK (char_length(name) >= 2 AND char_length(name) <= 100);
          
          ALTER TABLE blog_categories
          ADD CONSTRAINT check_category_slug_format
          CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$');
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_categories', { transaction });
    });
  }
};
