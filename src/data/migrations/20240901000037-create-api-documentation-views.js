'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- API endpoint documentation view
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
          ) AS metadata
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP VIEW IF EXISTS public_api.documentation;
    `);
  }
}; 