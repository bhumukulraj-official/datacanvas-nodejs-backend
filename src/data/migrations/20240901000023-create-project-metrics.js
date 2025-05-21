'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for required schemas and dependencies
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            -- Check if metrics schema exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'metrics') THEN
              RAISE EXCEPTION 'Required schema "metrics" does not exist. This migration depends on "20240901000002-create-schemas.js"';
            END IF;
            
            -- Check if projects table exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                          WHERE table_schema = 'content' 
                          AND table_name = 'projects') THEN
              RAISE EXCEPTION 'Required table "content.projects" does not exist. This migration depends on "20240901000010-create-projects.js"';
            END IF;
          END
          $$;
        `, { transaction: t });
        
        await queryInterface.sequelize.query(`
          -- Project Metrics Table
          CREATE TABLE metrics.project_metrics (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
            metric_name VARCHAR(50) NOT NULL,
            metric_value DECIMAL(15, 2) NOT NULL,
            period_start DATE,
            period_end DATE,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- Indexes
          CREATE INDEX idx_project_metrics_project_id ON metrics.project_metrics(project_id);
          CREATE INDEX idx_project_metrics_metric_name ON metrics.project_metrics(metric_name);
          CREATE INDEX idx_project_metrics_period ON metrics.project_metrics(period_start, period_end);
          CREATE INDEX idx_project_metrics_metadata ON metrics.project_metrics USING GIN(metadata);
          
          -- Add composite index for common lookup pattern
          CREATE INDEX idx_project_metrics_project_metric_period ON metrics.project_metrics(project_id, metric_name, period_start);
          
          -- Add trigger for automatic timestamp updates
          CREATE TRIGGER update_project_metrics_timestamp
          BEFORE UPDATE ON metrics.project_metrics
          FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in project metrics migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Wrap in transaction for consistency with up migration
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema != 'metrics'
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'metrics'
            AND table_name = 'project_metrics'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && dependencies[0].count > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on metrics.project_metrics table. These will be dropped due to CASCADE.`);
          
          // Log the details for audit purposes
          await queryInterface.sequelize.query(`
            INSERT INTO metrics.user_activity_logs(
              action_type, entity_type, details
            ) VALUES (
              'migration_warning', 
              'metrics.project_metrics', 
              jsonb_build_object(
                'message', 'Dependencies found during down migration',
                'dependency_count', ${dependencies[0].count}
              )
            )
            ON CONFLICT DO NOTHING;
          `, { transaction: t }).catch(err => {
            console.warn('Could not log to metrics table, continuing anyway:', err.message);
          });
        }
        
        // Drop triggers first
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS update_project_metrics_timestamp ON metrics.project_metrics;
        `, { transaction: t });
        
        // Then drop the table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS metrics.project_metrics CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in project metrics down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 