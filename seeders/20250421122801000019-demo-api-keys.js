'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Generate hashed API keys
    const apiKey1 = 'dk_test_123456789abcdef';
    const apiKey2 = 'dk_test_987654321fedcba';
    const apiKey3 = 'dk_test_abcdef123456789';
    
    const hashedKeys = await Promise.all([
      bcrypt.hash(apiKey1, 10),
      bcrypt.hash(apiKey2, 10),
      bcrypt.hash(apiKey3, 10)
    ]);

    const now = new Date();
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const oneMonthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const apiKeys = [
      {
        name: 'Admin Full Access Key',
        key_hash: hashedKeys[0],
        permissions: [1, 2, 3, 4, 5], // Full access permissions
        expires_at: oneYearFromNow,
        last_used_at: now,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Read Only API Key',
        key_hash: hashedKeys[1],
        permissions: [1], // Read only permission
        expires_at: oneMonthFromNow,
        last_used_at: now,
        created_at: now,
        updated_at: now
      },
      {
        name: 'Write Only API Key',
        key_hash: hashedKeys[2],
        permissions: [2], // Write only permission
        expires_at: oneMonthFromNow,
        last_used_at: now,
        created_at: now,
        updated_at: now
      }
    ];

    await queryInterface.bulkInsert('api_keys', apiKeys, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('api_keys', null, {});
  }
}; 