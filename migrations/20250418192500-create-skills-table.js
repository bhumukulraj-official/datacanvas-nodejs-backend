'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('skills', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING,
      },
      proficiency: {
        type: Sequelize.INTEGER,
      },
      icon: {
        type: Sequelize.STRING,
      },
      is_highlighted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      display_order: {
        type: Sequelize.INTEGER,
      },
      description: {
        type: Sequelize.TEXT,
      },
      years_of_experience: {
        type: Sequelize.DECIMAL(4, 1),
      },
      last_used_date: {
        type: Sequelize.DATE,
      },
      certification_url: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('skills', ["user_id"], { name: 'idx_skills_user_id' });
    await queryInterface.addIndex('skills', ["category"], { name: 'idx_skills_category' });
    await queryInterface.addIndex('skills', ["is_highlighted"], { name: 'idx_skills_is_highlighted' });
    await queryInterface.addIndex('skills', ["display_order"], { name: 'idx_skills_display_order' });
    await queryInterface.addIndex('skills', ["name"], { name: 'idx_skills_name' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skills');
  }
};
