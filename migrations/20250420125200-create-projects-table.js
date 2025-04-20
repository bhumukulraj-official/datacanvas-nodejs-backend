'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('projects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      thumbnail_url: {
        type: Sequelize.STRING,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [],
      },
      technologies: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [],
      },
      github_url: {
        type: Sequelize.STRING,
      },
      live_url: {
        type: Sequelize.STRING,
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'draft',
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
    await queryInterface.addIndex('projects', ["user_id"], { name: 'idx_projects_user_id' });
    await queryInterface.addIndex('projects', ["status"], { name: 'idx_projects_status' });
    await queryInterface.addIndex('projects', ["is_featured"], { name: 'idx_projects_is_featured' });
    await queryInterface.addIndex('projects', ["created_at"], { name: 'idx_projects_created_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('projects');
  }
};
