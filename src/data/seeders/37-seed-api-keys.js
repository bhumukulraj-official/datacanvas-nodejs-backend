'use strict';
const crypto = require('crypto');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Get admin user
      const [admins] = await queryInterface.sequelize.query(
        "SELECT id FROM auth.users WHERE role = 'admin' LIMIT 1",
        { transaction: t }
      );

      if (admins.length === 0) {
        console.log('No admin user found for API key creation');
        return;
      }
      
      const adminId = admins[0].id;
      
      // Check if the api_keys table exists with the right columns
      const [tableInfo] = await queryInterface.sequelize.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'auth' AND table_name = 'api_keys'
      `, { transaction: t });
      
      // Get column names for logging
      const columns = tableInfo.map(row => row.column_name);
      console.log('Available columns in api_keys:', columns);
      
      // Generate API keys
      const adminApiKey = crypto.randomBytes(32).toString('hex');
      const clientApiKey = crypto.randomBytes(32).toString('hex');
      
      // Generate key hashes (in a real environment, these would be properly salted and hashed)
      const adminKeyHash = crypto.createHash('sha256').update(adminApiKey).digest('hex');
      const clientKeyHash = crypto.createHash('sha256').update(clientApiKey).digest('hex');

      // Insert API keys
      await queryInterface.sequelize.query(`
        INSERT INTO auth.api_keys (
          name, key, key_hash, scopes, user_id, 
          expires_at, is_active, created_at, updated_at
        ) VALUES
          (
            'Admin API Key', 
            '${adminApiKey}',
            '${adminKeyHash}', 
            '["admin", "read", "write"]'::jsonb, 
            ${adminId}, 
            NOW() + INTERVAL '1 year', 
            true, 
            NOW(), 
            NOW()
          ),
          (
            'Client API Key', 
            '${clientApiKey}',
            '${clientKeyHash}', 
            '["read"]'::jsonb, 
            ${adminId}, 
            NOW() + INTERVAL '6 months', 
            true, 
            NOW(), 
            NOW()
          );
      `, { transaction: t });
      
      // Log the keys for testing purposes (in a real env, these would be securely provided to users)
      console.log('Admin API Key (for testing only):', adminApiKey);
      console.log('Client API Key (for testing only):', clientApiKey);
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(`
        DELETE FROM auth.api_keys;
      `, { transaction: t });
    });
  }
}; 