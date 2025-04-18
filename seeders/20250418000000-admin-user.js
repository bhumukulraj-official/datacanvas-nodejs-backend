'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password_hash: hashedPassword,
        role: 'admin',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});

    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    const adminId = adminUser[0].id;

    // Create admin profile
    await queryInterface.bulkInsert('profiles', [
      {
        user_id: adminId,
        title: 'Full Stack Developer',
        bio: 'Experienced full stack developer with expertise in web technologies.',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // First delete the profile
    const [adminUser] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1;`
    );
    
    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      await queryInterface.bulkDelete('profiles', { user_id: adminId }, {});
    }
    
    // Then delete the user
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' }, {});
  }
}; 