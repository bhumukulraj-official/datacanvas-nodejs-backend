'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contact_submissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'new',
      },
      ip_address: {
        type: Sequelize.STRING,
      },
      recaptcha_token: {
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
    await queryInterface.addIndex('contact_submissions', ["status"], { name: 'idx_contact_submissions_status' });
    await queryInterface.addIndex('contact_submissions', ["created_at"], { name: 'idx_contact_submissions_created_at' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('contact_submissions');
  }
};
