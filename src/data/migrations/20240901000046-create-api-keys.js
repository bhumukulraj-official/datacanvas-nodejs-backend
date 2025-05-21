'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE TABLE auth.api_keys (
          id SERIAL PRIMARY KEY,
          key VARCHAR(64) UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          scopes JSONB NOT NULL,
          rate_limit INT DEFAULT 1000,
          user_id INT REFERENCES auth.users(id),
          expires_at TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_api_keys_key ON auth.api_keys(key);

        ALTER TABLE auth.api_keys
        ADD COLUMN previous_key VARCHAR(64),
        ADD COLUMN rotation_interval INTERVAL DEFAULT '90 days',
        ADD COLUMN last_rotated_at TIMESTAMPTZ;

        ALTER TABLE auth.api_keys
        ADD COLUMN key_hash VARCHAR(255),
        ALTER COLUMN key DROP NOT NULL;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS auth.api_keys;
    `);
  }
}; 