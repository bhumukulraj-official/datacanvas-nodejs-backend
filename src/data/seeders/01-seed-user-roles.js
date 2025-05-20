'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Use raw query instead of bulkInsert to handle schema-qualified tables
      await queryInterface.sequelize.query(`
        INSERT INTO auth.user_roles (code, name, description, is_active, display_order, created_at)
        VALUES 
          ('admin', 'Administrator', 'System administrator with full access', true, 1, NOW()),
          ('client', 'Client', 'Client user with limited access', true, 2, NOW())
        ON CONFLICT (code) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Don't delete the roles as they're essential to the system
      // Just return success
      return Promise.resolve();
    });
  }
}; 