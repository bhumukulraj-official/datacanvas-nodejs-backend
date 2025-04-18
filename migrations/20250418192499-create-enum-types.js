'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS notification_priority;
    `);
  }
};
