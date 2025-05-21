'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Create base search table
        await queryInterface.sequelize.query(`
          -- Search index table
          CREATE TABLE content.search_index (
            id SERIAL PRIMARY KEY,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INT NOT NULL,
            search_vector TSVECTOR NOT NULL,
            metadata JSONB DEFAULT '{}',
            UNIQUE(entity_type, entity_id)
          );

          -- Indexes
          CREATE INDEX idx_search_index_vector ON content.search_index USING GIN(search_vector);
          CREATE INDEX idx_search_index_entity ON content.search_index(entity_type, entity_id);
        `, { transaction: t });

        // Create trigger function for automatically updating search indexes
        await queryInterface.sequelize.query(`
          -- Function to update search index
          CREATE OR REPLACE FUNCTION content.update_search_index() RETURNS TRIGGER AS $$
          BEGIN
            IF TG_OP = 'DELETE' THEN
              DELETE FROM content.search_index WHERE entity_type = TG_TABLE_NAME AND entity_id = OLD.id;
              RETURN OLD;
            ELSE
              INSERT INTO content.search_index (entity_type, entity_id, search_vector, metadata)
              VALUES (
                TG_TABLE_NAME,
                NEW.id,
                SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.title, '')), 'A') ||
                SETWEIGHT(TO_TSVECTOR('english', COALESCE(NEW.description, '')), 'B'),
                jsonb_build_object('thumbnail_url', NEW.thumbnail_url)
              )
              ON CONFLICT (entity_type, entity_id) DO UPDATE SET
                search_vector = EXCLUDED.search_vector,
                metadata = EXCLUDED.metadata;
              RETURN NEW;
            END IF;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Grant proper permissions
          ALTER FUNCTION content.update_search_index() OWNER TO postgres;
          
          -- Create triggers for projects
          CREATE TRIGGER trg_projects_search_update
          AFTER INSERT OR UPDATE OF title, description ON content.projects
          FOR EACH ROW
          WHEN (NEW.is_deleted = FALSE)
          EXECUTE FUNCTION content.update_search_index();
          
          -- Add deletion trigger
          CREATE TRIGGER trg_projects_search_delete
          AFTER UPDATE OF is_deleted ON content.projects
          FOR EACH ROW
          WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
          EXECUTE FUNCTION content.update_search_index();
        `, { transaction: t });

        // Create a more efficient, robust batch processing function
        await queryInterface.sequelize.query(`
          -- Create safer batched population function with better error handling
          CREATE OR REPLACE FUNCTION content.populate_search_index_batch(
            batch_size INT DEFAULT 100, 
            start_id INT DEFAULT 0,
            entity_type VARCHAR DEFAULT 'projects'
          ) RETURNS TABLE(
            processed_count INT,
            last_processed_id INT,
            error_count INT
          ) AS $$
          DECLARE
            last_id INT := start_id;
            processed INT := 0;
            errors INT := 0;
            rec RECORD;
            search_vector TSVECTOR;
            metadata_json JSONB;
          BEGIN
            -- Process each record individually for better error isolation
            FOR rec IN (
              SELECT id, title, description, thumbnail_url
              FROM content.projects
              WHERE id > start_id AND is_deleted = FALSE
              ORDER BY id
              LIMIT batch_size
            ) LOOP
              BEGIN
                -- Create search vector for this record
                search_vector := 
                  SETWEIGHT(TO_TSVECTOR('english', COALESCE(rec.title, '')), 'A') ||
                  SETWEIGHT(TO_TSVECTOR('english', COALESCE(rec.description, '')), 'B');
                  
                metadata_json := jsonb_build_object('thumbnail_url', rec.thumbnail_url);
                
                -- Insert or update the search index
                INSERT INTO content.search_index (
                  entity_type, entity_id, search_vector, metadata
                ) VALUES (
                  entity_type, rec.id, search_vector, metadata_json
                ) ON CONFLICT (entity_type, entity_id) DO UPDATE 
                SET search_vector = EXCLUDED.search_vector,
                    metadata = EXCLUDED.metadata;
                    
                processed := processed + 1;
                last_id := rec.id;
              EXCEPTION WHEN OTHERS THEN
                errors := errors + 1;
                RAISE WARNING 'Error indexing % ID %: %', entity_type, rec.id, SQLERRM;
              END;
            END LOOP;
            
            RETURN QUERY SELECT processed, last_id, errors;
          END;
          $$ LANGUAGE plpgsql;
        `, { transaction: t });
        
        // Process the data in batches with improved error handling and performance monitoring
        let continueProcessing = true;
        let startId = 0;
        let batchSize = 50; // Start with smaller batches
        let totalProcessed = 0;
        let totalErrors = 0;
        let batchNumber = 0;
        const maxBatches = 100; // Safety limit
        
        console.log('Starting search index population...');
        
        while (continueProcessing && batchNumber < maxBatches) {
          // Dynamically adjust batch size based on previous results
          const [result] = await queryInterface.sequelize.query(
            `SELECT * FROM content.populate_search_index_batch($1, $2)`,
            { 
              bind: [batchSize, startId],
              type: queryInterface.sequelize.QueryTypes.SELECT,
              transaction: t
            }
          );
          
          batchNumber++;
          totalProcessed += parseInt(result.processed_count, 10);
          totalErrors += parseInt(result.error_count, 10);
          
          // Log progress periodically
          if (batchNumber % 5 === 0) {
            console.log(`Indexed ${totalProcessed} records with ${totalErrors} errors (batch ${batchNumber})`);
          }
          
          // Check if we received data
          if (parseInt(result.processed_count, 10) === 0) {
            continueProcessing = false;
          } else {
            startId = parseInt(result.last_processed_id, 10);
            
            // Adjust batch size dynamically based on error rate
            if (parseInt(result.error_count, 10) > (batchSize * 0.1)) {
              // Too many errors, reduce batch size
              batchSize = Math.max(10, Math.floor(batchSize * 0.8));
            } else if (parseInt(result.error_count, 10) === 0 && batchSize < 200) {
              // No errors, gradually increase batch size
              batchSize = Math.min(200, batchSize + 10);
            }
          }
        }
        
        console.log(`Search index population completed. Processed ${totalProcessed} records with ${totalErrors} errors.`);
        
        // Cleanup the temporary batch function
        await queryInterface.sequelize.query(
          `DROP FUNCTION IF EXISTS content.populate_search_index_batch(INT, INT, VARCHAR)`,
          { transaction: t }
        );
        
        // Add full-text search indexes for other text-heavy fields
        await queryInterface.sequelize.query(`
          CREATE INDEX idx_project_updates_search ON content.project_updates 
          USING GIN(to_tsvector('english', title || ' ' || description));
          
          CREATE INDEX idx_skills_search ON content.skills 
          USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in search support migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // First drop triggers to allow dropping the function safely
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_projects_search_update ON content.projects;
          DROP TRIGGER IF EXISTS trg_projects_search_delete ON content.projects;
        `, { transaction: t });
        
        // Drop the function
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS content.update_search_index;
        `, { transaction: t });
        
        // Finally drop the table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS content.search_index CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in search support down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 