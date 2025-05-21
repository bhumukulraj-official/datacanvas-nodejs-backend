'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        // Create the table first
        await queryInterface.sequelize.query(`
          CREATE TABLE public.error_color_mappings (
            error_category VARCHAR(50) PRIMARY KEY,
            ui_color VARCHAR(50) NOT NULL,
            hex_code VARCHAR(7) NOT NULL,
            usage_description TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
          );
        `, { transaction: t });
        
        // Insert values with ON CONFLICT handling to allow re-running migrations
        await queryInterface.sequelize.query(`
          INSERT INTO public.error_color_mappings 
          (error_category, ui_color, hex_code, usage_description)
          VALUES
          ('Authentication', 'Error Red', '#EF4444', 'Authentication forms, login failures'),
          ('Validation', 'Error Red', '#EF4444', 'Form validation errors'),
          ('Permission', 'Error Red', '#EF4444', 'Access denied messages'),
          ('Resource', 'Warning Yellow', '#FBBF24', 'Resource not found states'),
          ('Rate Limiting', 'Warning Yellow', '#FBBF24', 'Throttling notifications'),
          ('Payment', 'Error Red', '#EF4444', 'Payment failures'),
          ('WebSocket', 'Warning Yellow', '#FBBF24', 'Connection issues')
          ON CONFLICT (error_category) 
          DO UPDATE SET 
            ui_color = EXCLUDED.ui_color,
            hex_code = EXCLUDED.hex_code,
            usage_description = EXCLUDED.usage_description;
        `, { transaction: t });
        
        // Generic error messages
        await queryInterface.sequelize.query(`
          UPDATE public.error_color_mappings
          SET usage_description = 'Authentication related issues'
          WHERE error_category = 'Authentication';
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in error color mappings migration:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.sequelize.query(`
          DROP TABLE IF EXISTS public.error_color_mappings CASCADE;
        `, { transaction: t });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Error in error color mappings down migration:', error);
        return Promise.reject(error);
      }
    });
  }
}; 