'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Using the same password hash for all test users for simplicity
      const passwordHash = await bcrypt.hash('Password123!', 10);
      
      // Use raw SQL to handle schema-qualified tables
      await queryInterface.sequelize.query(`
        INSERT INTO auth.users (
          email, password_hash, name, role, email_verified, 
          onboarding_status, onboarding_date, metadata, created_at, updated_at
        ) VALUES 
        (
          'admin@example.com', 
          '${passwordHash}', 
          'Admin User', 
          'admin', 
          true, 
          'active', 
          NOW(), 
          '${JSON.stringify({ phone: '+1234567890' })}', 
          NOW(), 
          NOW()
        ),
        (
          'client1@example.com', 
          '${passwordHash}', 
          'Client One', 
          'client', 
          true, 
          'active', 
          NOW(), 
          '${JSON.stringify({ phone: '+1987654321' })}', 
          NOW(), 
          NOW()
        ),
        (
          'client2@example.com', 
          '${passwordHash}', 
          'Client Two', 
          'client', 
          true, 
          'active', 
          NOW(), 
          '${JSON.stringify({ phone: '+1876543219' })}', 
          NOW(), 
          NOW()
        ),
        (
          'client3@example.com', 
          '${passwordHash}', 
          'Client Three', 
          'client', 
          false, 
          'pending', 
          NULL, 
          '${JSON.stringify({ phone: '+1765432198' })}', 
          NOW(), 
          NOW()
        ),
        (
          'client4@example.com', 
          '${passwordHash}', 
          'Client Four', 
          'client', 
          true, 
          'invited', 
          NULL, 
          '${JSON.stringify({ phone: '+1654321987' })}', 
          NOW(), 
          NOW()
        )
        ON CONFLICT (email) DO NOTHING;
      `, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Remove all seeded users with raw SQL
      await queryInterface.sequelize.query(`
        DELETE FROM auth.users 
        WHERE email IN (
          'admin@example.com',
          'client1@example.com',
          'client2@example.com',
          'client3@example.com',
          'client4@example.com'
        );
      `, { transaction: t });
    });
  }
}; 