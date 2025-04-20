'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING,
      },
      bio: {
        type: Sequelize.TEXT,
      },
      avatar_url: {
        type: Sequelize.STRING,
      },
      phone: {
        type: Sequelize.STRING,
      },
      location: {
        type: Sequelize.STRING,
      },
      social_links: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      resume_url: {
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
    await queryInterface.addIndex('profiles', ["user_id"], { name: 'idx_profiles_user_id' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profiles');
  }
};
