'use strict';

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check if we're dealing with a view
        const [viewExists] = await queryInterface.sequelize.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.views
            WHERE table_schema = 'public_api' 
            AND table_name = 'documentation'
          ) as exists;
        `, { transaction: t });
        
        if (viewExists[0].exists) {
          console.log('Documentation exists as a view, cannot insert directly');
          
          // Instead, let's create a table to store the extended documentation
          await queryInterface.sequelize.query(`
            -- Create documentation extensions table if it doesn't exist
            CREATE TABLE IF NOT EXISTS public_api.api_docs_extensions (
              id SERIAL PRIMARY KEY,
              endpoint VARCHAR(100) NOT NULL,
              method VARCHAR(10) NOT NULL,
              parameters JSONB DEFAULT '[]',
              response JSONB DEFAULT '{}',
              examples JSONB DEFAULT '[]',
              status_codes JSONB DEFAULT '[]',
              created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(endpoint, method)
            );
            
            -- Add trigger for updated_at
            DROP TRIGGER IF EXISTS update_api_docs_extensions_timestamp ON public_api.api_docs_extensions;
            CREATE TRIGGER update_api_docs_extensions_timestamp
            BEFORE UPDATE ON public_api.api_docs_extensions
            FOR EACH ROW EXECUTE FUNCTION update_timestamp();
          `, { transaction: t });
          
          // Insert extended documentation
          await queryInterface.sequelize.query(`
            INSERT INTO public_api.api_docs_extensions (
              endpoint, method, parameters, response, examples, status_codes
            ) VALUES
              (
                '/api/v1/projects', 
                'GET', 
                '[
                  { "name": "limit", "type": "number", "required": false, "description": "Number of items to return" },
                  { "name": "offset", "type": "number", "required": false, "description": "Offset for pagination" }
                ]',
                '{ "type": "array", "items": { "$ref": "#/components/schemas/Project" } }',
                '[
                  {
                    "request": { "method": "GET", "url": "/api/v1/projects?limit=10" },
                    "response": { "status": 200, "body": "[{ \\"id\\": 1, \\"title\\": \\"E-commerce Platform\\" }]" }
                  }
                ]',
                '[
                  { "code": 200, "description": "Successful operation" },
                  { "code": 401, "description": "Unauthorized" },
                  { "code": 500, "description": "Server error" }
                ]'
              ),
              (
                '/api/v1/projects/:id', 
                'GET', 
                '[
                  { "name": "id", "type": "string", "required": true, "description": "Project ID" }
                ]',
                '{ "$ref": "#/components/schemas/Project" }',
                '[
                  {
                    "request": { "method": "GET", "url": "/api/v1/projects/1" },
                    "response": { "status": 200, "body": "{ \\"id\\": 1, \\"title\\": \\"E-commerce Platform\\" }" }
                  }
                ]',
                '[
                  { "code": 200, "description": "Successful operation" },
                  { "code": 404, "description": "Project not found" },
                  { "code": 500, "description": "Server error" }
                ]'
              )
            ON CONFLICT (endpoint, method) DO UPDATE SET
              parameters = EXCLUDED.parameters,
              response = EXCLUDED.response,
              examples = EXCLUDED.examples,
              status_codes = EXCLUDED.status_codes,
              updated_at = NOW();
          `, { transaction: t });
          
          // Create a combined view for API documentation
          await queryInterface.sequelize.query(`
            CREATE OR REPLACE VIEW public_api.api_documentation_complete AS
            SELECT 
              d.endpoint,
              d.method,
              d.description,
              d.metadata,
              e.parameters,
              e.response,
              e.examples,
              e.status_codes
            FROM 
              public_api.documentation d
            LEFT JOIN 
              public_api.api_docs_extensions e ON d.endpoint = e.endpoint AND d.method = e.method;
          `, { transaction: t });
          
          console.log('Created extended API documentation and combined view');
        } else {
          console.log('Documentation view does not exist, cannot proceed with seeding');
        }
      } catch (error) {
        console.error('Error in API documentation seeder:', error.message);
        throw error;
      }
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Drop the combined view
        await queryInterface.sequelize.query(`
          DROP VIEW IF EXISTS public_api.api_documentation_complete;
        `, { transaction: t });
        
        // Clear the extension table but don't drop it
        await queryInterface.sequelize.query(`
          TRUNCATE public_api.api_docs_extensions;
        `, { transaction: t });
        
        console.log('Removed API documentation extensions');
      } catch (error) {
        console.error('Error in API documentation down migration:', error.message);
        throw error;
      }
    });
  }
};