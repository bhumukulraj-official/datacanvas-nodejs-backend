'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
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
        CREATE INDEX idx_revenue_reports_report_date ON metrics.revenue_reports(report_date);
        CREATE INDEX idx_revenue_reports_period_type ON metrics.revenue_reports(period_type);
        CREATE INDEX idx_revenue_reports_breakdown ON metrics.revenue_reports USING GIN(breakdown);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS metrics.revenue_reports CASCADE;
    `);
  }
}; 