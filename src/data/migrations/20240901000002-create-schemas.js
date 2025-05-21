'use strict';

/**
 * Migration: Create Schemas
 * Purpose: Sets up database schemas for organizing tables
 * Dependencies: None
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for extension dependency from previous migration
        const [extResult] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM pg_extension WHERE extname = 'uuid-ossp';
        `, { transaction: t });

        if (parseInt(extResult[0].count) === 0) {
          console.warn('Warning: uuid-ossp extension not found. This might cause issues. Consider running previous migration first.');
        }

        // Get list of existing schemas to avoid unnecessary creation
        const [schemas] = await queryInterface.sequelize.query(`
          SELECT schema_name FROM information_schema.schemata 
          WHERE schema_name IN ('auth', 'content', 'messaging', 'billing', 'public_api', 'metrics');
        `, { transaction: t });
        
        const existingSchemas = schemas.map(s => s.schema_name);
        console.log('Existing schemas:', existingSchemas.join(', ') || 'none');
        
        // Create schemas if they don't exist
        const schemasToCreate = ['auth', 'content', 'messaging', 'billing', 'public_api', 'metrics']
          .filter(schema => !existingSchemas.includes(schema));
        
        if (schemasToCreate.length > 0) {
          console.log('Creating schemas:', schemasToCreate.join(', '));
          
          // Create schemas one by one with individual error handling
          for (const schema of schemasToCreate) {
            try {
              await queryInterface.sequelize.query(`
                CREATE SCHEMA IF NOT EXISTS ${schema};
                GRANT ALL ON SCHEMA ${schema} TO postgres;
              `, { transaction: t });
              console.log(`Schema ${schema} created successfully.`);
            } catch (schemaError) {
              console.error(`Error creating schema ${schema}:`, schemaError);
              throw schemaError; // Rethrow to roll back transaction
            }
          }
        } else {
          console.log('All required schemas already exist.');
        }
        
        // Save schema creation status in public schema for reference by other migrations
        await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS public.migration_meta (
            key VARCHAR(100) PRIMARY KEY,
            value JSONB NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
          
          INSERT INTO public.migration_meta (key, value)
          VALUES ('schemas_created', '${JSON.stringify({
            schemas: ['auth', 'content', 'messaging', 'billing', 'public_api', 'metrics'],
            created_at: new Date().toISOString()
          })}')
          ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in create-schemas migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety with proper error handling
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping
        const schemas = ['metrics', 'public_api', 'billing', 'messaging', 'content', 'auth'];
        
        for (const schema of schemas) {
          const [tables] = await queryInterface.sequelize.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_schema = '${schema}';
          `, { transaction: t });
          
          const tableCount = parseInt(tables[0].count);
          
          if (tableCount > 0) {
            console.warn(`Warning: Schema ${schema} contains ${tableCount} tables. These will be dropped when dropping the schema.`);
          }
          
          console.log(`Dropping schema ${schema} CASCADE...`);
          await queryInterface.sequelize.query(`
            DROP SCHEMA IF EXISTS ${schema} CASCADE;
          `, { transaction: t });
          console.log(`Schema ${schema} dropped successfully.`);
        }
        
        // Remove the migration meta entry
        await queryInterface.sequelize.query(`
          DELETE FROM public.migration_meta WHERE key = 'schemas_created';
        `, { transaction: t }).catch(err => {
          console.warn('Could not clean up migration_meta table:', err.message);
        });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in create-schemas down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 