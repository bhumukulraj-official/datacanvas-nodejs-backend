'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert error color mappings
      await queryInterface.sequelize.query(`
        INSERT INTO public.error_color_mappings 
        (error_category, ui_color, hex_code, usage_description)
        VALUES
          ('Authentication', 'Error Red', '#EF4444', 'Authentication forms, login failures, session expiration'),
          ('Validation', 'Error Red', '#EF4444', 'Form validation errors, data validation failures'),
          ('Permission', 'Error Red', '#EF4444', 'Access denied messages, unauthorized actions'),
          ('Resource', 'Warning Yellow', '#FBBF24', 'Resource not found states, missing data'),
          ('Rate Limiting', 'Warning Yellow', '#FBBF24', 'Throttling notifications, API rate limit exceeded'),
          ('Payment', 'Error Red', '#EF4444', 'Payment failures, billing issues, transaction errors'),
          ('WebSocket', 'Warning Yellow', '#FBBF24', 'Connection issues, real-time communication problems'),
          ('Network', 'Warning Yellow', '#FBBF24', 'Network connectivity issues, timeout errors'),
          ('Database', 'Error Red', '#EF4444', 'Database connection failures, query errors'),
          ('Server', 'Error Red', '#EF4444', 'Server errors, internal processing failures'),
          ('File', 'Warning Yellow', '#FBBF24', 'File upload/download issues, format problems'),
          ('Input', 'Warning Yellow', '#FBBF24', 'User input problems, format mismatches'),
          ('Configuration', 'Info Blue', '#3B82F6', 'Configuration issues, environment problems'),
          ('Dependency', 'Info Blue', '#3B82F6', 'Third-party service failures, dependency issues'),
          ('Security', 'Error Red', '#EF4444', 'Security violations, suspicious activities'),
          ('Performance', 'Info Blue', '#3B82F6', 'System performance degradation, slow responses'),
          ('Business Logic', 'Warning Yellow', '#FBBF24', 'Business rule violations, logical constraints'),
          ('Data Integrity', 'Error Red', '#EF4444', 'Data corruption, inconsistency issues'),
          ('User Account', 'Warning Yellow', '#FBBF24', 'Account-related issues, profile problems'),
          ('Notification', 'Info Blue', '#3B82F6', 'Notification delivery failures, messaging issues')
        ON CONFLICT (error_category) 
        DO UPDATE SET 
          ui_color = EXCLUDED.ui_color,
          hex_code = EXCLUDED.hex_code,
          usage_description = EXCLUDED.usage_description;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM public.error_color_mappings 
        WHERE error_category IN (
          'Authentication', 'Validation', 'Permission', 'Resource', 
          'Rate Limiting', 'Payment', 'WebSocket', 'Network', 
          'Database', 'Server', 'File', 'Input', 'Configuration', 
          'Dependency', 'Security', 'Performance', 'Business Logic', 
          'Data Integrity', 'User Account', 'Notification'
        );
      `, { transaction: t });
    });
  }
}; 