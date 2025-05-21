'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        CREATE TABLE public.validation_rules (
          id SERIAL PRIMARY KEY,
          entity_type VARCHAR(50) NOT NULL,
          field_name VARCHAR(50) NOT NULL,
          rule_type VARCHAR(50) NOT NULL,
          rule_value TEXT,
          error_message TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(entity_type, field_name, rule_type)
        );

        -- Example rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
        ('users', 'email', 'required', NULL, 'Email is required'),
        ('users', 'email', 'email', NULL, 'Invalid email format'),
        ('users', 'password', 'minLength', '8', 'Password must be at least 8 characters'),
        ('projects', 'title', 'required', NULL, 'Project title is required'),
        ('projects', 'title', 'maxLength', '200', 'Project title must be 200 characters or less'),
        ('projects', 'description', 'required', NULL, 'Project description is required');
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS public.validation_rules;
    `);
  }
}; 