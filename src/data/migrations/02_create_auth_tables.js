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

        -- Email Verification Tokens Table
        CREATE TABLE auth.email_verification_tokens (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_users_email ON auth.users(email);
        CREATE INDEX idx_users_role ON auth.users(role);
        CREATE INDEX idx_users_is_deleted ON auth.users(is_deleted);
        CREATE INDEX idx_users_uuid ON auth.users(uuid);
        CREATE INDEX idx_users_metadata ON auth.users USING GIN(metadata);
        
        CREATE INDEX idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
        CREATE INDEX idx_refresh_tokens_token ON auth.refresh_tokens(token);
        CREATE INDEX idx_refresh_tokens_is_revoked ON auth.refresh_tokens(is_revoked);
        CREATE INDEX idx_refresh_tokens_device_info ON auth.refresh_tokens USING GIN(device_info);
        
        CREATE INDEX idx_email_verification_tokens_user_id ON auth.email_verification_tokens(user_id);
        CREATE INDEX idx_email_verification_tokens_token ON auth.email_verification_tokens(token);
      `, { transaction: t });

      // Insert initial roles
      await queryInterface.sequelize.query(`
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
        DROP TABLE IF EXISTS auth.email_verification_tokens CASCADE;
        DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;
        DROP TABLE IF EXISTS auth.users CASCADE;
        DROP TABLE IF EXISTS auth.user_roles CASCADE;
      `, { transaction: t });
    });
  }
}; 