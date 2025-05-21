'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Create skills table first
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
          
          -- Basic indexes for common query patterns
          CREATE INDEX idx_skills_user_id ON content.skills(user_id);
          CREATE INDEX idx_skills_category ON content.skills(category);
          CREATE INDEX idx_skills_is_highlighted ON content.skills(is_highlighted);
          CREATE INDEX idx_skills_is_deleted ON content.skills(is_deleted);
        `, { transaction: t });
        
        // Create search index separately for better optimization
        // Using a simplified approach that will be more performant during updates
        await queryInterface.sequelize.query(`
          -- Optimized search index focusing just on name and category
          -- This reduces the performance impact during updates while still providing search capabilities
          CREATE INDEX idx_skills_name_search ON content.skills USING GIN(to_tsvector('english', name));
          
          -- Create a separate partial index for skills that are highlighted and not deleted
          -- This optimizes the common query pattern for finding highlighted skills
          CREATE INDEX idx_skills_highlighted_active ON content.skills(user_id) 
          WHERE is_highlighted = TRUE AND is_deleted = FALSE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in create skills migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS content.skills CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in skills down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 