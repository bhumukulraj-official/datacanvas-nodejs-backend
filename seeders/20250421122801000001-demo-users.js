'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      email: 'admin@datacanvas.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Add some demo users
    const demoUsers = [
      {
        username: 'johndoe',
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'janesmith',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', demoUsers, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
}; 