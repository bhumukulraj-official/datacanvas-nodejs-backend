'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the table within a transaction
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        -- Client Invitations Table
        CREATE TABLE auth.client_invitations (
          id SERIAL PRIMARY KEY,
          uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
          email VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          invitation_token VARCHAR(255) UNIQUE NOT NULL,
          custom_message TEXT,
          sender_id INT REFERENCES auth.users(id) ON DELETE SET NULL,
          is_accepted BOOLEAN DEFAULT FALSE,
          accepted_at TIMESTAMPTZ,
          accepted_by_user_id INT REFERENCES auth.users(id) ON DELETE SET NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          metadata JSONB DEFAULT '{}',
          is_revoked BOOLEAN DEFAULT FALSE,
          revoked_at TIMESTAMPTZ,
          revoked_by INT REFERENCES auth.users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX idx_client_invitations_email ON auth.client_invitations(email);
        CREATE INDEX idx_client_invitations_invitation_token ON auth.client_invitations(invitation_token);
        CREATE INDEX idx_client_invitations_sender_id ON auth.client_invitations(sender_id);
        CREATE INDEX idx_client_invitations_is_accepted ON auth.client_invitations(is_accepted);
        CREATE INDEX idx_client_invitations_expires_at ON auth.client_invitations(expires_at);
        CREATE INDEX idx_client_invitations_is_revoked ON auth.client_invitations(is_revoked);
        CREATE INDEX idx_client_invitations_metadata ON auth.client_invitations USING GIN(metadata);
        
        -- Add trigger for updated_at
        CREATE TRIGGER update_client_invitations_timestamp
        BEFORE UPDATE ON auth.client_invitations
        FOR EACH ROW EXECUTE FUNCTION update_timestamp();

        -- Add invitation limits
        ALTER TABLE auth.client_invitations
        ADD COLUMN max_uses INT DEFAULT 1,
        ADD COLUMN used_count INT DEFAULT 0;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DROP TRIGGER IF EXISTS update_client_invitations_timestamp ON auth.client_invitations;
        DROP TABLE IF EXISTS auth.client_invitations CASCADE;
      `, { transaction: t });
    });
  }
}; 