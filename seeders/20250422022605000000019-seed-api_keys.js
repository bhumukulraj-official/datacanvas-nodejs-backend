'use strict';
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Generate API key hashes
    const apiKeys = [];
    const keyHashes = [];
    
    for (let i = 0; i < 8; i++) {
      const apiKey = crypto.randomBytes(16).toString('hex');
      apiKeys.push(apiKey);
      // In production, you'd hash the keys; here we're using a simple hash for the seed
      const hash = await bcrypt.hash(apiKey, 10);
      keyHashes.push(hash);
    }

    return queryInterface.bulkInsert('api_keys', [
      {
        name: 'Admin API Key',
        key_hash: keyHashes[0],
        permissions: [1, 2, 3, 4, 5], // Full admin permissions
        status: 'active',
        expires_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        last_used_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Read-Only API Key',
        key_hash: keyHashes[1],
        permissions: [1, 2], // Read-only permissions
        status: 'active',
        expires_at: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        last_used_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Developer Test Key',
        key_hash: keyHashes[2],
        permissions: [1, 2, 3], // Limited permissions
        status: 'active',
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        last_used_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Used 2 days ago
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Integration Key',
        key_hash: keyHashes[3],
        permissions: [1, 2, 3, 4], // Integration permissions
        status: 'active',
        expires_at: null, // Never expires
        last_used_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Used 5 days ago
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Expired API Key',
        key_hash: keyHashes[4],
        permissions: [1, 2],
        status: 'inactive',
        expires_at: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
        last_used_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // Used 60 days ago
        created_at: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // Created 1 year ago
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Revoked API Key',
        key_hash: keyHashes[5],
        permissions: [1, 2, 3, 4, 5],
        status: 'revoked',
        expires_at: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // Would expire in 90 days
        last_used_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // Used 10 days ago
        created_at: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), // Created 120 days ago
        updated_at: now,
        deleted_at: null
      },
      {
        name: 'Deleted API Key',
        key_hash: keyHashes[6],
        permissions: [1, 2],
        status: 'active',
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Would expire in 30 days
        last_used_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Used 15 days ago
        created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // Created 60 days ago
        updated_at: now,
        deleted_at: now // Soft deleted
      },
      {
        name: 'Monitoring API Key',
        key_hash: keyHashes[7],
        permissions: [1], // Read-only monitoring
        status: 'active',
        expires_at: new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
        last_used_at: null, // Never used
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('api_keys', null, {});
  }
}; 