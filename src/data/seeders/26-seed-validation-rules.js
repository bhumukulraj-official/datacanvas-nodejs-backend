'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Insert validation rules for common entities
      await queryInterface.sequelize.query(`
        -- User validation rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
          ('users', 'email', 'required', NULL, 'Email is required'),
          ('users', 'email', 'email', NULL, 'Invalid email format'),
          ('users', 'email', 'unique', NULL, 'Email is already in use'),
          ('users', 'password', 'required', NULL, 'Password is required'),
          ('users', 'password', 'minLength', '8', 'Password must be at least 8 characters'),
          ('users', 'password', 'pattern', '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]', 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
          ('users', 'name', 'required', NULL, 'Name is required'),
          ('users', 'name', 'maxLength', '100', 'Name must be 100 characters or less')
        ON CONFLICT (entity_type, field_name, rule_type) DO NOTHING;

        -- Project validation rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
          ('projects', 'title', 'required', NULL, 'Project title is required'),
          ('projects', 'title', 'maxLength', '200', 'Project title must be 200 characters or less'),
          ('projects', 'description', 'required', NULL, 'Project description is required'),
          ('projects', 'status_code', 'required', NULL, 'Project status is required'),
          ('projects', 'status_code', 'enum', 'draft,in_progress,completed,on_hold,cancelled', 'Invalid project status'),
          ('projects', 'github_url', 'url', NULL, 'GitHub URL must be a valid URL'),
          ('projects', 'live_url', 'url', NULL, 'Live URL must be a valid URL')
        ON CONFLICT (entity_type, field_name, rule_type) DO NOTHING;

        -- Profile validation rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
          ('profiles', 'bio', 'maxLength', '1000', 'Bio must be 1000 characters or less'),
          ('profiles', 'avatar_url', 'url', NULL, 'Avatar URL must be a valid URL'),
          ('profiles', 'phone', 'pattern', '^\\+?[0-9]{10,15}$', 'Phone number must be 10-15 digits, optionally starting with +')
        ON CONFLICT (entity_type, field_name, rule_type) DO NOTHING;

        -- Invoice validation rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
          ('invoices', 'invoice_number', 'required', NULL, 'Invoice number is required'),
          ('invoices', 'invoice_number', 'unique', NULL, 'Invoice number must be unique'),
          ('invoices', 'amount', 'required', NULL, 'Invoice amount is required'),
          ('invoices', 'amount', 'min', '0.01', 'Invoice amount must be greater than 0'),
          ('invoices', 'issue_date', 'required', NULL, 'Issue date is required'),
          ('invoices', 'due_date', 'required', NULL, 'Due date is required'),
          ('invoices', 'due_date', 'afterOrEqual', 'issue_date', 'Due date must be on or after the issue date')
        ON CONFLICT (entity_type, field_name, rule_type) DO NOTHING;

        -- Message validation rules
        INSERT INTO public.validation_rules 
        (entity_type, field_name, rule_type, rule_value, error_message)
        VALUES
          ('messages', 'content', 'required', NULL, 'Message content is required'),
          ('messages', 'content', 'maxLength', '10000', 'Message content must be 10000 characters or less'),
          ('messages', 'receiver_id', 'required', NULL, 'Receiver is required')
        ON CONFLICT (entity_type, field_name, rule_type) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM public.validation_rules 
        WHERE entity_type IN ('users', 'projects', 'profiles', 'invoices', 'messages');
      `, { transaction: t });
    });
  }
}; 