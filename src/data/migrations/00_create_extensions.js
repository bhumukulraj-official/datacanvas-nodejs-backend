'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Add UUID extension for generating UUIDs
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    // We don't drop the extension as it might be used by other databases
    return Promise.resolve();
  }
}; 