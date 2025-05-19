'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Profiles Table
        CREATE TABLE content.profiles (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          title VARCHAR(200),
          bio TEXT,
          avatar_url VARCHAR(255),
          phone VARCHAR(20),
          location VARCHAR(100),
          social_links JSONB DEFAULT '{}',
          resume_url VARCHAR(255),
          additional_fields JSONB DEFAULT '{}',
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Enforce one profile per user constraint
        ALTER TABLE content.profiles ADD CONSTRAINT unique_user_profile UNIQUE (user_id);

        -- Indexes
        CREATE INDEX idx_profiles_user_id ON content.profiles(user_id);
        CREATE INDEX idx_profiles_is_deleted ON content.profiles(is_deleted);
        CREATE INDEX idx_profiles_social_links ON content.profiles USING GIN(social_links);
        CREATE INDEX idx_profiles_additional_fields ON content.profiles USING GIN(additional_fields);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.profiles CASCADE;
      `, { transaction: t });
    });
  }
}; 