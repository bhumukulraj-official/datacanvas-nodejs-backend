'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Note: Enum types are created during migration, no need to seed data
    return Promise.resolve();
  },

  async down(queryInterface, Sequelize) {
    // Note: Enum types are dropped during migration, no need to clean up
    return Promise.resolve();
  }
}; 