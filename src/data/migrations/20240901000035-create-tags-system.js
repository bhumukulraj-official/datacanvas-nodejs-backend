'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Tags table
        CREATE TABLE content.tags (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) UNIQUE NOT NULL,
          slug VARCHAR(50) UNIQUE NOT NULL,
          category VARCHAR(50),
          is_technology BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Project Tags junction table
        CREATE TABLE content.project_tags (
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          tag_id INT REFERENCES content.tags(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (project_id, tag_id)
        );

        -- Migrate existing tags from projects.tags array with improved error handling
        CREATE OR REPLACE FUNCTION migrate_project_tags() RETURNS void AS $FUNC$
        DECLARE
          project RECORD;
          tag_name TEXT;
          tag_id INT;
          processed_count INT := 0;
          error_count INT := 0;
          max_errors INT := 50; -- Maximum number of errors to tolerate
        BEGIN
          -- Log start of migration
          RAISE NOTICE 'Starting tag migration from projects.tags arrays...';
          
          -- Process each project that has tags
          FOR project IN SELECT id, tags FROM content.projects 
                        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
          LOOP
            BEGIN
              -- Process each tag in the array
              FOREACH tag_name IN ARRAY project.tags
              LOOP
                BEGIN
                  -- Trim whitespace and validate tag
                  tag_name := TRIM(tag_name);
                  
                  -- Skip invalid tags
                  IF tag_name = '' OR tag_name IS NULL OR LENGTH(tag_name) > 50 THEN
                    RAISE WARNING 'Skipping invalid tag "%" for project %', tag_name, project.id;
                    CONTINUE;
                  END IF;
                  
                  -- Insert tag if not exists
                  INSERT INTO content.tags (name, slug)
                  VALUES (
                    tag_name, 
                    LOWER(REGEXP_REPLACE(tag_name, '[^a-zA-Z0-9]+', '-', 'g'))
                  )
                  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                  RETURNING id INTO tag_id;
                  
                  -- Link to project
                  INSERT INTO content.project_tags (project_id, tag_id)
                  VALUES (project.id, tag_id)
                  ON CONFLICT DO NOTHING;
                  
                  processed_count := processed_count + 1;
                EXCEPTION WHEN OTHERS THEN
                  -- Log tag processing error but continue
                  RAISE WARNING 'Error processing tag "%" for project %: %', tag_name, project.id, SQLERRM;
                  error_count := error_count + 1;
                END;
              END LOOP;
              
            EXCEPTION WHEN OTHERS THEN
              -- Log error but continue with next project
              RAISE WARNING 'Error processing tags for project %: %', project.id, SQLERRM;
              error_count := error_count + 1;
              
              -- Exit if too many errors
              IF error_count > max_errors THEN
                RAISE EXCEPTION 'Too many errors (%) during tag migration, aborting', error_count;
              END IF;
            END;
          END LOOP;
          
          -- Log completion
          RAISE NOTICE 'Tag migration complete: % tags processed, % errors', processed_count, error_count;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Fatal error in tag migration: %', SQLERRM;
          RAISE EXCEPTION 'Tag migration failed';
        END;
        $FUNC$ LANGUAGE plpgsql;

        -- Execute the migration function with error handling
        DO $OUTER$
        BEGIN
          PERFORM migrate_project_tags();
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Tag migration failed: %', SQLERRM;
        END $OUTER$;
        
        -- Clean up the function
        DROP FUNCTION IF EXISTS migrate_project_tags();

        -- Create view for public API
        CREATE OR REPLACE VIEW public_api.tags AS
        SELECT id, name, slug, category 
        FROM content.tags
        WHERE is_technology = FALSE;

        CREATE OR REPLACE VIEW public_api.technologies AS
        SELECT id, name, slug, category 
        FROM content.tags
        WHERE is_technology = TRUE;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP VIEW IF EXISTS public_api.technologies;
        DROP VIEW IF EXISTS public_api.tags;
        DROP TABLE IF EXISTS content.project_tags CASCADE;
        DROP TABLE IF EXISTS content.tags CASCADE;
      `, { transaction: t });
    });
  }
}; 