'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- User Roles Table
        CREATE TABLE auth.user_roles (
          code VARCHAR(20) PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          display_order INT DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Insert initial roles
        INSERT INTO auth.user_roles (code, name, description, display_order)
        VALUES 
        ('admin', 'Administrator', 'System administrator with full access', 1),
        ('client', 'Client', 'Client user with limited access', 2);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS auth.user_roles CASCADE;
      `, { transaction: t });
    });
  }
}; 