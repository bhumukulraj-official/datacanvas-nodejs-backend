'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Users Table
        CREATE TABLE auth.users (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          role VARCHAR(20) REFERENCES auth.user_roles(code) DEFAULT 'client',
          email_verified BOOLEAN DEFAULT FALSE,
          onboarding_status VARCHAR(20) DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'invited', 'active', 'inactive')),
          onboarding_date TIMESTAMPTZ,
          metadata JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes
        CREATE INDEX idx_users_email ON auth.users(email);
        CREATE INDEX idx_users_role ON auth.users(role);
        CREATE INDEX idx_users_is_deleted ON auth.users(is_deleted);
        CREATE INDEX idx_users_uuid ON auth.users(uuid);
        CREATE INDEX idx_users_metadata ON auth.users USING GIN(metadata);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS auth.users CASCADE;
      `, { transaction: t });
    });
  }
}; 