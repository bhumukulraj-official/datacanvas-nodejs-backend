'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Skills Table
        CREATE TABLE content.skills (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
          name VARCHAR(100) NOT NULL,
          category VARCHAR(50),
          proficiency INT CHECK (proficiency BETWEEN 1 AND 5),
          description TEXT,
          is_highlighted BOOLEAN DEFAULT FALSE,
          display_order INT DEFAULT 0,
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Indexes
        CREATE INDEX idx_skills_user_id ON content.skills(user_id);
        CREATE INDEX idx_skills_category ON content.skills(category);
        CREATE INDEX idx_skills_is_highlighted ON content.skills(is_highlighted);
        CREATE INDEX idx_skills_is_deleted ON content.skills(is_deleted);
        CREATE INDEX idx_skills_search ON content.skills USING GIN(to_tsvector('english', name || ' ' || COALESCE(category, '') || ' ' || COALESCE(description, '')));
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS content.skills CASCADE;
      `, { transaction: t });
    });
  }
}; 