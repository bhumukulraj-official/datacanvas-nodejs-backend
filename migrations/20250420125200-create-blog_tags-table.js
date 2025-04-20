'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('blog_tags', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
    await queryInterface.addIndex('blog_tags', ["slug"], { name: 'idx_blog_tags_slug', unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('blog_tags');
  }
};
