'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Wrap in transaction for safety
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for required schemas 
        await queryInterface.sequelize.query(`
          DO $$
          BEGIN
            -- Check if billing schema exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'billing') THEN
              RAISE EXCEPTION 'Required schema "billing" does not exist. This migration depends on "20240901000002-create-schemas.js"';
            END IF;
          END
          $$;
        `, { transaction: t });

        await queryInterface.sequelize.query(`
          -- Payment Statuses Table
          CREATE TABLE billing.payment_statuses (
            code VARCHAR(20) PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            display_order INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );

          -- Insert initial payment statuses
          INSERT INTO billing.payment_statuses (code, name, description, display_order)
          VALUES 
          ('pending', 'Pending', 'Payment is being processed', 1),
          ('completed', 'Completed', 'Payment successfully processed', 2),
          ('failed', 'Failed', 'Payment processing failed', 3),
          ('refunded', 'Refunded', 'Payment has been refunded', 4);
          
          -- Add index for is_active column
          CREATE INDEX idx_payment_statuses_is_active ON billing.payment_statuses(is_active);
          
          -- Add trigger for automatic timestamp updates
          CREATE TRIGGER update_payment_statuses_timestamp
          BEFORE UPDATE ON billing.payment_statuses
          FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in payment statuses migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Check for dependencies before dropping
        const [dependencies] = await queryInterface.sequelize.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND constraint_schema = 'billing'
          AND constraint_name IN (
            SELECT constraint_name
            FROM information_schema.constraint_column_usage
            WHERE table_schema = 'billing'
            AND table_name = 'payment_statuses'
          );
        `, { transaction: t });

        // If there are dependencies, handle them or warn
        if (dependencies && dependencies[0].count > 0) {
          console.warn(`Warning: Found ${dependencies[0].count} dependencies on billing.payment_statuses table. These will be dropped due to CASCADE.`);
          
          // Log the details for audit purposes
          await queryInterface.sequelize.query(`
            INSERT INTO metrics.user_activity_logs(
              action_type, entity_type, details
            ) VALUES (
              'migration_warning', 
              'billing.payment_statuses', 
              jsonb_build_object(
                'message', 'Dependencies found during down migration',
                'dependency_count', ${dependencies[0].count}
              )
            )
            ON CONFLICT DO NOTHING;
          `, { transaction: t }).catch(err => {
            console.warn('Could not log to metrics table, continuing anyway:', err.message);
          });
        }
        
        // Drop trigger first
        await queryInterface.sequelize.query(`
          DROP TRIGGER IF EXISTS update_payment_statuses_timestamp ON billing.payment_statuses;
        `, { transaction: t });
        
        // Drop table
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS billing.payment_statuses CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in payment statuses down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 