'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Verify schema exists first
      await queryInterface.sequelize.query(
        'CREATE SCHEMA IF NOT EXISTS content;',
        { transaction: t }
      );

      await queryInterface.sequelize.query(`
        INSERT INTO "content"."project_statuses" ("code", "name", "description", "display_order")
        VALUES 
          ('planned', 'Planned', 'Project is in planning phase', 1),
          ('in_progress', 'In Progress', 'Project is currently active', 2),
          ('on_hold', 'On Hold', 'Project is paused temporarily', 3),
          ('completed', 'Completed', 'Project finished successfully', 4)
        ON CONFLICT (code) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM content.project_statuses 
        WHERE code IN ('planned', 'in_progress', 'on_hold', 'completed');
      `, { transaction: t });
    });
  }
}; 