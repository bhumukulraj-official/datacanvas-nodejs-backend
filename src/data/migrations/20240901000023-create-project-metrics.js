'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
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

        -- Indexes
        CREATE INDEX idx_project_metrics_project_id ON metrics.project_metrics(project_id);
        CREATE INDEX idx_project_metrics_metric_name ON metrics.project_metrics(metric_name);
        CREATE INDEX idx_project_metrics_period ON metrics.project_metrics(period_start, period_end);
        CREATE INDEX idx_project_metrics_metadata ON metrics.project_metrics USING GIN(metadata);
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS metrics.project_metrics CASCADE;
    `);
  }
}; 