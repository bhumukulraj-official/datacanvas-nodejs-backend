'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Check if auth schema exists
      const [schemaExists] = await queryInterface.sequelize.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')`,
        { transaction: t }
      );
      if (!schemaExists[0].exists) {
        throw new Error('Auth schema does not exist - run create-schemas migration first');
      }

      try {
        // Create user roles table
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
          
          -- Create index on is_active for performance
          CREATE INDEX idx_user_roles_is_active ON auth.user_roles(is_active);
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in user roles creation migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema = 'auth'
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'auth'
            AND table_name = 'user_roles'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && dependencies[0].count > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on auth.user_roles table. These will be dropped due to CASCADE.`);
        }
        
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS auth.user_roles CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in user roles down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 