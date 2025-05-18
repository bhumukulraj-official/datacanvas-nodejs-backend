'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the schema if it doesn't exist and set the search path
    await queryInterface.sequelize.query(`
      -- Make sure schemas exist
      CREATE SCHEMA IF NOT EXISTS metrics;
      
      -- Grant privileges
      GRANT ALL ON SCHEMA metrics TO postgres;
      
      -- Set the search path for this session
      SET search_path TO public, content, auth, metrics;
    `);

    // Now create all tables within a transaction
    await queryInterface.sequelize.transaction(async (t) => {
      // User Activity Logs Table
      await queryInterface.sequelize.query(`
        CREATE TABLE metrics.user_activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES auth.users(id) ON DELETE SET NULL,
          action_type VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50),
          entity_id INT,
          details JSONB DEFAULT '{}',
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Project Metrics Table
        CREATE TABLE metrics.project_metrics (
          id SERIAL PRIMARY KEY,
          project_id INT REFERENCES content.projects(id) ON DELETE CASCADE,
          metric_name VARCHAR(50) NOT NULL,
          metric_value DECIMAL(15, 2) NOT NULL,
          period_start DATE,
          period_end DATE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Revenue Reports Table
        CREATE TABLE metrics.revenue_reports (
          id SERIAL PRIMARY KEY,
          report_date DATE NOT NULL,
          period_type VARCHAR(20) CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
          total_revenue DECIMAL(15, 2) NOT NULL,
          total_invoices INT NOT NULL,
          total_paid DECIMAL(15, 2) NOT NULL,
          total_outstanding DECIMAL(15, 2) NOT NULL,
          breakdown JSONB,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_user_activity_logs_user_id ON metrics.user_activity_logs(user_id);
        CREATE INDEX idx_user_activity_logs_action_type ON metrics.user_activity_logs(action_type);
        CREATE INDEX idx_user_activity_logs_entity_type ON metrics.user_activity_logs(entity_type);
        CREATE INDEX idx_user_activity_logs_created_at ON metrics.user_activity_logs(created_at);
        CREATE INDEX idx_user_activity_logs_details ON metrics.user_activity_logs USING GIN(details);
        
        CREATE INDEX idx_project_metrics_project_id ON metrics.project_metrics(project_id);
        CREATE INDEX idx_project_metrics_metric_name ON metrics.project_metrics(metric_name);
        CREATE INDEX idx_project_metrics_period ON metrics.project_metrics(period_start, period_end);
        CREATE INDEX idx_project_metrics_metadata ON metrics.project_metrics USING GIN(metadata);
        
        CREATE INDEX idx_revenue_reports_report_date ON metrics.revenue_reports(report_date);
        CREATE INDEX idx_revenue_reports_period_type ON metrics.revenue_reports(period_type);
        CREATE INDEX idx_revenue_reports_breakdown ON metrics.revenue_reports USING GIN(breakdown);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS metrics.revenue_reports CASCADE;
      DROP TABLE IF EXISTS metrics.project_metrics CASCADE;
      DROP TABLE IF EXISTS metrics.user_activity_logs CASCADE;
    `);
  }
}; 