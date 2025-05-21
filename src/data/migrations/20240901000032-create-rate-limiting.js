'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- API Rate Limits Table
        CREATE TABLE public_api.rate_limits (
          id SERIAL PRIMARY KEY,
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('ip', 'user', 'api_key')),
          entity_identifier VARCHAR(100) NOT NULL,
          endpoint VARCHAR(100) NOT NULL,
          requests_count INT DEFAULT 1,
          window_start TIMESTAMPTZ NOT NULL,
          window_size_seconds INT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Composite unique constraint
        ALTER TABLE public_api.rate_limits 
        ADD CONSTRAINT unique_rate_limit_entity_endpoint 
        UNIQUE (entity_type, entity_identifier, endpoint, window_start);

        -- Indexes
        CREATE INDEX idx_rate_limits_entity ON public_api.rate_limits(entity_type, entity_identifier);
        CREATE INDEX idx_rate_limits_endpoint ON public_api.rate_limits(endpoint);
        CREATE INDEX idx_rate_limits_window ON public_api.rate_limits(window_start);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_rate_limits_timestamp
        BEFORE UPDATE ON public_api.rate_limits
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        
        -- Rate Limit Configuration Table
        CREATE TABLE public_api.rate_limit_configs (
          id SERIAL PRIMARY KEY,
          endpoint_pattern VARCHAR(100) NOT NULL,
          requests_limit INT NOT NULL,
          window_size_seconds INT NOT NULL,
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('ip', 'user', 'api_key')),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert default rate limit configs based on API spec
        INSERT INTO public_api.rate_limit_configs 
        (endpoint_pattern, requests_limit, window_size_seconds, entity_type, description)
        VALUES 
        ('/api/v1/public/*', 100, 60, 'ip', 'Public APIs: 100 requests per minute'),
        ('/api/v1/admin/*', 1000, 60, 'user', 'Admin APIs: 1000 requests per minute'),
        ('/api/v1/auth/reset-password/*', 5, 60, 'ip', 'Password reset: 5 requests per minute'),
        ('/api/v1/contact', 3, 60, 'ip', 'Contact form: 3 submissions per minute');
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_rate_limit_configs_timestamp
        BEFORE UPDATE ON public_api.rate_limit_configs
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Add auth differentiation
        ALTER TABLE public_api.rate_limits
        ADD COLUMN is_authenticated BOOLEAN DEFAULT FALSE;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_rate_limits_timestamp ON public_api.rate_limits;
        DROP TRIGGER IF EXISTS update_rate_limit_configs_timestamp ON public_api.rate_limit_configs;
        DROP TABLE IF EXISTS public_api.rate_limits CASCADE;
        DROP TABLE IF EXISTS public_api.rate_limit_configs CASCADE;
      `, { transaction: t });
    });
  }
}; 