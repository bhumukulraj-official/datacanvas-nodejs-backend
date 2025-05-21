'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap entire migration in transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Project Statuses Table
        CREATE TABLE content.project_statuses (
          code VARCHAR(20) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert initial statuses
        INSERT INTO content.project_statuses (code, name, description, display_order)
        VALUES 
        ('draft', 'Draft', 'Initial project setup', 1),
        ('in_progress', 'In Progress', 'Active development', 2),
        ('completed', 'Completed', 'Project is finished', 3),
        ('on_hold', 'On Hold', 'Project temporarily paused', 4),
        ('cancelled', 'Cancelled', 'Project has been cancelled', 5);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.project_statuses CASCADE;
      `, { transaction: t });
    });
  }
}; 