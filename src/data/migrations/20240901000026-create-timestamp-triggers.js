'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Create the trigger function
      await queryInterface.sequelize.query(`
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `, { transaction: t });

      // Create triggers for all tables with updated_at columns
      await queryInterface.sequelize.query(`
        -- Auth schema
        CREATE TRIGGER update_users_timestamp
        BEFORE UPDATE ON auth.users
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Content schema
        CREATE TRIGGER update_profiles_timestamp
        BEFORE UPDATE ON content.profiles
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_skills_timestamp
        BEFORE UPDATE ON content.skills
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_projects_timestamp
        BEFORE UPDATE ON content.projects
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_project_updates_timestamp
        BEFORE UPDATE ON content.project_updates
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_project_files_timestamp
        BEFORE UPDATE ON content.project_files
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_project_client_assignments_timestamp
        BEFORE UPDATE ON content.project_client_assignments
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Messaging schema
        CREATE TRIGGER update_messages_timestamp
        BEFORE UPDATE ON messaging.messages
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_message_attachments_timestamp
        BEFORE UPDATE ON messaging.message_attachments
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Billing schema
        CREATE TRIGGER update_invoices_timestamp
        BEFORE UPDATE ON billing.invoices
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_invoice_items_timestamp
        BEFORE UPDATE ON billing.invoice_items
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_payments_timestamp
        BEFORE UPDATE ON billing.payments
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Metrics schema
        CREATE TRIGGER update_project_metrics_timestamp
        BEFORE UPDATE ON metrics.project_metrics
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        CREATE TRIGGER update_revenue_reports_timestamp
        BEFORE UPDATE ON metrics.revenue_reports
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
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

      // Drop function
      await queryInterface.sequelize.query(`
        DROP FUNCTION IF EXISTS update_timestamp();
      `, { transaction: t });
    });
  }
}; 