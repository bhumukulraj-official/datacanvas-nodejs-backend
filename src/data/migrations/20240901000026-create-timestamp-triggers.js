'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Create the trigger function with proper schema qualification
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION public.update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- Set search path restriction for security
        REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.update_timestamp() TO postgres;
        
        COMMENT ON FUNCTION public.update_timestamp() IS 'Trigger function to automatically update the updated_at column with current timestamp';
      `, { transaction: t });

      // Helper function to create a trigger safely
      const createTriggerIfNotExists = async (triggerName, tableFQName) => {
        // Check if trigger exists
        const [result] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE t.tgname = '${triggerName}'
            AND n.nspname || '.' || c.relname = '${tableFQName}';
        `, { transaction: t });
        
        const count = parseInt(result[0].count);
        
        // Only create trigger if it doesn't exist
        if (count === 0) {
          await queryInterface.sequelize.query(`
            CREATE TRIGGER ${triggerName}
            BEFORE UPDATE ON ${tableFQName}
            FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
          `, { transaction: t });
          console.log(`Created trigger ${triggerName} on ${tableFQName}`);
        } else {
          console.log(`Trigger ${triggerName} already exists on ${tableFQName}, skipping`);
        }
      };

      // Auth schema
      await createTriggerIfNotExists('update_users_timestamp', 'auth.users');
      
      // Content schema
      await createTriggerIfNotExists('update_profiles_timestamp', 'content.profiles');
      await createTriggerIfNotExists('update_skills_timestamp', 'content.skills');
      await createTriggerIfNotExists('update_projects_timestamp', 'content.projects');
      await createTriggerIfNotExists('update_project_updates_timestamp', 'content.project_updates');
      await createTriggerIfNotExists('update_project_files_timestamp', 'content.project_files');
      await createTriggerIfNotExists('update_project_client_assignments_timestamp', 'content.project_client_assignments');
      
      // Messaging schema
      await createTriggerIfNotExists('update_messages_timestamp', 'messaging.messages');
      await createTriggerIfNotExists('update_message_attachments_timestamp', 'messaging.message_attachments');
      
      // Billing schema
      await createTriggerIfNotExists('update_invoices_timestamp', 'billing.invoices');
      await createTriggerIfNotExists('update_invoice_items_timestamp', 'billing.invoice_items');
      await createTriggerIfNotExists('update_payments_timestamp', 'billing.payments');
      
      // Metrics schema
      await createTriggerIfNotExists('update_project_metrics_timestamp', 'metrics.project_metrics');
      await createTriggerIfNotExists('update_revenue_reports_timestamp', 'metrics.revenue_reports');
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Drop triggers
        await queryInterface.sequelize.query(`
          -- Auth schema
          DROP TRIGGER IF EXISTS update_users_timestamp ON auth.users;

          -- Content schema
          DROP TRIGGER IF EXISTS update_profiles_timestamp ON content.profiles;
          DROP TRIGGER IF EXISTS update_skills_timestamp ON content.skills;
          DROP TRIGGER IF EXISTS update_projects_timestamp ON content.projects;
          DROP TRIGGER IF EXISTS update_project_updates_timestamp ON content.project_updates;
          DROP TRIGGER IF EXISTS update_project_files_timestamp ON content.project_files;
          DROP TRIGGER IF EXISTS update_project_client_assignments_timestamp ON content.project_client_assignments;

          -- Messaging schema
          DROP TRIGGER IF EXISTS update_messages_timestamp ON messaging.messages;
          DROP TRIGGER IF EXISTS update_message_attachments_timestamp ON messaging.message_attachments;

          -- Billing schema
          DROP TRIGGER IF EXISTS update_invoices_timestamp ON billing.invoices;
          DROP TRIGGER IF EXISTS update_invoice_items_timestamp ON billing.invoice_items;
          DROP TRIGGER IF EXISTS update_payments_timestamp ON billing.payments;

          -- Metrics schema
          DROP TRIGGER IF EXISTS update_project_metrics_timestamp ON metrics.project_metrics;
          DROP TRIGGER IF EXISTS update_revenue_reports_timestamp ON metrics.revenue_reports;
        `, { transaction: t });

        // Drop function with schema qualification
        await queryInterface.sequelize.query(`
          DROP FUNCTION IF EXISTS public.update_timestamp();
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 