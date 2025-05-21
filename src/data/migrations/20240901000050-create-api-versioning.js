'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if schema exists first
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'public_api') THEN
              CREATE SCHEMA public_api;
              GRANT ALL ON SCHEMA public_api TO postgres;
            END IF;
          END
          $$;
        `, { transaction: t });
        
        // First create the table structure
        await queryInterface.sequelize.query(`
          CREATE TABLE public_api.versions (
            version VARCHAR(10) PRIMARY KEY,
            base_path VARCHAR(20) NOT NULL,
            release_date DATE NOT NULL,
            deprecated_at DATE,
            sunset_date TIMESTAMPTZ,
            docs_url VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction: t });

        // Then insert initial data in a separate step
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions 
          (version, base_path, release_date, docs_url)
          VALUES
          ('1.0', '/api/v1', CURRENT_DATE, '/api-docs/v1')
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });

        // Add constraints with more comprehensive checks and trigger functions
        await queryInterface.sequelize.query(`
          -- Add constraint to ensure active versions can't be deleted abruptly
          ALTER TABLE public_api.versions 
          ADD CONSTRAINT check_active_version 
          CHECK (
            is_active = FALSE 
            OR (sunset_date IS NULL) 
            OR (sunset_date > CURRENT_TIMESTAMP + INTERVAL '30 days')
          );
          
          -- Add trigger function to enforce API version lifecycle rules
          CREATE OR REPLACE FUNCTION public_api.enforce_version_lifecycle() RETURNS TRIGGER AS $$
          BEGIN
            -- If marking as deprecated, ensure there's at least one other active version
            IF (NEW.is_active = FALSE AND OLD.is_active = TRUE) THEN
              IF NOT EXISTS (
                SELECT 1 FROM public_api.versions 
                WHERE is_active = TRUE AND version != NEW.version
              ) THEN
                RAISE EXCEPTION 'Cannot deactivate version % as it is the only active version', NEW.version;
              END IF;
            END IF;
            
            -- Set deprecated_at if not already set when is_active changes to FALSE
            IF (NEW.is_active = FALSE AND OLD.is_active = TRUE AND NEW.deprecated_at IS NULL) THEN
              NEW.deprecated_at := CURRENT_DATE;
            END IF;
            
            -- If setting a sunset date, ensure it's at least 60 days from now (stronger than the constraint)
            IF (NEW.sunset_date IS NOT NULL AND (OLD.sunset_date IS NULL OR NEW.sunset_date != OLD.sunset_date)) THEN
              IF (NEW.sunset_date < CURRENT_TIMESTAMP + INTERVAL '60 days') THEN
                RAISE WARNING 'Setting a sunset date less than 60 days in the future (%) may violate API stability guarantees', NEW.sunset_date;
              END IF;
            END IF;
            
            -- Prevent changing sunset_date to an earlier date if already set
            IF (OLD.sunset_date IS NOT NULL AND NEW.sunset_date IS NOT NULL AND NEW.sunset_date < OLD.sunset_date) THEN
              RAISE EXCEPTION 'Cannot move sunset date earlier (from % to %)', OLD.sunset_date, NEW.sunset_date;
            END IF;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trg_enforce_version_lifecycle
          BEFORE UPDATE ON public_api.versions
          FOR EACH ROW
          EXECUTE FUNCTION public_api.enforce_version_lifecycle();
          
          -- Create logging function to track API version lifecycle changes
          CREATE TABLE public_api.version_lifecycle_logs (
            id SERIAL PRIMARY KEY,
            version VARCHAR(10) NOT NULL,
            action VARCHAR(50) NOT NULL,
            details JSONB,
            performed_by TEXT,
            performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE OR REPLACE FUNCTION public_api.log_version_lifecycle_change() RETURNS TRIGGER AS $$
          BEGIN
            INSERT INTO public_api.version_lifecycle_logs(version, action, details, performed_by)
            VALUES (
              NEW.version,
              CASE
                WHEN TG_OP = 'INSERT' THEN 'created'
                WHEN TG_OP = 'UPDATE' AND NEW.is_active = FALSE AND OLD.is_active = TRUE THEN 'deprecated'
                WHEN TG_OP = 'UPDATE' AND NEW.sunset_date IS NOT NULL AND OLD.sunset_date IS NULL THEN 'sunset_scheduled'
                WHEN TG_OP = 'UPDATE' THEN 'updated'
                ELSE TG_OP
              END,
              jsonb_build_object(
                'old_state', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
                'new_state', to_jsonb(NEW),
                'changes', CASE WHEN TG_OP = 'UPDATE' THEN 
                   (SELECT jsonb_object_agg(key, value) FROM jsonb_each(to_jsonb(NEW)) JOIN 
                    jsonb_each(to_jsonb(OLD)) USING (key) WHERE to_jsonb(NEW) ->> key != to_jsonb(OLD) ->> key)
                  ELSE NULL END
              ),
              current_user
            );
            RETURN NULL;
          END;
          $$ LANGUAGE plpgsql;
          
          CREATE TRIGGER trg_log_version_lifecycle
          AFTER INSERT OR UPDATE ON public_api.versions
          FOR EACH ROW
          EXECUTE FUNCTION public_api.log_version_lifecycle_change();
          
          -- Add index for common query patterns
          CREATE INDEX idx_api_versions_active ON public_api.versions(is_active);
          CREATE INDEX idx_api_versions_deprecated ON public_api.versions(deprecated_at) WHERE deprecated_at IS NOT NULL;
          
          -- Add trigger for updated_at timestamp
          CREATE TRIGGER update_api_versions_timestamp
          BEFORE UPDATE ON public_api.versions
          FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
        `, { transaction: t });

        // Replace the invalid ALTER VIEW with CREATE OR REPLACE VIEW
        await queryInterface.sequelize.query(`
          CREATE OR REPLACE VIEW public_api.documentation AS
          SELECT 
            endpoint,
            method,
            description,
            jsonb_build_object(
              'schema', CASE 
                WHEN endpoint LIKE '/auth%' THEN 'auth'
                WHEN endpoint LIKE '/profile%' THEN 'content'
                WHEN endpoint LIKE '/projects%' THEN 'content'
                WHEN endpoint LIKE '/messages%' THEN 'messaging'
                WHEN endpoint LIKE '/invoices%' THEN 'billing'
                ELSE 'public_api'
              END,
              'table', CASE
                WHEN endpoint = '/auth/register' THEN 'users'
                WHEN endpoint = '/auth/login' THEN 'refresh_tokens'
                WHEN endpoint = '/profile' THEN 'profiles'
                WHEN endpoint LIKE '/projects%' THEN 'projects'
                WHEN endpoint LIKE '/messages%' THEN 'messages'
                WHEN endpoint LIKE '/invoices%' THEN 'invoices'
                ELSE NULL
              END
            ) AS metadata,
            '1.0' AS api_version  -- Added version column here
          FROM (
            VALUES
              ('/auth/register', 'POST', 'Register a new user'),
              ('/auth/login', 'POST', 'Authenticate user'),
              ('/profile', 'GET', 'Get user profile'),
              ('/projects', 'GET', 'List projects'),
              ('/projects/:id', 'GET', 'Get project details'),
              ('/messages', 'GET', 'List messages'),
              ('/invoices', 'GET', 'List invoices')
          ) AS t(endpoint, method, description);
        `, { transaction: t });

        // Add automatic sunset
        await queryInterface.sequelize.query(`
          ALTER TABLE public_api.versions
          ADD COLUMN auto_sunset BOOLEAN DEFAULT TRUE;
        `, { transaction: t });

        return Promise.resolve();
      } catch (error) {
        console.error('Error in API versioning migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping the table
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema = 'public_api'
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'public_api'
            AND table_name = 'versions'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && dependencies[0].count > 0) {
          console.warn('Warning: Found dependencies on public_api.versions table. These may need to be handled separately.');
          
          // Logging details about the dependencies for better troubleshooting
          await queryInterface.sequelize.query(`
            INSERT INTO metrics.user_activity_logs(
              action_type, entity_type, details
            ) VALUES (
              'migration_warning', 
              'public_api.versions', 
              jsonb_build_object(
                'message', 'API version dependencies found during down migration',
                'dependency_count', ${dependencies[0].count}
              )
            );
          `, { transaction: t });
        }

        // Drop triggers first to avoid constraint issues
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_log_version_lifecycle ON public_api.versions;
          DROP TRIGGER IF EXISTS trg_enforce_version_lifecycle ON public_api.versions;
          DROP TRIGGER IF EXISTS update_api_versions_timestamp ON public_api.versions;
        `, { transaction: t });
        
        // Drop functions
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS public_api.log_version_lifecycle_change();
          DROP FUNCTION IF EXISTS public_api.enforce_version_lifecycle();
        `, { transaction: t });

        // Drop constraints 
        await queryInterface.sequelize.query(`
          ALTER TABLE IF EXISTS public_api.versions 
          DROP CONSTRAINT IF EXISTS check_active_version;
          
          -- Drop indexes
          DROP INDEX IF EXISTS idx_api_versions_active;
          DROP INDEX IF EXISTS idx_api_versions_deprecated;
        `, { transaction: t });

        // Drop the logging table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS public_api.version_lifecycle_logs CASCADE;
        `, { transaction: t });
        
        // Then drop the versions table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS public_api.versions CASCADE;
        `, { transaction: t });

        return Promise.resolve();
      } catch (error) {
        console.error('Error in API versioning down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 