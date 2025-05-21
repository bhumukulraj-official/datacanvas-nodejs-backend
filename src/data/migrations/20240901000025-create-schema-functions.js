'use strict';

/**
 * Migration: Create Schema Functions
 * Purpose: Creates utility functions used across schemas
 * Dependencies: 20240901000002-create-schemas.js, 20240901000022-create-user-activity-logs.js
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Perform dependency checks first, outside the transaction
    try {
      // Check if metrics schema exists
      const [schemaExists] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.schemata 
        WHERE schema_name = 'metrics';
      `);
      
      if (parseInt(schemaExists[0].count) === 0) {
        throw new Error('metrics schema does not exist. This migration depends on 20240901000002-create-schemas.js being run first.');
      }
      
      // Check if user_activity_logs table exists
      const [tableExists] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'metrics' AND table_name = 'user_activity_logs';
      `);
      
      if (parseInt(tableExists[0].count) === 0) {
        throw new Error('metrics.user_activity_logs table does not exist. This migration depends on 20240901000022-create-user-activity-logs.js being run first.');
      }
      
      // Save the original search path to restore it later
      const [originalSearchPath] = await queryInterface.sequelize.query(`
        SHOW search_path;
      `);
      // Handle search_path result more robustly
      let originalPath = 'public';
      if (originalSearchPath && originalSearchPath.length > 0) {
        // The result might be in different formats depending on the DB driver
        if (originalSearchPath[0].search_path) {
          originalPath = originalSearchPath[0].search_path;
        } else if (typeof originalSearchPath[0] === 'object') {
          // Try to find the search_path key regardless of case
          const key = Object.keys(originalSearchPath[0]).find(k => 
            k.toLowerCase() === 'search_path');
          if (key) {
            originalPath = originalSearchPath[0][key];
          }
        } else if (typeof originalSearchPath[0] === 'string') {
          originalPath = originalSearchPath[0];
        }
      }
      
      // Create functions within a transaction with improved error handling
      return queryInterface.sequelize.transaction(async (t) => {
        try {
          // Set search path for this transaction only
          await queryInterface.sequelize.query(`
            SET LOCAL search_path TO public, metrics, pg_catalog;
          `, { transaction: t });
          
          console.log('Creating schema functions...');
          
          // Check for existing functions first to handle conflicts
          const functionsToCreate = [
            'metrics.merge_jsonb',
            'metrics.jsonb_extract_typed',
            'metrics.log_table_change'
          ];
          
          for (const funcName of functionsToCreate) {
            const [fnExists] = await queryInterface.sequelize.query(`
              SELECT COUNT(*) as count FROM pg_proc p
              JOIN pg_namespace n ON p.pronamespace = n.oid
              WHERE n.nspname || '.' || p.proname = '${funcName}';
            `, { transaction: t });
            
            if (parseInt(fnExists[0].count) > 0) {
              console.log(`Function ${funcName} already exists, will be replaced.`);
            }
          }
          
          // JSONB helper functions with improved idempotency
          await queryInterface.sequelize.query(`
            -- JSONB helper functions with schema prefix to avoid conflicts
            CREATE OR REPLACE FUNCTION metrics.merge_jsonb(a jsonb, b jsonb)
            RETURNS jsonb AS $$
            BEGIN
              RETURN a || b;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
            
            COMMENT ON FUNCTION metrics.merge_jsonb(jsonb, jsonb) IS 'Merges two JSONB objects, with the second object taking precedence for overlapping keys';
          `, { transaction: t });
          
          // Create each function separately to isolate errors
          await queryInterface.sequelize.query(`
            -- Type extraction from JSONB
            CREATE OR REPLACE FUNCTION metrics.jsonb_extract_typed(j jsonb, path text, default_value anyelement)
            RETURNS anyelement AS $$
            DECLARE
              result jsonb;
            BEGIN
              result := j #> string_to_array(path, '.');
              IF result IS NULL THEN
                RETURN default_value;
              ELSE
                RETURN result::text::anyelement;
              END IF;
            EXCEPTION
              WHEN others THEN
                RETURN default_value;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
            
            COMMENT ON FUNCTION metrics.jsonb_extract_typed(jsonb, text, anyelement) IS 'Extracts a value from a JSONB object using a path, with type casting and default value';
          `, { transaction: t });
          
          // Create log_table_change separately with improved security
          await queryInterface.sequelize.query(`
            -- Trigger function for logging table changes with improved session variable handling
            CREATE OR REPLACE FUNCTION metrics.log_table_change()
            RETURNS TRIGGER AS $$
            DECLARE
              table_schema text;
              table_name text;
              record_data jsonb;
              changed_fields jsonb;
              user_id int;
              log_id int;
              action_type text;
              current_user_setting text;
            BEGIN
              -- Get table name and schema
              table_schema := TG_TABLE_SCHEMA;
              table_name := TG_TABLE_NAME;
              
              -- Set action type based on operation
              IF (TG_OP = 'INSERT') THEN
                action_type := 'create';
                record_data := to_jsonb(NEW);
                changed_fields := record_data;
              ELSIF (TG_OP = 'UPDATE') THEN
                action_type := 'update';
                record_data := to_jsonb(NEW);
                changed_fields := to_jsonb(NEW) - to_jsonb(OLD);
              ELSIF (TG_OP = 'DELETE') THEN
                action_type := 'delete';
                record_data := to_jsonb(OLD);
                changed_fields := to_jsonb(OLD);
              END IF;
              
              -- Try to extract user_id from session context if available
              -- Using a safer approach to check if the setting exists
              BEGIN
                -- Set a timeout for current_setting to prevent blocking
                SET LOCAL statement_timeout = '100ms';
                SELECT current_setting('app.current_user_id', true) INTO current_user_setting;
                RESET statement_timeout;
                
                IF current_user_setting IS NOT NULL AND current_user_setting != '' THEN
                  user_id := current_user_setting::int;
                END IF;
              EXCEPTION
                WHEN OTHERS THEN
                  user_id := NULL;
                  RESET statement_timeout;
              END;
              
              -- Insert log entry
              INSERT INTO metrics.user_activity_logs(
                user_id,
                action_type,
                entity_type,
                entity_id,
                details,
                created_at
              ) VALUES (
                user_id,
                action_type,
                table_schema || '.' || table_name,
                CASE 
                  WHEN record_data->>'id' IS NOT NULL THEN (record_data->>'id')::int 
                  ELSE NULL 
                END,
                jsonb_build_object(
                  'record', record_data,
                  'changed', changed_fields,
                  'operation', TG_OP
                ),
                now()
              ) RETURNING id INTO log_id;
              
              IF (TG_OP = 'DELETE') THEN
                RETURN OLD;
              ELSE
                RETURN NEW;
              END IF;
            EXCEPTION
              WHEN OTHERS THEN
                -- Log error but continue operation
                RAISE WARNING 'Error in log_table_change: % - %', SQLERRM, record_data;
                RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
            END;
            $$ LANGUAGE plpgsql
            -- Set restricted search path for security
            SET search_path = metrics, public, pg_catalog;
            
            COMMENT ON FUNCTION metrics.log_table_change() IS 'Trigger function that logs changes to tables to the user_activity_logs table';
          `, { transaction: t });
          
          // Record function creation in migration meta
          await queryInterface.sequelize.query(`
            INSERT INTO public.migration_meta (key, value)
            VALUES ('schema_functions_created', jsonb_build_object(
              'functions', ARRAY['metrics.merge_jsonb', 'metrics.jsonb_extract_typed', 'metrics.log_table_change'],
              'created_at', CURRENT_TIMESTAMP
            ))
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, 
                updated_at = CURRENT_TIMESTAMP;
          `, { transaction: t });
          
          // Restore original search path
          await queryInterface.sequelize.query(`
            SET LOCAL search_path TO ${originalPath};
          `, { transaction: t });
          
          console.log('Schema functions created successfully');
          return Promise.resolve();
        } catch (error) {
          console.error('Error creating schema functions:', error);
          
          // Restore search path even if there's an error
          await queryInterface.sequelize.query(`
            SET LOCAL search_path TO ${originalPath};
          `, { transaction: t }).catch(() => {
            // Ignore errors when restoring search path during error handling
          });
          
          return Promise.reject(error);
        }
      });
    } catch (error) {
      console.error('Dependency check failed:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Save the original search path to restore it later
    const [originalSearchPath] = await queryInterface.sequelize.query(`
      SHOW search_path;
    `);
    // Handle search_path result more robustly
    let originalPath = 'public';
    if (originalSearchPath && originalSearchPath.length > 0) {
      // The result might be in different formats depending on the DB driver
      if (originalSearchPath[0].search_path) {
        originalPath = originalSearchPath[0].search_path;
      } else if (typeof originalSearchPath[0] === 'object') {
        // Try to find the search_path key regardless of case
        const key = Object.keys(originalSearchPath[0]).find(k => 
          k.toLowerCase() === 'search_path');
        if (key) {
          originalPath = originalSearchPath[0][key];
        }
      } else if (typeof originalSearchPath[0] === 'string') {
        originalPath = originalSearchPath[0];
      }
    }
    
    // Enhanced down migration with transaction and proper error handling
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Set appropriate search path for this transaction
        await queryInterface.sequelize.query(`
          SET LOCAL search_path TO public, metrics, pg_catalog;
        `, { transaction: t });
        
        console.log('Dropping schema functions...');
        
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM pg_depend d
          JOIN pg_proc p ON d.objid = p.oid
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'metrics'
          AND p.proname IN ('log_table_change', 'jsonb_extract_typed', 'merge_jsonb')
          AND d.deptype = 'n';
        `, { transaction: t });
        
        if (parseInt(dependencies[0].count) > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on metrics functions. These will be forcibly dropped with CASCADE.`);
        }
        
        // Drop functions one by one with individual error handling
        await queryInterface.sequelize.query(`
          -- Drop functions in the correct order to avoid dependency issues
          DROP FUNCTION IF EXISTS metrics.log_table_change() CASCADE;
        `, { transaction: t }).catch(err => {
          console.warn('Error dropping log_table_change function:', err.message);
        });
        
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS metrics.jsonb_extract_typed(jsonb, text, anyelement) CASCADE;
        `, { transaction: t }).catch(err => {
          console.warn('Error dropping jsonb_extract_typed function:', err.message);
        });
        
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS metrics.merge_jsonb(jsonb, jsonb) CASCADE;
        `, { transaction: t }).catch(err => {
          console.warn('Error dropping merge_jsonb function:', err.message);
        });
        
        // Clean up migration meta
        await queryInterface.sequelize.query(`
          DELETE FROM public.migration_meta WHERE key = 'schema_functions_created';
        `, { transaction: t }).catch(err => {
          console.warn('Could not clean up migration_meta table:', err.message);
        });
        
        // Restore original search path
        await queryInterface.sequelize.query(`
          SET LOCAL search_path TO ${originalPath};
        `, { transaction: t });
        
        console.log('Schema functions dropped successfully');
        return Promise.resolve();
      } catch (error) {
        console.error('Error in schema functions down migration:', error);
        
        // Restore search path even if there's an error
        await queryInterface.sequelize.query(`
          SET LOCAL search_path TO ${originalPath};
        `, { transaction: t }).catch(() => {
          // Ignore errors when restoring search path during error handling
        });
        
        return Promise.reject(error);
      }
    });
  }
}; 