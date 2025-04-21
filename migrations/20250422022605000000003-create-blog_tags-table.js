'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable('blog_tags', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        slug: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
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
      await queryInterface.addIndex('blog_tags', ['name'], {
        name: 'idx_blog_tags_name',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });

      await queryInterface.addIndex('blog_tags', ['slug'], {
        name: 'idx_blog_tags_slug',
        unique: true,
        where: {
          deleted_at: null
        },
        transaction
      });

      await queryInterface.addIndex('blog_tags', ['created_by'], {
        name: 'idx_blog_tags_created_by',
        transaction
      });

      await queryInterface.addIndex('blog_tags', ['deleted_at'], {
        name: 'idx_blog_tags_deleted_at',
        transaction
      });

      // Add constraints for PostgreSQL
      const dialect = queryInterface.sequelize.getDialect();
      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(`
          ALTER TABLE blog_tags
          ADD CONSTRAINT check_tag_name_length
          CHECK (char_length(name) >= 2 AND char_length(name) <= 50);
          
          ALTER TABLE blog_tags
          ADD CONSTRAINT check_tag_slug_format
          CHECK (slug ~* '^[a-z0-9]+(?:-[a-z0-9]+)*$');
        `, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('blog_tags', { transaction });
    });
  }
};
