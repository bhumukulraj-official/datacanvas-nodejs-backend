'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the schema if it doesn't exist and set the search path
    await queryInterface.sequelize.query(`
      -- Make sure schemas exist
      CREATE SCHEMA IF NOT EXISTS metrics;
      
      -- Grant privileges
      GRANT ALL ON SCHEMA metrics TO postgres;
      
      -- Set the search path for this session
      SET search_path TO public, content, auth, metrics;
    `);

    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- User Activity Logs Table
        CREATE TABLE metrics.user_activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE SET NULL,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50),
          entity_id INT,
          details JSONB DEFAULT '{}',
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_user_activity_logs_user_id ON metrics.user_activity_logs(user_id);
        CREATE INDEX idx_user_activity_logs_action_type ON metrics.user_activity_logs(action_type);
        CREATE INDEX idx_user_activity_logs_entity_type ON metrics.user_activity_logs(entity_type);
        CREATE INDEX idx_user_activity_logs_created_at ON metrics.user_activity_logs(created_at);
        CREATE INDEX idx_user_activity_logs_details ON metrics.user_activity_logs USING GIN(details);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS metrics.user_activity_logs CASCADE;
    `);
  }
}; 