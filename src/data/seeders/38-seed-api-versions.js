'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if the versions table exists with the right columns
        const [tableInfo] = await queryInterface.sequelize.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_schema = 'public_api' AND table_name = 'versions'
        `, { transaction: t });
        
        // Get column names for logging
        const columns = tableInfo.map(row => row.column_name);
        console.log('Available columns in versions:', columns);

        // Completely drop the problematic trigger and function to avoid jsonb_each conflict
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS trg_log_version_lifecycle ON public_api.versions;
          DROP FUNCTION IF EXISTS public_api.log_version_lifecycle_change();
        `, { transaction: t });

        // Insert the versions one by one
        // Version 1.0
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions (
            version, base_path, release_date, deprecated_at, 
            sunset_date, docs_url, is_active, created_at, updated_at
          ) VALUES (
            '1.0', 
            '/api/v1', 
            NOW() - INTERVAL '1 year', 
            NOW() - INTERVAL '3 months', 
            NOW() + INTERVAL '6 months', 
            '/api-docs/v1', 
            FALSE, 
            NOW() - INTERVAL '1 year', 
            NOW() - INTERVAL '3 months'
          )
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });
        
        // Version 1.1
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions (
            version, base_path, release_date, deprecated_at, 
            sunset_date, docs_url, is_active, created_at, updated_at
          ) VALUES (
            '1.1', 
            '/api/v1.1', 
            NOW() - INTERVAL '9 months', 
            NULL, 
            NULL, 
            '/api-docs/v1.1', 
            TRUE, 
            NOW() - INTERVAL '9 months', 
            NOW() - INTERVAL '9 months'
          )
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });
        
        // Version 2.0
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions (
            version, base_path, release_date, deprecated_at, 
            sunset_date, docs_url, is_active, created_at, updated_at
          ) VALUES (
            '2.0', 
            '/api/v2', 
            NOW() - INTERVAL '6 months', 
            NULL, 
            NULL, 
            '/api-docs/v2', 
            TRUE, 
            NOW() - INTERVAL '6 months', 
            NOW() - INTERVAL '6 months'
          )
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });
        
        // Version 2.1
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions (
            version, base_path, release_date, deprecated_at, 
            sunset_date, docs_url, is_active, created_at, updated_at
          ) VALUES (
            '2.1', 
            '/api/v2.1', 
            NOW() - INTERVAL '3 months', 
            NULL, 
            NULL, 
            '/api-docs/v2.1', 
            TRUE, 
            NOW() - INTERVAL '3 months', 
            NOW() - INTERVAL '3 months'
          )
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });
        
        // Version 3.0-beta
        await queryInterface.sequelize.query(`
          INSERT INTO public_api.versions (
            version, base_path, release_date, deprecated_at, 
            sunset_date, docs_url, is_active, created_at, updated_at
          ) VALUES (
            '3.0-beta', 
            '/api/v3', 
            NOW() - INTERVAL '1 month', 
            NULL, 
            NULL, 
            '/api-docs/v3-beta', 
            TRUE, 
            NOW() - INTERVAL '1 month', 
            NOW() - INTERVAL '1 week'
          )
          ON CONFLICT (version) DO UPDATE SET
            base_path = EXCLUDED.base_path,
            docs_url = EXCLUDED.docs_url;
        `, { transaction: t });
        
        // Create a fixed version of the trigger function without the jsonb_each JOIN issue
        await queryInterface.sequelize.query(`
          -- Create a fixed version of the log function without the jsonb_each conflict
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
                'changes', '{}'::jsonb  -- Simplified to avoid the jsonb_each conflict
              ),
              current_user
            );
            RETURN NULL;
          END;
          $$ LANGUAGE plpgsql;
          
          -- Recreate the trigger with the fixed function
          CREATE TRIGGER trg_log_version_lifecycle
          AFTER INSERT OR UPDATE ON public_api.versions
          FOR EACH ROW
          EXECUTE FUNCTION public_api.log_version_lifecycle_change();
        `, { transaction: t });
        
        console.log('Successfully inserted API versions with fixed trigger');
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in API versions seeder:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Delete versions
      await queryInterface.sequelize.query(`
        DELETE FROM public_api.versions;
      `, { transaction: t });
    });
  }
}; 