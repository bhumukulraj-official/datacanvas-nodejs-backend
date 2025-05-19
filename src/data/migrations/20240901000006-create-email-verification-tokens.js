'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Email Verification Tokens Table
        CREATE TABLE auth.email_verification_tokens (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes
        CREATE INDEX idx_email_verification_tokens_user_id ON auth.email_verification_tokens(user_id);
        CREATE INDEX idx_email_verification_tokens_token ON auth.email_verification_tokens(token);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS auth.email_verification_tokens CASCADE;
      `, { transaction: t });
    });
  }
}; 