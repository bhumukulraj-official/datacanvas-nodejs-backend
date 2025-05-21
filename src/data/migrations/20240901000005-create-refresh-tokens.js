'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Refresh Tokens Table
        CREATE TABLE auth.refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          device_info JSONB DEFAULT '{}',
          is_revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes
        CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
        CREATE INDEX idx_refresh_tokens_token ON auth.refresh_tokens(token);
        CREATE INDEX idx_refresh_tokens_is_revoked ON auth.refresh_tokens(is_revoked);
        CREATE INDEX idx_refresh_tokens_device_info ON auth.refresh_tokens USING GIN(device_info);
        CREATE INDEX idx_refresh_tokens_user_token ON auth.refresh_tokens(user_id, token);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;
      `, { transaction: t });
    });
  }
}; 