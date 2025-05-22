'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert sample revenue reports for different periods
      await queryInterface.sequelize.query(`
        -- Daily reports
        INSERT INTO metrics.revenue_reports (
          report_date, period_type, total_revenue, total_invoices, 
          total_paid, total_outstanding, breakdown, created_at, updated_at
        ) VALUES
          (
            NOW() - INTERVAL '1 day', 
            'daily', 
            1250.00, 
            3, 
            850.00, 
            400.00, 
            '{"by_client": {"client1": 500, "client2": 350, "client3": 400}, "by_project": {"project1": 650, "project2": 600}}', 
            NOW(), 
            NOW()
          ),
          (
            NOW() - INTERVAL '2 days', 
            'daily', 
            975.50, 
            2, 
            975.50, 
            0.00, 
            '{"by_client": {"client1": 475.50, "client4": 500}, "by_project": {"project3": 975.50}}', 
            NOW(), 
            NOW()
          ),
          (
            NOW() - INTERVAL '3 days', 
            'daily', 
            1800.00, 
            4, 
            1200.00, 
            600.00, 
            '{"by_client": {"client2": 800, "client3": 400, "client5": 600}, "by_project": {"project1": 800, "project2": 400, "project4": 600}}', 
            NOW(), 
            NOW()
          );
          
        -- Weekly reports
        INSERT INTO metrics.revenue_reports (
          report_date, period_type, total_revenue, total_invoices, 
          total_paid, total_outstanding, breakdown, created_at, updated_at
        ) VALUES
          (
            NOW() - INTERVAL '7 days', 
            'weekly', 
            7500.00, 
            12, 
            5800.00, 
            1700.00, 
            '{"by_client": {"client1": 2500, "client2": 1800, "client3": 1200, "client4": 1000, "client5": 1000}, "by_service": {"development": 4500, "design": 1500, "maintenance": 1500}}', 
            NOW(), 
            NOW()
          ),
          (
            NOW() - INTERVAL '14 days', 
            'weekly', 
            6250.00, 
            10, 
            6250.00, 
            0.00, 
            '{"by_client": {"client1": 1800, "client2": 1200, "client3": 1750, "client6": 1500}, "by_service": {"development": 3800, "design": 1200, "consulting": 1250}}', 
            NOW(), 
            NOW()
          );
          
        -- Monthly reports
        INSERT INTO metrics.revenue_reports (
          report_date, period_type, total_revenue, total_invoices, 
          total_paid, total_outstanding, breakdown, created_at, updated_at
        ) VALUES
          (
            NOW() - INTERVAL '1 month', 
            'monthly', 
            32500.00, 
            45, 
            28900.00, 
            3600.00, 
            '{"by_client": {"client1": 8500, "client2": 7200, "client3": 6800, "client4": 5000, "client5": 3000, "client6": 2000}, "by_project_type": {"web": 18000, "mobile": 8500, "design": 6000}}', 
            NOW(), 
            NOW()
          ),
          (
            NOW() - INTERVAL '2 months', 
            'monthly', 
            29750.00, 
            40, 
            29750.00, 
            0.00, 
            '{"by_client": {"client1": 7500, "client2": 6500, "client3": 5250, "client4": 4500, "client5": 3500, "client7": 2500}, "by_project_type": {"web": 16000, "mobile": 7750, "design": 6000}}', 
            NOW(), 
            NOW()
          );
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM metrics.revenue_reports;
      `, { transaction: t });
    });
  }
}; 