'use strict';

/**
 * Migration: Create Projects
 * Purpose: Creates the projects table with all related indexes and constraints
 * Dependencies: 20240901000002-create-schemas.js, 20240901000004-create-users.js, 20240901000007-create-project-statuses.js
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check for dependencies outside of the transaction
    try {
      // Check for required tables
      const [dependencies] = await queryInterface.sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = 'auth' AND table_name = 'users') AS users_exists,
          (SELECT COUNT(*) FROM information_schema.tables 
           WHERE table_schema = 'content' AND table_name = 'project_statuses') AS statuses_exists;
      `);
      
      const usersExists = parseInt(dependencies[0].users_exists) > 0;
      const statusesExists = parseInt(dependencies[0].statuses_exists) > 0;
      
      if (!usersExists) {
        throw new Error("auth.users table does not exist. This migration depends on 20240901000004-create-users.js");
      }
      
      if (!statusesExists) {
        throw new Error("content.project_statuses table does not exist. This migration depends on 20240901000007-create-project-statuses.js");
      }
      
      // Wrap in transaction for safety
      return queryInterface.sequelize.transaction(async (t) => {
        try {
          console.log('Creating projects table and indexes...');
          
          // Check if table already exists
          const [tableExists] = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = 'content' AND table_name = 'projects';
          `, { transaction: t });
          
          if (parseInt(tableExists[0].count) > 0) {
            console.log('projects table already exists, skipping creation');
            return Promise.resolve();
          }
          
          // Check for update_timestamp function
          const [timestampFnExists] = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count FROM pg_proc 
            WHERE proname = 'update_timestamp' AND pronamespace = 'public'::regnamespace;
          `, { transaction: t });
          
          if (parseInt(timestampFnExists[0].count) === 0) {
            console.log('Creating update_timestamp function...');
            await queryInterface.sequelize.query(`
              CREATE OR REPLACE FUNCTION public.update_timestamp()
              RETURNS TRIGGER AS $$
              BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
              END;
              $$ LANGUAGE plpgsql;
            `, { transaction: t });
          }
          
          // Create projects table with consistent foreign key behavior
          await queryInterface.sequelize.query(`
            -- Projects Table
            CREATE TABLE content.projects (
              id SERIAL PRIMARY KEY,
              uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
              user_id INT REFERENCES auth.users(id) ON DELETE CASCADE,
              title VARCHAR(200) NOT NULL,
              description TEXT NOT NULL,
              thumbnail_url VARCHAR(255),
              technologies TEXT[],
              github_url VARCHAR(255),
              live_url VARCHAR(255),
              is_featured BOOLEAN DEFAULT FALSE,
              visibility VARCHAR(15) DEFAULT 'portfolio' CHECK (visibility IN ('portfolio', 'private', 'client_only')),
              status_code VARCHAR(20) REFERENCES content.project_statuses(code) ON DELETE SET NULL,
              custom_fields JSONB DEFAULT '{}',
              is_deleted BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              deleted_at TIMESTAMPTZ
            );

            -- Optimized index strategy - prioritize high-value indexes and avoid redundancies
            -- Primary lookup indexes
            CREATE INDEX idx_projects_user_id ON content.projects(user_id);
            CREATE INDEX idx_projects_uuid ON content.projects(uuid);
            
            -- Filtered lookup indexes with high selectivity
            CREATE INDEX idx_projects_status_visibility ON content.projects(status_code, visibility, is_deleted) 
              WHERE is_deleted = FALSE;
            CREATE INDEX idx_projects_featured ON content.projects(is_featured) 
              WHERE is_featured = TRUE AND is_deleted = FALSE;
            
            -- Full-text search indexes (using GIN for array types)
            CREATE INDEX idx_projects_technologies ON content.projects USING GIN(technologies);
            
            -- JSONB index (for custom fields queries)
            CREATE INDEX idx_projects_custom_fields ON content.projects USING GIN(custom_fields jsonb_path_ops);
            
            -- BRIN index for time-range queries (more efficient than B-tree for timestamp ranges)
            CREATE INDEX idx_projects_created_at ON content.projects USING BRIN(created_at) 
              WITH (pages_per_range = 32);

            -- Add trigger for automatic updated_at timestamp
            CREATE TRIGGER update_projects_timestamp
            BEFORE UPDATE ON content.projects
            FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
            
            -- Record in migration meta
            INSERT INTO public.migration_meta (key, value)
            VALUES ('projects_table_created', jsonb_build_object(
              'created_at', CURRENT_TIMESTAMP,
              'indexes', 8
            ))
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

            -- Missing index recommendation
            CREATE INDEX idx_projects_visibility ON content.projects(visibility);
          `, { transaction: t });
          
          console.log('Projects table and indexes created successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Error in projects table creation:', error);
          return Promise.reject(error);
        }
      });
    } catch (dependencyError) {
      console.error('Dependency check failed:', dependencyError);
      return Promise.reject(dependencyError);
    }
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        console.log('Starting projects table down migration...');
        
        // Check if table exists first
        const [tableExists] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = 'content' AND table_name = 'projects';
        `, { transaction: t });
        
        if (parseInt(tableExists[0].count) === 0) {
          console.log('projects table does not exist, skipping drop');
          return Promise.resolve();
        }
        
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema NOT IN ('content')
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'content'
            AND table_name = 'projects'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && parseInt(dependencies[0].count) > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on content.projects table. These will be dropped due to CASCADE.`);
          
          // Try to log the details for audit purposes
          await queryInterface.sequelize.query(`
            INSERT INTO metrics.user_activity_logs(
              action_type, entity_type, details
            ) VALUES (
              'migration_warning', 
              'content.projects', 
              jsonb_build_object(
                'message', 'Dependencies found during down migration',
                'dependency_count', ${dependencies[0].count},
                'timestamp', CURRENT_TIMESTAMP
              )
            )
            ON CONFLICT DO NOTHING;
          `, { transaction: t }).catch(err => {
            console.warn('Could not log to metrics table, continuing anyway:', err.message);
          });
        }
        
        // Drop in the correct order: trigger first, then table
        console.log('Dropping projects table triggers and indexes...');
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS update_projects_timestamp ON content.projects;
        `, { transaction: t });
        
        console.log('Dropping projects table...');
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS content.projects CASCADE;
        `, { transaction: t });
        
        // Clean up migration meta
        await queryInterface.sequelize.query(`
          DELETE FROM public.migration_meta WHERE key = 'projects_table_created';
        `, { transaction: t }).catch(err => {
          console.warn('Could not clean up migration_meta table:', err.message);
        });
        
        console.log('Projects table dropped successfully');
        return Promise.resolve();
      } catch (error) {
        console.error('Error in projects down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 