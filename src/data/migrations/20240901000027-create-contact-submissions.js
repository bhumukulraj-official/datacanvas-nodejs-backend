'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Contact Submissions Table
        CREATE TABLE public_api.contact_submissions (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL,
          subject VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          recaptcha_score DECIMAL(3,2),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'replied', 'spam')),
          is_deleted BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          deleted_at TIMESTAMPTZ
        );

        -- Indexes
        CREATE INDEX idx_contact_submissions_email ON public_api.contact_submissions(email);
        CREATE INDEX idx_contact_submissions_status ON public_api.contact_submissions(status);
        CREATE INDEX idx_contact_submissions_is_deleted ON public_api.contact_submissions(is_deleted);
        CREATE INDEX idx_contact_submissions_created_at ON public_api.contact_submissions(created_at);
        CREATE INDEX idx_contact_submissions_deleted_at ON public_api.contact_submissions(deleted_at);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_contact_submissions_timestamp
        BEFORE UPDATE ON public_api.contact_submissions
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();
        
        -- Add soft delete trigger with schema qualification
        CREATE OR REPLACE FUNCTION public_api.set_deleted_at() RETURNS TRIGGER AS $$
        BEGIN
          IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
            NEW.deleted_at = CURRENT_TIMESTAMP;
          ELSIF NEW.is_deleted = FALSE AND OLD.is_deleted = TRUE THEN
            NEW.deleted_at = NULL;
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        CREATE TRIGGER set_contact_submissions_deleted_at
        BEFORE UPDATE OF is_deleted ON public_api.contact_submissions
        FOR EACH ROW EXECUTE FUNCTION public_api.set_deleted_at();
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS set_contact_submissions_deleted_at ON public_api.contact_submissions;
        DROP TRIGGER IF EXISTS update_contact_submissions_timestamp ON public_api.contact_submissions;
        DROP FUNCTION IF EXISTS public_api.set_deleted_at();
        DROP TABLE IF EXISTS public_api.contact_submissions CASCADE;
      `, { transaction: t });
    });
  }
}; 