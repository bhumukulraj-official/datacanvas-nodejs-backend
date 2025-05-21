'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      // Create the schema if it doesn't exist and set the search path
      await queryInterface.sequelize.query(`
        -- Make sure schemas exist
        CREATE SCHEMA IF NOT EXISTS content;
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE SCHEMA IF NOT EXISTS billing;
        CREATE SCHEMA IF NOT EXISTS public_api;
        
        -- Grant privileges
        GRANT ALL ON SCHEMA content TO postgres;
        GRANT ALL ON SCHEMA auth TO postgres;
        GRANT ALL ON SCHEMA billing TO postgres;
        GRANT ALL ON SCHEMA public_api TO postgres;
        
        -- Set the search path for this session
        SET search_path TO public, content, auth, billing, public_api;
      `, { transaction: t });

      // Create simple views first
      await queryInterface.sequelize.query(`
        -- Create a simple projects view
        CREATE OR REPLACE VIEW public_api.projects WITH (security_barrier=true) AS
        SELECT 
          p.id,
          p.uuid,
          p.title,
          p.description,
          p.thumbnail_url,
          p.technologies,
          p.github_url,
          p.live_url,
          p.is_featured,
          p.status_code,
          p.created_at,
          p.updated_at,
          array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
        FROM content.projects p
        LEFT JOIN content.project_tags pt ON p.id = pt.project_id
        LEFT JOIN content.tags t ON pt.tag_id = t.id
        WHERE p.is_deleted = FALSE AND p.visibility = 'portfolio'
        GROUP BY p.id;
        
        -- Create a simple profiles view
        CREATE OR REPLACE VIEW public_api.user_profiles AS
        SELECT 
          u.id,
          u.uuid,
          u.name,
          p.title,
          p.bio,
          p.avatar_url,
          p.location,
          p.social_links,
          p.resume_url
        FROM auth.users u
        LEFT JOIN content.profiles p ON u.id = p.user_id
        WHERE u.is_deleted = FALSE;
        
        -- Create a simple invoices view
        CREATE OR REPLACE VIEW public_api.client_invoices AS
        SELECT 
          i.id,
          i.uuid,
          i.invoice_number,
          i.amount,
          i.tax,
          i.status_code,
          i.issue_date,
          i.due_date,
          i.paid_date,
          i.project_id,
          i.client_id
        FROM billing.invoices i
        WHERE i.is_deleted = FALSE;
        
        -- Create a simple client projects view with proper client filtering
        CREATE OR REPLACE VIEW public_api.client_projects AS
        SELECT 
          p.id,
          p.uuid,
          p.title,
          p.description,
          p.thumbnail_url,
          p.technologies,
          p.status_code,
          p.created_at,
          p.updated_at,
          pca.client_id,
          array_agg(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
        FROM content.projects p
        JOIN content.project_client_assignments pca ON p.id = pca.project_id AND pca.is_active = TRUE
        LEFT JOIN content.project_tags pt ON p.id = pt.project_id
        LEFT JOIN content.tags t ON pt.tag_id = t.id
        WHERE p.is_deleted = FALSE
        GROUP BY p.id, pca.client_id;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP VIEW IF EXISTS public_api.client_projects;
        DROP VIEW IF EXISTS public_api.client_invoices;
        DROP VIEW IF EXISTS public_api.user_profiles;
        DROP VIEW IF EXISTS public_api.projects;
      `, { transaction: t });
    });
  }
}; 