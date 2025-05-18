'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the schema if it doesn't exist and set the search path
    await queryInterface.sequelize.query(`
      -- Make sure schemas exist
      CREATE SCHEMA IF NOT EXISTS metrics;
      CREATE SCHEMA IF NOT EXISTS public;
      
      -- Grant privileges
      GRANT ALL ON SCHEMA metrics TO postgres;
      GRANT ALL ON SCHEMA public TO postgres;
      
      -- Set the search path for this session
      SET search_path TO public, metrics;
    `);

    // Create functions within a transaction
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- JSONB helper functions
        CREATE OR REPLACE FUNCTION public.merge_jsonb(a jsonb, b jsonb)
        RETURNS jsonb AS $$
        BEGIN
          RETURN a || b;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
        
        COMMENT ON FUNCTION public.merge_jsonb(jsonb, jsonb) IS 'Merges two JSONB objects, with the second object taking precedence for overlapping keys';

        -- Type extraction from JSONB
        CREATE OR REPLACE FUNCTION public.jsonb_extract_typed(j jsonb, path text, default_value anyelement)
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
        
        COMMENT ON FUNCTION public.jsonb_extract_typed(jsonb, text, anyelement) IS 'Extracts a value from a JSONB object using a path, with type casting and default value';

        -- Trigger function for logging table changes
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
          BEGIN
            user_id := current_setting('app.current_user_id')::int;
          EXCEPTION
            WHEN OTHERS THEN
              user_id := NULL;
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
        END;
        $$ LANGUAGE plpgsql;
        
        COMMENT ON FUNCTION metrics.log_table_change() IS 'Trigger function that logs changes to tables to the user_activity_logs table';
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS metrics.log_table_change() CASCADE;
      DROP FUNCTION IF EXISTS public.jsonb_extract_typed(jsonb, text, anyelement) CASCADE;
      DROP FUNCTION IF EXISTS public.merge_jsonb(jsonb, jsonb) CASCADE;
    `);
  }
}; 